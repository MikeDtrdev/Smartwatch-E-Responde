import { Alert, Vibration, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { database } from '../firebaseConfig';
import { ref, set } from 'firebase/database';
import PairingService from './pairingService';
import { GeocodingService, GeocodingResult } from './geocodingService';

export interface SOSAlert {
  id: string;
  timestamp: number;
  type: 'manual' | 'proximity' | 'shake' | 'theft';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  };
  message: string;
  userId: string;
}

export interface TheftReportData {
  crimeType: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  severity: string;
  createdAt: string;
  timestamp: number;
  isTheftDetection: boolean;
  theftDetails: {
    distance: number;
    phoneLocation: { latitude: number; longitude: number; timestamp: number };
    watchLocation: { latitude: number; longitude: number };
    detectionTime: string;
  };
  reporterName?: string;
  reporterUid?: string;
  barangay?: string;
  anonymous?: boolean;
  multimedia?: string[];
  videos?: string[];
  status?: string;
  createdVia?: string;
  upvotes?: number;
  downvotes?: number;
  userVotes?: Record<string, 'upvote' | 'downvote'>;
  triggerSource?: string;
}

type CrimeReportPayload = {
  crimeType: string;
  dateTime: string;
  description: string;
  multimedia: string[];
  videos: string[];
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  barangay: string;
  anonymous: boolean;
  reporterName: string;
  reporterUid: string;
  status: string;
  createdAt: string;
  reportId: string;
  severity: 'Immediate' | 'High' | 'Moderate' | 'Low';
  upvotes: number;
  downvotes: number;
  userVotes: Record<string, 'upvote' | 'downvote'>;
  triggerSource: string;
  timestamp: number;
  createdVia: string;
  isTheftDetection?: boolean;
  theftDetails?: TheftReportData['theftDetails'];
};

class SOSService {
  private isActive = false;
  private lastSOSTime = 0;
  private readonly SOS_COOLDOWN = 10000; // 10 seconds cooldown between SOS alerts

  /**
   * Send SOS alert with vibration and notification
   */
  async sendSOSAlert(type: 'manual' | 'proximity' | 'shake' | 'theft', userId: string, location?: { latitude: number; longitude: number }) {
    // Safety check: Only allow SOS if explicitly triggered
    if (!type || !userId) {
      console.log('SOS Service: Invalid SOS request - missing type or userId');
      return;
    }

    const now = Date.now();
    
    // Check cooldown to prevent spam
    if (now - this.lastSOSTime < this.SOS_COOLDOWN) {
      console.log('SOS Service: Alert blocked due to cooldown');
      return;
    }

    this.lastSOSTime = now;
    this.isActive = true;

    console.log(`SOS Service: Processing ${type} SOS alert for user ${userId}`);

    try {
      // Get REAL GPS location - no fallback
      const alertLocation = await this.getRealGPSLocation();
      
      if (!alertLocation) {
        console.error('SOS Service: Cannot send SOS - GPS location unavailable');
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please try again.',
          [
            { text: 'Try Again', onPress: () => this.sendSOSAlert(type, userId, location) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        this.isActive = false;
        return;
      }

      // Create SOS alert object with REAL coordinates
      const sosAlert: SOSAlert = {
        id: `sos_${now}`,
        timestamp: now,
        type,
        location: alertLocation,
        message: this.getSOSMessage(type),
        userId
      };

      // Vibrate device
      this.vibrateDevice();

      // Show alert
      this.showSOSAlert(type);

      // Save to Firebase database
      const storedAlert = await this.saveSOSAlert(sosAlert);

      // Send notification to paired mobile app
      await PairingService.sendSOSToMobile(storedAlert ?? sosAlert);

      console.log('SOS Service: Alert sent successfully with REAL GPS coordinates', sosAlert);
    } catch (error) {
      console.error('SOS Service: Failed to send alert:', error);
      Alert.alert('SOS Error', 'Failed to send SOS alert');
    } finally {
      this.isActive = false;
    }
  }

  /**
   * Get appropriate SOS message based on trigger type
   */
  private getSOSMessage(type: 'manual' | 'proximity' | 'shake' | 'theft'): string {
    switch (type) {
      case 'manual':
        return 'SOS Alert - User pressed SOS button';
      case 'proximity':
        return 'Proximity SOS Alert - Smartwatch disconnected from phone (>5m)';
      case 'shake':
        return 'Shake SOS Alert - User shook smartwatch 3 times';
      case 'theft':
        return 'Theft Detection Alert - Smartphone taken away from smartwatch';
      default:
        return 'SOS Alert triggered';
    }
  }

  /**
   * Vibrate device with SOS pattern
   */
  private vibrateDevice() {
    if (Platform.OS === 'android') {
      // SOS pattern: 3 short, 3 long, 3 short
      Vibration.vibrate([0, 200, 200, 200, 200, 200, 200, 600, 200, 600, 200, 600, 200, 200, 200, 200, 200, 200]);
    } else {
      // iOS vibration
      Vibration.vibrate();
    }
  }

  /**
   * Show SOS alert dialog
   */
  private showSOSAlert(type: 'manual' | 'proximity' | 'shake' | 'theft') {
    const title = 'SOS ALERT SENT';
    const message = 'Your emergency alert has been sent successfully with your current location.';
    
    Alert.alert(
      title,
      message,
      [
        {
          text: 'OK',
          style: 'default',
          onPress: () => {
            this.isActive = false;
          }
        }
      ],
      { cancelable: false }
    );
  }

  /**
   * Save SOS alert to Firebase database
   */
  private async saveSOSAlert(
    sosAlert: SOSAlert,
    options?: {
      crimeReportOverrides?: Partial<CrimeReportPayload>;
      persistCrimeReport?: boolean;
    }
  ): Promise<
    (SOSAlert & {
      status: 'active' | 'responded' | 'resolved';
      sentAt: string;
      triggerSource: string;
      reportId: string;
    }) | null
  > {
    try {
      if (!database) {
        console.warn('SOS Service: Database not available');
        return null;
      }

      const reportId = sosAlert.timestamp.toString();
      const sentAt = new Date(sosAlert.timestamp).toISOString();
      const alertPayload = {
        ...sosAlert,
        status: 'active' as const,
        sentAt,
        triggerSource: `smartwatch_${sosAlert.type}`,
        reportId,
      };

      if (options?.persistCrimeReport !== false) {
        const crimeReportPayload = this.buildCrimeReportPayload(
          sosAlert,
          reportId,
          options?.crimeReportOverrides
        );
        await this.persistCrimeReport(sosAlert.userId, reportId, crimeReportPayload);
      }

      console.log('SOS Service: SOS alert processed with report ID:', reportId);
      return alertPayload;
    } catch (error) {
      console.error('SOS Service: Failed to save alert to database:', error);
      return null;
    }
  }

  private getCrimeTypeForSOS(type: SOSAlert['type']): string {
    switch (type) {
      case 'theft':
        return 'Theft';
      case 'proximity':
        return 'Proximity SOS Alert';
      case 'shake':
        return 'Shake SOS Alert';
      case 'manual':
      default:
        return 'Emergency SOS Alert';
    }
  }

  private buildCrimeReportPayload(
    sosAlert: SOSAlert,
    reportId: string,
    overrides?: Partial<CrimeReportPayload>
  ): CrimeReportPayload {
    const timestampIso = new Date(sosAlert.timestamp).toISOString();
    const baseLocation = sosAlert.location
      ? {
          latitude: sosAlert.location.latitude,
          longitude: sosAlert.location.longitude,
          address:
            sosAlert.location.address ??
            `${sosAlert.location.latitude}, ${sosAlert.location.longitude}`,
        }
      : {
          latitude: 0,
          longitude: 0,
          address: 'Location unavailable',
        };

    const basePayload: CrimeReportPayload = {
      crimeType: this.getCrimeTypeForSOS(sosAlert.type),
      dateTime: timestampIso,
      description: sosAlert.message,
      multimedia: [],
      videos: [],
      location: baseLocation,
      barangay: sosAlert.location?.city ?? 'Unknown',
      anonymous: false,
      reporterName: 'Smartwatch SOS User',
      reporterUid: sosAlert.userId,
      status: 'pending',
      createdAt: timestampIso,
      reportId,
      severity: 'Immediate',
      upvotes: 0,
      downvotes: 0,
      userVotes: {},
      triggerSource: `smartwatch_${sosAlert.type}`,
      timestamp: sosAlert.timestamp,
      createdVia: `smartwatch_${sosAlert.type}_sos`,
    };

    const mergedPayload: CrimeReportPayload = {
      ...basePayload,
      ...overrides,
      location: {
        ...basePayload.location,
        ...(overrides?.location ?? {}),
      },
      multimedia: overrides?.multimedia ?? basePayload.multimedia,
      videos: overrides?.videos ?? basePayload.videos,
      reporterName: overrides?.reporterName ?? basePayload.reporterName,
      reporterUid: overrides?.reporterUid ?? basePayload.reporterUid,
      status: overrides?.status ?? basePayload.status,
      severity: (overrides?.severity as CrimeReportPayload['severity']) ?? basePayload.severity,
      barangay: overrides?.barangay ?? basePayload.barangay,
      triggerSource: overrides?.triggerSource ?? basePayload.triggerSource,
      createdVia: overrides?.createdVia ?? basePayload.createdVia,
      anonymous: overrides?.anonymous ?? basePayload.anonymous,
      upvotes: overrides?.upvotes ?? basePayload.upvotes,
      downvotes: overrides?.downvotes ?? basePayload.downvotes,
      userVotes: overrides?.userVotes ?? basePayload.userVotes,
      crimeType: overrides?.crimeType ?? basePayload.crimeType,
      description: overrides?.description ?? basePayload.description,
      dateTime: overrides?.dateTime ?? basePayload.dateTime,
      createdAt: overrides?.createdAt ?? basePayload.createdAt,
      timestamp: overrides?.timestamp ?? basePayload.timestamp,
    };

    if (overrides?.isTheftDetection !== undefined) {
      mergedPayload.isTheftDetection = overrides.isTheftDetection;
    }

    if (overrides?.theftDetails) {
      mergedPayload.theftDetails = overrides.theftDetails;
    }

    return mergedPayload;
  }

  private async persistCrimeReport(userId: string, reportId: string, payload: CrimeReportPayload) {
    const globalRef = ref(database, `civilian/civilian crime reports/${reportId}`);
    const userRef = ref(database, `civilian/civilian account/${userId}/crime reports/${reportId}`);

    await Promise.all([set(globalRef, payload), set(userRef, payload)]);
    console.log('SOS Service: Crime report saved at report ID:', reportId);
  }

  /**
   * Check if SOS service is active
   */
  isSOSActive(): boolean {
    return this.isActive;
  }

  /**
   * Check if location permissions are granted
   */
  private async checkLocationPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        console.log('SOS Service: Location permission already granted:', granted);
        return granted;
      } catch (error) {
        console.error('SOS Service: Error checking permissions:', error);
        return false;
      }
    }
    return true; // iOS handles permissions differently
  }

  /**
   * Request location permissions
   */
  private async requestLocationPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        console.log('SOS Service: Requesting location permissions...');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to location to send SOS alerts with your current position.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        console.log('SOS Service: Permission request result:', granted);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.error('SOS Service: Error requesting permissions:', error);
        return false;
      }
    }
    return true; // iOS handles permissions differently
  }

  /**
   * Get REAL GPS location with fast capture and geocoding
   */
  private async getRealGPSLocation(): Promise<GeocodingResult | null> {
    try {
      console.log('SOS Service: Getting REAL GPS location...');
      
      // Check if permissions are already granted
      const hasPermission = await this.checkLocationPermissions();
      
      if (!hasPermission) {
        // Request permissions if not granted
        const permissionGranted = await this.requestLocationPermissions();
        if (!permissionGranted) {
          console.error('SOS Service: Location permission denied');
          return null;
        }
      }

      // First, capture location coordinates quickly
      const locationPromise = new Promise<{latitude: number, longitude: number}>((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            console.log('SOS Service: Location captured - Lat:', latitude, 'Lng:', longitude, 'Accuracy:', `${accuracy}m`);
            
            // Accept coordinates with reasonable accuracy
            if (accuracy <= 200) {
              console.log(`SOS Service: Accepting coordinates with ${accuracy}m accuracy`);
              resolve({ latitude, longitude });
            } else {
              console.log(`SOS Service: Accuracy ${accuracy}m too poor, rejecting coordinates`);
              reject(new Error(`GPS accuracy too poor: ${accuracy}m`));
            }
          },
          (error) => {
            console.log('SOS Service: Location error:', error);
            
            let errorMessage = 'Unable to get your current location.';
            
            // Provide specific error messages based on error code
            switch (error.code) {
              case 1: // PERMISSION_DENIED
                errorMessage = 'Location permission denied. Please enable location access in settings.';
                break;
              case 2: // POSITION_UNAVAILABLE
                errorMessage = 'Location is currently unavailable. Please try again.';
                break;
              case 3: // TIMEOUT
                errorMessage = 'Location request timed out. Please try again.';
                break;
              default:
                errorMessage = 'Unable to get your current location. Please try again.';
            }
            
            console.error('SOS Service: GPS Error:', errorMessage);
            reject(error);
          },
          {
            enableHighAccuracy: false, // Faster capture
            timeout: 8000, // Reduced timeout for faster capture
            maximumAge: 30000 // Accept cached location up to 30 seconds old
          }
        );
      });

      // Wait for location with reduced timeout
      const coordinates = await Promise.race([
        locationPromise,
        new Promise<{latitude: number, longitude: number}>((_, reject) => 
          setTimeout(() => reject(new Error('Location timeout')), 8000)
        )
      ]);

      console.log('SOS Service: Location captured successfully:', coordinates);

      // Now do reverse geocoding with improved service
      console.log('SOS Service: Starting reverse geocoding...');
      const geocodingResult = await GeocodingService.reverseGeocode(
        coordinates.latitude, 
        coordinates.longitude
      );

      console.log('SOS Service: Geocoding completed:', geocodingResult);
      return geocodingResult;

    } catch (error) {
      console.error('SOS Service: GPS error:', error);
      return null;
    }
  }

  /**
   * Test GPS location (for debugging)
   */
  async testGPSLocation(): Promise<GeocodingResult | null> {
    return await this.getRealGPSLocation();
  }

  /**
   * Send theft-specific SOS alert with crime report
   */
  async sendTheftSOSAlert(userId: string, theftReportData: TheftReportData): Promise<void> {
    try {
      console.log('SOS Service: Sending theft SOS alert for user:', userId);
      
      const now = Date.now();
      
      // Check cooldown to prevent spam
      if (now - this.lastSOSTime < this.SOS_COOLDOWN) {
        console.log('SOS Service: Theft alert blocked due to cooldown');
        return;
      }

      this.lastSOSTime = now;
      this.isActive = true;

      // Create theft SOS alert
      const theftSOSAlert: SOSAlert = {
        id: `theft_sos_${now}`,
        timestamp: now,
        type: 'theft',
        location: theftReportData.location,
        message: theftReportData.description,
        userId
      };

      // Vibrate device with theft-specific pattern
      this.vibrateDevice();

      // Show theft alert
      this.showTheftAlert();

      // Save theft report to civilian crime reports
      await this.saveTheftReport(userId, theftReportData);

      // Save SOS alert to database
      const storedAlert = await this.saveSOSAlert(theftSOSAlert, {
        persistCrimeReport: false,
      });

      // Send notification to paired mobile app
      await PairingService.sendSOSToMobile(storedAlert ?? theftSOSAlert);

      console.log('SOS Service: Theft SOS alert sent successfully');
    } catch (error) {
      console.error('SOS Service: Failed to send theft SOS alert:', error);
    } finally {
      this.isActive = false;
    }
  }

  /**
   * Save theft report to civilian crime reports database
   */
  private async saveTheftReport(userId: string, theftReportData: TheftReportData): Promise<void> {
    try {
      if (!database) {
        console.warn('SOS Service: Database not available for theft report');
        return;
      }

      const reportId = theftReportData.timestamp.toString();
      const timestampIso = new Date(theftReportData.timestamp).toISOString();

      const alignedReport = {
        crimeType: theftReportData.crimeType,
        dateTime: timestampIso,
        description: theftReportData.description,
        multimedia: theftReportData.multimedia ?? [],
        videos: theftReportData.videos ?? [],
        location: {
          latitude: theftReportData.location.latitude,
          longitude: theftReportData.location.longitude,
          address: theftReportData.location.address,
        },
        barangay: theftReportData.barangay ?? 'Unknown',
        anonymous: theftReportData.anonymous ?? false,
        reporterName: theftReportData.reporterName ?? 'Smartwatch Auto Report',
        reporterUid: theftReportData.reporterUid ?? userId,
        status: theftReportData.status ?? 'pending',
        createdAt: theftReportData.createdAt ?? timestampIso,
        createdVia: theftReportData.createdVia ?? 'smartwatch_auto_theft_detection',
        reportId,
        severity: theftReportData.severity ?? 'Immediate',
        upvotes: theftReportData.upvotes ?? 0,
        downvotes: theftReportData.downvotes ?? 0,
        userVotes: theftReportData.userVotes ?? {},
        isTheftDetection: theftReportData.isTheftDetection,
        theftDetails: theftReportData.theftDetails,
        triggerSource: theftReportData.triggerSource ?? 'smartwatch_theft_detection',
        timestamp: theftReportData.timestamp,
      };
      
      await this.persistCrimeReport(userId, reportId, alignedReport);
      
      console.log('SOS Service: Theft report saved to database with ID:', reportId);
    } catch (error) {
      console.error('SOS Service: Failed to save theft report:', error);
    }
  }

  /**
   * Show theft-specific alert dialog
   */
  private showTheftAlert(): void {
    const title = 'THEFT DETECTED';
    const message = 'Your smartphone has been taken away! A theft report has been automatically sent to authorities with your current location.';
    
    Alert.alert(
      title,
      message,
      [
        {
          text: 'OK',
          style: 'default',
          onPress: () => {
            this.isActive = false;
          }
        }
      ],
      { cancelable: false }
    );
  }

  /**
   * Reset SOS service state
   */
  reset() {
    this.isActive = false;
    this.lastSOSTime = 0;
  }
}

export default new SOSService();

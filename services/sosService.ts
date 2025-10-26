import { Alert, Vibration, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { database } from '../firebaseConfig';
import { ref, push, set } from 'firebase/database';
import PairingService from './pairingService';
import { GeocodingService, GeocodingResult } from './geocodingService';

export interface SOSAlert {
  id: string;
  timestamp: number;
  type: 'manual' | 'proximity' | 'shake';
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

class SOSService {
  private isActive = false;
  private lastSOSTime = 0;
  private readonly SOS_COOLDOWN = 10000; // 10 seconds cooldown between SOS alerts

  /**
   * Send SOS alert with vibration and notification
   */
  async sendSOSAlert(type: 'manual' | 'proximity' | 'shake', userId: string, location?: { latitude: number; longitude: number }) {
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
      await this.saveSOSAlert(sosAlert);

      // Send notification to paired mobile app
      await PairingService.sendSOSToMobile(sosAlert);

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
  private getSOSMessage(type: 'manual' | 'proximity' | 'shake'): string {
    switch (type) {
      case 'manual':
        return 'SOS Alert - User pressed SOS button';
      case 'proximity':
        return 'Proximity SOS Alert - Smartwatch disconnected from phone (>5m)';
      case 'shake':
        return 'Shake SOS Alert - User shook smartwatch 3 times';
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
  private showSOSAlert(type: 'manual' | 'proximity' | 'shake') {
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
  private async saveSOSAlert(sosAlert: SOSAlert) {
    try {
      if (!database) {
        console.warn('SOS Service: Database not available');
        return;
      }

      const sosRef = ref(database, 'sos_alerts');
      const newSOSRef = push(sosRef);
      await set(newSOSRef, sosAlert);
      
      console.log('SOS Service: Alert saved to database');
    } catch (error) {
      console.error('SOS Service: Failed to save alert to database:', error);
    }
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
   * Reset SOS service state
   */
  reset() {
    this.isActive = false;
    this.lastSOSTime = 0;
  }
}

export default new SOSService();

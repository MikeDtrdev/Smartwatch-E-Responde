import { getDatabase, ref, set, get } from 'firebase/database';
import Geolocation from '@react-native-community/geolocation';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { database } from '../firebaseConfig';

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

class LocationTrackingService {
  private deviceId: string | null = null;
  private userId: string | null = null;
  private locationUpdateInterval: NodeJS.Timeout | null = null;
  private isTracking = false;
  private updateIntervalMs = 20000; // 20 seconds

  constructor() {
    console.log('LocationTrackingService: Service initialized');
  }

  /**
   * Initialize location tracking for the smartwatch
   */
  async initializeTracking(userId: string, deviceId: string): Promise<void> {
    try {
      console.log('LocationTrackingService: ============================================');
      console.log('LocationTrackingService: Initializing tracking for user:', userId);
      console.log('LocationTrackingService: Device ID:', deviceId);
      console.log('LocationTrackingService: ============================================');
      
      this.userId = userId;
      this.deviceId = deviceId;
      
      // Request location permissions
      console.log('LocationTrackingService: Requesting location permissions...');
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        console.error('LocationTrackingService: ❌ Location permission denied');
        throw new Error('Location permission denied. Please enable location access in settings.');
      }
      console.log('LocationTrackingService: ✅ Location permission granted');

      // Start location tracking
      console.log('LocationTrackingService: Starting location tracking...');
      await this.startLocationTracking();
      
      console.log('LocationTrackingService: ✅ Tracking initialized successfully');
      console.log('LocationTrackingService: Device ID:', this.deviceId);
      console.log('LocationTrackingService: Firebase path will be: device_locations/' + this.userId + '/smartwatch');
    } catch (error: any) {
      console.error('LocationTrackingService: ❌ Failed to initialize tracking:', error);
      console.error('LocationTrackingService: Error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      throw error;
    }
  }

  /**
   * Request location permissions for Android
   */
  private async requestLocationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'E-Responde needs access to your location to track device proximity and detect theft.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('LocationTrackingService: Location permission granted');
          return true;
        } else {
          console.log('LocationTrackingService: Location permission denied');
          return false;
        }
      }
      return true; // iOS permissions handled differently
    } catch (error) {
      console.error('LocationTrackingService: Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Start continuous location tracking
   */
  private async startLocationTracking(): Promise<void> {
    try {
      if (this.isTracking) {
        console.log('LocationTrackingService: Already tracking, stopping previous session');
        this.stopLocationTracking();
      }

      this.isTracking = true;
      console.log('LocationTrackingService: Starting location tracking every', this.updateIntervalMs, 'ms');
      console.log('LocationTrackingService: Device ID:', this.deviceId);
      console.log('LocationTrackingService: User ID:', this.userId);
      console.log('LocationTrackingService: Database:', database ? 'Connected' : 'Not connected');

      // Initial location update (don't wait for it to complete - let it run in background)
      console.log('LocationTrackingService: Performing initial location update...');
      this.updateLocation().catch((error) => {
        console.error('LocationTrackingService: Initial location update failed, but continuing tracking:', error);
      });
      console.log('LocationTrackingService: Location tracking interval starting (initial update may still be in progress)');

      // Set up interval for continuous updates
      this.locationUpdateInterval = setInterval(async () => {
        try {
          await this.updateLocation();
        } catch (error) {
          console.error('LocationTrackingService: Error in location update interval:', error);
        }
      }, this.updateIntervalMs);

    } catch (error) {
      console.error('LocationTrackingService: Failed to start location tracking:', error);
      throw error;
    }
  }

  /**
   * Update current location to Firebase
   */
  private async updateLocation(): Promise<void> {
    try {
      if (!this.deviceId || !this.userId) {
        console.log('LocationTrackingService: Device ID or User ID not set, skipping location update');
        console.log('LocationTrackingService: Device ID:', this.deviceId, 'User ID:', this.userId);
        return;
      }

      console.log('LocationTrackingService: Getting current location...');
      console.log('LocationTrackingService: Device ID:', this.deviceId);
      console.log('LocationTrackingService: User ID:', this.userId);
      
      const position = await this.getCurrentPosition();
      
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: Date.now()
      };

      console.log('LocationTrackingService: Location data prepared:', locationData);
      console.log('LocationTrackingService: Writing to Firebase path: device_locations/' + this.userId + '/smartwatch');

      // Check if database is available
      if (!database) {
        console.error('LocationTrackingService: ❌ Database is not initialized!');
        throw new Error('Firebase database is not initialized. Please check Firebase configuration.');
      }

      console.log('LocationTrackingService: Database is available, proceeding with write...');

      // Update location in Firebase - write longitude and latitude separately
      const longitudeRef = ref(database, `device_locations/${this.userId}/smartwatch/longitude`);
      const latitudeRef = ref(database, `device_locations/${this.userId}/smartwatch/latitude`);
      console.log('LocationTrackingService: Firebase references created:', {
        longitude: longitudeRef.toString(),
        latitude: latitudeRef.toString()
      });
      
      await set(longitudeRef, locationData.longitude);
      await set(latitudeRef, locationData.latitude);
      console.log('LocationTrackingService: Firebase set() call completed');
      
      console.log('LocationTrackingService: ✅ Location updated successfully in Firebase:', {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        timestamp: new Date(locationData.timestamp).toISOString(),
        userId: this.userId,
        path: `device_locations/${this.userId}/smartwatch`
      });

    } catch (error: any) {
      console.error('LocationTrackingService: ❌ Failed to update location:', error);
      console.error('LocationTrackingService: Error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
        deviceId: this.deviceId,
        userId: this.userId
      });
      // Don't throw error to prevent stopping the tracking interval
    }
  }

  /**
   * Get current GPS position
   */
  private getCurrentPosition(): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('LocationTrackingService: Requesting GPS location...');
      console.log('LocationTrackingService: Geolocation module:', Geolocation ? 'Available' : 'NULL');
      
      if (!Geolocation) {
        console.error('LocationTrackingService: ❌ Geolocation module is null!');
        reject(new Error('Geolocation module is not available. Please check if @react-native-community/geolocation is properly installed and linked.'));
        return;
      }
      
      if (!Geolocation.getCurrentPosition) {
        console.error('LocationTrackingService: ❌ getCurrentPosition method is not available!');
        reject(new Error('getCurrentPosition method is not available on Geolocation module.'));
        return;
      }
      
      console.log('LocationTrackingService: GPS options:', {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      });
      
      // First try with high accuracy, but if it fails, retry with lower accuracy
      Geolocation.getCurrentPosition(
        (position) => {
          console.log('LocationTrackingService: ✅ GPS position obtained:', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed
          });
          resolve(position);
        },
        (error) => {
          console.warn('LocationTrackingService: ⚠️ High accuracy GPS failed, trying with lower accuracy...', error);
          console.warn('LocationTrackingService: GPS error code:', error.code);
          console.warn('LocationTrackingService: GPS error message:', error.message);
          
          // Retry with lower accuracy and longer timeout for smartwatch
          Geolocation.getCurrentPosition(
            (position) => {
              console.log('LocationTrackingService: ✅ GPS position obtained (lower accuracy):', {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              });
              resolve(position);
            },
            (retryError) => {
              console.error('LocationTrackingService: ❌ GPS error (retry also failed):', retryError);
              console.error('LocationTrackingService: GPS error code:', retryError.code);
              console.error('LocationTrackingService: GPS error message:', retryError.message);
              
              // Provide detailed error information
              let errorMessage = `GPS Error: ${retryError.message}`;
              if (retryError.code === 1) {
                errorMessage = 'GPS Error: Permission denied. Please enable location permissions.';
              } else if (retryError.code === 2) {
                errorMessage = 'GPS Error: Position unavailable. Please check GPS signal.';
              } else if (retryError.code === 3) {
                errorMessage = 'GPS Error: Request timeout. GPS may not be available. Please ensure you are outdoors or have GPS signal.';
              }
              
              reject(new Error(errorMessage));
            },
            {
              enableHighAccuracy: false, // Lower accuracy for smartwatch
              timeout: 20000, // Longer timeout for smartwatch (20 seconds)
              maximumAge: 30000, // Accept cached location up to 30 seconds old
              showLocationDialog: true,
              forceRequestLocation: false, // Don't force if cached available
            }
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // First attempt with high accuracy
          maximumAge: 10000, // Accept cached location up to 10 seconds old
          showLocationDialog: true,
          forceRequestLocation: false, // Don't force if cached available
        }
      );
    });
  }

  /**
   * Get phone location from Firebase
   */
  async getPhoneLocation(): Promise<DeviceLocation | null> {
    try {
      if (!database || !this.userId) {
        console.log('LocationTrackingService: Database not available or User ID not set');
        return null;
      }

      const phoneLatitudeRef = ref(database, `device_locations/${this.userId}/phone/latitude`);
      const phoneLongitudeRef = ref(database, `device_locations/${this.userId}/phone/longitude`);
      
      const latitudeSnapshot = await get(phoneLatitudeRef);
      const longitudeSnapshot = await get(phoneLongitudeRef);
      
      if (latitudeSnapshot.exists() && longitudeSnapshot.exists()) {
        const latitude = latitudeSnapshot.val();
        const longitude = longitudeSnapshot.val();
        console.log('LocationTrackingService: Phone location retrieved:', { latitude, longitude });
        return {
          latitude,
          longitude,
          timestamp: Date.now() // Use current timestamp since we're not storing it separately
        };
      } else {
        console.log('LocationTrackingService: Phone location not found');
        return null;
      }
    } catch (error) {
      console.error('LocationTrackingService: Error getting phone location:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in meters
    return distance;
  }

  /**
   * Stop location tracking
   */
  stopLocationTracking(): void {
    try {
      console.log('LocationTrackingService: Stopping location tracking');
      
      this.isTracking = false;
      
      if (this.locationUpdateInterval) {
        clearInterval(this.locationUpdateInterval);
        this.locationUpdateInterval = null;
      }
      
      console.log('LocationTrackingService: Location tracking stopped');
    } catch (error) {
      console.error('LocationTrackingService: Error stopping location tracking:', error);
    }
  }

  /**
   * Check if tracking is active
   */
  isLocationTrackingActive(): boolean {
    return this.isTracking;
  }

  /**
   * Get current device ID
   */
  getDeviceId(): string | null {
    return this.deviceId;
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Set update interval
   */
  setUpdateInterval(intervalMs: number): void {
    this.updateIntervalMs = intervalMs;
    console.log('LocationTrackingService: Update interval set to', intervalMs, 'ms');
  }
}

// Export singleton instance
export default new LocationTrackingService();

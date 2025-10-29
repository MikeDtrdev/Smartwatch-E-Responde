import { getDatabase, ref, set, get } from 'firebase/database';
import Geolocation from 'react-native-geolocation-service';
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
      console.log('LocationTrackingService: Initializing tracking for user:', userId, 'device:', deviceId);
      
      this.userId = userId;
      this.deviceId = deviceId;
      
      // Request location permissions
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      // Start location tracking
      await this.startLocationTracking();
      
      console.log('LocationTrackingService: Tracking initialized successfully');
    } catch (error) {
      console.error('LocationTrackingService: Failed to initialize tracking:', error);
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

      // Initial location update
      await this.updateLocation();

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
        return;
      }

      console.log('LocationTrackingService: Getting current location...');
      
      const position = await this.getCurrentPosition();
      
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: Date.now()
      };

      // Update location in Firebase
      const locationRef = ref(database, `device_locations/${this.deviceId}`);
      await set(locationRef, locationData);
      
      console.log('LocationTrackingService: Location updated successfully:', {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        timestamp: new Date(locationData.timestamp).toISOString()
      });

    } catch (error) {
      console.error('LocationTrackingService: Failed to update location:', error);
      // Don't throw error to prevent stopping the tracking interval
    }
  }

  /**
   * Get current GPS position
   */
  private getCurrentPosition(): Promise<Geolocation.GeoPosition> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          console.log('LocationTrackingService: GPS position obtained:', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          resolve(position);
        },
        (error) => {
          console.error('LocationTrackingService: GPS error:', error);
          reject(new Error(`GPS Error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
          showLocationDialog: true,
          forceRequestLocation: true,
        }
      );
    });
  }

  /**
   * Get phone location from Firebase
   */
  async getPhoneLocation(): Promise<DeviceLocation | null> {
    try {
      if (!database) {
        console.log('LocationTrackingService: Database not available');
        return null;
      }

      const phoneLocationRef = ref(database, 'device_locations/phone');
      const snapshot = await get(phoneLocationRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('LocationTrackingService: Phone location retrieved:', data);
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: data.timestamp
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

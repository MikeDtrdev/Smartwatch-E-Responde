import { getDatabase, ref, set, get } from 'firebase/database';
import { database } from '../firebaseConfig';
import LocationTrackingService from './locationTrackingService';
import SOSService from './sosService';

export interface TheftDetectionConfig {
  distanceThreshold: number; // meters
  monitoringInterval: number; // milliseconds
  sosCooldown: number; // milliseconds
}

class TheftDetectionService {
  private userId: string | null = null;
  private deviceId: string | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private lastSOSTrigger = 0;
  private config: TheftDetectionConfig = {
    distanceThreshold: 5, // 5 meters
    monitoringInterval: 10000, // 10 seconds
    sosCooldown: 60000 // 1 minute cooldown
  };

  constructor() {
    console.log('TheftDetectionService: Service initialized');
  }

  /**
   * Start theft detection monitoring
   */
  async startTheftDetection(userId: string, deviceId: string): Promise<void> {
    try {
      console.log('TheftDetectionService: Starting theft detection for user:', userId, 'device:', deviceId);
      
      this.userId = userId;
      this.deviceId = deviceId;
      
      // Initialize location tracking
      await LocationTrackingService.initializeTracking(userId, deviceId);
      
      // Start distance monitoring
      this.startDistanceMonitoring();
      
      console.log('TheftDetectionService: Theft detection started successfully');
    } catch (error) {
      console.error('TheftDetectionService: Failed to start theft detection:', error);
      throw error;
    }
  }

  /**
   * Start monitoring distance between watch and phone
   */
  private startDistanceMonitoring(): void {
    try {
      if (this.isMonitoring) {
        console.log('TheftDetectionService: Already monitoring, stopping previous session');
        this.stopTheftDetection();
      }

      this.isMonitoring = true;
      console.log('TheftDetectionService: Starting distance monitoring every', this.config.monitoringInterval, 'ms');

      // Initial distance check
      this.checkDistance();

      // Set up interval for continuous monitoring
      this.monitoringInterval = setInterval(async () => {
        try {
          await this.checkDistance();
        } catch (error) {
          console.error('TheftDetectionService: Error in distance monitoring interval:', error);
        }
      }, this.config.monitoringInterval);

    } catch (error) {
      console.error('TheftDetectionService: Failed to start distance monitoring:', error);
    }
  }

  /**
   * Check distance between watch and phone
   */
  private async checkDistance(): Promise<void> {
    try {
      if (!this.userId || !this.deviceId) {
        console.log('TheftDetectionService: User ID or Device ID not set, skipping distance check');
        return;
      }

      console.log('TheftDetectionService: Checking distance between watch and phone...');

      // Get phone location
      const phoneLocation = await LocationTrackingService.getPhoneLocation();
      if (!phoneLocation) {
        console.log('TheftDetectionService: Phone location not found, skipping distance check');
        return;
      }

      // Get watch location (current location)
      const watchLocation = await this.getCurrentWatchLocation();
      if (!watchLocation) {
        console.log('TheftDetectionService: Watch location not available, skipping distance check');
        return;
      }

      // Calculate distance
      const distance = LocationTrackingService.calculateDistance(
        phoneLocation.latitude,
        phoneLocation.longitude,
        watchLocation.latitude,
        watchLocation.longitude
      );

      console.log('TheftDetectionService: Distance calculated:', distance.toFixed(2), 'meters');

      // Check if distance exceeds threshold
      if (distance > this.config.distanceThreshold) {
        console.log('TheftDetectionService: Distance exceeds threshold! Triggering theft detection...');
        await this.triggerTheftSOS(distance, phoneLocation, watchLocation);
      } else {
        console.log('TheftDetectionService: Distance within safe range');
      }

    } catch (error) {
      console.error('TheftDetectionService: Error checking distance:', error);
    }
  }

  /**
   * Get current watch location
   */
  private async getCurrentWatchLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      return new Promise((resolve) => {
        const Geolocation = require('react-native-geolocation-service');
        
        Geolocation.getCurrentPosition(
          (position: any) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error: any) => {
            console.error('TheftDetectionService: Error getting watch location:', error);
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 10000
          }
        );
      });
    } catch (error) {
      console.error('TheftDetectionService: Error getting watch location:', error);
      return null;
    }
  }

  /**
   * Trigger theft SOS report
   */
  private async triggerTheftSOS(
    distance: number, 
    phoneLocation: { latitude: number; longitude: number; timestamp: number },
    watchLocation: { latitude: number; longitude: number }
  ): Promise<void> {
    try {
      const now = Date.now();
      
      // Check cooldown to prevent spam
      if (now - this.lastSOSTrigger < this.config.sosCooldown) {
        console.log('TheftDetectionService: SOS cooldown active, skipping theft report');
        return;
      }

      console.log('TheftDetectionService: Creating theft SOS report...');

      // Create theft report data
      const theftReportData = {
        crimeType: 'Theft',
        description: `Smartphone taken away from smartwatch. Distance: ${distance.toFixed(2)} meters. Phone was at location ${phoneLocation.latitude.toFixed(6)}, ${phoneLocation.longitude.toFixed(6)} when theft was detected.`,
        location: {
          latitude: watchLocation.latitude,
          longitude: watchLocation.longitude,
          address: 'Location detected via GPS'
        },
        severity: 'Immediate',
        createdAt: new Date().toISOString(),
        timestamp: now,
        isTheftDetection: true,
        theftDetails: {
          distance: distance,
          phoneLocation: phoneLocation,
          watchLocation: watchLocation,
          detectionTime: new Date().toISOString()
        }
      };

      // Send SOS alert with theft report
      if (this.userId) {
        await SOSService.sendTheftSOSAlert(this.userId, theftReportData);
        this.lastSOSTrigger = now;
        console.log('TheftDetectionService: Theft SOS report sent successfully');
      }

    } catch (error) {
      console.error('TheftDetectionService: Error triggering theft SOS:', error);
    }
  }

  /**
   * Stop theft detection monitoring
   */
  stopTheftDetection(): void {
    try {
      console.log('TheftDetectionService: Stopping theft detection');
      
      this.isMonitoring = false;
      
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }
      
      // Stop location tracking
      LocationTrackingService.stopLocationTracking();
      
      console.log('TheftDetectionService: Theft detection stopped');
    } catch (error) {
      console.error('TheftDetectionService: Error stopping theft detection:', error);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TheftDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('TheftDetectionService: Configuration updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): TheftDetectionConfig {
    return { ...this.config };
  }

  /**
   * Check if monitoring is active
   */
  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Get last SOS trigger time
   */
  getLastSOSTrigger(): number {
    return this.lastSOSTrigger;
  }

  /**
   * Reset SOS cooldown (for testing)
   */
  resetSOSCooldown(): void {
    this.lastSOSTrigger = 0;
    console.log('TheftDetectionService: SOS cooldown reset');
  }
}

// Export singleton instance
export default new TheftDetectionService();

import { DeviceEventEmitter, Platform, PermissionsAndroid, Vibration, Alert } from 'react-native';
import SOSService from './sosService';
import { GeocodingService, GeocodingResult } from './geocodingService';
import AccelerometerService from './accelerometerService';

interface ShakeData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

class ShakeSOSService {
  private isMonitoring = false;
  private lastSOSTime = 0; // Track last SOS trigger time
  private readonly SOS_COOLDOWN = 30000; // 30 seconds cooldown between SOS triggers

  /**
   * Start monitoring for shake gestures using accelerometer
   */
  startMonitoring(userId: string) {
    if (this.isMonitoring) {
      console.log('Shake SOS Service: Already monitoring');
      return;
    }

    this.isMonitoring = true;
    console.log('Shake SOS Service: Started monitoring for shake gestures using accelerometer');
    
    // Start accelerometer monitoring with shake detection callback
    AccelerometerService.startMonitoring(() => {
      this.handleTripleShakeDetected(userId);
    });
  }

  /**
   * Handle triple shake detection from accelerometer service
   */
  private async handleTripleShakeDetected(userId: string) {
    // Triple safety check: Only process if monitoring is active
    if (!this.isMonitoring) {
      console.log('Shake SOS Service: Monitoring is disabled, ignoring shake detection');
      return;
    }

    // Additional safety check: Ensure userId is valid
    if (!userId) {
      console.log('Shake SOS Service: Invalid userId, ignoring shake detection');
      return;
    }

    try {
      // Check cooldown to prevent rapid successive SOS triggers
      const now = Date.now();
      if (now - this.lastSOSTime < this.SOS_COOLDOWN) {
        console.log(`Shake SOS Service: SOS blocked due to cooldown (${Math.round((this.SOS_COOLDOWN - (now - this.lastSOSTime)) / 1000)}s remaining)`);
        return;
      }

      this.lastSOSTime = now;
      console.log('Shake SOS Service: Triple shake detected - triggering SOS alert');
      
      // Show user-friendly alert
      Alert.alert(
        'SOS ACTIVATED',
        'Your emergency alert has been sent successfully with your current location.',
        [{ text: 'OK', style: 'default' }],
        { cancelable: false }
      );
      
      // Vibrate to give user feedback that triple shake was detected
      Vibration.vibrate([0, 200, 100, 200]); // Short-short-long vibration pattern
      
      // Get current location with geocoding
      const location = await this.getCurrentLocationWithGeocoding();
      
      // Send SOS alert
      await SOSService.sendSOSAlert('shake', userId, location);
      
      console.log('Shake SOS Service: SOS alert sent successfully');
      
    } catch (error) {
      console.error('Shake SOS Service: Failed to trigger SOS:', error);
    }
  }

  /**
   * Stop monitoring shake gestures
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      console.log('Shake SOS Service: Already stopped');
      return;
    }

    this.isMonitoring = false;
    AccelerometerService.emergencyStop(); // Use emergency stop for complete shutdown

    console.log('Shake SOS Service: Stopped monitoring - accelerometer completely disabled');
  }


  /**
   * Get current location with geocoding using the same method as main SOS service
   */
  private async getCurrentLocationWithGeocoding(): Promise<GeocodingResult | null> {
    try {
      console.log('Shake SOS Service: Getting GPS location with geocoding...');
      
      // Use the same GPS method as the main SOS service
      const Geolocation = require('@react-native-community/geolocation').default;
      
      // First, capture location coordinates quickly
      const locationPromise = new Promise<{latitude: number, longitude: number}>((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            console.log('Shake SOS Service: Location captured - Lat:', latitude, 'Lng:', longitude, 'Accuracy:', `${accuracy}m`);
            
            // Accept coordinates with reasonable accuracy
            if (accuracy <= 200) {
              console.log(`Shake SOS Service: Accepting coordinates with ${accuracy}m accuracy`);
              resolve({ latitude, longitude });
            } else {
              console.log(`Shake SOS Service: Accuracy ${accuracy}m too poor, rejecting coordinates`);
              reject(new Error(`GPS accuracy too poor: ${accuracy}m`));
            }
          },
          (error) => {
            console.log('Shake SOS Service: Location error:', error);
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

      console.log('Shake SOS Service: Location captured successfully:', coordinates);

      // Now do reverse geocoding
      console.log('Shake SOS Service: Starting reverse geocoding...');
      const geocodingResult = await GeocodingService.reverseGeocode(
        coordinates.latitude, 
        coordinates.longitude
      );

      console.log('Shake SOS Service: Geocoding completed:', geocodingResult);
      return geocodingResult;

    } catch (error) {
      console.error('Shake SOS Service: GPS/Geocoding error:', error);
      return null;
    }
  }

  /**
   * Get current shake count from accelerometer service
   */
  getShakeCount(): number {
    return AccelerometerService.getShakeCount();
  }

  /**
   * Reset shake count in accelerometer service
   */
  resetShakeCount() {
    AccelerometerService.resetShakeCount();
  }

  /**
   * Reset SOS cooldown (for testing purposes)
   */
  resetSOSCooldown() {
    this.lastSOSTime = 0;
    console.log('Shake SOS Service: SOS cooldown reset');
  }

  /**
   * Update accelerometer configuration
   */
  updateShakeConfig(config: { threshold?: number; requiredShakes?: number; shakeTimeout?: number; shakeInterval?: number }) {
    AccelerometerService.updateConfig(config);
    console.log('Shake SOS Service: Shake configuration updated');
  }

  /**
   * Get current accelerometer configuration
   */
  getShakeConfig() {
    return AccelerometerService.getConfig();
  }

  /**
   * Check if accelerometer service is active
   */
  isAccelerometerActive(): boolean {
    return AccelerometerService.isActive();
  }

}

export default new ShakeSOSService();
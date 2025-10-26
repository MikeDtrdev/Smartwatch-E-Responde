import { DeviceEventEmitter, NativeEventEmitter, NativeModules, Platform } from 'react-native';
import SOSService from './sosService';
import { GeocodingService, GeocodingResult } from './geocodingService';

interface ProximityData {
  distance: number;
  isConnected: boolean;
}

class ProximitySOSService {
  private isMonitoring = false;
  private lastDistance = 0;
  private readonly MAX_DISTANCE = 5; // 5 meters
  private eventEmitter: NativeEventEmitter | null = null;
  private proximityListener: any = null;

  constructor() {
    this.initializeEventEmitter();
  }

  /**
   * Initialize event emitter for proximity sensor
   */
  private initializeEventEmitter() {
    try {
      if (Platform.OS === 'android') {
        // For Android, we'll use a mock proximity service since React Native doesn't have built-in proximity
        // In a real implementation, you'd need a native module
        console.log('Proximity SOS Service: Initialized for Android');
      }
    } catch (error) {
      console.error('Proximity SOS Service: Failed to initialize:', error);
    }
  }

  /**
   * Start monitoring proximity
   */
  startMonitoring(userId: string) {
    if (this.isMonitoring) {
      console.log('Proximity SOS Service: Already monitoring');
      return;
    }

    this.isMonitoring = true;
    console.log('Proximity SOS Service: Started monitoring');

    // Simulate proximity monitoring with periodic checks
    // In a real implementation, this would use actual proximity sensor data
    this.simulateProximityMonitoring(userId);
  }

  /**
   * Stop monitoring proximity
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.proximityListener) {
      this.proximityListener.remove();
      this.proximityListener = null;
    }

    console.log('Proximity SOS Service: Stopped monitoring');
  }

  /**
   * Simulate proximity monitoring for development
   * In production, this would use actual sensor data
   */
  private simulateProximityMonitoring(userId: string) {
    let checkCount = 0;
    let consecutiveExceeded = 0; // Track consecutive distance exceedances
    
    const proximityCheck = () => {
      if (!this.isMonitoring) return;

      // Simulate more stable distance readings (like a real smartwatch would have)
      const baseDistance = 1.5; // Base distance when connected (more realistic)
      const variation = (Math.random() - 0.5) * 1.5; // -0.75 to +0.75 meters variation (much smaller)
      const simulatedDistance = Math.max(0.1, baseDistance + variation);
      
      // Only log every 10th check to reduce spam
      if (checkCount % 10 === 0) {
        console.log(`Proximity SOS Service: Distance check - ${simulatedDistance.toFixed(2)}m`);
      }
      
      // Check if distance exceeds threshold
      if (simulatedDistance > this.MAX_DISTANCE) {
        consecutiveExceeded++;
        console.log(`Proximity SOS Service: Distance exceeded threshold (${consecutiveExceeded} consecutive)`);
        
        // Only trigger SOS after 5 consecutive exceedances to reduce false positives
        if (consecutiveExceeded >= 5) {
          this.triggerProximitySOS(userId, simulatedDistance);
          consecutiveExceeded = 0; // Reset counter
        }
      } else {
        consecutiveExceeded = 0; // Reset counter when distance is normal
      }

      this.lastDistance = simulatedDistance;
      checkCount++;

      // Continue monitoring - check every 5 seconds (less frequent)
      setTimeout(proximityCheck, 5000);
    };

    // Start the monitoring loop
    proximityCheck();
  }

  /**
   * Trigger proximity SOS alert
   */
  private async triggerProximitySOS(userId: string, distance: number) {
    try {
      console.log(`Proximity SOS Service: Triggering SOS for distance ${distance.toFixed(2)}m`);
      
      // Get current location with geocoding
      const location = await this.getCurrentLocationWithGeocoding();
      
      // Send SOS alert
      await SOSService.sendSOSAlert('proximity', userId, location);
      
    } catch (error) {
      console.error('Proximity SOS Service: Failed to trigger SOS:', error);
    }
  }

  /**
   * Get current location with geocoding using the same method as main SOS service
   */
  private async getCurrentLocationWithGeocoding(): Promise<GeocodingResult | null> {
    try {
      console.log('Proximity SOS Service: Getting GPS location with geocoding...');
      
      // Use the same GPS method as the main SOS service
      const Geolocation = require('@react-native-community/geolocation').default;
      
      // First, capture location coordinates quickly
      const locationPromise = new Promise<{latitude: number, longitude: number}>((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            console.log('Proximity SOS Service: Location captured - Lat:', latitude, 'Lng:', longitude, 'Accuracy:', `${accuracy}m`);
            
            // Accept coordinates with reasonable accuracy
            if (accuracy <= 200) {
              console.log(`Proximity SOS Service: Accepting coordinates with ${accuracy}m accuracy`);
              resolve({ latitude, longitude });
            } else {
              console.log(`Proximity SOS Service: Accuracy ${accuracy}m too poor, rejecting coordinates`);
              reject(new Error(`GPS accuracy too poor: ${accuracy}m`));
            }
          },
          (error) => {
            console.log('Proximity SOS Service: Location error:', error);
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

      console.log('Proximity SOS Service: Location captured successfully:', coordinates);

      // Now do reverse geocoding
      console.log('Proximity SOS Service: Starting reverse geocoding...');
      const geocodingResult = await GeocodingService.reverseGeocode(
        coordinates.latitude, 
        coordinates.longitude
      );

      console.log('Proximity SOS Service: Geocoding completed:', geocodingResult);
      return geocodingResult;

    } catch (error) {
      console.error('Proximity SOS Service: GPS/Geocoding error:', error);
      return null;
    }
  }

  /**
   * Check if monitoring is active
   */
  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Get last recorded distance
   */
  getLastDistance(): number {
    return this.lastDistance;
  }
}

export default new ProximitySOSService();

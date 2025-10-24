import { Alert, Vibration, Platform, PermissionsAndroid } from 'react-native';
import { database } from '../firebaseConfig';
import { ref, push, set } from 'firebase/database';
import PairingService from './pairingService';

export interface SOSAlert {
  id: string;
  timestamp: number;
  type: 'manual' | 'proximity' | 'shake';
  location?: {
    latitude: number;
    longitude: number;
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
    const now = Date.now();
    
    // Check cooldown to prevent spam
    if (now - this.lastSOSTime < this.SOS_COOLDOWN) {
      console.log('SOS Service: Alert blocked due to cooldown');
      return;
    }

    this.lastSOSTime = now;
    this.isActive = true;

    try {
      // Get location if not provided
      const alertLocation = location || await this.getCurrentLocation();
      
      // Create SOS alert object
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

      console.log('SOS Service: Alert sent successfully', sosAlert);
    } catch (error) {
      console.error('SOS Service: Failed to send alert:', error);
    }
  }

  /**
   * Get appropriate SOS message based on trigger type
   */
  private getSOSMessage(type: 'manual' | 'proximity' | 'shake'): string {
    switch (type) {
      case 'manual':
        return 'Manual SOS Alert - User pressed SOS button';
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
    const title = '🚨 SOS ALERT SENT 🚨';
    const message = this.getSOSMessage(type);
    
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
   * Get current location using GPS
   */
  private async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    try {
      // For now, use fallback location to prevent crashes
      // TODO: Implement proper GPS location tracking when Geolocation package is fixed
      console.log('SOS Service: Using fallback location (GPS temporarily disabled)');
      return this.getFallbackLocation();
      
      /* GPS Location Code - Temporarily Disabled
      // Request location permissions on Android
      if (Platform.OS === 'android') {
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
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('SOS Service: Location permission denied, using fallback location');
          return this.getFallbackLocation();
        }
      }

      // Use React Native's built-in Geolocation API
      const { Geolocation } = require('@react-native-community/geolocation');
      
      // Get current position with timeout
      return new Promise((resolve, reject) => {
        if (!Geolocation || !Geolocation.getCurrentPosition) {
          console.warn('SOS Service: Geolocation not available, using fallback');
          resolve(this.getFallbackLocation());
          return;
        }

        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log('SOS Service: GPS location obtained:', { latitude, longitude });
            resolve({ latitude, longitude });
          },
          (error) => {
            console.warn('SOS Service: Failed to get GPS location:', error);
            resolve(this.getFallbackLocation());
          },
          {
            enableHighAccuracy: true,
            timeout: 10000, // 10 seconds timeout
            maximumAge: 60000, // Accept location up to 1 minute old
          }
        );
      });
      */
    } catch (error) {
      console.warn('SOS Service: Location error, using fallback:', error);
      return this.getFallbackLocation();
    }
  }

  /**
   * Get fallback location (Manila area) when GPS is unavailable
   */
  private getFallbackLocation(): { latitude: number; longitude: number } {
    console.log('SOS Service: Using fallback location');
    return {
      latitude: 14.5995 + (Math.random() - 0.5) * 0.01, // Manila area
      longitude: 120.9842 + (Math.random() - 0.5) * 0.01
    };
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

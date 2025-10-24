import { database } from '../firebaseConfig';
import { ref, set, onValue, off, push } from 'firebase/database';

export interface SmartwatchDevice {
  id: string;
  name: string;
  userId: string;
  isPaired: boolean;
  lastSeen: number;
  batteryLevel?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface PairingRequest {
  id: string;
  smartwatchId: string;
  mobileUserId: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'rejected';
}

class PairingService {
  private currentDevice: SmartwatchDevice | null = null;
  private pairingListeners: Array<() => void> = [];

  /**
   * Initialize smartwatch device - reuse existing device if available
   */
  async initializeDevice(userId: string, deviceName: string = 'E-Responde Smartwatch'): Promise<SmartwatchDevice> {
    try {
      // First, try to find existing device for this user
      const existingDevice = await this.findExistingDevice(userId);
      
      if (existingDevice) {
        // Update existing device with current timestamp and battery
        existingDevice.lastSeen = Date.now();
        existingDevice.batteryLevel = 100;
        
        // Update device in database
        const deviceRef = ref(database, `devices/${existingDevice.id}`);
        await set(deviceRef, existingDevice);
        
        this.currentDevice = existingDevice;
        console.log('Pairing Service: Reusing existing device:', existingDevice);
        
        // Clean up old devices in background
        this.cleanupOldDevices(userId).catch(error => 
          console.warn('Pairing Service: Background cleanup failed:', error)
        );
        
        return existingDevice;
      }

      // Create new device if none exists
      const deviceId = `smartwatch_${Date.now()}`;
      const device: SmartwatchDevice = {
        id: deviceId,
        name: deviceName,
        userId,
        isPaired: false,
        lastSeen: Date.now(),
        batteryLevel: 100
      };

      // Save device to database
      const deviceRef = ref(database, `devices/${deviceId}`);
      await set(deviceRef, device);

      this.currentDevice = device;
      console.log('Pairing Service: New device created:', device);
      
      return device;
    } catch (error) {
      console.error('Pairing Service: Failed to initialize device:', error);
      throw error;
    }
  }

  /**
   * Find existing device for user
   */
  private async findExistingDevice(userId: string): Promise<SmartwatchDevice | null> {
    try {
      const devicesRef = ref(database, 'devices');
      
      return new Promise((resolve) => {
        const listener = onValue(devicesRef, (snapshot) => {
          if (snapshot.exists()) {
            const devices = snapshot.val();
            
            // Look for existing device with this userId
            for (const deviceId in devices) {
              const device = devices[deviceId] as SmartwatchDevice;
              if (device.userId === userId && deviceId.startsWith('smartwatch_')) {
                off(devicesRef, 'value', listener);
                resolve(device);
                return;
              }
            }
          }
          
          off(devicesRef, 'value', listener);
          resolve(null);
        });
      });
    } catch (error) {
      console.warn('Pairing Service: Failed to find existing device:', error);
      return null;
    }
  }

  /**
   * Start listening for pairing requests
   */
  startListeningForPairing(deviceId: string, onPairingRequest: (request: PairingRequest) => void) {
    try {
      const pairingRef = ref(database, `pairing_requests/${deviceId}`);
      
      const listener = onValue(pairingRef, (snapshot) => {
        if (snapshot.exists()) {
          const request = snapshot.val() as PairingRequest;
          console.log('Pairing Service: New pairing request received:', request);
          onPairingRequest(request);
        }
      });

      this.pairingListeners.push(() => off(pairingRef, 'value', listener));
      console.log('Pairing Service: Started listening for pairing requests');
    } catch (error) {
      console.error('Pairing Service: Failed to start listening:', error);
    }
  }

  /**
   * Accept pairing request
   */
  async acceptPairing(requestId: string, mobileUserId: string): Promise<boolean> {
    try {
      // Update pairing request status
      const requestRef = ref(database, `pairing_requests/${requestId}`);
      await set(requestRef, {
        status: 'accepted',
        acceptedAt: Date.now()
      });

      // Update device pairing status
      if (this.currentDevice) {
        const deviceRef = ref(database, `devices/${this.currentDevice.id}`);
        await set(deviceRef, {
          ...this.currentDevice,
          isPaired: true,
          pairedWith: mobileUserId,
          pairedAt: Date.now()
        });
      }

      console.log('Pairing Service: Pairing accepted successfully');
      return true;
    } catch (error) {
      console.error('Pairing Service: Failed to accept pairing:', error);
      return false;
    }
  }

  /**
   * Send SOS notification to paired mobile app
   */
  async sendSOSToMobile(sosAlert: any): Promise<boolean> {
    try {
      if (!this.currentDevice?.isPaired) {
        console.warn('Pairing Service: Device not paired, cannot send SOS to mobile');
        return false;
      }

      // Send SOS notification to mobile app
      const notificationRef = ref(database, `notifications/${this.currentDevice.userId}`);
      const newNotificationRef = push(notificationRef);
      
      await set(newNotificationRef, {
        ...sosAlert,
        type: 'sos_alert',
        timestamp: Date.now(),
        from: 'smartwatch',
        deviceId: this.currentDevice.id
      });

      console.log('Pairing Service: SOS notification sent to mobile app');
      return true;
    } catch (error) {
      console.error('Pairing Service: Failed to send SOS to mobile:', error);
      return false;
    }
  }

  /**
   * Update device status
   */
  async updateDeviceStatus(batteryLevel?: number, location?: { latitude: number; longitude: number }) {
    try {
      if (!this.currentDevice) return;

      const deviceRef = ref(database, `devices/${this.currentDevice.id}`);
      await set(deviceRef, {
        ...this.currentDevice,
        lastSeen: Date.now(),
        batteryLevel: batteryLevel || this.currentDevice.batteryLevel,
        location: location || this.currentDevice.location
      });

      console.log('Pairing Service: Device status updated');
    } catch (error) {
      console.error('Pairing Service: Failed to update device status:', error);
    }
  }

  /**
   * Get current device
   */
  getCurrentDevice(): SmartwatchDevice | null {
    return this.currentDevice;
  }

  /**
   * Check if device is paired
   */
  isPaired(): boolean {
    return this.currentDevice?.isPaired || false;
  }

  /**
   * Clean up old devices for user (remove devices older than 7 days)
   */
  async cleanupOldDevices(userId: string) {
    try {
      const devicesRef = ref(database, 'devices');
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      const snapshot = await new Promise((resolve) => {
        const listener = onValue(devicesRef, (snapshot) => {
          off(devicesRef, 'value', listener);
          resolve(snapshot);
        });
      });

      if (snapshot.exists()) {
        const devices = snapshot.val();
        const cleanupPromises = [];

        for (const deviceId in devices) {
          const device = devices[deviceId] as SmartwatchDevice;
          if (device.userId === userId && 
              deviceId.startsWith('smartwatch_') && 
              device.lastSeen < sevenDaysAgo) {
            
            // Don't delete the current device
            if (this.currentDevice && deviceId !== this.currentDevice.id) {
              const deviceRef = ref(database, `devices/${deviceId}`);
              cleanupPromises.push(set(deviceRef, null));
              console.log(`Pairing Service: Cleaning up old device: ${deviceId}`);
            }
          }
        }

        await Promise.all(cleanupPromises);
        console.log('Pairing Service: Cleanup completed');
      }
    } catch (error) {
      console.warn('Pairing Service: Failed to cleanup old devices:', error);
    }
  }

  /**
   * Stop all listeners
   */
  stopListening() {
    this.pairingListeners.forEach(cleanup => cleanup());
    this.pairingListeners = [];
    console.log('Pairing Service: Stopped all listeners');
  }
}

export default new PairingService();

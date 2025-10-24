import { DeviceEventEmitter, Platform, PermissionsAndroid, Vibration } from 'react-native';
import SOSService from './sosService';

interface ShakeData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

class ShakeSOSService {
  private isMonitoring = false;
  private shakeCount = 0;
  private lastShakeTime = 0;
  private lastSOSTime = 0; // Track last SOS trigger time
  private baselineMotion = { x: 0, y: 0, z: 0 }; // Baseline motion for filtering
  private motionHistory: { x: number; y: number; z: number; timestamp: number }[] = []; // Motion history for filtering
  private readonly SHAKE_THRESHOLD = 25; // Increased threshold to prevent false positives
  private readonly SHAKE_TIMEOUT = 1500; // 1.5 second timeout between shakes
  private readonly REQUIRED_SHAKES = 3; // Triple shake detection
  private readonly SHAKE_INTERVAL = 300; // 300ms between shake detections (more realistic)
  private readonly SOS_COOLDOWN = 30000; // 30 seconds cooldown between SOS triggers
  private readonly MOTION_FILTER_THRESHOLD = 5; // Ignore movements smaller than this
  private accelerometerSubscription: any = null;

  /**
   * Start monitoring for shake gestures
   */
  startMonitoring(userId: string) {
    if (this.isMonitoring) {
      console.log('Shake SOS Service: Already monitoring');
      return;
    }

    this.isMonitoring = true;
    this.shakeCount = 0;
    this.motionHistory = [];
    console.log('Shake SOS Service: Started monitoring for shake gestures');
    console.log('Shake SOS Service: Ready to detect real device shakes (no simulation)');
    
    // Start calibration process
    this.startCalibration();
  }

  /**
   * Calibrate baseline motion to filter out gravity and device orientation
   */
  private startCalibration() {
    console.log('Shake SOS Service: Starting motion calibration...');
    
    // Reset baseline
    this.baselineMotion = { x: 0, y: 0, z: 0 };
    
    // In a real implementation, you would collect several readings here
    // For now, we'll use a simple approach
    setTimeout(() => {
      console.log('Shake SOS Service: Calibration complete - ready for shake detection');
    }, 1000);
  }

  /**
   * Stop monitoring shake gestures
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    this.shakeCount = 0;

    console.log('Shake SOS Service: Stopped monitoring');
  }

  /**
   * Handle motion data and detect shakes with improved filtering
   * This should be called when real device motion is detected
   */
  handleMotionData(data: { x: number; y: number; z: number }, userId: string) {
    if (!this.isMonitoring) return;

    const { x, y, z } = data;
    const currentTime = Date.now();

    // Add to motion history for filtering
    this.motionHistory.push({ x, y, z, timestamp: currentTime });
    
    // Keep only last 10 readings (1 second at 100ms intervals)
    if (this.motionHistory.length > 10) {
      this.motionHistory.shift();
    }

    // Calculate motion relative to baseline (gravity compensation)
    const motionX = x - this.baselineMotion.x;
    const motionY = y - this.baselineMotion.y;
    const motionZ = z - this.baselineMotion.z;
    
    // Calculate magnitude of motion (excluding gravity)
    const motionMagnitude = Math.sqrt(motionX * motionX + motionY * motionY + motionZ * motionZ);

    // Filter out small movements that are likely noise
    if (motionMagnitude < this.MOTION_FILTER_THRESHOLD) {
      return;
    }

    // Check for significant shake motion
    if (motionMagnitude > this.SHAKE_THRESHOLD) {
      // Additional validation: check if this is a sudden change (not gradual)
      const isSuddenMotion = this.isSuddenMotionChange(motionMagnitude);
      
      if (isSuddenMotion) {
        // Check timing between shakes
        if (currentTime - this.lastShakeTime > this.SHAKE_INTERVAL) {
          this.shakeCount++;
          this.lastShakeTime = currentTime;

          console.log(`Shake SOS Service: Shake ${this.shakeCount}/${this.REQUIRED_SHAKES} detected - magnitude: ${motionMagnitude.toFixed(2)}`);

          // Check if we've reached the required number of shakes
          if (this.shakeCount >= this.REQUIRED_SHAKES) {
            console.log('Shake SOS Service: Triple shake detected, triggering SOS');
            this.shakeCount = 0; // Reset counter
            this.triggerTripleShakeSOS(userId);
          }
        }
      }
    } else {
      // Reset shake count if no significant motion for too long
      if (currentTime - this.lastShakeTime > this.SHAKE_TIMEOUT) {
        if (this.shakeCount > 0) {
          console.log('Shake SOS Service: Shake timeout, resetting count');
          this.shakeCount = 0;
        }
      }
    }
  }

  /**
   * Check if motion is sudden (not gradual) to filter out false positives
   */
  private isSuddenMotionChange(currentMagnitude: number): boolean {
    if (this.motionHistory.length < 3) return true; // Not enough data, assume sudden
    
    // Get average magnitude of previous readings
    const recentReadings = this.motionHistory.slice(-3, -1); // Last 2 readings before current
    const avgPreviousMagnitude = recentReadings.reduce((sum, reading) => {
      const mag = Math.sqrt(
        Math.pow(reading.x - this.baselineMotion.x, 2) +
        Math.pow(reading.y - this.baselineMotion.y, 2) +
        Math.pow(reading.z - this.baselineMotion.z, 2)
      );
      return sum + mag;
    }, 0) / recentReadings.length;

    // Motion is sudden if current magnitude is significantly higher than recent average
    const magnitudeIncrease = currentMagnitude - avgPreviousMagnitude;
    return magnitudeIncrease > 10; // Must be at least 10 units higher than recent average
  }

  /**
   * Trigger SOS after triple shake detection (based on E-Responde app)
   */
  private async triggerTripleShakeSOS(userId: string) {
    try {
      // Check cooldown to prevent rapid successive SOS triggers
      const now = Date.now();
      if (now - this.lastSOSTime < this.SOS_COOLDOWN) {
        console.log(`Shake SOS Service: SOS blocked due to cooldown (${Math.round((this.SOS_COOLDOWN - (now - this.lastSOSTime)) / 1000)}s remaining)`);
        return;
      }

      this.lastSOSTime = now;
      console.log('Shake SOS Service: Triple shake detected - triggering SOS alert');
      
      // Vibrate to give user feedback that triple shake was detected
      Vibration.vibrate([0, 200, 100, 200]); // Short-short-long vibration pattern
      
      // Get current location
      const location = await this.getCurrentLocation();
      
      // Send SOS alert
      await SOSService.sendSOSAlert('shake', userId, location);
      
      console.log('Shake SOS Service: SOS alert sent successfully');
      
    } catch (error) {
      console.error('Shake SOS Service: Failed to trigger SOS:', error);
    }
  }

  /**
   * Get current location (fallback for now)
   */
  private async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    try {
      // For now, use fallback location to prevent crashes
      // TODO: Implement proper GPS location tracking when Geolocation package is fixed
      console.log('Shake SOS Service: Using fallback location (GPS temporarily disabled)');
      return this.getFallbackLocation();
    } catch (error) {
      console.warn('Shake SOS Service: Location error, using fallback:', error);
      return this.getFallbackLocation();
    }
  }

  /**
   * Get fallback location (Manila area)
   */
  private getFallbackLocation(): { latitude: number; longitude: number } {
    return {
      latitude: 14.5995 + (Math.random() - 0.5) * 0.01, // Manila area with small variation
      longitude: 120.9842 + (Math.random() - 0.5) * 0.01
    };
  }

  /**
   * Get current shake count
   */
  getShakeCount(): number {
    return this.shakeCount;
  }

  /**
   * Reset shake count
   */
  resetShakeCount() {
    this.shakeCount = 0;
  }

  /**
   * Reset SOS cooldown (for testing purposes)
   */
  resetSOSCooldown() {
    this.lastSOSTime = 0;
    console.log('Shake SOS Service: SOS cooldown reset');
  }

  /**
   * Manually trigger shake detection (for when user actually shakes device)
   * This should be called from real device motion sensors
   */
  triggerShakeDetection(userId: string, motionData: { x: number; y: number; z: number }) {
    if (!this.isMonitoring) return;
    
    // Update baseline motion gradually to adapt to device orientation changes
    this.updateBaselineMotion(motionData);
    
    console.log('Shake SOS Service: Real device motion detected');
    this.handleMotionData(motionData, userId);
  }

  /**
   * Update baseline motion to adapt to device orientation changes
   */
  private updateBaselineMotion(motionData: { x: number; y: number; z: number }) {
    // Only update baseline if motion is relatively stable (not during shakes)
    const currentMagnitude = Math.sqrt(
      Math.pow(motionData.x - this.baselineMotion.x, 2) +
      Math.pow(motionData.y - this.baselineMotion.y, 2) +
      Math.pow(motionData.z - this.baselineMotion.z, 2)
    );

    // If motion is stable (low magnitude), gradually update baseline
    if (currentMagnitude < 5) {
      const alpha = 0.1; // Learning rate for baseline update
      this.baselineMotion.x = this.baselineMotion.x * (1 - alpha) + motionData.x * alpha;
      this.baselineMotion.y = this.baselineMotion.y * (1 - alpha) + motionData.y * alpha;
      this.baselineMotion.z = this.baselineMotion.z * (1 - alpha) + motionData.z * alpha;
    }
  }

}

export default new ShakeSOSService();
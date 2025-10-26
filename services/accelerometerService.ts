import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';

// Try to import sensor manager, fallback to alternative if not available
let SensorManager: any = null;
try {
  SensorManager = require('react-native-sensor-manager').SensorManager;
} catch (error) {
  console.log('AccelerometerService: react-native-sensor-manager not available, using alternative');
}

interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface ShakeConfig {
  threshold: number;
  requiredShakes: number;
  shakeTimeout: number;
  shakeInterval: number;
}

class AccelerometerService {
  private isMonitoring = false;
  private shakeCount = 0;
  private lastShakeTime = 0;
  private lastTripleShakeTime = 0; // Track last triple shake to prevent rapid retriggers
  private subscription: any = null;
  private baselineMotion = { x: 9.8, y: 0, z: 0 }; // Baseline for gravity compensation
  private config: ShakeConfig = {
    threshold: 5, // Very low threshold for easy triggering
    requiredShakes: 3, // Number of shakes required to trigger SOS
    shakeTimeout: 4000, // Longer timeout between shake sequences (4 seconds)
    shakeInterval: 25, // Super fast interval for instant triple shakes (25ms)
  };
  private readonly TRIPLE_SHAKE_COOLDOWN = 10000; // 10 seconds cooldown after triple shake

  /**
   * Start monitoring accelerometer for shake detection
   */
  startMonitoring(onShakeDetected: () => void) {
    if (this.isMonitoring) {
      console.log('AccelerometerService: Already monitoring');
      return;
    }

    this.isMonitoring = true;
    this.shakeCount = 0;
    this.lastShakeTime = 0;

    console.log('AccelerometerService: Started monitoring accelerometer');
    console.log(`AccelerometerService: Config - threshold: ${this.config.threshold}, required shakes: ${this.config.requiredShakes}`);

    if (SensorManager) {
      // Use react-native-sensor-manager if available
      SensorManager.startAccelerometer(100);
      this.subscription = SensorManager.addAccelerometerListener((data: AccelerometerData) => {
        this.handleAccelerometerData(data, onShakeDetected);
      });
    } else {
      // Fallback: Use DeviceMotion API (iOS) or simulate data for testing
      if (Platform.OS === 'ios') {
        this.startDeviceMotionMonitoring(onShakeDetected);
      } else {
        console.log('AccelerometerService: Using simulated data for Android testing');
        this.startSimulatedMonitoring(onShakeDetected);
      }
    }
  }

  /**
   * Stop monitoring accelerometer
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      console.log('AccelerometerService: Already stopped');
      return;
    }

    this.isMonitoring = false;
    this.shakeCount = 0; // Reset shake count when stopping

    if (SensorManager) {
      // Stop accelerometer and remove listener
      SensorManager.stopAccelerometer();
      if (this.subscription) {
        SensorManager.removeListener(this.subscription);
        this.subscription = null;
      }
    } else {
      // Stop fallback monitoring
      this.stopFallbackMonitoring();
    }

    console.log('AccelerometerService: Stopped monitoring and reset shake count - no more accelerometer data processing');
  }

  /**
   * Handle accelerometer data and detect shakes
   */
  private handleAccelerometerData(data: AccelerometerData, onShakeDetected: () => void) {
    // CRITICAL: If monitoring is disabled, completely ignore all data
    if (!this.isMonitoring) {
      return; // No processing, no logging, nothing
    }

    const { x, y, z } = data;
    const currentTime = Date.now();

    // Calculate motion relative to baseline (gravity compensation)
    const motionX = x - this.baselineMotion.x;
    const motionY = y - this.baselineMotion.y;
    const motionZ = z - this.baselineMotion.z;
    
    // Calculate magnitude of motion (excluding gravity)
    const motionMagnitude = Math.sqrt(motionX * motionX + motionY * motionY + motionZ * motionZ);

    // Debug: Log all accelerometer data (reduced frequency for readability)
    if (Math.random() < 0.2) { // Log 20% of readings for better debugging
      console.log(`AccelerometerService: x:${x.toFixed(2)} y:${y.toFixed(2)} z:${z.toFixed(2)} motion:${motionMagnitude.toFixed(2)} threshold:${this.config.threshold}`);
    }

    // Check if this is a significant shake (using motion magnitude, not total magnitude)
    if (motionMagnitude > this.config.threshold) {
      // Double-check monitoring is still active (toggle might be turned off)
      if (!this.isMonitoring) {
        console.log('🚫 Shake detection blocked - monitoring is disabled');
        return;
      }

      // Check if enough time has passed since last shake
      if (currentTime - this.lastShakeTime > this.config.shakeInterval) {
        this.shakeCount++;
        this.lastShakeTime = currentTime;

        console.log(`🎯 SHAKE DETECTED! Count: ${this.shakeCount}/${this.config.requiredShakes} - Motion: ${motionMagnitude.toFixed(2)} (threshold: ${this.config.threshold})`);

        // Check if we've reached the required number of shakes
        if (this.shakeCount >= this.config.requiredShakes) {
          // Double-check monitoring is still active (toggle might be turned off)
          if (!this.isMonitoring) {
            console.log('🚫 Triple shake blocked - monitoring is disabled');
            this.shakeCount = 0;
            return;
          }

          // Check cooldown to prevent rapid retriggers
          const now = Date.now();
          if (now - this.lastTripleShakeTime < this.TRIPLE_SHAKE_COOLDOWN) {
            console.log(`🚫 Triple shake blocked - cooldown active (${Math.round((this.TRIPLE_SHAKE_COOLDOWN - (now - this.lastTripleShakeTime)) / 1000)}s remaining)`);
            this.shakeCount = 0; // Reset counter
            return;
          }

          this.lastTripleShakeTime = now;
          console.log('🚨 TRIPLE SHAKE DETECTED! Triggering SOS...');
          this.shakeCount = 0; // Reset counter
          
          // Final safety check before calling callback
          if (this.isMonitoring) {
            onShakeDetected();
          } else {
            console.log('🚫 Triple shake callback blocked - monitoring disabled');
          }
        }
      } else {
        console.log(`⏰ Shake too soon! Need ${this.config.shakeInterval}ms between shakes. Current: ${currentTime - this.lastShakeTime}ms`);
      }
    } else {
      // Reset shake count if no significant motion for too long
      if (currentTime - this.lastShakeTime > this.config.shakeTimeout) {
        if (this.shakeCount > 0) {
          console.log(`⏰ Shake timeout (${this.config.shakeTimeout}ms), resetting count from ${this.shakeCount} to 0`);
          this.shakeCount = 0;
        }
      }
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ShakeConfig>) {
    this.config = { ...this.config, ...newConfig };
    console.log('AccelerometerService: Config updated:', this.config);
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
    console.log('AccelerometerService: Shake count reset');
  }

  /**
   * Get current configuration
   */
  getConfig(): ShakeConfig {
    return { ...this.config };
  }

  /**
   * Force stop and reset everything (emergency stop)
   */
  forceStop() {
    this.isMonitoring = false;
    this.shakeCount = 0;
    this.lastShakeTime = 0;
    this.lastTripleShakeTime = 0; // Reset cooldown

    if (SensorManager) {
      try {
        SensorManager.stopAccelerometer();
        if (this.subscription) {
          SensorManager.removeListener(this.subscription);
        }
      } catch (error) {
        console.log('AccelerometerService: Error stopping sensor manager:', error);
      }
    } else {
      this.stopFallbackMonitoring();
    }

    console.log('AccelerometerService: Stopped monitoring and reset shake count - no more accelerometer data processing');
  }

  /**
   * Force stop and reset everything (emergency stop)
   */
  forceStop() {
    this.isMonitoring = false;
    this.shakeCount = 0;
    this.lastShakeTime = 0;
    this.lastTripleShakeTime = 0; // Reset cooldown

    // Force stop all accelerometer processing
    if (SensorManager) {
      try {
        SensorManager.stopAccelerometer();
        if (this.subscription) {
          SensorManager.removeListener(this.subscription);
        }
        // Clear any remaining listeners
        SensorManager.removeAllListeners();
      } catch (error) {
        console.log('AccelerometerService: Error stopping sensor manager:', error);
      }
    } else {
      this.stopFallbackMonitoring();
    }

    this.subscription = null;
    console.log('AccelerometerService: Force stopped and reset everything - triple shake detection completely disabled - no more accelerometer logs');
  }

  /**
   * Completely disable accelerometer - emergency shutdown
   */
  emergencyStop() {
    console.log('AccelerometerService: EMERGENCY STOP - Completely disabling accelerometer');
    
    this.isMonitoring = false;
    this.shakeCount = 0;
    this.lastShakeTime = 0;
    this.lastTripleShakeTime = 0;
    this.subscription = null;

    // Force stop everything
    if (SensorManager) {
      try {
        SensorManager.stopAccelerometer();
        SensorManager.removeAllListeners();
      } catch (error) {
        console.log('AccelerometerService: Error in emergency stop:', error);
      }
    }

    console.log('AccelerometerService: EMERGENCY STOP COMPLETE - No more accelerometer processing');
  }

  /**
   * Start DeviceMotion monitoring (iOS fallback)
   */
  private startDeviceMotionMonitoring(onShakeDetected: () => void) {
    if (Platform.OS === 'ios') {
      // iOS DeviceMotion API
      const DeviceMotion = require('react-native').DeviceMotion;
      if (DeviceMotion) {
        DeviceMotion.setUpdateInterval(100);
        this.subscription = DeviceMotion.addListener('motion', (data: any) => {
          const accelerometerData: AccelerometerData = {
            x: data.acceleration.x,
            y: data.acceleration.y,
            z: data.acceleration.z,
            timestamp: Date.now()
          };
          this.handleAccelerometerData(accelerometerData, onShakeDetected);
        });
      }
    }
  }

  /**
   * Start simulated monitoring for testing
   */
  private startSimulatedMonitoring(onShakeDetected: () => void) {
    console.log('AccelerometerService: Starting simulated accelerometer data for testing');
    console.log('AccelerometerService: Simulated shakes will occur every 2 seconds');
    
    // Simulate accelerometer data for testing
    let simulationCount = 0;
    this.subscription = setInterval(() => {
      simulationCount++;
      
      // Simulate shake every 20 iterations (2 seconds) for easier testing
      const isShake = simulationCount % 20 === 0;
      
      const accelerometerData: AccelerometerData = {
        x: isShake ? 8 : 9.8, // Simulate shake with magnitude above threshold (3)
        y: isShake ? 5 : 0,
        z: isShake ? 4 : 0,
        timestamp: Date.now()
      };
      
      this.handleAccelerometerData(accelerometerData, onShakeDetected);
    }, 100);
  }

  /**
   * Stop fallback monitoring
   */
  private stopFallbackMonitoring() {
    if (this.subscription) {
      if (Platform.OS === 'ios') {
        this.subscription.remove();
      } else {
        clearInterval(this.subscription);
      }
      this.subscription = null;
    }
  }
}

export default new AccelerometerService();
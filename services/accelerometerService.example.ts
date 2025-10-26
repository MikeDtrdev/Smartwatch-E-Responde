// Example usage of the AccelerometerService
import AccelerometerService from '../services/accelerometerService';

// Start monitoring with shake detection callback
AccelerometerService.startMonitoring(() => {
  console.log('Triple shake detected! Triggering SOS...');
  // Your SOS logic here
});

// Update configuration
AccelerometerService.updateConfig({
  threshold: 20, // More sensitive
  requiredShakes: 3,
  shakeTimeout: 1000,
  shakeInterval: 200
});

// Get current status
const shakeCount = AccelerometerService.getShakeCount();
const isActive = AccelerometerService.isActive();
const config = AccelerometerService.getConfig();

// Stop monitoring
AccelerometerService.stopMonitoring();

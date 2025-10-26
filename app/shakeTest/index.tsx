import React, { FC, PropsWithChildren, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import ShakeSOSService from '../../services/shakeSOSService';
import AccelerometerService from '../../services/accelerometerService';
import styles from './styles';

const ShakeTestScreen: FC<PropsWithChildren> = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const [config, setConfig] = useState(AccelerometerService.getConfig());

  useEffect(() => {
    // Update shake count periodically
    const interval = setInterval(() => {
      setShakeCount(AccelerometerService.getShakeCount());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const startMonitoring = () => {
    ShakeSOSService.startMonitoring('test-user');
    setIsMonitoring(true);
    Alert.alert('Monitoring Started', 'Shake your device 3 times quickly to trigger SOS');
  };

  const stopMonitoring = () => {
    ShakeSOSService.stopMonitoring();
    setIsMonitoring(false);
    setShakeCount(0);
  };

  const resetShakeCount = () => {
    ShakeSOSService.resetShakeCount();
    setShakeCount(0);
  };

  const resetCooldown = () => {
    ShakeSOSService.resetSOSCooldown();
    Alert.alert('Cooldown Reset', 'SOS cooldown has been reset');
  };


  const updateThreshold = (newThreshold: number) => {
    ShakeSOSService.updateShakeConfig({ threshold: newThreshold });
    setConfig(AccelerometerService.getConfig());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shake Detection Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status: {isMonitoring ? 'Monitoring' : 'Stopped'}
        </Text>
        <Text style={styles.statusText}>
          Shake Count: {shakeCount}/{config.requiredShakes}
        </Text>
        <Text style={styles.statusText}>
          Threshold: {config.threshold}
        </Text>
        <Text style={styles.statusText}>
          Shake Interval: {config.shakeInterval}ms
        </Text>
        <Text style={styles.statusText}>
          Shake Timeout: {config.shakeTimeout}ms
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isMonitoring ? styles.stopButton : styles.startButton]}
          onPress={isMonitoring ? stopMonitoring : startMonitoring}
        >
          <Text style={styles.buttonText}>
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={resetShakeCount}
        >
          <Text style={styles.buttonText}>Reset Shake Count</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={resetCooldown}
        >
          <Text style={styles.buttonText}>Reset Cooldown</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.thresholdContainer}>
        <Text style={styles.thresholdLabel}>Adjust Threshold:</Text>
        <View style={styles.thresholdButtons}>
        <TouchableOpacity
          style={styles.thresholdButton}
          onPress={() => updateThreshold(3)}
        >
          <Text style={styles.thresholdButtonText}>3 (Very Sensitive)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.thresholdButton}
          onPress={() => updateThreshold(5)}
        >
          <Text style={styles.thresholdButtonText}>5 (Default)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.thresholdButton}
          onPress={() => updateThreshold(8)}
        >
          <Text style={styles.thresholdButtonText}>8 (Less Sensitive)</Text>
        </TouchableOpacity>
        </View>
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Instructions:</Text>
        <Text style={styles.instructionsText}>
          1. Start monitoring{'\n'}
          2. Shake your device 3 times quickly{'\n'}
          3. Watch console logs for debug info{'\n'}
          4. Shake count resets after 3 seconds{'\n'}
          5. Try threshold 3 for very sensitive detection{'\n'}
          6. Only 50ms needed between shakes
        </Text>
      </View>
    </View>
  );
};

export default ShakeTestScreen;

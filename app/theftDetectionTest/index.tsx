import React, { FC, useState, useEffect } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useMinimalAuth } from '../../services/minimalAuthContext';
import TheftDetectionService from '../../services/theftDetectionService';
import LocationTrackingService from '../../services/locationTrackingService';
import { createStyles } from './styles';

const { width } = Dimensions.get('window');

const TheftDetectionTest: FC = () => {
  const { user } = useMinimalAuth();
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');

  const styles = createStyles();

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testLocationTracking = async () => {
    try {
      addTestResult('Testing location tracking...');
      
      if (!user?.uid) {
        addTestResult('ERROR: User not authenticated');
        return;
      }

      const testDeviceId = `test_watch_${Date.now()}`;
      setDeviceId(testDeviceId);
      
      await LocationTrackingService.initializeTracking(user.uid, testDeviceId);
      addTestResult('✓ Location tracking initialized');
      
      // Wait a bit for location update
      setTimeout(() => {
        addTestResult('✓ Location tracking test completed');
      }, 5000);
      
    } catch (error) {
      addTestResult(`ERROR: ${error}`);
    }
  };

  const testTheftDetection = async () => {
    try {
      addTestResult('Testing theft detection...');
      
      if (!user?.uid) {
        addTestResult('ERROR: User not authenticated');
        return;
      }

      const testDeviceId = `test_watch_${Date.now()}`;
      setDeviceId(testDeviceId);
      
      await TheftDetectionService.startTheftDetection(user.uid, testDeviceId);
      addTestResult('✓ Theft detection started');
      
      // Test distance calculation
      const distance = LocationTrackingService.calculateDistance(
        14.5995, 120.9842, // Phone location (Manila)
        14.5994, 120.9843  // Watch location (1 meter away)
      );
      
      addTestResult(`✓ Distance calculation test: ${distance.toFixed(2)}m`);
      
    } catch (error) {
      addTestResult(`ERROR: ${error}`);
    }
  };

  const testPhoneLocation = async () => {
    try {
      addTestResult('Testing phone location retrieval...');
      
      const phoneLocation = await LocationTrackingService.getPhoneLocation();
      
      if (phoneLocation) {
        addTestResult(`✓ Phone location found: ${phoneLocation.latitude}, ${phoneLocation.longitude}`);
      } else {
        addTestResult('⚠ Phone location not found (expected if phone app not running)');
      }
      
    } catch (error) {
      addTestResult(`ERROR: ${error}`);
    }
  };

  const runAllTests = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    addTestResult('Starting theft detection tests...');
    
    await testLocationTracking();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testTheftDetection();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testPhoneLocation();
    
    addTestResult('All tests completed!');
    setIsTesting(false);
  };

  const stopTests = () => {
    try {
      LocationTrackingService.stopLocationTracking();
      TheftDetectionService.stopTheftDetection();
      addTestResult('✓ All services stopped');
    } catch (error) {
      addTestResult(`ERROR stopping services: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Theft Detection Test</Text>
        <Text style={styles.subtitle}>Please log in to test theft detection</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Theft Detection Test</Text>
        <Text style={styles.subtitle}>Test the theft detection system</Text>
      </View>

      <View style={styles.testControls}>
        <TouchableOpacity
          style={[styles.testButton, isTesting && styles.testButtonDisabled]}
          onPress={runAllTests}
          disabled={isTesting}
        >
          {isTesting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.testButtonText}>Run All Tests</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={stopTests}
        >
          <Text style={styles.testButtonText}>Stop Services</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={clearResults}
        >
          <Text style={styles.testButtonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        <View style={styles.resultsList}>
          {testResults.map((result, index) => (
            <Text key={index} style={styles.resultText}>
              {result}
            </Text>
          ))}
        </View>
      </View>

      {deviceId && (
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceInfoTitle}>Device ID:</Text>
          <Text style={styles.deviceInfoText}>{deviceId}</Text>
        </View>
      )}
    </View>
  );
};

export default TheftDetectionTest;

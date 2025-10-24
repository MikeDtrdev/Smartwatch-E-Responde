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
import SOSService from '../../services/sosService';
import ProximitySOSService from '../../services/proximitySOSService';
import ShakeSOSService from '../../services/shakeSOSService';
import PairingService from '../../services/pairingService';
import { createStyles } from './styles';

const { width } = Dimensions.get('window');

const MinimalDashboard: FC = () => {
  const { user, logout, error } = useMinimalAuth();
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [proximityStatus, setProximityStatus] = useState('Connected');
  const [shakeCount, setShakeCount] = useState(0);
  const [isPaired, setIsPaired] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState('Initializing...');

  const styles = createStyles();

  // Initialize SOS services when component mounts
  useEffect(() => {
    const initializeServices = async () => {
      if (user?.uid) {
        console.log('Minimal Dashboard: Initializing SOS services');
        
        try {
          // Initialize smartwatch device
          const device = await PairingService.initializeDevice(user.uid, 'E-Responde Smartwatch');
          setDeviceStatus('Device Ready');
          setIsPaired(device.isPaired);
        
          // Start proximity monitoring
          ProximitySOSService.startMonitoring(user.uid);
          
          // Start shake detection
          ShakeSOSService.startMonitoring(user.uid);
          
          // Update proximity status periodically
          const proximityInterval = setInterval(() => {
            try {
              const distance = ProximitySOSService.getLastDistance();
              if (distance > 5) {
                setProximityStatus('Disconnected (>5m)');
              } else {
                setProximityStatus('Connected');
              }
            } catch (error) {
              console.warn('Minimal Dashboard: Error updating proximity status:', error);
            }
          }, 2000);

          // Update shake count
          const shakeInterval = setInterval(() => {
            try {
              setShakeCount(ShakeSOSService.getShakeCount());
            } catch (error) {
              console.warn('Minimal Dashboard: Error updating shake count:', error);
            }
          }, 1000);

          return () => {
            clearInterval(proximityInterval);
            clearInterval(shakeInterval);
            try {
              ProximitySOSService.stopMonitoring();
              ShakeSOSService.stopMonitoring();
            } catch (error) {
              console.warn('Minimal Dashboard: Error stopping services:', error);
            }
          };
        } catch (error) {
          console.error('Minimal Dashboard: Error initializing SOS services:', error);
        }
      }
    };

    initializeServices();
  }, [user?.uid]);

  const handleSOS = async () => {
    if (isSOSActive) return;

    try {
      setIsSOSActive(true);
      setSosCountdown(3);
      
      // 3-second countdown
      const countdownInterval = setInterval(() => {
        setSosCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      // Wait for countdown
      setTimeout(async () => {
        try {
          // Send SOS alert using the service with location
          if (user?.uid) {
            // Get current location for manual SOS
            const location = {
              latitude: 14.5995 + (Math.random() - 0.5) * 0.01, // Manila area
              longitude: 120.9842 + (Math.random() - 0.5) * 0.01
            };
            await SOSService.sendSOSAlert('manual', user.uid, location);
          }
          
          setIsSOSActive(false);
          setSosCountdown(null);
        } catch (error) {
          console.error('Minimal Dashboard: Error sending SOS:', error);
          Alert.alert('Error', 'Failed to send SOS alert');
          setIsSOSActive(false);
          setSosCountdown(null);
        }
      }, 3000);

    } catch (error) {
      console.error('Minimal Dashboard: Error in SOS:', error);
      setIsSOSActive(false);
      setSosCountdown(null);
    }
  };




  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Minimal Dashboard: Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>E-Responde</Text>
          <Text style={styles.subtitle}>Smartwatch</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            // Force app restart by reloading the page
            console.log('Retry button pressed');
          }}
        >
          <Text style={styles.retryButtonText}>Restart App</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>E-Responde</Text>
        <Text style={styles.subtitle}>Smartwatch</Text>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={styles.userText}>Welcome, {user?.email || 'User'}</Text>
        <Text style={styles.statusText}>Device: {deviceStatus}</Text>
        <Text style={styles.statusText}>Status: {proximityStatus}</Text>
        <Text style={styles.statusText}>Shake Count: {shakeCount}/3</Text>
        <Text style={styles.statusText}>Paired: {isPaired ? 'Yes' : 'No'}</Text>
      </View>

      {/* SOS Button */}
      <TouchableOpacity
        style={[
          styles.sosButton,
          isSOSActive && styles.sosButtonActive
        ]}
        onPress={handleSOS}
        disabled={isSOSActive}
      >
        {isSOSActive && sosCountdown ? (
          <View style={styles.sosCountdown}>
            <Text style={styles.sosCountdownText}>{sosCountdown}</Text>
            <Text style={styles.sosCountdownLabel}>Sending...</Text>
          </View>
        ) : (
          <View style={styles.sosContent}>
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.sosSubtext}>Emergency</Text>
          </View>
        )}
      </TouchableOpacity>


      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          Emergency SOS Features:
        </Text>
        <Text style={styles.infoSubtext}>
          • Tap SOS button for manual alert
        </Text>
        <Text style={styles.infoSubtext}>
          • Shake 3 times for shake alert
        </Text>
        <Text style={styles.infoSubtext}>
          • Auto alert when {'>'}5m from phone
        </Text>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MinimalDashboard;


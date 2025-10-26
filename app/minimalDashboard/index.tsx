import React, { FC, useState, useEffect } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
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
  const [isGPSLoading, setIsGPSLoading] = useState(false);
  const [proximityStatus, setProximityStatus] = useState('Connected');
  const [shakeCount, setShakeCount] = useState(0);
  const [isPaired, setIsPaired] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState('Initializing...');
  const [showSOSInfo, setShowSOSInfo] = useState(false);
  const [isShakeSOSEnabled, setIsShakeSOSEnabled] = useState(false);

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
          
          // DO NOT start shake detection automatically - only when toggle is ON
          // ShakeSOSService.startMonitoring(user.uid); // Removed - only start when toggle is enabled
          
          // Ensure shake detection is OFF by default
          ShakeSOSService.stopMonitoring();
          setIsShakeSOSEnabled(false);
          
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
    // Safety check: Only allow SOS if button is actually pressed and not already active
    if (isSOSActive || isGPSLoading) {
      console.log('SOS Button: Already active or loading, ignoring press');
      return;
    }

    // Additional safety check: Ensure user is authenticated
    if (!user?.uid) {
      console.log('SOS Button: User not authenticated, ignoring press');
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      console.log('SOS Button: Manual SOS button pressed - starting countdown');
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
          setIsGPSLoading(true);
          
          // Send SOS alert using the service - it will get location automatically
          if (user?.uid) {
            await SOSService.sendSOSAlert('manual', user.uid);
          }
          
          setIsSOSActive(false);
          setSosCountdown(null);
          setIsGPSLoading(false);
        } catch (error) {
          console.error('Minimal Dashboard: Error sending SOS:', error);
          Alert.alert('Error', 'Failed to send SOS alert');
          setIsSOSActive(false);
          setSosCountdown(null);
          setIsGPSLoading(false);
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

  const toggleShakeSOS = () => {
    if (isShakeSOSEnabled) {
      // Disable shake SOS
      ShakeSOSService.stopMonitoring();
      setIsShakeSOSEnabled(false);
      console.log('Shake SOS: Disabled');
    } else {
      // Enable shake SOS
      if (user?.uid) {
        ShakeSOSService.startMonitoring(user.uid);
        setIsShakeSOSEnabled(true);
        console.log('Shake SOS: Enabled');
      } else {
        Alert.alert('Error', 'User not authenticated');
      }
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
      {/* Header with Info Button */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <Text style={styles.userText}>Welcome, {user?.email || 'User'}</Text>
            <Text style={styles.statusText}>Status: {proximityStatus}</Text>
            <Text style={styles.statusText}>Shake Count: {shakeCount}/3</Text>
            <Text style={styles.statusText}>Paired: {isPaired ? 'Yes' : 'No'}</Text>
          </View>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setShowSOSInfo(true)}
          >
            <Text style={styles.infoButtonText}>i</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SOS Button */}
      <TouchableOpacity
        style={[
          styles.sosButton,
          (isSOSActive || isGPSLoading) && styles.sosButtonActive
        ]}
        onPress={handleSOS}
        disabled={isSOSActive || isGPSLoading}
      >
        {isSOSActive && sosCountdown ? (
          <View style={styles.sosCountdown}>
            <Text style={styles.sosCountdownText}>{sosCountdown}</Text>
            <Text style={styles.sosCountdownLabel}>Sending...</Text>
          </View>
        ) : isGPSLoading ? (
          <View style={styles.sosLoading}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.sosLoadingText}>Sending SOS...</Text>
          </View>
        ) : (
          <View style={styles.sosContent}>
            <Text style={styles.sosText}>SEND SOS</Text>
          </View>
        )}
      </TouchableOpacity>




      {/* Triple Shake SOS Toggle */}
      <TouchableOpacity
        style={[styles.shakeToggleButton, isShakeSOSEnabled && styles.shakeToggleButtonActive]}
        onPress={toggleShakeSOS}
      >
        <View style={styles.toggleContainer}>
          <View style={[styles.toggleSwitch, isShakeSOSEnabled && styles.toggleSwitchActive]}>
            <View style={[styles.toggleThumb, isShakeSOSEnabled && styles.toggleThumbActive]} />
          </View>
          <View style={styles.toggleContent}>
            <Text style={styles.shakeToggleText}>Shake SOS Detection</Text>
            <Text style={styles.shakeToggleSubtext}>
              {isShakeSOSEnabled ? 'Shake 3x to trigger SOS' : 'Tap to enable shake detection'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* SOS Info Modal */}
      <Modal
        visible={showSOSInfo}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSOSInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Emergency SOS Features</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSOSInfo(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
              <Text style={styles.featureTitle}>Manual SOS Alert</Text>
              <Text style={styles.featureDescription}>
                Tap the SOS button to send an emergency alert with your location
              </Text>
              
              <Text style={styles.featureTitle}>Shake Detection Toggle</Text>
              <Text style={styles.featureDescription}>
                Use the toggle button above to enable/disable shake detection. When enabled, shake your device 3 times quickly to automatically trigger an SOS alert with your location
              </Text>
              
              <Text style={styles.featureTitle}>Toggle Control</Text>
              <Text style={styles.featureDescription}>
                • Toggle ON: Shake detection active - shake 3x to trigger SOS{'\n'}
                • Toggle OFF: Shake detection disabled - no accidental triggers{'\n'}
                • Default: OFF when you log in - enable manually when needed
              </Text>
              
              <Text style={styles.featureTitle}>Proximity Alert</Text>
              <Text style={styles.featureDescription}>
                Automatic alert when you move more than 5 meters away from your phone
              </Text>
              
              <Text style={styles.featureTitle}>Device Pairing</Text>
              <Text style={styles.featureDescription}>
                Stay connected to your phone for continuous monitoring and alerts
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MinimalDashboard;


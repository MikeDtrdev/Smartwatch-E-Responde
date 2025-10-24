import React, { FC, useState } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Alert,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useMinimalAuth } from '../../services/minimalAuthContext';
import { COLORS } from '../../services/constants';
import { createStyles } from './styles';

const { width, height } = Dimensions.get('window');

const MinimalLogin: FC = () => {
  const { login, isLoading, error } = useMinimalAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const styles = createStyles();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      await login(email.trim(), password);
    } catch (error: any) {
      console.error('Minimal login error:', error);
      Alert.alert('Login Failed', error.message || 'Login failed. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>E-Responde</Text>
        <Text style={styles.subtitle}>Smartwatch</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.BACKGROUND}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={COLORS.BACKGROUND}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          Enter your E-Responde credentials
        </Text>
        <Text style={styles.infoSubtext}>
          Smartwatch version - minimal features
        </Text>
      </View>
    </View>
  );
};

export default MinimalLogin;

import React, { FC, useState } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Alert,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { useMinimalAuth } from '../../services/minimalAuthContext';
import { COLORS } from '../../services/constants';
import { createStyles } from './styles';

const { width, height } = Dimensions.get('window');

const MinimalLogin: FC = () => {
  const { login, isLoading, error } = useMinimalAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);

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
        <Image 
          source={require('../../assets/images/logosmartwatch.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>E-Responde</Text>
        <Text style={styles.subtitle}>Smartwatch version - minimal features</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.formContainer}>
        <View style={styles.emailContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.BACKGROUND}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setShowEmailDropdown(text.length > 0);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {showEmailDropdown && (
            <View style={styles.dropdown}>
              <Text style={styles.dropdownText}>
                Only E-responde registered accounts can work with this smartwatch application.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor={COLORS.BACKGROUND}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Image 
              source={showPassword ? 
                require('../../assets/images/eyeoff.png') : 
                require('../../assets/images/eyeon.png')
              } 
              style={styles.passwordToggleIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

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

    </View>
  );
};

export default MinimalLogin;

import React, { useState, useEffect } from 'react';
import { StatusBar, Platform, Alert } from 'react-native';
import { MinimalAuthProvider } from './services/minimalAuthContext';
import { useMinimalAuth } from './services/minimalAuthContext';
import MinimalLogin from './app/minimalLogin';
import MinimalDashboard from './app/minimalDashboard';
import { ActivityIndicator, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS, SMARTWATCH_CONSTANTS } from './services/constants';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Smartwatch App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{
          flex: 1,
          backgroundColor: COLORS.PRIMARY,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <Text style={{
            color: COLORS.BACKGROUND,
            fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_LARGE,
            textAlign: 'center',
            marginBottom: 20,
          }}>
            App Error
          </Text>
          <Text style={{
            color: COLORS.BACKGROUND,
            fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_SMALL,
            textAlign: 'center',
            opacity: 0.8,
            marginBottom: 20,
          }}>
            {this.state.error?.message || 'Unknown error occurred'}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.BACKGROUND,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 5,
            }}
            onPress={() => {
              // Reset error boundary
              this.setState({ hasError: false, error: null });
            }}
          >
            <Text style={{
              color: COLORS.PRIMARY,
              fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_MEDIUM,
              fontWeight: 'bold',
            }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const AppContent = () => {
  const { isAuthenticated, isLoading, user, error } = useMinimalAuth();
  const [appReady, setAppReady] = useState(false);

  // Initialize app with error handling
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Smartwatch App: Initializing app...');
        
        // Wait for React Native to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setAppReady(true);
        console.log('Smartwatch App: App initialized successfully');
      } catch (error) {
        console.error('Smartwatch App: Initialization error:', error);
        setAppReady(true); // Continue anyway
      }
    };

    initializeApp();
  }, []);

  if (!appReady || isLoading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: COLORS.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <ActivityIndicator size="large" color={COLORS.BACKGROUND} />
        <Text style={{
          color: COLORS.BACKGROUND,
          fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_MEDIUM,
          marginTop: 15,
        }}>
          {!appReady ? 'Starting...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return <MinimalLogin />;
  }

  return <MinimalDashboard />;
};

const App = () => {
  return (
    <ErrorBoundary>
      <MinimalAuthProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.PRIMARY}
          translucent={Platform.OS === 'android'}
        />
        <AppContent />
      </MinimalAuthProvider>
    </ErrorBoundary>
  );
};

export default App;


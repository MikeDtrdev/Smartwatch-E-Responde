/**
 * Smartwatch Application Constants
 * Optimized for small screen and proximity features
 */

export const SMARTWATCH_CONSTANTS = {
  // Proximity Detection - Optimized for your smartwatch
  PROXIMITY_THRESHOLD_METERS: 5, // 5 meters distance trigger
  PROXIMITY_CHECK_INTERVAL: 3000, // Check every 3 seconds (battery optimized)
  PROXIMITY_TIMEOUT: 15000, // 15 seconds timeout for location (reduced for performance)

  // SOS Alerts - Optimized for smartwatch
  SOS_COUNTDOWN_SECONDS: 3, // 3-second countdown for smartwatch
  SOS_CLEANUP_DAYS: 7,

  // Location - Optimized for smartwatch GPS
  LOCATION_TIMEOUT: 8000, // Reduced timeout for faster response
  LOCATION_MAX_AGE: 20000, // Reduced cache age for accuracy
  LOCATION_ACCURACY: 'high', // High accuracy for proximity detection

  // UI - Optimized for your smartwatch dimensions (49.5*41.5*13.5mm)
  SCREEN_WIDTH: 240, // Optimized for small screen
  SCREEN_HEIGHT: 240, // Optimized for small screen
  BUTTON_SIZE: 50, // Smaller touch targets for smartwatch
  FONT_SIZE_SMALL: 10, // Reduced for small screen
  FONT_SIZE_MEDIUM: 12, // Reduced for small screen
  FONT_SIZE_LARGE: 14, // Reduced for small screen
  FONT_SIZE_XLARGE: 16, // Reduced for small screen

  // Battery Optimization - Enhanced for smartwatch
  BACKGROUND_UPDATE_INTERVAL: 15000, // 15 seconds for background updates (battery saving)
  PROXIMITY_BACKGROUND_INTERVAL: 5000, // 5 seconds for proximity checks
  GYROSCOPE_UPDATE_INTERVAL: 200, // 200ms for gyroscope (reduced from 100ms)
  
  // Performance Optimization
  MAX_ANIMATION_DURATION: 0, // Disable animations for performance
  REDUCED_MOTION: true, // Disable motion effects
  OPTIMIZE_RENDERING: true, // Enable rendering optimizations
};

export const ERROR_MESSAGES = {
  AUTH: {
    USER_NOT_FOUND: 'No account found with this email address',
    WRONG_PASSWORD: 'Incorrect password',
    INVALID_EMAIL: 'Invalid email address',
    USER_DISABLED: 'This account has been disabled',
    TOO_MANY_REQUESTS: 'Too many failed attempts. Please try again later',
    NETWORK_ERROR: 'Network error. Please check your internet connection',
  },
  PROXIMITY: {
    LOCATION_DENIED: 'Location permission denied',
    LOCATION_TIMEOUT: 'Location request timed out',
    LOCATION_UNAVAILABLE: 'Location services unavailable',
    PROXIMITY_ERROR: 'Proximity detection error',
  },
  EMERGENCY: {
    NO_PRIMARY_CONTACTS: 'No emergency contacts found',
    SOS_FAILED: 'Failed to send SOS alert',
    PROXIMITY_SOS_FAILED: 'Failed to send proximity SOS alert',
  },
  GENERIC: {
    UNKNOWN: 'An unknown error occurred',
    TRY_AGAIN: 'Please try again',
  },
};

export const SUCCESS_MESSAGES = {
  AUTH: {
    LOGGED_IN: 'Successfully logged in',
    LOGGED_OUT: 'Logged out successfully',
  },
  EMERGENCY: {
    SOS_SENT: (count: number) => `SOS sent to ${count} contact(s)`,
    PROXIMITY_SOS_SENT: 'Proximity SOS alert sent',
  },
};

export const COLORS = {
  PRIMARY: '#2d3480',
  SECONDARY: '#4c643b',
  DANGER: '#FF4444',
  WARNING: '#FFA500',
  SUCCESS: '#32CD32',
  INFO: '#4A90E2',
  LIGHT_GRAY: '#E5E7EB',
  DARK_GRAY: '#6B7280',
  BACKGROUND: '#FFFFFF',
  TEXT: '#1F2937',
  TEXT_SECONDARY: '#666666',
};

export default {
  SMARTWATCH_CONSTANTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  COLORS,
};


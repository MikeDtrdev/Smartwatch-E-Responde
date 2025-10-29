# Smartwatch Theft Detection Implementation

## Overview
This implementation adds automatic theft detection to the E-Responde smartwatch app. When the smartwatch and smartphone are more than 5 meters apart, the smartwatch automatically creates a theft crime report and sends an SOS alert.

## Features Implemented

### 1. Location Tracking Service (`locationTrackingService.ts`)
- **Continuous GPS tracking** every 20 seconds
- **Firebase integration** for location storage
- **Distance calculation** using Haversine formula
- **Permission handling** for Android location access
- **Error handling** for GPS failures

### 2. Theft Detection Service (`theftDetectionService.ts`)
- **Distance monitoring** every 10 seconds
- **5-meter threshold** for theft detection
- **Automatic SOS triggering** when threshold exceeded
- **Spam prevention** with 1-minute cooldown
- **Configurable parameters** (distance, interval, cooldown)

### 3. Enhanced SOS Service (`sosService.ts`)
- **Theft-specific SOS alerts** with crime report data
- **Crime report creation** in Firebase database
- **Dual database storage** (main reports + user reports)
- **Theft-specific UI alerts** and notifications

### 4. Dashboard Integration (`minimalDashboard/index.tsx`)
- **Theft detection toggle** button
- **Real-time status display** (Active/Disabled)
- **User-friendly controls** with visual feedback
- **Comprehensive info modal** explaining all features

### 5. Test Component (`theftDetectionTest/`)
- **Comprehensive testing** of all theft detection features
- **Real-time test results** display
- **Service management** (start/stop/clear)
- **Debug information** for troubleshooting

## Database Structure

### Device Locations
```
device_locations/
├── phone/                          # Smartphone location
│   ├── latitude: number
│   ├── longitude: number
│   └── timestamp: number
└── {deviceId}/                     # Smartwatch location
    ├── latitude: number
    ├── longitude: number
    └── timestamp: number
```

### Crime Reports (Auto-created on theft)
```
civilian/
├── civilian crime reports/
│   └── {timestamp}/                # Report ID = timestamp
│       ├── crimeType: "Theft"
│       ├── description: "Smartphone taken away..."
│       ├── location: { latitude, longitude, address }
│       ├── severity: "Immediate"
│       ├── createdAt: ISO string
│       ├── isTheftDetection: true
│       └── theftDetails: {
│           ├── distance: number
│           ├── phoneLocation: { lat, lng, timestamp }
│           ├── watchLocation: { lat, lng }
│           └── detectionTime: ISO string
│       }
└── civilian account/
    └── {userId}/
        └── crime reports/
            └── {timestamp}/
                └── ... (same as above)
```

## Usage Instructions

### 1. Enable Theft Detection
1. **Log in** to your smartwatch app
2. **Tap the "Theft Detection" toggle** to enable
3. **Grant location permissions** when prompted
4. **Status shows "Active"** when enabled

### 2. How It Works
1. **Smartwatch tracks location** every 20 seconds
2. **Monitors distance** to phone every 10 seconds
3. **Triggers theft SOS** when distance > 5 meters
4. **Creates crime report** with GPS coordinates
5. **Sends alert** to authorities and paired devices

### 3. Testing
1. **Use the test component** to verify functionality
2. **Run "Run All Tests"** to test all features
3. **Check test results** for any issues
4. **Use "Stop Services"** to disable testing

## Configuration

### Adjustable Parameters
```typescript
// In theftDetectionService.ts
const config = {
  distanceThreshold: 5,        // meters
  monitoringInterval: 10000,   // milliseconds (10s)
  sosCooldown: 60000          // milliseconds (1 min)
};

// In locationTrackingService.ts
const updateIntervalMs = 20000; // milliseconds (20s)
```

## Android Permissions
The following permissions are already configured in `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## Integration with Smartphone App

### Required Smartphone Setup
1. **Enable distance monitoring** in smartphone app
2. **Use same device ID** that smartwatch generates
3. **Ensure phone location** is being written to Firebase
4. **Test with both devices** in same location first

### Device ID Format
- **Smartwatch generates**: `watch_{userId}_{timestamp}`
- **Example**: `watch_abc12345_1704067200000`
- **Smartphone must use**: Same device ID for monitoring

## Troubleshooting

### Issue: Theft Detection Not Triggering
**Check:**
1. ✅ Location permissions granted on smartwatch?
2. ✅ Theft detection toggle enabled?
3. ✅ Smartphone app monitoring same device ID?
4. ✅ Both devices have GPS enabled?
5. ✅ Distance actually > 5 meters?

### Issue: Location Not Updating
**Check:**
1. ✅ GPS enabled on smartwatch?
2. ✅ Network connectivity available?
3. ✅ Firebase config correct?
4. ✅ Location permissions granted?

### Issue: High Battery Drain
**Solutions:**
- Increase update interval (20s → 30s)
- Reduce GPS accuracy requirement
- Implement geofencing for stationary periods

## Security Features

1. **Device ID**: Auto-generated, not user-controlled
2. **Authentication**: Requires Firebase auth
3. **Permissions**: Enforced location permissions
4. **Rate Limiting**: 1-minute cooldown prevents spam
5. **Data Validation**: All location data validated before storage

## Testing Checklist

- [ ] Location tracking initializes correctly
- [ ] Distance calculation works accurately
- [ ] Theft detection triggers at 5m threshold
- [ ] Crime reports created in Firebase
- [ ] SOS alerts sent to authorities
- [ ] UI shows correct status
- [ ] Toggle controls work properly
- [ ] Permissions handled gracefully
- [ ] Error handling works correctly
- [ ] Battery usage acceptable

## Next Steps

1. **Test with real devices** in different locations
2. **Monitor Firebase console** for location updates
3. **Verify crime reports** appear in smartphone app
4. **Test edge cases** (GPS unavailable, network issues)
5. **Optimize battery usage** if needed
6. **Add user preferences** for distance threshold

## Files Modified/Created

### New Files:
- `services/locationTrackingService.ts` - GPS tracking service
- `services/theftDetectionService.ts` - Theft detection logic
- `app/theftDetectionTest/index.tsx` - Test component
- `app/theftDetectionTest/styles.ts` - Test component styles

### Modified Files:
- `services/sosService.ts` - Added theft SOS support
- `app/minimalDashboard/index.tsx` - Added theft detection UI
- `android/app/src/main/AndroidManifest.xml` - Permissions already configured

The theft detection system is now fully implemented and ready for testing!

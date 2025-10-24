# E-Responde Smartwatch App

A React Native smartwatch application that integrates with the E-Responde emergency response system. This app provides proximity-based SOS alerts and emergency communication for smartwatch users.

## Features

### Core Functionality
- **Firebase Authentication**: Same backend as main mobile app
- **Proximity Detection**: Automatic SOS when 5+ meters away from phone
- **Manual SOS**: 3-second countdown emergency button
- **Real-time Sync**: Synchronized with mobile app and admin dashboard
- **Location Tracking**: GPS-based location services

### Smartwatch Optimizations
- **Small Screen UI**: Optimized for 240x240 smartwatch displays
- **Large Touch Targets**: 60px minimum button sizes
- **Battery Efficient**: Optimized location and sync intervals
- **One-Handed Operation**: Designed for single-hand use

## Technical Specifications

### Smartwatch Requirements
- **Screen Size**: 240x240 pixels minimum
- **OS**: Android 6.0+ (API 23+)
- **RAM**: 512MB minimum
- **Storage**: 100MB available space
- **Sensors**: GPS, Accelerometer, Gyroscope
- **Connectivity**: Wi-Fi, Bluetooth, Cellular

### Supported Smartwatch Specs
- Dimensions: 49.5×41.5×13.5mm
- Connectivity: Wi-Fi 2.4GHz, Bluetooth 4.1, GSM/3G/4G
- Sensors: Gravity sensor, heart rate sensor
- Battery: 1380mAh
- Button: 1 Key operation

## Installation

### Prerequisites
- Node.js >= 18
- React Native development environment
- Android Studio
- Smartwatch with Android support

### Setup
```bash
# Navigate to smartwatch directory
cd smartwatch

# Install dependencies
npm install

# For Android
cd android
./gradlew clean
cd ..

# Start Metro bundler
npm start

# Run on smartwatch
npm run android
```

### Building APK
```bash
# Build release APK
npm run build-android

# APK will be generated in:
# android/app/build/outputs/apk/release/app-release.apk
```

## Configuration

### Firebase Setup
The smartwatch app uses the same Firebase configuration as the main mobile app:
- Project ID: e-responde
- Database: Realtime Database
- Authentication: Email/Password

### Proximity Settings
- **Distance Threshold**: 5 meters
- **Check Interval**: 2 seconds
- **Location Accuracy**: High precision
- **Background Updates**: Every 5 seconds

### SOS Settings
- **Countdown**: 3 seconds
- **Auto-trigger**: When proximity threshold exceeded
- **Manual Trigger**: Large SOS button
- **Recipients**: Emergency contacts from main app

## Usage

### Login
1. Enter email and password (same as main app)
2. Only civilian users can access smartwatch
3. Police users will see access denied message

### Dashboard
- **Status**: Shows monitoring status and location
- **SOS Button**: Large red button for manual emergency
- **Proximity Info**: Displays last alert distance and time
- **Logout**: Sign out from smartwatch

### Automatic Features
- **Proximity Monitoring**: Continuously tracks distance from phone
- **Auto SOS**: Triggers when 5m+ away from phone
- **Location Sync**: Updates location to mobile app and admin
- **Battery Optimization**: Efficient background operation

## Integration

### Mobile App Sync
- Real-time location sharing
- Proximity alerts sent to mobile app
- SOS alerts synchronized
- Command/response system

### Admin Dashboard
- Smartwatch status monitoring
- SOS alert notifications
- Location tracking
- Device management

## Development

### Project Structure
```
smartwatch/
├── app/
│   ├── login/           # Authentication screens
│   └── dashboard/       # Main smartwatch interface
├── services/
│   ├── authContext.tsx  # Authentication context
│   ├── firebaseService.ts # Firebase operations
│   ├── proximityService.ts # Proximity detection
│   └── syncService.ts   # Mobile app synchronization
├── android/             # Android configuration
└── package.json        # Dependencies
```

### Key Services

#### ProximityService
- GPS location tracking
- Distance calculation
- Proximity threshold monitoring
- Automatic alert triggering

#### SyncService
- Mobile app communication
- Admin dashboard updates
- Real-time data synchronization
- Command/response handling

#### FirebaseService
- Authentication management
- Emergency contact access
- SOS alert sending
- Data persistence

## Troubleshooting

### Common Issues

#### Location Not Working
- Check GPS permissions
- Enable high accuracy location
- Check device GPS functionality

#### Proximity Not Detecting
- Verify phone location sharing
- Check distance threshold settings
- Ensure both devices have location enabled

#### Sync Issues
- Check internet connectivity
- Verify Firebase configuration
- Restart smartwatch app

#### Battery Drain
- Reduce location update frequency
- Disable unnecessary background services
- Check battery optimization settings

## Security

### Data Protection
- Encrypted Firebase communication
- Secure authentication tokens
- Location data privacy
- Emergency contact protection

### Access Control
- Civilian users only
- Email verification required
- Suspended account handling
- Secure logout functionality

## Support

For technical support or feature requests, contact the E-Responde development team.

## License

This project is part of the E-Responde emergency response system. All rights reserved.


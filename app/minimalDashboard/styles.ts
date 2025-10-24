import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, SMARTWATCH_CONSTANTS } from '../../services/constants';

const { width, height } = Dimensions.get('window');

export const createStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    padding: 15,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_LARGE,
    fontWeight: 'bold',
    color: COLORS.BACKGROUND,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_MEDIUM,
    color: COLORS.BACKGROUND,
    opacity: 0.8,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  userText: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_MEDIUM,
    color: COLORS.BACKGROUND,
    marginBottom: 5,
  },
  statusText: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_SMALL,
    color: COLORS.BACKGROUND,
    opacity: 0.8,
  },
  sosButton: {
    width: Math.min(width * 0.6, 120),
    height: Math.min(width * 0.6, 120),
    borderRadius: Math.min(width * 0.3, 60),
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sosButtonActive: {
    backgroundColor: '#FF6666',
    transform: [{ scale: 1.1 }],
  },
  sosContent: {
    alignItems: 'center',
  },
  sosText: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_LARGE,
    fontWeight: 'bold',
    color: COLORS.BACKGROUND,
    marginBottom: 2,
  },
  sosSubtext: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_SMALL,
    color: COLORS.BACKGROUND,
    opacity: 0.9,
  },
  sosCountdown: {
    alignItems: 'center',
  },
  sosCountdownText: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_LARGE,
    fontWeight: 'bold',
    color: COLORS.BACKGROUND,
    marginBottom: 2,
  },
  sosCountdownLabel: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_SMALL,
    color: COLORS.BACKGROUND,
    opacity: 0.9,
  },
  infoSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  infoText: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_MEDIUM,
    color: COLORS.BACKGROUND,
    textAlign: 'center',
    marginBottom: 5,
  },
  infoSubtext: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_SMALL,
    color: COLORS.BACKGROUND,
    opacity: 0.8,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutText: {
    color: COLORS.BACKGROUND,
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_MEDIUM,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 15,
    borderRadius: 5,
    marginVertical: 20,
  },
  errorText: {
    color: COLORS.BACKGROUND,
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_SMALL,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.BACKGROUND,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  retryButtonText: {
    color: COLORS.PRIMARY,
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_MEDIUM,
    fontWeight: 'bold',
  },
});


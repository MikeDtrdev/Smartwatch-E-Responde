import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, SMARTWATCH_CONSTANTS } from '../../services/constants';

const { width, height } = Dimensions.get('window');

export const createStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 15,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 50,
    marginBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.BACKGROUND,
  },
  infoButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.BACKGROUND,
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
    flex: 1,
    marginRight: -60,
  },
  userText: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_MEDIUM,
    color: COLORS.BACKGROUND,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_SMALL,
    color: COLORS.BACKGROUND,
    opacity: 0.8,
  },
  sosButton: {
    width: Math.min(width * 0.95, 250),
    height: Math.min(width * 0.95, 250),
    borderRadius: Math.min(width * 0.475, 125),
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 0,
    marginBottom: 10,
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
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_LARGE + 20,
    fontWeight: '900',
    color: COLORS.BACKGROUND,
    textAlign: 'center',
    letterSpacing: 1,
  },
  sosSubtext: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_MEDIUM,
    fontWeight: 'bold',
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
  sosLoading: {
    alignItems: 'center',
  },
  sosLoadingText: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_SMALL,
    color: COLORS.BACKGROUND,
    opacity: 0.9,
    marginTop: 10,
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
  shakeToggleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  shakeToggleButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  toggleContent: {
    flex: 1,
    alignItems: 'flex-start',
  },
  shakeToggleText: {
    color: COLORS.BACKGROUND,
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_MEDIUM,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  shakeToggleSubtext: {
    color: COLORS.BACKGROUND,
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_SMALL,
    opacity: 0.8,
    textAlign: 'left',
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    paddingHorizontal: 2,
    marginRight: 15,
  },
  toggleSwitchActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.BACKGROUND,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
    width: '60%', // Make button smaller in width
    alignSelf: 'center', // Center the button
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 15,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  modalBody: {
    padding: 20,
  },
  featureTitle: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 8,
    marginTop: 15,
  },
  featureDescription: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_SMALL,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
});


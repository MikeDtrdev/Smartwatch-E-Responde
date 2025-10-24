import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, SMARTWATCH_CONSTANTS } from '../../services/constants';

const { width, height } = Dimensions.get('window');

export const createStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  errorText: {
    color: COLORS.BACKGROUND,
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_SMALL,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 30,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    color: COLORS.BACKGROUND,
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_MEDIUM,
  },
  loginButton: {
    backgroundColor: COLORS.BACKGROUND,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: COLORS.PRIMARY,
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_MEDIUM,
    fontWeight: 'bold',
  },
  infoSection: {
    alignItems: 'center',
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
});


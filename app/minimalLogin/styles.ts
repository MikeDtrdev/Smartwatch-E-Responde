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
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
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
  emailContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    padding: 15,
    color: COLORS.BACKGROUND,
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_MEDIUM,
  },
  dropdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dropdownText: {
    color: COLORS.PRIMARY,
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_SMALL,
    textAlign: 'center',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    color: COLORS.BACKGROUND,
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_MEDIUM,
  },
  passwordToggle: {
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordToggleIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.BACKGROUND,
  },
  loginButton: {
    backgroundColor: COLORS.BACKGROUND,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    alignSelf: 'center',
    width: '60%',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: COLORS.PRIMARY,
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_LARGE,
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


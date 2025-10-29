import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, SMARTWATCH_CONSTANTS } from '../../services/constants';

const { width, height } = Dimensions.get('window');

export const createStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    padding: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_LARGE,
    fontWeight: 'bold',
    color: COLORS.BACKGROUND,
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_SMALL,
    color: COLORS.BACKGROUND,
    textAlign: 'center',
    opacity: 0.8,
  },
  testControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  testButton: {
    backgroundColor: COLORS.ACCENT,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    marginVertical: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  testButtonDisabled: {
    backgroundColor: COLORS.SECONDARY,
    opacity: 0.6,
  },
  testButtonText: {
    color: COLORS.BACKGROUND,
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_SMALL,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  resultsTitle: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 10,
  },
  resultsList: {
    flex: 1,
  },
  resultText: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_SMALL,
    color: COLORS.PRIMARY,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  deviceInfo: {
    backgroundColor: COLORS.SECONDARY,
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  deviceInfoTitle: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_SMALL,
    fontWeight: 'bold',
    color: COLORS.BACKGROUND,
    marginBottom: 5,
  },
  deviceInfoText: {
    fontSize: SMARTWATCH_CONSTANTS.FONT_SIZE_SMALL,
    color: COLORS.BACKGROUND,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});

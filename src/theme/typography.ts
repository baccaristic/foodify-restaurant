import { TextStyle } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { colors } from './colors';

type Weight = TextStyle['fontWeight'];

const baseText = (size: number, weight: Weight = '400', color = colors.textPrimary): TextStyle => ({
  fontSize: moderateScale(size),
  fontFamily: 'Roboto',
  fontWeight: weight,
  color,
});

export const typography = {
  h1: baseText(34, '700'),
  h2: baseText(26, '700'),
  h3: baseText(20, '700'),
  body: baseText(16),
  bodyMedium: baseText(14),
  bodySmall: baseText(12),
  bodyStrong: baseText(16, '600'),
  button: baseText(14, '700', colors.white),
  captionStrong: baseText(12, '600'),
  inverseBody: baseText(14, '400', colors.textOnDark),
  inverseTitle: baseText(20, '700', colors.textOnDark),
};

import { MD3Theme } from 'react-native-paper';

type FontWeight = 
  | 'normal' 
  | 'bold' 
  | '100' 
  | '200' 
  | '300' 
  | '400' 
  | '500' 
  | '600' 
  | '700' 
  | '800' 
  | '900';

const baseFont = {
  fontFamily: 'System',
  fontWeight: '400' as FontWeight,
  letterSpacing: 0,
} as const;

const defaultFonts = {
  displayLarge: {
    ...baseFont,
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '400' as FontWeight,
  },
  displayMedium: {
    ...baseFont,
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '400' as FontWeight,
  },
  displaySmall: {
    ...baseFont,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '400' as FontWeight,
  },
  headlineLarge: {
    ...baseFont,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '400' as FontWeight,
  },
  headlineMedium: {
    ...baseFont,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '400' as FontWeight,
  },
  headlineSmall: {
    ...baseFont,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '400' as FontWeight,
  },
  titleLarge: {
    ...baseFont,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '400' as FontWeight,
  },
  titleMedium: {
    ...baseFont,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as FontWeight,
    letterSpacing: 0.15,
  },
  titleSmall: {
    ...baseFont,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as FontWeight,
    letterSpacing: 0.1,
  },
  bodyLarge: {
    ...baseFont,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as FontWeight,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    ...baseFont,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as FontWeight,
    letterSpacing: 0.25,
  },
  bodySmall: {
    ...baseFont,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as FontWeight,
    letterSpacing: 0.4,
  },
  labelLarge: {
    ...baseFont,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as FontWeight,
    letterSpacing: 0.1,
  },
  labelMedium: {
    ...baseFont,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as FontWeight,
    letterSpacing: 0.5,
  },
  labelSmall: {
    ...baseFont,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as FontWeight,
    letterSpacing: 0.5,
  },
  default: {
    ...baseFont,
    fontSize: 14,
    lineHeight: 20,
  },
};

const lightColors = {
  primary: '#6750A4',
  onPrimary: '#FFFFFF',
  primaryContainer: '#EADDFF',
  onPrimaryContainer: '#21005D',
  secondary: '#625B71',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E8DEF8',
  onSecondaryContainer: '#1D192B',
  tertiary: '#7D5260',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFD8E4',
  onTertiaryContainer: '#31111D',
  error: '#B3261E',
  onError: '#FFFFFF',
  errorContainer: '#F9DEDC',
  onErrorContainer: '#410E0B',
  background: '#FFFBFE',
  onBackground: '#1C1B1F',
  surface: '#FFFBFE',
  onSurface: '#1C1B1F',
  surfaceVariant: '#E7E0EC',
  onSurfaceVariant: '#49454F',
  outline: '#79747E',
  outlineVariant: '#CAC4D0',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#313033',
  inverseOnSurface: '#F4EFF4',
  inversePrimary: '#D0BCFF',
  elevation: {
    level0: 'transparent',
    level1: 'rgb(247, 243, 249)',
    level2: 'rgb(243, 237, 246)',
    level3: 'rgb(238, 232, 244)',
    level4: 'rgb(236, 230, 243)',
    level5: 'rgb(233, 227, 241)',
  },
  surfaceDisabled: 'rgba(28, 27, 31, 0.12)',
  onSurfaceDisabled: 'rgba(28, 27, 31, 0.38)',
  backdrop: 'rgba(50, 47, 55, 0.4)',
};

const darkColors = {
  primary: '#D0BCFF',
  onPrimary: '#381E72',
  primaryContainer: '#4F378B',
  onPrimaryContainer: '#EADDFF',
  secondary: '#CCC2DC',
  onSecondary: '#332D41',
  secondaryContainer: '#4A4458',
  onSecondaryContainer: '#E8DEF8',
  tertiary: '#EFB8C8',
  onTertiary: '#492532',
  tertiaryContainer: '#633B48',
  onTertiaryContainer: '#FFD8E4',
  error: '#F2B8B5',
  onError: '#601410',
  errorContainer: '#8C1D18',
  onErrorContainer: '#F9DEDC',
  background: '#1C1B1F',
  onBackground: '#E6E1E5',
  surface: '#1C1B1F',
  onSurface: '#E6E1E5',
  surfaceVariant: '#49454F',
  onSurfaceVariant: '#CAC4D0',
  outline: '#938F99',
  outlineVariant: '#49454F',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#E6E1E5',
  inverseOnSurface: '#313033',
  inversePrimary: '#6750A4',
  elevation: {
    level0: 'transparent',
    level1: 'rgb(37, 35, 42)',
    level2: 'rgb(42, 40, 48)',
    level3: 'rgb(48, 45, 55)',
    level4: 'rgb(50, 47, 57)',
    level5: 'rgb(53, 50, 62)',
  },
  surfaceDisabled: 'rgba(230, 225, 229, 0.12)',
  onSurfaceDisabled: 'rgba(230, 225, 229, 0.38)',
  backdrop: 'rgba(50, 47, 55, 0.4)',
};

export const DefaultTheme: MD3Theme = {
  version: 3,
  isV3: true,
  dark: false,
  roundness: 4,
  animation: {
    scale: 1.0,
  },
  colors: lightColors,
  fonts: defaultFonts,
};

export const DarkTheme: MD3Theme = {
  version: 3,
  isV3: true,
  dark: true,
  roundness: 4,
  animation: {
    scale: 1.0,
  },
  colors: darkColors,
  fonts: defaultFonts,
};
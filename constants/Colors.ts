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
  fontFamily: 'Onest',
  fontWeight: '400' as FontWeight,
  letterSpacing: 0,
} as const;

const defaultFonts = {
  displayLarge: {
    fontFamily: 'Onest-Light',
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '300' as FontWeight,
    letterSpacing: 0,
  },
  displayMedium: {
    fontFamily: 'Onest-Light',
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '300' as FontWeight,
    letterSpacing: 0,
  },
  displaySmall: {
    fontFamily: 'Onest-Light',
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '300' as FontWeight,
    letterSpacing: 0,
  },
  headlineLarge: {
    fontFamily: 'Onest',
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '400' as FontWeight,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: 'Onest',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '400' as FontWeight,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily: 'Onest',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '400' as FontWeight,
    letterSpacing: 0,
  },
  titleLarge: {
    fontFamily: 'Onest',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '400' as FontWeight,
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: 'Onest-Medium',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as FontWeight,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily: 'Onest-Medium',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as FontWeight,
    letterSpacing: 0.1,
  },
  bodyLarge: {
    fontFamily: 'Onest',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as FontWeight,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontFamily: 'Onest',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as FontWeight,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: 'Onest',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as FontWeight,
    letterSpacing: 0.4,
  },
  labelLarge: {
    fontFamily: 'Onest-Medium',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as FontWeight,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: 'Onest-Medium',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as FontWeight,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: 'Onest-Medium',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as FontWeight,
    letterSpacing: 0.5,
  },
  default: {
    fontFamily: 'Onest',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as FontWeight,
    letterSpacing: 0.25,
  },
};

const lightColors = {
  //Основной цвет бренда — активные иконки, кнопки contained, выделения, FAB
  primary: '#8A51E6', //'#6750A4'
  //Цвет текста/иконок, отображаемых поверх primary
  onPrimary: '#FFFFFF',
  //Фон вторичных элементов или кнопок (outlined, text) в сочетании с брендом
  primaryContainer: '#EADDFF',
  //Текст, поверх primaryContaine` (напр. текст в модалках или badge'ах)
  onPrimaryContainer: '#21005D',
  //Поддерживающий цвет (вторичные кнопки, иконки, меню, чекбоксы)
  secondary: '#E6D8F9',
  //Текст/иконки поверх secondary
  onSecondary: '#21055C',
  //СТРОКА ПОИСКА. Контейнер/фон элементов со secondary (напр. Chip, Card)
  secondaryContainer: '#F4EDFF',
  //Текст/иконки на фоне secondaryContainer
  onSecondaryContainer: '#1D192B',
  //Дополнительный акцент — иногда используется в Dialog, Badge, Switch
  tertiary: '#7D5260',
  //Поверх tertiary
  onTertiary: '#FFFFFF',
  //Альтернативный фон для tertiary элементов
  tertiaryContainer: '#FFD8E4',
  //Текст и иконки поверх tertiaryContainer
  onTertiaryContainer: '#31111D',
  //Кнопки/текст об ошибке (валидация, confirm delete)
  error: '#EE2D38', //'#B3261E',
  //Текст/иконки на фоне error
  onError: '#FFFFFF',
  //Фон сообщений об ошибке (например, карточка просроченного лекарства)
  errorContainer: '#F2B8B5',
  //Текст/иконки на фоне errorContainer
  onErrorContainer: '#410E0B',
  //Фоновый цвет приложения
  background: '#F7F7F7',
  //Текст и иконки поверх background
  onBackground: '#1C1B1F',
  //КАРТОЧКА. Фон карточек, модалок, полей, диалогов
  surface: '#FFFFFF',
  //Основной текст, иконки поверх surface (например, список лекарств)
  onSurface: '#000000',//'#1C1B1F',
  //ТАББАР. Светлая/тёмная вариация surface. Применяется в BlurView, таббаре
  surfaceVariant: '#FFFFFF',
  //НЕ ВЫБРАННЫЙ ТЕКСТ ТАБА. Цвет текста, неакцентного (например, placeholder, второстепенный текст)
  onSurfaceVariant: '#49454F', //#9EA8BD
  //Цвет границ, бордеров (TextInput, Divider, Card)
  outline: '#79747E',
  //Более мягкий outline (менее контрастный, для разделения блоков)
  outlineVariant: '#CAC4D0',
  //Цвет теней (обычно всегда чёрный)
  shadow: '#000000',
  //Тёмная подложка под модалками (background overlay)
  scrim: '#000000',
  //Цвет поверхности при инверсии (например, в Snackbar, Toast)
  inverseSurface: '#313033',
  //Текст на inverseSurface
  inverseOnSurface: '#F4EFF4',
  //Акцентный цвет, когда всё остальное инверсное (редко используется)
  inversePrimary: '#D0BCFF',
  elevation: {
    level0: 'transparent', // базовый уровень (например, фон экрана)
    level1: 'rgb(247, 243, 249)', // карточки, AppBar, диалоги, FAB и т.д.
    level2: 'rgb(243, 237, 246)',
    level3: 'rgb(238, 232, 244)',
    level4: 'rgb(236, 230, 243)',
    level5: 'rgb(233, 227, 241)',
  },
  //Применяется к disabled-элементам: кнопки, инпуты, чекбоксы.
  //Например, когда форма невалидна или неактивна
  surfaceDisabled: 'rgba(28, 27, 31, 0.12)',
  onSurfaceDisabled: 'rgba(28, 27, 31, 0.38)',
  //Затемнение фона под Dialog, Modal, BottomSheet.
  //Цвет затемняющей "завесы" (scrim / backdrop)
  backdrop: 'rgba(50, 47, 55, 0.4)',
};

const darkColors = {
  primary: '#D0BCFF',
  onPrimary: '#381E72',
  primaryContainer: '#4F378B',
  onPrimaryContainer: '#EADDFF',
  secondary: '#4D3589',
  onSecondary: '#EADDFF',
  secondaryContainer: '#4A4458',
  onSecondaryContainer: '#E8DEF8',
  tertiary: '#EFB8C8',
  onTertiary: '#492532',
  tertiaryContainer: '#633B48',
  onTertiaryContainer: '#FFD8E4',
  error: '#ff8989ff',
  onError: '#601410',
  errorContainer: '#8C1D18',
  onErrorContainer: '#F9DEDC',
  background: '#000000',
  onBackground: '#E6E1E5',
  surface: '#1C1B1F',
  onSurface: '#E6E1E5',
  surfaceVariant: '#1C1B1F',
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
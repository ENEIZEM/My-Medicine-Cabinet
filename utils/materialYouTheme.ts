import { MD3Theme, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import MaterialYou from 'react-native-material-you-colors';

export function getMaterialYouTheme(isDarkMode: boolean): MD3Theme {
  const baseTheme = isDarkMode ? MD3DarkTheme : MD3LightTheme;

  // Проверяем поддержку Material You
  if (MaterialYou.isSupported) {
    // Получаем палитру цветов
    const palette = MaterialYou.getMaterialYouPalette();

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: palette.system_accent1[5],
        onPrimary: palette.system_accent1[0],
        secondary: palette.system_accent2[5],
        onSecondary: palette.system_accent2[0],
        background: palette.system_neutral1[0],
        surface: palette.system_neutral1[1],
        // Добавьте другие цвета по необходимости
      },
    };
  } else {
    return baseTheme;
  }
}

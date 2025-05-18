import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  useColorScheme,
  ColorSchemeName,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MD3DarkTheme,
  MD3LightTheme,
  MD3Theme,
} from 'react-native-paper';
import MaterialYou from 'react-native-material-you-colors';

type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextType = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  theme: MD3Theme;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme: ColorSchemeName = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');
  const [theme, setTheme] = useState<MD3Theme>(MD3LightTheme);

  useEffect(() => {
    AsyncStorage.getItem('theme').then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setMode(stored);
      }
    });
  }, []);

  const handleSetMode = (newMode: ThemeMode) => {
    setMode(newMode);
    AsyncStorage.setItem('theme', newMode);
  };

  useEffect(() => {
    const resolved = mode === 'system' ? systemScheme : mode;
    const isDark = resolved === 'dark';

    let baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;

    if (
      Platform.OS === 'android' &&
      MaterialYou.isSupported
    ) {
      const palette = MaterialYou.getMaterialYouPalette();

      const customColors = {
        primary: palette.system_accent1[5],
        onPrimary: palette.system_accent1[0],
        primaryContainer: palette.system_accent1[3],
        onPrimaryContainer: palette.system_accent1[10],
        secondary: palette.system_accent2[5],
        onSecondary: palette.system_accent2[0],
        secondaryContainer: palette.system_accent2[3],
        onSecondaryContainer: palette.system_accent2[10],
        background: palette.system_neutral1[0],
        onBackground: palette.system_neutral1[10],
        surface: palette.system_neutral1[1],
        onSurface: palette.system_neutral1[10],
        surfaceVariant: palette.system_neutral2[2],
        onSurfaceVariant: palette.system_neutral2[9],
        outline: palette.system_neutral2[6],
        // Добавьте другие нужные цвета по необходимости
      };

      baseTheme = {
        ...baseTheme,
        colors: {
          ...baseTheme.colors,
          ...customColors,
        },
      };
    }

    setTheme(baseTheme);
  }, [mode, systemScheme]);

  return (
    <ThemeContext.Provider value={{ mode, setMode: handleSetMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context)
    throw new Error('useThemeMode must be used within ThemeProvider');
  return context;
};

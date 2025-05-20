import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextType = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  theme: typeof MD3LightTheme;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

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

  const resolved = mode === 'system' ? systemScheme : mode;
  const theme = resolved === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return (
    <ThemeContext.Provider value={{ mode, setMode: handleSetMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeMode must be used within ThemeProvider');
  return context;
};
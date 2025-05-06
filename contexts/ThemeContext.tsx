import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme } from '@/constants/colors';
import type { Theme } from '@/types/settings.d';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(systemTheme === 'dark' ? DarkTheme : DefaultTheme);
  const [isDark, setIsDark] = useState(systemTheme === 'dark');

  const toggleTheme = () => {
    setIsDark(!isDark);
    setTheme(!isDark ? DarkTheme : DefaultTheme);
  };

  // Синхронизация с системной темой
  useEffect(() => {
    setIsDark(systemTheme === 'dark');
    setTheme(systemTheme === 'dark' ? DarkTheme : DefaultTheme);
  }, [systemTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
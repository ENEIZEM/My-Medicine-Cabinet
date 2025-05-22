// contexts/SettingsContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsContextType {
  is12HourFormat: boolean;
  toggleTimeFormat: () => Promise<void>;
  userName: string;
  setUserName: (name: string) => Promise<void>;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  resolvedTheme: 'light' | 'dark'; // 👈 добавлено
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [is12HourFormat, setIs12HourFormat] = useState(false);
  const [userName, setUserNameState] = useState('');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  const systemScheme = useColorScheme(); // 👈 light / dark / null
  const resolvedTheme: 'light' | 'dark' =
    themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeMode;

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [format, savedName, savedTheme] = await Promise.all([
          AsyncStorage.getItem('timeFormat'),
          AsyncStorage.getItem('userName'),
          AsyncStorage.getItem('themeMode'),
        ]);

        if (format) setIs12HourFormat(format === '12');
        if (savedName) setUserNameState(savedName);
        if (
          savedTheme === 'light' ||
          savedTheme === 'dark' ||
          savedTheme === 'system'
        ) {
          setThemeModeState(savedTheme);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  const toggleTimeFormat = async () => {
    try {
      const newFormat = is12HourFormat ? '24' : '12';
      await AsyncStorage.setItem('timeFormat', newFormat);
      setIs12HourFormat(newFormat === '12');
    } catch (error) {
      console.error('Failed to save time format:', error);
    }
  };

  const setUserName = async (name: string) => {
    try {
      await AsyncStorage.setItem('userName', name);
      setUserNameState(name);
    } catch (error) {
      console.error('Failed to save user name:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        is12HourFormat,
        toggleTimeFormat,
        userName,
        setUserName,
        themeMode,
        setThemeMode,
        resolvedTheme, // 👈 обязательно добавлен
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

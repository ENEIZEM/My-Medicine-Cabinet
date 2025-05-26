// contexts/SettingsContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

export type DateOrder = 'dmy' | 'ymd' | 'mdy' | 'ydm';
export type DateSeparator = '.' | '-' | ' ';

interface SettingsContextType {
  is12HourFormat: boolean;
  toggleTimeFormat: () => Promise<void>;
  userName: string;
  setUserName: (name: string) => Promise<void>;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  resolvedTheme: 'light' | 'dark'; // 👈 добавлено
  
  dateOrder: DateOrder;
  setDateOrder: (order: DateOrder) => Promise<void>;
  dateSeparator: DateSeparator;
  setDateSeparator: (sep: DateSeparator) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const getSystemDateOrder = (): DateOrder => {
  const format = new Intl.DateTimeFormat().format(new Date(2025, 0, 15)); // Jan 15, 2025
  if (format.match(/^15[^\d]?0?1[^\d]?2025$/)) return 'dmy';
  if (format.match(/^2025[^\d]?0?1[^\d]?15$/)) return 'ymd';
  if (format.match(/^0?1[^\d]?15[^\d]?2025$/)) return 'mdy';
  if (format.match(/^2025[^\d]?15[^\d]?0?1$/)) return 'ydm';
  return 'dmy';
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [is12HourFormat, setIs12HourFormat] = useState(false);
  const [userName, setUserNameState] = useState('');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [dateOrder, setDateOrderState] = useState<DateOrder>('dmy');
  const [dateSeparator, setDateSeparatorState] = useState<DateSeparator>('.');

  

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

        if (format === '12' || format === '24') {
          setIs12HourFormat(format === '12');
        } else {
          // Установить формат по умолчанию в зависимости от системы
          const locale = Intl.DateTimeFormat().resolvedOptions().locale;
          const use24Hour = !locale.includes('en-US'); // примерная эвристика
          setIs12HourFormat(!use24Hour ? false : true);
        }

        if (savedName) setUserNameState(savedName);
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
          setThemeModeState(savedTheme);
        } else {
          setThemeModeState('system'); // По умолчанию
        }

        const storedOrder = await AsyncStorage.getItem('dateOrder');
        const storedSep = await AsyncStorage.getItem('dateSeparator');

        setDateOrderState(storedOrder as DateOrder ?? getSystemDateOrder());
        setDateSeparatorState((storedSep as DateSeparator) ?? '.');
        
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  const setDateOrder = async (order: DateOrder) => {
    setDateOrderState(order);
    await AsyncStorage.setItem('dateOrder', order);
  };
  const setDateSeparator = async (sep: DateSeparator) => {
    setDateSeparatorState(sep);
    await AsyncStorage.setItem('dateSeparator', sep);
  };

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
        dateOrder,
        setDateOrder,
        dateSeparator,
        setDateSeparator
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

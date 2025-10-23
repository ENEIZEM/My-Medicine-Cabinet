import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import * as Localization from 'expo-localization';
import { translations } from '@/constants/locales';

export type ThemeMode = 'light' | 'dark' | 'system';
export type DateOrder = 'dmy' | 'ymd' | 'mdy' | 'ydm';
export type DateSeparator = '.' | '-' | ' ';
export type HomeTab = 'schedule' | 'medicine';
export type Language = keyof typeof translations;

interface SettingsContextType {
  is12HourFormat: boolean;
  toggleTimeFormat: () => Promise<void>;
  userName: string;
  setUserName: (name: string) => Promise<void>;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  resolvedTheme: 'light' | 'dark';
  dateOrder: DateOrder;
  setDateOrder: (order: DateOrder) => Promise<void>;
  dateSeparator: DateSeparator;
  setDateSeparator: (sep: DateSeparator) => Promise<void>;
  homeTab: HomeTab;
  setHomeTab: (tab: HomeTab) => Promise<void>;
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  toggleLanguage: () => void;
  t: typeof translations[Language];

  // Добавлено: нижняя вставка (bottom inset) — в dp
  bottomInset: number;
  setBottomInset: (inset: number) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const getSystemDateOrder = (): DateOrder => {
  const format = new Intl.DateTimeFormat().format(new Date(2025, 0, 15));
  // Подстроено под возможные форматы
  if (format.match(/^15[^\d]?0?1[^\d]?2025$/)) return 'dmy';
  if (format.match(/^2025[^\d]?0?1[^\d]?15$/)) return 'ymd';
  if (format.match(/^0?1[^\d]?15[^\d]?2025$/)) return 'mdy';
  if (format.match(/^2025[^\d]?15[^\d]?0?1$/)) return 'ydm';
  return 'dmy';
};

const getDeviceLanguage = (): Language => {
  const sovietLanguages = [
    'ru', 'uk', 'be', 'kk', 'ky', 'uz', 'tk', 'az', 'hy', 'ro',
    'ab', 'os', 'tg', 'ka', 'lv', 'lt', 'et',
  ];

  const locales = Localization.getLocales();
  if (Array.isArray(locales) && locales.length > 0) {
    const langCode = locales[0].languageCode?.toLowerCase();
    if (langCode && sovietLanguages.includes(langCode)) {
      return 'ru';
    }
  }

  return 'en';
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [is12HourFormat, setIs12HourFormat] = useState(false);
  const [userName, setUserNameState] = useState('');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [dateOrder, setDateOrderState] = useState<DateOrder>('dmy');
  const [dateSeparator, setDateSeparatorState] = useState<DateSeparator>('.');
  const [homeTab, setHomeTabState] = useState<HomeTab>('medicine');
  const [language, setLanguageState] = useState<Language>('en');

  // Добавлено: bottomInset — хранится в dp
  const [bottomInset, setBottomInsetState] = useState<number>(0);

  const systemScheme = useColorScheme();
  const resolvedTheme: 'light' | 'dark' =
    themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeMode;

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [
          savedFormat,
          savedName,
          savedTheme,
          storedOrder,
          storedSep,
          savedHomeTab,
          savedLang,
          storedBottomInset,
        ] = await Promise.all([
          AsyncStorage.getItem('timeFormat'),
          AsyncStorage.getItem('userName'),
          AsyncStorage.getItem('themeMode'),
          AsyncStorage.getItem('dateOrder'),
          AsyncStorage.getItem('dateSeparator'),
          AsyncStorage.getItem('homeTab'),
          AsyncStorage.getItem('appLanguage'),
          AsyncStorage.getItem('bottomInset'), // загружаем сохранённую bottomInset, если есть
        ]);

        if (savedFormat === '12' || savedFormat === '24') {
          setIs12HourFormat(savedFormat === '12');
        } else {
          const calendars = Localization.getCalendars();
          const system24Hour = calendars?.[0]?.uses24hourClock ?? true;
          setIs12HourFormat(!system24Hour);
        }

        if (savedName) setUserNameState(savedName);

        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
          setThemeModeState(savedTheme);
        }

        if (storedOrder === 'dmy' || storedOrder === 'ymd' || storedOrder === 'mdy' || storedOrder === 'ydm') {
          setDateOrderState(storedOrder);
        } else {
          setDateOrderState(getSystemDateOrder());
        }

        if (storedSep === '.' || storedSep === '-' || storedSep === ' ') {
          setDateSeparatorState(storedSep);
        }

        if (savedHomeTab === 'schedule' || savedHomeTab === 'medicine') {
          setHomeTabState(savedHomeTab);
        }

        if (savedLang && translations[savedLang as Language]) {
          setLanguageState(savedLang as Language);
        } else {
          setLanguageState(getDeviceLanguage());
        }

        if (storedBottomInset) {
          const parsed = parseFloat(storedBottomInset);
          if (!Number.isNaN(parsed)) {
            setBottomInsetState(parsed);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  const setDateOrder = async (order: DateOrder) => {
    try {
      await AsyncStorage.setItem('dateOrder', order);
      setDateOrderState(order);
    } catch (error) {
      console.error('Failed to save date order:', error);
    }
  };

  const setDateSeparator = async (sep: DateSeparator) => {
    try {
      await AsyncStorage.setItem('dateSeparator', sep);
      setDateSeparatorState(sep);
    } catch (error) {
      console.error('Failed to save date separator:', error);
    }
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

  const setHomeTab = async (tab: HomeTab) => {
    try {
      await AsyncStorage.setItem('homeTab', tab);
      setHomeTabState(tab);
    } catch (error) {
      console.error('Failed to save home tab:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('appLanguage', lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const toggleLanguage = () => {
    const newLang: Language = language === 'en' ? 'ru' : 'en';
    setLanguage(newLang);
  };

  // Добавлено: сеттер для bottomInset — сохраняет в AsyncStorage и обновляет state
  const setBottomInset = async (inset: number) => {
    try {
      await AsyncStorage.setItem('bottomInset', String(inset));
      setBottomInsetState(inset);
    } catch (error) {
      console.error('Failed to save bottom inset:', error);
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
        resolvedTheme,
        dateOrder,
        setDateOrder,
        dateSeparator,
        setDateSeparator,
        homeTab,
        setHomeTab,
        language,
        setLanguage,
        toggleLanguage,
        t: translations[language],
        bottomInset,
        setBottomInset,
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

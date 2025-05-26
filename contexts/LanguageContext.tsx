import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { translations } from '@/constants/locales';

type Language = keyof typeof translations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  toggleLanguage: () => void;
  t: typeof translations[Language];
  userName: string;
  setUserName: (name: string) => Promise<void>;
}

  const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

  export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>('en');
    const [userName, setUserNameState] = useState('');

    const getDeviceLanguage = (): Language => {
    const locales = Localization.getLocales();
    if (
      Array.isArray(locales) &&
      locales.length > 0
    ) {
      const langTag = locales[0].languageTag.toLowerCase();
      if (langTag.startsWith('ru')) return 'ru';
    }
    return 'en';
  };


  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedLang, savedName] = await Promise.all([
          AsyncStorage.getItem('appLanguage'),
          AsyncStorage.getItem('userName'),
        ]);

        if (savedLang && translations[savedLang as Language]) {
          setLanguageState(savedLang as Language);
        } else {
          setLanguageState(getDeviceLanguage());
        }

        if (savedName) {
          setUserNameState(savedName);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

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

  const setUserName = async (name: string) => {
    try {
      await AsyncStorage.setItem('userName', name);
      setUserNameState(name);
    } catch (error) {
      console.error('Error saving user name:', error);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t: translations[language],
        userName,
        setUserName,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

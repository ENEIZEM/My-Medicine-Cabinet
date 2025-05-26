import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TimeFormatContextType = {
  is24HourFormat: boolean;
  toggleTimeFormat: () => void;
};

const TimeFormatContext = createContext<TimeFormatContextType | undefined>(undefined);

export const TimeFormatProvider = ({ children }: { children: ReactNode }) => {
  const [is24HourFormat, setIs24HourFormat] = useState(true);

  useEffect(() => {
    const loadFormat = async () => {
      const stored = await AsyncStorage.getItem('timeFormat');
      if (stored === '12') setIs24HourFormat(false);
      if (stored === '24') setIs24HourFormat(true);
    };
    loadFormat();
  }, []);

  const toggleTimeFormat = () => {
    const newFormat = !is24HourFormat;
    setIs24HourFormat(newFormat);
    AsyncStorage.setItem('timeFormat', newFormat ? '24' : '12');
  };

  return (
    <TimeFormatContext.Provider value={{ is24HourFormat, toggleTimeFormat }}>
      {children}
    </TimeFormatContext.Provider>
  );
};

export const useTimeFormat = () => {
  const context = useContext(TimeFormatContext);
  if (!context) {
    throw new Error('useTimeFormat must be used within a TimeFormatProvider');
  }
  return context;
};

import { Slot } from 'expo-router';
import { TimeFormatProvider } from '@/contexts/TimeFormatContext';
import { ThemeProvider, useThemeMode } from '@/contexts/ThemeContext';
import { PaperProvider } from 'react-native-paper';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { MedicineProvider } from '@/contexts/MedicineContext';
import { useState, useEffect } from 'react';
import WelcomeScreen from '@/app/welcome';
import { SettingsProvider } from '@/contexts/SettingsContext';

function AppWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeMode();
  return <PaperProvider theme={theme}>{children}</PaperProvider>;
}

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <TimeFormatProvider>
      <ThemeProvider>
        <AppWrapper>
          <LanguageProvider>
            <SettingsProvider>
              <MedicineProvider>
                {isLoading ? <WelcomeScreen /> : <Slot />}
              </MedicineProvider>
            </SettingsProvider>
          </LanguageProvider>
        </AppWrapper>
      </ThemeProvider>
    </TimeFormatProvider>
  );
}
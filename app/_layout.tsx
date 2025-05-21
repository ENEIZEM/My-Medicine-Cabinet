// app/_layout.tsx
import { Slot } from 'expo-router';
import { TimeFormatProvider } from '@/contexts/TimeFormatContext';
import { ThemeProvider, useThemeMode } from '@/contexts/ThemeContext';
import { PaperProvider } from 'react-native-paper';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { MedicineProvider } from '@/contexts/MedicineContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

function AppWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeMode();
  return <PaperProvider theme={theme}>{children}</PaperProvider>;
}

export default function RootLayout() {
  useEffect(() => {
    const hide = async () => {
      await SplashScreen.hideAsync();
    };
    hide();
  }, []);

  return (
    <TimeFormatProvider>
      <ThemeProvider>
        <AppWrapper>
          <LanguageProvider>
            <SettingsProvider>
              <MedicineProvider>
                <Slot />
              </MedicineProvider>
            </SettingsProvider>
          </LanguageProvider>
        </AppWrapper>
      </ThemeProvider>
    </TimeFormatProvider>
  );
}
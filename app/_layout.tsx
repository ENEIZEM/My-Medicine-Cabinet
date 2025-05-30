import { Slot } from 'expo-router';
import { TimeFormatProvider } from '@/contexts/TimeFormatContext';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { MedicineProvider } from '@/contexts/MedicineContext';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // ⬅️ обязательно
import { View } from 'react-native';

function AppWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useSettings();
  const theme = resolvedTheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
        {children}
      </PaperProvider>
    </GestureHandlerRootView>
  );
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
      <SettingsProvider>
        <AppWrapper>
          <LanguageProvider>
            <MedicineProvider>
              <Slot />
            </MedicineProvider>
          </LanguageProvider>
        </AppWrapper>
      </SettingsProvider>
    </TimeFormatProvider>
  );
}
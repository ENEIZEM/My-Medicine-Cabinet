import React, { useEffect, useState } from 'react';
import { Slot } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { MedicineProvider } from '@/contexts/MedicineContext';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View, PixelRatio } from 'react-native';
import { DefaultTheme, DarkTheme } from '@/constants/colors';
import * as Font from 'expo-font';
import { ScheduleProvider } from '@/contexts/ScheduleContext';
import { IntakeProvider } from '@/contexts/IntakeContext';
import * as NavigationBar from 'react-native-system-navigation-bar';
import NavigationBarNative from 'NavigationBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Создание кастомной темы с шрифтами Onest
const createCustomTheme = (baseTheme: any) => ({
  ...baseTheme,
  fonts: {
    ...baseTheme.fonts,
    regular: {
      ...baseTheme.fonts.regular,
      fontFamily: 'Onest-Regular',
    },
    medium: {
      ...baseTheme.fonts.medium,
      fontFamily: 'Onest-Medium',
    },
    bold: {
      ...baseTheme.fonts.bold,
      fontFamily: 'Onest-Bold',
    },
    light: {
      ...baseTheme.fonts.light,
      fontFamily: 'Onest-Light',
    },
  },
});

function AppWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, bottomInset, setBottomInset } = useSettings();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const insets = useSafeAreaInsets();

  // Загружаем шрифты Onest
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Onest-Regular': require('../assets/fonts/Onest/Onest-Regular.ttf'),
          'Onest-Medium': require('../assets/fonts/Onest/Onest-Medium.ttf'),
          'Onest-Bold': require('../assets/fonts/Onest/Onest-Bold.ttf'),
          'Onest-Light': require('../assets/fonts/Onest/Onest-Light.ttf'),
        });
      } catch (e) {
        console.warn('Failed to load fonts', e);
      } finally {
        setFontsLoaded(true);
      }
    }

    loadFonts();
  }, []);

  // Устанавливаем цвет NavigationBar в зависимости от темы (раньше приветствия)
  useEffect(() => {
    async function setNavBarColor() {
      try {

      } catch (e) {
        console.warn('Failed to set NavigationBar color:', e);
      }
    }

    setNavBarColor();
  }, [resolvedTheme]);

  // Инициализируем bottomInset
  useEffect(() => {
    const initializeBottomInset = async () => {
      try {
        if (!bottomInset || bottomInset === 0) {
          const nativeHeightPx = await NavigationBarNative.getHeight?.();
          if (nativeHeightPx && nativeHeightPx > 0) {
            const nativeHeightDp = nativeHeightPx / PixelRatio.get();
            await setBottomInset(nativeHeightDp);
          } else {
            await setBottomInset(insets.bottom ?? 0);
          }
        }
      } catch (e) {
        console.warn('Failed to initialize bottom inset:', e);
        await setBottomInset(insets.bottom ?? 0);
      }
    };

    initializeBottomInset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insets.bottom]);

  if (!fontsLoaded) {
    return null; // можно добавить кастомный Splash-экран
  }

  const baseTheme = resolvedTheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = createCustomTheme(baseTheme);

  return (
    <View style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
        {children}
      </PaperProvider>
    </View>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.preventAutoHideAsync();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn('Failed to hide splash:', e);
        }
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <SettingsProvider>
      <AppWrapper>
        <IntakeProvider>
          <MedicineProvider>
            <ScheduleProvider>
                <Slot />
            </ScheduleProvider>
          </MedicineProvider>
        </IntakeProvider>
      </AppWrapper>
    </SettingsProvider>
  );
}

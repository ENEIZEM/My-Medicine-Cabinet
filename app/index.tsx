// app/index.tsx
import { useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import WelcomeScreen from '@/app/welcome';

SplashScreen.preventAutoHideAsync();

export default function Index() {
  const router = useRouter();

  const handleReady = useCallback(async () => {
    await SplashScreen.hideAsync();
    router.replace('/(tabs)/schedule');
  }, []);

  return <WelcomeScreen onReady={handleReady} />;
}

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import WelcomeScreen from '@/app/welcome'; // если такой компонент есть

SplashScreen.preventAutoHideAsync();

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const prepare = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsReady(true);
      await SplashScreen.hideAsync();
      router.replace('/(tabs)/schedule');
    };

    prepare();
  }, []);

  if (!isReady) {
    return <WelcomeScreen />;
  }

  return null;
}

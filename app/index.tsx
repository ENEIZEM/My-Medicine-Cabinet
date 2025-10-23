import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  useEffect(() => {
    router.replace('/welcome');
    // AsyncStorage.clear().then(() => {
    //   console.log('✅ AsyncStorage очищен');
    // });
  }, []);
  return null;
}
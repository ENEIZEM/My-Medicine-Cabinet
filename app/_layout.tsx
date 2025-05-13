import { Slot, SplashScreen } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { MedicineProvider } from '@/contexts/MedicineContext';
import { PaperProvider } from 'react-native-paper';
import { useState, useEffect } from 'react';
import WelcomeScreen from '@/app/welcome';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <MedicineProvider>
          <PaperProvider>
            {isLoading ? <WelcomeScreen /> : <Slot />}
          </PaperProvider>
        </MedicineProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
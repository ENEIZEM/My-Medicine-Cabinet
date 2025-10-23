// components/SmartBlurView.tsx
import React, { useEffect, useState } from 'react';
import { Platform, View, StyleSheet, ViewStyle } from 'react-native';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from 'react-native-paper';

type Props = {
  children?: React.ReactNode;
  style?: ViewStyle;
  blurAmount?: number;
};

let ExpoBlurView: any = null;
let NativeBlurView: any = null;
try { ExpoBlurView = require('expo-blur').BlurView } catch {}
try { NativeBlurView = require('@react-native-community/blur').BlurView } catch {}

export default function SmartBlurView({ children, style, blurAmount = 12 }: Props) {
  const { resolvedTheme } = useSettings();
  const [apiLevel, setApiLevel] = useState<number | null>(Platform.OS === 'ios' ? 999 : null);
    const theme = useTheme();
    const { colors } = theme;

  useEffect(() => {
    if (Platform.OS === 'android') {
      import('react-native-device-info')
        .then(({ getApiLevel }) => getApiLevel().then(setApiLevel).catch(() => setApiLevel(0)));
    }
  }, []);

  // полупрозрачный цвет для таббара
  const overlayColor = colors.surfaceVariant //resolvedTheme === 'dark' ? 'rgba(80, 75, 105, 0.15)' : 'rgba(180, 175, 195, 0.15)';

  // 1) iOS в Expo Go
  if (Platform.OS === 'ios' && ExpoBlurView) {
    return (
      <View style={[styles.container, style]}>
        {/* Размытие */}
        <ExpoBlurView
          tint={resolvedTheme === 'dark' ? 'dark' : 'light'}
          intensity={blurAmount}
          style={StyleSheet.absoluteFill}
        />
        {/* Цветовой тон */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]} />
        {children}
      </View>
    );
  }

  // 2) iOS (native) или Android 9+
  if (
    (Platform.OS === 'ios' && NativeBlurView) ||
    (Platform.OS === 'android' && apiLevel !== null && apiLevel >= 28 && NativeBlurView)
  ) {
    return (
      <View style={[styles.container, style]}>
        <NativeBlurView
          blurType={resolvedTheme === 'dark' ? 'dark' : 'light'}
          blurAmount={blurAmount}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]} />
        {children}
      </View>
    );
  }

  // 3) Fallback (Android < 9)
  return (
    <View style={[styles.container, style, { backgroundColor: overlayColor }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
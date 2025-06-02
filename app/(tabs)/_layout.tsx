import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { useTheme, Text, Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSettings } from '@/contexts/SettingsContext';
import { BlurView } from 'expo-blur';

import ScheduleScreen from './schedule';
import MedicineScreen from './medicine';
import ProfileScreen from './profile';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export default function TabsLayout() {
  const theme = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useSettings();
  const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-5, { duration: 50 }),
      withTiming(5, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const routes = [
    { key: 'schedule', title: t.scheduleTitle, icon: 'calendar' },
    { key: 'medicine', title: t.medicineTitle, icon: 'pill' },
    { key: 'profile', title: t.profileTitle, icon: 'account' },
  ];

  const handleTabPress = (newIndex: number) => {
    if (newIndex === index) {
      triggerShake(); // если нажали на уже активную вкладку
      return;
    }
    setIndex(newIndex);
    pagerRef.current?.setPage(newIndex);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* PagerView с эффектом shake при попытке перейти за границу */}
      <Animated.View style={[{ flex: 1 }, shakeStyle]}>
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageSelected={(e) => setIndex(e.nativeEvent.position)}
        >
          <View key="schedule">
            <ScheduleScreen />
          </View>
          <View key="medicine">
            <MedicineScreen />
          </View>
          <View key="profile">
            <ProfileScreen />
          </View>
        </PagerView>
      </Animated.View>

      {/* Размытие + полупрозрачная подложка + табы */}
      <BlurView
        intensity={50}
        tint={resolvedTheme}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 68 + insets.bottom,
          paddingBottom: insets.bottom,
          zIndex: 10,
        }}
      >
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor:
              resolvedTheme === 'dark'
                ? 'rgba(80, 75, 105, 0.15)'
                : 'rgba(180, 175, 195, 0.15)',
          }}
        />
        <View style={{ flexDirection: 'row', flex: 1 }}>
          {routes.map((route, i) => {
            const isFocused = index === i;
            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => handleTabPress(i)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.8}
              >
                <Icon
                  source={route.icon}
                  size={28}
                  color={
                    isFocused
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: isFocused ? '700' : '500',
                    color: isFocused
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant,
                  }}
                >
                  {route.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}
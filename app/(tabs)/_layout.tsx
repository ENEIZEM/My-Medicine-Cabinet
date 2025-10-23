import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { useTheme, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@/contexts/SettingsContext';
import NavigationBar from 'react-native-system-navigation-bar';

import ScheduleScreen from './schedule';
import MedicineScreen from './medicine';
import ProfileScreen from './profile';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {
  IconCalendarTab,
  IconMedicineTab,
  IconAccountTab,
} from '@/constants/icons';

export default function TabsLayout() {
  const theme = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const { resolvedTheme, homeTab, t } = useSettings();

  const initialIndex = homeTab === 'medicine' ? 1 : 0;
  const [index, setIndex] = useState(initialIndex);
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

  const routes = [{
    key: 'schedule',
    title: t.scheduleTitle,
    icon: IconCalendarTab,
  }, {
    key: 'medicine',
    title: t.medicineTitle,
    icon: IconMedicineTab,
  }, {
    key: 'profile',
    title: t.profileTitle,
    icon: IconAccountTab,
  }];

  const handleTabPress = (newIndex: number) => {
    if (newIndex === index) {
      triggerShake();
      return;
    }
    setIndex(newIndex);
    pagerRef.current?.setPage(newIndex);
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      // Небольшая задержка для полной инициализации
      const timer = setTimeout(async () => {
        try {
          await NavigationBar.setNavigationColor(
            colors.surfaceVariant, 
            resolvedTheme === 'dark' ? 'light' : 'dark'
          );
        } catch (e) {}
      });
      return () => clearTimeout(timer);
    }
  }, [resolvedTheme, colors.surfaceVariant]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View style={[{ flex: 1 }, shakeStyle]}>
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={initialIndex}
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

      {/* Таббар */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 68 + insets.bottom,
          paddingBottom: insets.bottom,
          zIndex: 11,
          backgroundColor: colors.surfaceVariant,
          flexDirection: 'row',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 60,
          elevation: 4,
        }}
      >
        {routes.map((route, i) => {
          const isFocused = index === i;
          const IconComponent = route.icon;

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
              <IconComponent
                width={isFocused ? 30 : 28}
                height={isFocused ? 30 : 28}
                fill={isFocused ? colors.primary : colors.onSurfaceVariant}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: isFocused ? '700' : '500',
                  color: isFocused ? colors.primary : colors.onSurfaceVariant,
                }}
              >
                {route.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
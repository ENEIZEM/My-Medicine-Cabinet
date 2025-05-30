import React, { useState } from 'react';
import { View, TouchableOpacity, useWindowDimensions, StyleSheet } from 'react-native';
import { Text, Icon, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { TabView } from 'react-native-tab-view';

import ScheduleScreen from './schedule';
import MedicineScreen from './medicine';
import ProfileScreen from './profile';
import { BlurView } from 'expo-blur';


export default function TabsLayout() {
  const { t } = useLanguage();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const routes = [
    { key: 'schedule', title: t.scheduleTitle, icon: 'calendar' },
    { key: 'medicine', title: t.medicineTitle, icon: 'pill' },
    { key: 'profile', title: t.profileTitle, icon: 'account' },
  ];

  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'schedule':
        return <ScheduleScreen />;
      case 'medicine':
        return <MedicineScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        swipeEnabled
        renderTabBar={() => null}
      />

      {/* Кастомный таббар */}
      <BlurView
        intensity={50}
        tint={theme.dark ? 'dark' : 'light'}
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
            backgroundColor: theme.dark
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
                onPress={() => setIndex(i)}
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
                  color={isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: isFocused ? '700' : '500',
                    color: isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant,
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
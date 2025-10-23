import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from 'react-native-paper';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { commonStyles } from '@/constants/styles';
import { IconHeart } from '@/constants/icons';
import { scheduleOnRN } from 'react-native-worklets';

export default function Welcome() {
  const { userName, homeTab, is12HourFormat, t } = useSettings();
  const { colors } = useTheme();
  const router = useRouter();

  const [greeting, setGreeting] = useState(t.greetings.default);
  const isVisible = useSharedValue(1);

  useEffect(() => {
    const hour = new Date().getHours();
    const displayHour = is12HourFormat ? hour % 12 || 12 : hour;

    if (displayHour >= 5 && displayHour < 12) {
      setGreeting(t.greetings.morning);
    } else if (displayHour >= 12 && displayHour < 18) {
      setGreeting(t.greetings.afternoon);
    } else if (displayHour >= 18 && displayHour < 23) {
      setGreeting(t.greetings.evening);
    } else {
      setGreeting(t.greetings.night);
    }

    const timer = setTimeout(() => {
      isVisible.value = withTiming(0, { duration: 400 }, (finished) => {
        if (finished) {
          const target =
            homeTab === 'medicine' ? '/(tabs)/medicine' : '/(tabs)/schedule';
          scheduleOnRN(router.replace, target);
        }
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [t, is12HourFormat, userName]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: isVisible.value,
  }));

  return (
    <View style={[commonStyles.centered, { backgroundColor: colors.background }]}>
      {/* Иконка */}
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)}>
        <Animated.View style={fadeStyle}>
          <IconHeart width={80} height={80} fill={colors.primary} />
        </Animated.View>
      </Animated.View>

      {/* Приветствие */}
      <Animated.View
        entering={FadeIn.delay(100).duration(300)}
        exiting={FadeOut.delay(100).duration(300)}
      >
        <Animated.View style={fadeStyle}>
          <Text style={{ fontSize: 28, color: colors.onBackground }}>{greeting}</Text>
        </Animated.View>
      </Animated.View>

      {/* Имя пользователя */}
      <Animated.View
        entering={FadeIn.delay(200).duration(300)}
        exiting={FadeOut.delay(200).duration(300)}
      >
        <Animated.View style={fadeStyle}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.primary }}>
            {userName}
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

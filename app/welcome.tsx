import { View, Text } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import { useSettings } from '@/contexts/SettingsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { commonStyles } from '@/constants/styles';

type WelcomeScreenProps = {
  onReady?: () => void;
};

export default function WelcomeScreen({ onReady }: WelcomeScreenProps) {
  const { colors } = useTheme();
  const { userName, is12HourFormat } = useSettings();
  const { t } = useLanguage();

  const [greeting, setGreeting] = useState(t.greetings.default);
  const isVisible = useSharedValue(1); // 1 — видимо, 0 — скрыто

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
        if (finished && onReady) {
          runOnJS(onReady)();
        }
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [t, is12HourFormat]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: isVisible.value,
  }));

  return (
    <View style={[commonStyles.centered, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeIn.duration(300)}>
        <Animated.View style={fadeStyle}>
          <Icon source="heart" size={80} color={colors.primary} />
        </Animated.View>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(100).duration(300)}>
        <Animated.View style={fadeStyle}>
          <Text style={{ fontSize: 28, color: colors.onBackground, fontWeight: 'bold', }}>
            {greeting}
          </Text>
        </Animated.View>
      </Animated.View>

      {!!userName && (
        <Animated.View entering={FadeIn.delay(200).duration(300)}>
          <Animated.View style={fadeStyle}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.primary }}>
              {userName}
            </Text>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

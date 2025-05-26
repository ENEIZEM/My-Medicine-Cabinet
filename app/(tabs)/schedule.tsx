import { View, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles } from '@/constants/styles';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';



export default function ScheduleScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

const opacity = useSharedValue(0);

useFocusEffect(
  React.useCallback(() => {
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 300 });
    return () => {
      opacity.value = 0;
    };
  }, [])
);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
}));


return (
<Animated.View style={[animatedStyle, {
  backgroundColor: colors.background,
  paddingTop: insets.top + 16,
  paddingBottom: insets.bottom + 16,
  paddingHorizontal: 16,
}, commonStyles.container]}>
</Animated.View>
  );
}

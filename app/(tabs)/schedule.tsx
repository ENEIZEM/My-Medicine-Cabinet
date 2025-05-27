import { View, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles } from '@/constants/styles';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';

export default function ScheduleScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setVisible(false);               // сбросим
      const timeout = setTimeout(() => {
        setVisible(true);              // появление контента
      }, 10);                          // задержка в 1 кадр

      return () => {
        clearTimeout(timeout);
        setVisible(false);            // скрытие при уходе
      };
    }, [])
  );

  return (
    <View
      style={[
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 6,
          paddingBottom: insets.bottom,
        },
        commonStyles.container,
      ]}
    >
      {visible && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(100)}
        >
        </Animated.View>
      )}
    </View>
  );
}
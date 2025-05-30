import { View } from 'react-native';
import ScheduleHeader from '@/components/ui/ScheduleHeader';
import { useTheme } from 'react-native-paper';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles } from '@/constants/styles';
import { useSettings } from '@/contexts/SettingsContext';
import React from 'react';

export default function ScheduleScreen() {
  const { resolvedTheme } = useSettings();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          backgroundColor: resolvedTheme === 'dark' ? '#000' : colors.background,
          paddingTop: 0,
          paddingBottom: insets.bottom,
        },
        commonStyles.container,
      ]}
    >
      <ScheduleHeader />
    </View>
  );
}
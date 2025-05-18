import { View, Text } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import { useSettings } from '@/contexts/SettingsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';
import { commonStyles } from '@/constants/styles';

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const { userName, is12HourFormat } = useSettings();
  const { t } = useLanguage();

  const [greeting, setGreeting] = useState(t.greetings.default);

  useEffect(() => {
    updateGreeting(new Date().getHours());
  }, [t, is12HourFormat]);

  const updateGreeting = (hour: number) => {
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
  };

  return (
    <View style={[commonStyles.centered, { backgroundColor: colors.background }]}>
      <Icon source="heart" size={80} color={colors.primary} />
      <Text style={[{ fontSize: 28, fontWeight: '300', color: colors.onBackground }]}>
        {greeting}
      </Text>
      {userName && (
        <Text style={[{ fontSize: 32, fontWeight: '600', color: colors.primary }]}>
          {userName}
        </Text>
      )}
    </View>
  );
}

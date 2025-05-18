import { View, Text, StyleSheet } from 'react-native';
import { useTheme, Icon } from 'react-native-paper';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';
import * as Localization from 'expo-localization';

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const { t, userName } = useLanguage();
  const [greeting, setGreeting] = useState(t.greetings.default);
  const [is12HourFormat, setIs12HourFormat] = useState(false);

  useEffect(() => {
    const localeTag = Localization.getLocales()[0]?.languageTag;

    const isUsing12HourClock = (localeTag?: string): boolean => {
      const testDate = new Date(Date.UTC(2020, 0, 1, 20)); // 20:00 UTC
      const formatter = new Intl.DateTimeFormat(localeTag, {
        hour: 'numeric',
        hour12: undefined,
        timeZone: 'UTC',
      });
      const parts = formatter.formatToParts(testDate);
      return parts.some(part => part.type === 'dayPeriod');
    };

    const is12 = isUsing12HourClock(localeTag);
    setIs12HourFormat(is12);
    updateGreeting(new Date().getHours());
  }, [t]);

  const updateGreeting = (hour: number) => {
    // Корректируем час для 12-часового формата, если нужно
    const displayHour = is12HourFormat ? hour % 12 || 12 : hour;

    if (hour >= 5 && hour < 12) {
      setGreeting(t.greetings.morning);
    } else if (hour >= 12 && hour < 18) {
      setGreeting(t.greetings.afternoon);
    } else if (hour >= 18 && hour < 23) {
      setGreeting(t.greetings.evening);
    } else {
      setGreeting(t.greetings.night);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Icon source="heart" size={80} color={colors.primary} />
      <Text style={[styles.greeting, { color: colors.onBackground }]}>
        {greeting}
      </Text>
      {userName && (
        <Text style={[styles.name, { color: colors.primary }]}>
          {userName}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '300',
  },
  name: {
    fontSize: 32,
    fontWeight: '600',
  },
});

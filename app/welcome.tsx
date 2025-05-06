import { View, Text, StyleSheet } from 'react-native';
import { useTheme, Icon } from 'react-native-paper';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const { t, userName } = useLanguage();
  const [greeting, setGreeting] = useState(t.greetings.default);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting(t.greetings.morning);
    } else if (hour >= 12 && hour < 18) {
      setGreeting(t.greetings.afternoon);
    } else if (hour >= 18 && hour < 23) {
      setGreeting(t.greetings.evening);
    } else {
      setGreeting(t.greetings.night);
    }
  }, [t]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Icon 
        source="heart" 
        size={80} 
        color={colors.primary} 
      />
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
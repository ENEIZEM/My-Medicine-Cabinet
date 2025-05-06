import { View, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ScheduleScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      <Text style={{ 
        color: colors.onBackground,
        fontSize: 20,
        fontWeight: '500'
      }}>
        {t.scheduleTitle}
      </Text>
    </View>
  );
}
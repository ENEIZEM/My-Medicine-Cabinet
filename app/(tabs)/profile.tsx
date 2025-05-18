import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, Text, TextInput } from 'react-native-paper';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import type { FC } from 'react';
import { commonStyles } from '@/constants/styles';

const ProfileScreen: FC = () => {
  const { colors } = useTheme();
  const { 
    t, 
    language, 
    setLanguage, 
    userName, 
    setUserName 
  } = useLanguage();
  const [name, setName] = useState(userName);

  const handleSaveName = () => {
    setUserName(name);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ru' ? 'en' : 'ru');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.onBackground }]}>
        {t.profileTitle}
      </Text>

      <TextInput
        style={[
          styles.input,
          { 
            color: colors.onBackground,
            borderBottomColor: colors.primary,
          }
        ]}
        placeholder={t.namePlaceholder}
        placeholderTextColor={colors.onSurfaceVariant}
        value={name}
        onChangeText={(text: string) => setName(text)}
        onSubmitEditing={handleSaveName}
      />

      <View style={styles.languageRow}>
        <Text style={{ color: colors.onSurface }}>{t.language}</Text>
        <TouchableOpacity onPress={toggleLanguage}>
          <Text style={{ color: colors.primary, fontWeight: '500' }}>
            {language === 'ru' ? 'Русский' : 'English'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 30,
  },
  input: {
    fontSize: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 30,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
});

export default ProfileScreen;
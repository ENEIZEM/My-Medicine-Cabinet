import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme, Switch } from 'react-native-paper'; // Добавляем Switch
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import type { FC } from 'react'; // Для явной типизации

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

  const handleLanguageChange = (val: boolean) => { // Явная типизация параметра
    setLanguage(val ? 'en' : 'ru');
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
        onChangeText={(text: string) => setName(text)} // Явная типизация
        onSubmitEditing={handleSaveName}
      />

      <View style={styles.languageContainer}>
        <Text style={{ color: colors.onSurface }}>
          {language === 'ru' ? 'Русский' : 'English'}
        </Text>
        <Switch
          value={language === 'en'}
          onValueChange={handleLanguageChange} // Используем типизированную функцию
          color={colors.primary}
        />
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
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
});

export default ProfileScreen;
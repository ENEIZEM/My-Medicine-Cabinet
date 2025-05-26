// app/(tabs)/profile.tsx
import { View, TouchableOpacity } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useState } from 'react';
import { commonStyles } from '@/constants/styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateOrder, DateSeparator } from '@/contexts/SettingsContext';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';




export default function ProfileScreen() {
  const { colors } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const {
    userName,
    setUserName,
    is12HourFormat,
    toggleTimeFormat,
    themeMode,
    setThemeMode,
    dateOrder, 
    setDateOrder, 
    dateSeparator, 
    setDateSeparator,
  } = useSettings();

  const [name, setName] = useState(userName);
  const insets = useSafeAreaInsets();

  const handleSaveName = () => {
    setUserName(name);
  };

  const toggleLang = () => {
    setLanguage(language === 'ru' ? 'en' : 'ru');
  };

  const cycleTheme = () => {
    const nextMode =
      themeMode === 'system' ? 'light' : themeMode === 'light' ? 'dark' : 'system';
    setThemeMode(nextMode);
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light':
        return t.themes.light;
      case 'dark':
        return t.themes.dark;
      default:
        return t.themes.system;
    }
  };

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
    }, commonStyles.container]}>

      <TextInput
        style={[
          commonStyles.input,
          { color: colors.onBackground, borderBottomColor: colors.primary, },
        ]}
        placeholder={t.namePlaceholder}
        placeholderTextColor={colors.onSurfaceVariant}
        value={name}
        onChangeText={setName}
        onBlur={handleSaveName}            // 👈 добавлено
        onSubmitEditing={handleSaveName}
      />
      <View style={commonStyles.row}>
        <Text style={{ color: colors.onSurface, fontSize: 16, }}>{t.language}</Text>
        <TouchableOpacity onPress={toggleLang}>
          <Text style={{ color: colors.primary, fontWeight: 'bold', }}>
            {language === 'ru' ? t.changeLang : t.changeLang}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={commonStyles.row}>
        <Text style={{ color: colors.onSurface, fontSize: 16, }}>{t.timeFormat}</Text>
        <TouchableOpacity onPress={toggleTimeFormat}>
          <Text style={{ color: colors.primary, fontWeight: 'bold', }}>
            {is12HourFormat ? '12h' : '24h'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={commonStyles.row}>
        <Text style={{ color: colors.onSurface, fontSize: 16,}}>{t.theme}</Text>
        <TouchableOpacity onPress={cycleTheme}>
          <Text style={{ color: colors.primary, fontWeight: 'bold', }}>
            {getThemeLabel()}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={commonStyles.row}>
        <Text style={{ color: colors.onSurface, fontSize: 16,}}>
          {t.dateFormatOrder}
        </Text>
        <TouchableOpacity onPress={() => {
          const orders: DateOrder[] = ['dmy', 'ymd', 'mdy', 'ydm'];
          const next = orders[(orders.indexOf(dateOrder) + 1) % orders.length];
          setDateOrder(next);
        }}>
          <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>
            {t.dateFormats[dateOrder]}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={commonStyles.row}>
        <Text style={{ color: colors.onSurface, fontSize: 16,}}>
          {t.dateSeparator}
        </Text>
        <TouchableOpacity onPress={() => {
          const separators: DateSeparator[] = ['.', '-', ' '];
          const next = separators[(separators.indexOf(dateSeparator) + 1) % separators.length];
          setDateSeparator(next);
        }}>
          <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>
            {{
              '.': t.separatorDot,
              '-': t.separatorDash,
              ' ': t.separatorSpace
            }[dateSeparator]}
          </Text>
        </TouchableOpacity>
      </View>

    </Animated.View>
  );
}
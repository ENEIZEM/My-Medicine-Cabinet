import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Text, TextInput, useTheme, Divider } from 'react-native-paper';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useState } from 'react';
import { commonStyles } from '@/constants/styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateOrder, DateSeparator } from '@/contexts/SettingsContext';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
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
  const [visible, setVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setVisible(false);
      const timeout = setTimeout(() => setVisible(true), 10);
      return () => {
        clearTimeout(timeout);
        setVisible(false);
      };
    }, [])
  );

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

  return (
    <View
      style={[
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        commonStyles.container,
      ]}
    >
      {visible && (
        <Animated.View 
          entering={FadeIn.duration(200)} 
          exiting={FadeOut.duration(100)}
          style={{ flex: 1 }}
        >
          {/* Поле ввода имени */}
         <View
            style={{
              height: 68,
              borderBottomWidth: 1,
              borderBottomColor: colors.outline,
              justifyContent: 'center',
              paddingHorizontal: 16,
              backgroundColor: colors.background,
              marginHorizontal: -16,
            }}
          >
          <View
            style={{
              backgroundColor: colors.surfaceVariant,
              borderRadius: 24,
              height: 44,
              justifyContent: 'center',
            }}
          >
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t.namePlaceholder}
              mode="flat"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              style={{
                height: 44,
                fontSize: 16,
                paddingVertical: 0,
                textAlign: 'center',
                backgroundColor: 'transparent',
              }}
              onBlur={handleSaveName}
              onSubmitEditing={handleSaveName}
            />
            <TextInput.Icon
              icon="account"
              style={{
                position: 'absolute',
                left: 12,
              }}
            />
          </View>
          </View>

          {/* ScrollView для настроек */}
          <ScrollView
            contentContainerStyle={{
              paddingBottom: 72,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Язык */}
            <View style={[
              commonStyles.row, 
              { 
                padding: 16,
                backgroundColor: colors.surface,
                borderRadius: 12,
              }
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput.Icon icon="translate" size={20} color={colors.onSurface} />
                <Text style={{ 
                  color: colors.onSurface, 
                  fontSize: 16,
                  marginLeft: 28,
                }}>
                  {t.language}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={toggleLang}
                style={{
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ 
                  color: colors.primary, 
                  fontWeight: 'bold', 
                  fontSize: 16
                }}>
                  {language === 'ru' ? t.changeLang : t.changeLang}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Формат времени */}
            <View style={[
              commonStyles.row, 
              { 
                padding: 16,
                backgroundColor: colors.surface,
                borderRadius: 12,
              }
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput.Icon icon="clock-outline" size={20} color={colors.onSurface} />
                <Text style={{ 
                  color: colors.onSurface, 
                  fontSize: 16,
                  marginLeft: 28,
                }}>
                  {t.timeFormat}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={toggleTimeFormat}
                style={{
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ 
                  color: colors.primary, 
                  fontWeight: 'bold', 
                  fontSize: 16
                }}>
                  {is12HourFormat ? t.times12 : t.times24}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Тема */}
            <View style={[
              commonStyles.row, 
              { 
                padding: 16,
                backgroundColor: colors.surface,
                borderRadius: 12,
              }
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput.Icon 
                  icon={themeMode === 'dark' ? 'weather-night' : themeMode === 'light' ? 'weather-sunny' : 'theme-light-dark'} 
                  size={20} 
                  color={colors.onSurface} 
                />
                <Text style={{ 
                  color: colors.onSurface, 
                  fontSize: 16,
                  marginLeft: 28,
                }}>
                  {t.theme}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={cycleTheme}
                style={{
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ 
                  color: colors.primary, 
                  fontWeight: 'bold', 
                  fontSize: 16
                }}>
                  {getThemeLabel()}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Формат даты */}
            <View style={[
              commonStyles.row, 
              { 
                padding: 16,
                backgroundColor: colors.surface,
                borderRadius: 12,
              }
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput.Icon icon="calendar" size={20} color={colors.onSurface} />
                <Text style={{ 
                  color: colors.onSurface, 
                  fontSize: 16,
                  marginLeft: 28,
                }}>
                  {t.dateFormatOrder}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => {
                  const orders: DateOrder[] = ['dmy', 'ymd', 'mdy', 'ydm'];
                  const next = orders[(orders.indexOf(dateOrder) + 1) % orders.length];
                  setDateOrder(next);
                }}
                style={{
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ 
                  color: colors.primary, 
                  fontWeight: 'bold', 
                  fontSize: 16
                }}>
                  {t.dateFormats[dateOrder]}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Разделитель даты */}
            <View style={[
              commonStyles.row, 
              { 
                padding: 16,
                backgroundColor: colors.surface,
                borderRadius: 12,
              }
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput.Icon icon="minus" size={20} color={colors.onSurface} />
                <Text style={{ 
                  color: colors.onSurface, 
                  fontSize: 16,
                  marginLeft: 28,
                }}>
                  {t.dateSeparator}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => {
                  const separators: DateSeparator[] = ['.', '-', ' '];
                  const next = separators[(separators.indexOf(dateSeparator) + 1) % separators.length];
                  setDateSeparator(next);
                }}
                style={{
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ 
                  color: colors.primary, 
                  fontWeight: 'bold', 
                  fontSize: 16
                }}>
                  {{
                    '.': t.separatorDot,
                    '-': t.separatorDash,
                    ' ': t.separatorSpace,
                  }[dateSeparator]}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}
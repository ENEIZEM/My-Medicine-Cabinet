import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguage } from '@/contexts/LanguageContext';
import { DateOrder, DateSeparator, useSettings } from '@/contexts/SettingsContext';
import { commonStyles } from '@/constants/styles';
import { BlurView } from 'expo-blur';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage } = useLanguage();
  const {
    userName, setUserName,
    is12HourFormat, toggleTimeFormat,
    themeMode, setThemeMode,
    dateOrder, setDateOrder,
    dateSeparator, setDateSeparator,
    resolvedTheme,
  } = useSettings();

  const [name, setName] = useState(userName);

  const handleSaveName = () => setUserName(name);

  const cycleTheme = () =>
    setThemeMode(themeMode === 'system' ? 'light' : themeMode === 'light' ? 'dark' : 'system');

  const getThemeLabel = () =>
    themeMode === 'light' ? t.themes.light :
    themeMode === 'dark' ? t.themes.dark : t.themes.system;

  const toggleLang = () => {
    setLanguage(language === 'ru' ? 'en' : 'ru');
  };

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
      {/* Поле имени */}
      <BlurView
        intensity={50}
        tint={resolvedTheme === 'dark' ? 'dark' : 'light'}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 68 + insets.top,
          justifyContent: 'center',
          paddingHorizontal: 16,
          zIndex: 10,
        }}
      >
        <View style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: resolvedTheme === 'dark' ? 'rgba(80, 75, 105, 0.15)' : 'rgba(180, 175, 195, 0.15)',
        }} />
        <View
          style={{
            backgroundColor: resolvedTheme === 'dark' ? 'rgba(240, 227, 253, 0.15)' : 'rgba(95, 48, 128, 0.15)',
            borderRadius: 8,
            height: 44,
            top: insets.top/2,
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
            onBlur={handleSaveName}
            onSubmitEditing={handleSaveName}
            style={{
              top: 0,
              height: 44,
              fontSize: 18,
              textAlign: 'center',
              backgroundColor: 'transparent',
            }}
          />
          <TextInput.Icon icon="account" size={26} style={{ position: 'absolute', left: 12 }} />
        </View>
      </BlurView>

          {/* ScrollView для настроек */}
          <ScrollView
            contentContainerStyle={{
              paddingBottom: 72,
              paddingTop: 80 + insets.top
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Язык */}
            <View style={[
              commonStyles.row, 
              {
                borderBottomWidth: 0,
                marginBottom: 10,
                padding: 16,
                backgroundColor: colors.surface,
                borderRadius: 8,
                elevation: 2, // Android
                shadowColor: '#000', // iOS
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
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
                  backgroundColor: resolvedTheme === 'dark' ? 'rgb(54, 51, 59)' : 'rgb(237, 225, 245)',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
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
                borderBottomWidth: 0,
                marginBottom: 10,
                padding: 16,
                backgroundColor: colors.surface,
                borderRadius: 8,
                elevation: 2, // Android
                shadowColor: '#000', // iOS
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
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
                  backgroundColor: resolvedTheme === 'dark' ? 'rgb(54, 51, 59)' : 'rgb(237, 225, 245)',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
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
                borderBottomWidth: 0,
                marginBottom: 10,
                padding: 16,
                backgroundColor: colors.surface,
                borderRadius: 8,
                elevation: 2, // Android
                shadowColor: '#000', // iOS
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
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
                  backgroundColor: resolvedTheme === 'dark' ? 'rgb(54, 51, 59)' : 'rgb(237, 225, 245)',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
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
                borderBottomWidth: 0,
                marginBottom: 10,
                padding: 16,
                backgroundColor: colors.surface,
                borderRadius: 8,
                elevation: 2, // Android
                shadowColor: '#000', // iOS
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
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
                  backgroundColor: resolvedTheme === 'dark' ? 'rgb(54, 51, 59)' : 'rgb(237, 225, 245)',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
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
                borderBottomWidth: 0,
                marginBottom: 10,
                padding: 16,
                backgroundColor: colors.surface,
                borderRadius: 8,
                elevation: 2, // Android
                shadowColor: '#000', // iOS
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
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
                  backgroundColor: resolvedTheme === 'dark' ? 'rgb(54, 51, 59)' : 'rgb(237, 225, 245)',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
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
    </View>
  );
}
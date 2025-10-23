import React, { useRef, useState } from 'react';
import { View, ScrollView, TextInput as RNTextInput } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@/contexts/SettingsContext';
import AppTile from '@/components/AppTile';
import CheckboxButtonGroup from '@/components/CheckboxButton';
import {
  IconAccount,
  IconLanguage,
  IconTheme,
  IconHome,
  IconClock,
  IconList,
  IconSeparator,
} from '@/constants/icons';

// импортируем наш новый Header
import Header from '@/components/Header';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    t, language, setLanguage,
    userName, setUserName,
    is12HourFormat, toggleTimeFormat,
    themeMode, setThemeMode,
    dateOrder, setDateOrder,
    dateSeparator, setDateSeparator,
    homeTab, setHomeTab
  } = useSettings();

  const [name, setName] = useState(userName);
  const handleSaveName = () => setUserName(name);
  const searchInputRef = useRef<RNTextInput | null>(null);

  return (
    <View
      style={{
        backgroundColor: colors.background,
        paddingTop: 0,
        paddingBottom: insets.bottom,
        paddingHorizontal: 16,
        flex: 1,
      }}
    >
      {/* Используем новый Header с инпутом */}
      <Header
        hasInput
        inputRef={searchInputRef}
        value={name}
        onChangeText={setName}
        onSubmitEditing={handleSaveName}
        onBlur={handleSaveName}
        placeholder={t.namePlaceholder}
        icon={IconAccount}
        iconProps={{ width: 28, height: 28 }}
      />

      {/* ScrollView для настроек */}
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 68,
          // синхронизируем верхний отступ контента с высотой Header
          paddingTop: 76 + insets.top,
          paddingHorizontal: 0,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Персонализация*/}
        <Text style={{ marginLeft: 16, marginVertical: 6, fontSize: 17, fontWeight: '700', color: colors.onSurfaceVariant }}>
          {t.subtitle.personalization}
        </Text>

        {/* Язык */}
        <AppTile
          title={t.language}
          icon={IconLanguage}
          iconColor={colors.primary}
          backgroundColor={colors.surface}
          contentGap={8}
          style={{ marginBottom: 8 }}
        >
          <CheckboxButtonGroup
            options={[
              { value: 'ru', label: t.lang.ru },
              { value: 'en', label: t.lang.en },
            ]}
            value={language}
            onChange={setLanguage}
            single
            columns={2}
            marginBottom={12}
          />
        </AppTile>

        {/* Тема */}
        <AppTile
          title={t.theme}
          icon={IconTheme}
          iconColor={colors.primary}
          backgroundColor={colors.surface}
          contentGap={8}
          style={{ marginBottom: 8 }}
        >
          <CheckboxButtonGroup
            options={[
              { value: 'light', label: t.themes.light },
              { value: 'dark', label: t.themes.dark },
              { value: 'system', label: t.themes.system },
            ]}
            value={themeMode}
            onChange={setThemeMode}
            single
            columns={2}
            marginBottom={12}
          />
        </AppTile>

        {/* Домашняя вкладка */}
        <AppTile
          title={t.homeTab}
          icon={IconHome}
          iconColor={colors.primary}
          backgroundColor={colors.surface}
          contentGap={8}
          style={{ marginBottom: 8 }}
        >
          <CheckboxButtonGroup
            options={[
              { value: 'schedule', label: t.scheduleTitle },
              { value: 'medicine', label: t.medicineTitle },
            ]}
            value={homeTab}
            onChange={setHomeTab}
            single
            columns={2}
            marginBottom={12}
          />
        </AppTile>

        {/* Дата и время */}
        <Text style={{ marginLeft: 16, marginVertical: 6, fontSize: 17, fontWeight: '700', color: colors.onSurfaceVariant }}>
          {t.subtitle.dateTime}
        </Text>

        {/* Формат времени */}
        <AppTile
          title={t.timeFormat}
          icon={IconClock}
          iconColor={colors.primary}
          backgroundColor={colors.surface}
          contentGap={8}
          style={{ marginBottom: 8 }}
        >
          <CheckboxButtonGroup
            options={[
              { value: '12h', label: t.times12 },
              { value: '24h', label: t.times24 },
            ]}
            value={is12HourFormat ? '12h' : '24h'}
            onChange={() => toggleTimeFormat()}
            single
            columns={2}
            marginBottom={12}
          />
        </AppTile>

        {/* Порядок даты */}
        <AppTile
          title={t.dateFormatOrder}
          icon={IconList}
          iconColor={colors.primary}
          backgroundColor={colors.surface}
          contentGap={8}
          style={{ marginBottom: 8 }}
        >
          <CheckboxButtonGroup
            options={[
              { value: 'dmy', label: t.dateFormats.dmy.replace(/\./g, dateSeparator) },
              { value: 'ymd', label: t.dateFormats.ymd.replace(/\./g, dateSeparator) },
              { value: 'mdy', label: t.dateFormats.mdy.replace(/\./g, dateSeparator) },
              { value: 'ydm', label: t.dateFormats.ydm.replace(/\./g, dateSeparator) },
            ]}
            value={dateOrder}
            onChange={setDateOrder}
            single
            columns={2}
            marginBottom={12}
          />
        </AppTile>

        {/* Разделитель даты */}
        <AppTile
          title={t.dateSeparator}
          icon={IconSeparator}
          iconColor={colors.primary}
          backgroundColor={colors.surface}
          contentGap={8}
          style={{ marginBottom: 8 }}
        >
          <CheckboxButtonGroup
            options={[
              { value: '.', label: t.separatorDot },
              { value: '-', label: t.separatorDash },
              { value: ' ', label: t.separatorSpace },
            ]}
            value={dateSeparator}
            onChange={setDateSeparator}
            single
            columns={3}
            marginBottom={12}
          />
        </AppTile>
      </ScrollView>
    </View>
  );
}

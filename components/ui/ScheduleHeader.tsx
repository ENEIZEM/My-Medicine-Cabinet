import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Platform, Modal } from 'react-native';
import { Text, IconButton, useTheme, Portal, Dialog, Button } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSettings } from '@/contexts/SettingsContext';

export default function ScheduleHeader() {
  const { t, language } = useLanguage();
  const { is12HourFormat, dateOrder, dateSeparator } = useSettings();
  const theme = useTheme();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  const getFormattedDate = (date: Date): string => {
    const day = date.getDate();
    const year = date.getFullYear();
    const monthIndex = date.getMonth();

    const months: Record<string, string[]> = {
      ru: [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
      ],
      en: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]
    };

    const monthWord = months[language][monthIndex];

    return `${day} ${monthWord} ${year}`;
  };

  const getFormattedTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    if (is12HourFormat) {
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes} ${period}`;
    } else {
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
  };

  useEffect(() => {
    const updateTime = () => setCurrentTime(getFormattedTime(new Date()));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [is12HourFormat]);

return (
  <>
    <View
      style={{
        height: 68,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline,
        justifyContent: 'center',
        paddingHorizontal: 16,
        backgroundColor: theme.colors.background,
        marginHorizontal: -16,
      }}
    >
      <View
        style={{
          backgroundColor: theme.colors.surfaceVariant,
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          borderRadius: 8,
        }}
      >
        {/* Время слева */}
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.onSurface }}>
          {currentTime}
        </Text>

        {/* Дата + иконка — теперь вся зона кликабельна */}
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          onTouchEnd={() => setShowDialog(true)} // 👈 при нажатии на всю область
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.onSurface }}>
            {getFormattedDate(selectedDate)}
          </Text>
          <IconButton
            icon="calendar"
            size={26}
            onPress={() => setShowDialog(true)}
            style={{ margin: 0 }}
          />
        </View>
      </View>
    </View>

{Platform.OS === 'android' && showDialog && (
  <DateTimePicker
    value={selectedDate}
    mode="date"
    display="default"
    onChange={(event, date) => {
      setShowDialog(false);
      if (date) setSelectedDate(date);
    }}
    locale={language === 'ru' ? 'ru-RU' : 'en-US'}
  />
)}

{Platform.OS === 'ios' && (
  <Modal visible={showDialog} transparent animationType="fade">
    <View
      style={{
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
      }}
    >
      <View
        style={{
          backgroundColor: theme.colors.surface,
          paddingVertical: 16,
          paddingHorizontal: 24,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          alignItems: 'center', // центрируем всё внутри
        }}
      >
        <View style={{ width: '100%', alignItems: 'center' }}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="spinner"
            onChange={(event, date) => {
              if (event.type === 'set' && date) {
                setSelectedDate(date);
              }
            }}
            locale={language === 'ru' ? 'ru-RU' : 'en-US'}
            style={{ width: 320 }} // фиксированная ширина = центрирование
          />
        </View>

        <Button onPress={() => setShowDialog(false)}>
          <Text style={{ fontSize: 16 }}>{t.actions.close}</Text>
        </Button>
      </View>
    </View>
  </Modal>
)}
  </>
);
}

import React, { useEffect, useState } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { Text, Icon, useTheme, Button, TouchableRipple } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import Modal from 'react-native-modal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSettings } from '@/contexts/SettingsContext';
import { BlurView } from 'expo-blur';
import CustomDatePickerModal from '@/components/ui/CustomDatePickerModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function ScheduleHeader() {
  const { t, language } = useLanguage();
  const { is12HourFormat, resolvedTheme } = useSettings();
  const theme = useTheme();
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  const getFormattedDate = (date: Date): string => {
    const day = date.getDate();
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const months = language === 'ru'
      ? ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${day} ${months[monthIndex]} ${year}`;
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
          justifyContent: 'space-between',
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
        }}
      >
      { /*Время слева*/ }
      <Text style={{ fontSize: 18, color: theme.colors.onSurface, }}>
        {currentTime}
      </Text>
          { /*Дата + иконка — одна кнопка с ripple*/ }
          <TouchableRipple
            onPress={() => {
              if (Platform.OS === 'android') {
                setShowCustomPicker(true);
              } else {
                setTempDate(selectedDate);
                setShowDialog(true); // это оставляем для iOS
              }
            }}
            borderless
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingLeft: 8,
              paddingRight: 0, // убираем внутренний отступ
              marginRight: -1, // выдвигаем иконку ближе к краю
              borderRadius: 8,
            }}
          >
            <>
              <Text
                style={{
                  fontSize: 18,
                  color: theme.colors.onSurface,
                  marginRight: 4,
                }}
              >
                {getFormattedDate(selectedDate)}
              </Text>
              <Icon source="calendar" size={26} color={theme.colors.onSurface} />
            </>
          </TouchableRipple>
        </View>
      </BlurView>

      {/* iOS модалка */}
      {Platform.OS === 'ios' && (
        <Modal
          isVisible={showDialog}
          animationIn="slideInUp"
          animationOut="slideOutDown"
          backdropTransitionOutTiming={0}
          onBackdropPress={() => setShowDialog(false)}
          onBackButtonPress={() => setShowDialog(false)}
          useNativeDriver
          style={{ justifyContent: 'flex-end', margin: 0 }}
        >
          <View
            style={{
              backgroundColor: theme.colors.surface,
              paddingVertical: 16,
              paddingHorizontal: 24,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              alignItems: 'center',
            }}
          >
            <View style={{ width: '100%', alignItems: 'center' }}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={(event, date) => {
                  if (event.type === 'set' && date) setTempDate(date);
                }}
                locale={language === 'ru' ? 'ru-RU' : 'en-US'}
                themeVariant={resolvedTheme === 'dark' ? 'dark' : 'light'}
                textColor={theme.colors.onBackground}
                style={{ width: 320 }}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, width: '100%' }}>
              <Button
                mode="outlined"
                onPress={() => setShowDialog(false)}
                style={{ flex: 1, marginRight: 8 }}
                labelStyle={{ fontSize: 16 }}
              >
                {t.actions.cancel}
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  setSelectedDate(tempDate);
                  setShowDialog(false);
                }}
                style={{ flex: 1, marginLeft: 8 }}
                labelStyle={{ fontSize: 16 }}
              >
                {t.actions.select}
              </Button>
            </View>
          </View>
        </Modal>
      )}

  <CustomDatePickerModal
          visible={showCustomPicker}
          initialDate={selectedDate}
          onDismiss={() => setShowCustomPicker(false)}
          onConfirm={(date) => {
            setSelectedDate(date);
            setShowCustomPicker(false);
          }}
        />
    </>
  );
}

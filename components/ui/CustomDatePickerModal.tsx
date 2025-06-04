// components/ui/CustomDatePickerModal.tsx
import React, { useEffect, useState } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import Modal from 'react-native-modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import 'dayjs/locale/en';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import { useLanguage } from '@/contexts/LanguageContext';
import { useSettings } from '@/contexts/SettingsContext';

dayjs.extend(localizedFormat);

interface Props {
  visible: boolean;
  initialDate?: Date;
  onDismiss: () => void;
  onConfirm: (date: Date) => void;
}

export default function CustomDatePickerModal({
  visible,
  initialDate = new Date(),
  onDismiss,
  onConfirm,
}: Props) {
  const { language } = useLanguage();
  const { resolvedTheme } = useSettings();
  const { colors } = useTheme();

  const [selectedDate, setSelectedDate] = useState(initialDate);

  useEffect(() => {
    setSelectedDate(initialDate);
  }, [initialDate]);

  const formatted = dayjs(selectedDate)
    .locale(language)
    .format('LL'); // e.g. "4 июня 2025 г." или "June 4, 2025"

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onDismiss}
      onBackButtonPress={onDismiss}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={styles.modal}
      useNativeDriver
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.label, { color: colors.onBackground }]}>
          {formatted}
        </Text>

        {Platform.OS === 'ios' ? (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="spinner"
            locale={language === 'ru' ? 'ru-RU' : 'en-US'}
            themeVariant={resolvedTheme === 'dark' ? 'dark' : 'light'}
            onChange={(event, date) => date && setSelectedDate(date)}
          />
        ) : null}

        {Platform.OS === 'android' ? (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="spinner"
            themeVariant={resolvedTheme === 'dark' ? 'dark' : 'light'}
            locale={language === 'ru' ? 'ru-RU' : 'en-US'}
            onChange={(event, date) => {
              if (event.type === 'set' && date) {
                onConfirm(date);
              }
              onDismiss();
            }}
          />
        ) : (
          <View style={styles.buttons}>
            <Button mode="outlined" onPress={onDismiss}>
              Cancel
            </Button>
            <Button mode="contained" onPress={() => onConfirm(selectedDate)}>
              OK
            </Button>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  container: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  label: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});

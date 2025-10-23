import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSettings } from '@/contexts/SettingsContext';
import BaseModal from 'app/(modals)/base-modal';
import AppTile from '@/components/AppTile';
import BaseTextInput from '@/components/BaseTextInput';
import BaseSlider from '@/components/BaseSlider';
import SegmentedPicker from '@/components/SegmentedPicker';

type Props = {
  title: string;
  visible: boolean;
  time: Date;
  onCancel: () => void;
  onChange: (time: Date) => void;
  force12HourFormat?: boolean | null;
};

export default function TimeSelector({ 
  title, 
  visible, 
  time, 
  onCancel, 
  onChange,
  force12HourFormat = null 
}: Props) {
  const { is12HourFormat: settings12HourFormat, t } = useSettings();
  const { colors } = useTheme();
  const initialTimeSet = useRef(false);

  const is12HourFormat = force12HourFormat !== null 
    ? force12HourFormat 
    : settings12HourFormat;

  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedAMPM, setSelectedAMPM] = useState<'AM' | 'PM'>('AM');
  const [sliderKey, setSliderKey] = useState(0);

  // Функция для преобразования 24-часового формата в 12-часовой
  const convertTo12HourFormat = (hour24: number) => {
    if (hour24 === 0) return 12;
    if (hour24 > 12) return hour24 - 12;
    return hour24;
  };

  // Функция для преобразования 12-часового формата в 24-часовой
  const convertTo24HourFormat = (hour12: number, ampm: 'AM' | 'PM') => {
    if (ampm === 'AM') {
      return hour12 === 12 ? 0 : hour12;
    } else {
      return hour12 === 12 ? 12 : hour12 + 12;
    }
  };

  useEffect(() => {
    if (visible && !initialTimeSet.current) {
      const hour = time.getHours();
      const minute = time.getMinutes();
      
      // Принудительно сбрасываем слайдеры
      setSelectedHour(-1);
      setSelectedMinute(-1);
      
      // На следующем фрейме устанавливаем правильные значения
      setTimeout(() => {
        setSelectedMinute(minute);
        
        if (is12HourFormat) {
          // Для 12-часового формата
          const hour12 = convertTo12HourFormat(hour);
          setSelectedHour(hour12);
          setSelectedAMPM(hour >= 12 ? 'PM' : 'AM');
        } else {
          // Для 24-часового формата используем полный час
          setSelectedHour(hour);
          setSelectedAMPM(hour >= 12 ? 'PM' : 'AM');
        }
        
        setSliderKey(prev => prev + 1);
      }, 10);

      initialTimeSet.current = true;
    }
  }, [visible, time, is12HourFormat]);

  useEffect(() => {
    if (!visible) {
      initialTimeSet.current = false;
    }
  }, [visible]);

  const handleHourChange = (hour: number) => {
    const roundedHour = Math.round(hour);
    setSelectedHour(roundedHour);
    
    // Автоматически переключаем AM/PM если нужно
    if (is12HourFormat && roundedHour === 12) {
      setSelectedAMPM('PM');
    }
  };

  const handleMinuteChange = (minute: number) => {
    setSelectedMinute(Math.round(minute));
  };

  const handleHourTextChange = (text: string) => {
    const numValue = parseInt(text, 10);
    if (!isNaN(numValue)) {
      // Ограничиваем значение в зависимости от формата
      const maxHour = is12HourFormat ? 12 : 23;
      const minHour = is12HourFormat ? 1 : 0;
      const clampedValue = Math.min(Math.max(numValue, minHour), maxHour);
      setSelectedHour(clampedValue);
    } else if (text === '') {
      const minHour = is12HourFormat ? 1 : 0;
      setSelectedHour(minHour);
    }
  };

  const handleMinuteTextChange = (text: string) => {
    const numValue = parseInt(text, 10);
    if (!isNaN(numValue)) {
      const clampedValue = Math.min(Math.max(numValue, 0), 59);
      setSelectedMinute(clampedValue);
    } else if (text === '') {
      setSelectedMinute(0);
    }
  };

  const handleAMPMChange = (value: string) => {
    setSelectedAMPM(value as 'AM' | 'PM');
  };

  const handleSelect = () => {
    let finalHour = selectedHour;
    
    if (is12HourFormat) {
      // Преобразуем 12-часовой формат в 24-часовой
      finalHour = convertTo24HourFormat(selectedHour, selectedAMPM);
    }
    
    const selectedTime = new Date(time);
    selectedTime.setHours(finalHour, selectedMinute, 0, 0);
    onChange(selectedTime);
    onCancel();
  };

  const getDisplayHour = () => {
    return selectedHour < 0 ? '00' : selectedHour.toString().padStart(2, '0');
  };

  const getDisplayMinute = () => {
    return selectedMinute < 0 ? '00' : selectedMinute.toString().padStart(2, '0');
  };

  return (
    <BaseModal 
      visible={visible}
      onClose={onCancel}
      title={title}
      leftButtonText={t.actions.cancel}
      onLeftButtonPress={onCancel}
      rightButtonText={t.actions.select}
      onRightButtonPress={handleSelect}
    >
      <View style={styles.container}>
        <AppTile
          backgroundColor={colors.surface}
          style={{marginVertical: 8}}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.timeInputContainer}>
              <BaseTextInput
                value={getDisplayHour()}
                width={'15%'}
                keyboardType="numeric"
                borderColor={colors.outline}
                maxDigits={2}
                minValue={is12HourFormat ? 1 : 0}
                maxValue={is12HourFormat ? 12 : 23}
                onChangeText={handleHourTextChange}
                returnKeyType="done"
              />
              <Text style={[styles.timeSeparator, { color: colors.onSurfaceVariant }]}>
                {':'}
              </Text>
              <BaseTextInput
                value={getDisplayMinute()}
                width={'15%'}
                keyboardType="numeric"
                borderColor={colors.outline}
                maxDigits={2}
                minValue={0}
                maxValue={59}
                onChangeText={handleMinuteTextChange}
                returnKeyType="done"
              />
            </View>
          </TouchableWithoutFeedback>

          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
            {t.time.hours.hours}
          </Text>

          {/* Два разных слайдера для часов в зависимости от формата */}
            <BaseSlider
              key={is12HourFormat ? `hour-12-${sliderKey}` : `hour-24-${sliderKey}`}
              value={selectedHour}
              min={is12HourFormat ? 1 : 0}
              max={is12HourFormat ? 12 : 23}
              onValueChange={handleHourChange}
              marginBottom={4}
            />

          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
            {t.time.minutes}
          </Text>
          <BaseSlider
            key={`minute-${sliderKey}`}
            value={selectedMinute}
            min={0}
            max={59}
            onValueChange={handleMinuteChange}
            marginBottom={-12}
          />

          {is12HourFormat && (
            <View style={styles.ampmContainer}>
              <SegmentedPicker
                options={[
                  { value: 'AM', label: 'AM' },
                  { value: 'PM', label: 'PM' },
                ]}
                value={selectedAMPM}
                onChange={handleAMPMChange}
              />
            </View>
          )}
        </AppTile>
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timeSeparator: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  ampmContainer: {
    marginTop: 20,
    width: '50%',
    marginHorizontal: '25%',
  },
});
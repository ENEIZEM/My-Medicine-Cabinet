import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Text as RNText,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSettings } from '@/contexts/SettingsContext';
import BaseModal from 'app/(modals)/base-modal';
import AppTile from '@/components/AppTile';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';


const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const YEARS_START = 1970;
const YEARS_COUNT = 50;
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_PADDING = 16;
const TEXT_PADDING = 16;
const TOTAL_SIDE_PADDING = SCREEN_PADDING + TEXT_PADDING;

const COLUMN_WIDTHS = {
  d: 94,
  m: 120,
  y: 72
};

type Props = {
  title: string;
  visible: boolean;
  date: Date;
  onCancel: () => void;
  onChange: (date: Date) => void;
};

function formatDateLocalized(date: Date, dateOrder: string, months: string[], separator: string): string {
  const day = date.getDate().toString().padStart(2, '0');
  const monthIndex = date.getMonth();
  const year = date.getFullYear().toString();
  const monthNumber = (monthIndex + 1).toString().padStart(2, '0');

  const parts: Record<string, string> = {
    d: day,
    m: months[monthIndex],
    y: year,
    M: monthNumber,
  };

  const orderForString = dateOrder.replace('m', 'M');
  return orderForString.split('').map((key) => parts[key]).join(separator);
}

function formatDateWithWeekday(date: Date, dateOrder: string, months: string[], separator: string, weekdays: string[]): string {
  const weekdayName = weekdays[date.getDay()];
  const formattedDate = formatDateLocalized(date, dateOrder, months, separator);
  return `${formattedDate} (${weekdayName})`;
}

function getWeekdayForDate(year: number, month: number, day: number): number {
  return new Date(year, month, day).getDay();
}

export default function DateSelector({ title, visible, date, onCancel, onChange }: Props) {
  const { dateOrder, dateSeparator, t, language } = useSettings();
  const { colors } = useTheme();

  const usesGenitive = dateOrder.indexOf('d') < dateOrder.indexOf('m');
  const months = language === 'ru'
    ? usesGenitive ? t.date.monthsGen : t.date.months
    : t.date.months;

  // Дни недели (сокращенные)
  const weekdaysShort = t.date.weekdaysShort;

  const today = new Date();
  const currentYear = today.getFullYear();
  const years = useMemo(() => (
    Array.from({ length: YEARS_COUNT + (currentYear - YEARS_START) + 1 }, (_, i) => YEARS_START + i)
  ), [currentYear]);

  const [selectedDay, setSelectedDay] = useState(date.getDate());
  const [selectedMonth, setSelectedMonth] = useState(date.getMonth());
  const [selectedYear, setSelectedYear] = useState(date.getFullYear());
  const [showTodayButton, setShowTodayButton] = useState(false);
  
  const todayButtonHeight = useSharedValue(0);
  const todayButtonOpacity = useSharedValue(0);

  const dayScrollRef = useRef<ScrollView>(null!);
  const monthScrollRef = useRef<ScrollView>(null!);
  const yearScrollRef = useRef<ScrollView>(null!);

  const daysInMonth = useMemo(() => (
    new Date(selectedYear, selectedMonth + 1, 0).getDate()
  ), [selectedYear, selectedMonth]);

  const days = useMemo(() => (
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ), [daysInMonth]);

  // Создаем массив дней с днями недели
  const daysWithWeekdays = useMemo(() => (
    days.map(day => {
      const weekdayIndex = getWeekdayForDate(selectedYear, selectedMonth, day);
      const weekdayShort = weekdaysShort[weekdayIndex];
      return `${day} (${weekdayShort})`;
    })
  ), [days, selectedYear, selectedMonth, weekdaysShort]);

  const totalColumnsWidth = COLUMN_WIDTHS.d + COLUMN_WIDTHS.m + COLUMN_WIDTHS.y;
  const availableGapSpace = SCREEN_WIDTH - 2 * TOTAL_SIDE_PADDING - totalColumnsWidth;
  const columnGap = availableGapSpace / 2;

  const todayButtonAnimatedStyle = useAnimatedStyle(() => ({
    height: todayButtonHeight.value,
    opacity: todayButtonOpacity.value,
    marginTop: 0,
    overflow: 'hidden',
  }));

  useEffect(() => {
    const isTodaySelected = 
      selectedDay === today.getDate() && 
      selectedMonth === today.getMonth() && 
      selectedYear === today.getFullYear();
    
    if (isTodaySelected && showTodayButton) {
      todayButtonHeight.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
      todayButtonOpacity.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      }, () => {
        scheduleOnRN(setShowTodayButton, false);
      });
    } else if (!isTodaySelected && !showTodayButton) {
      setShowTodayButton(true);
      todayButtonHeight.value = withTiming(60, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
      todayButtonOpacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [selectedDay, selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedDay > daysInMonth) {
      const newDay = daysInMonth;
      setSelectedDay(newDay);
      setTimeout(() => {
        scrollToIndex(dayScrollRef, newDay - 1);
      }, 50);
    }
  }, [selectedMonth, selectedYear]);

  const scrollToIndex = (ref: React.RefObject<ScrollView>, index: number) => {
    ref.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
  };

  const handleMomentumScroll = (
    setFn: (i: number) => void,
    list: any[]
  ) => (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.min(Math.max(Math.round(y / ITEM_HEIGHT), 0), list.length - 1);
    setFn(index);
  };

  useEffect(() => {
    if (visible) {
      setSelectedDay(date.getDate());
      setSelectedMonth(date.getMonth());
      setSelectedYear(date.getFullYear());
      setTimeout(() => {
        scrollToIndex(dayScrollRef, date.getDate() - 1);
        scrollToIndex(monthScrollRef, date.getMonth());
        const yearIndex = years.findIndex(y => y === date.getFullYear());
        if (yearIndex >= 0) scrollToIndex(yearScrollRef, yearIndex);
      }, 50);
    }
  }, [visible]);

  const handleToday = () => {
    const d = new Date();
    setSelectedDay(d.getDate());
    setSelectedMonth(d.getMonth());
    setSelectedYear(d.getFullYear());
    scrollToIndex(dayScrollRef, d.getDate() - 1);
    scrollToIndex(monthScrollRef, d.getMonth());
    scrollToIndex(yearScrollRef, Math.min(years.indexOf(d.getFullYear()), years.length - 1));
  };

  const handleSelect = () => {
    const selected = new Date(selectedYear, selectedMonth, selectedDay);
    onChange(selected);
    onCancel();
  };

  const renderColumn = (
    data: any[],
    selectedIndex: number,
    setSelected: (i: number) => void,
    ref: React.RefObject<ScrollView>,
    width: number,
    align?: 'flex-start' | 'flex-end'
  ) => (
    <View style={{
      width,
      alignItems: align || 'center',
      paddingHorizontal: TEXT_PADDING,
    }}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingVertical: (ITEM_HEIGHT * (VISIBLE_ITEMS - 1)) / 2,
        }}
        onMomentumScrollEnd={handleMomentumScroll(setSelected, data)}
      >
        {data.map((item, i) => (
          <View key={String(item)} style={styles.item}>
            <RNText
              numberOfLines={1}
              ellipsizeMode="clip"
              style={{
                fontSize: 16,
                lineHeight: ITEM_HEIGHT,
                fontWeight: i === selectedIndex ? '600' : '500',
                color: i === selectedIndex ? colors.onSurface : colors.outline,
                textAlign: 'center',
              }}
            >
              {item}
            </RNText>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const getColumns = () => {
    const order = dateOrder.split('') as ('d' | 'm' | 'y')[];
    return order.map((key, index) => {
      const isFirst = index === 0;
      const isLast = index === order.length - 1;
      let align: 'flex-start' | 'flex-end' | undefined;
      if (key === 'm' && isFirst) align = 'flex-start';
      if (key === 'm' && isLast) align = 'flex-end';
      return (
        <View
          key={key}
          style={{ width: COLUMN_WIDTHS[key] }}
        >
          {key === 'd' && renderColumn(
            daysWithWeekdays, // Используем дни с днями недели
            selectedDay - 1,
            (i) => setSelectedDay(i + 1),
            dayScrollRef,
            COLUMN_WIDTHS.d
          )}
          {key === 'm' && renderColumn(
            months,
            selectedMonth,
            setSelectedMonth,
            monthScrollRef,
            COLUMN_WIDTHS.m,
            align
          )}
          {key === 'y' && renderColumn(
            years,
            Math.max(0, years.findIndex((y) => y === selectedYear)),
            (i) => {
              const index = Math.min(i, years.length - 1);
              const y = years[index];
              if (typeof y === 'number') setSelectedYear(y);
            },
            yearScrollRef,
            COLUMN_WIDTHS.y
          )}
        </View>
      );
    });
  };

  const numericMonths = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const formattedTodayWithWeekday = formatDateWithWeekday(today, dateOrder, numericMonths, dateSeparator, weekdaysShort);

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
      <View style={{ paddingHorizontal: SCREEN_PADDING }}>
        <Animated.View style={todayButtonAnimatedStyle}>
          {showTodayButton && (
            <AppTile
              title={`${t.actions.today} ${formattedTodayWithWeekday}`}
              titleStyle={{ fontWeight: "500" }}
              actionsText={t.actions.find}
              actionsTextColor={colors.primary}
              backgroundColor={colors.surface}
              onPress={handleToday}
              style={{ marginTop: 8}}
            />
          )}
        </Animated.View>

        <AppTile
          simpleTile
          backgroundColor={colors.surface}
          style={{ marginVertical: 8}}
        >
          <View style={[styles.pickerContainer, {
            marginTop: 8,
            marginBottom: 8,
            paddingLeft: TOTAL_SIDE_PADDING - SCREEN_PADDING,
            paddingRight: TOTAL_SIDE_PADDING - SCREEN_PADDING,
          }]}>
            <View style={[styles.selectionHighlight, {
              backgroundColor: colors.secondary,
              left: SCREEN_PADDING,
              right: SCREEN_PADDING,
            }]} />
            <View style={[styles.pickerRow, { gap: columnGap }]}>
              {getColumns()}
            </View>
          </View>
        </AppTile>
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    position: 'relative',
    overflow: 'visible',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: '100%',
  },
  selectionHighlight: {
    position: 'absolute',
    height: ITEM_HEIGHT,
    borderRadius: 8,
    top: (ITEM_HEIGHT * (VISIBLE_ITEMS - 1)) / 2,
  },
});
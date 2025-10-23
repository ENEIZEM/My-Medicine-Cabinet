// app/(modals)/date-end-selector.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Text as RNText,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSettings } from '@/contexts/SettingsContext';
import BaseModal from 'app/(modals)/base-modal';
import AppTile from '@/components/AppTile';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Medicine, Schedule, TempMedicine, TempSchedule, Weekday } from '@/contexts/types';
import BaseCheckbox from '@/components/BaseCheckbox';
import { IconCalendar, IconCalendarCheckBox } from '@/constants/icons';
import BaseTextInput from '@/components/BaseTextInput';
import BaseButton from '@/components/BaseButton';

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
  medicine?: Medicine | TempMedicine | undefined;
  schedule?: Schedule | TempSchedule | undefined;

  startDateOverride?: string | undefined;
  intakeDaysOptionOverride?: Schedule['intakeDaysOption'] | undefined;
  intakeTimesOptionOverride?: Schedule['intakeTimesOption'] | undefined;
  formOverride?: Schedule['form'] | undefined;

  onComputed?: (payload: { 
    computedIso?: string | undefined; 
    requiredNumberOfIntake?: number | undefined; 
    intakeDays?: string[] | undefined;
    endOption?: '1' | '2' | '3' | undefined;
    endOptionCount?: number | undefined;
  }) => void;

  minValueForCount?: number | undefined;
  integerOnly?: boolean | undefined;
};

function parseISODate(iso?: string): Date {
  if (!iso) return new Date();
  const parts = iso.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day, 12, 0, 0, 0);
  }
  console.warn('Unexpected date format:', iso);
  return new Date();
}

function isoDateStr(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addToDate(date: Date, count: number, unit: 'day' | 'week' | 'month' | 'year') {
  const dd = new Date(date);
  switch (unit) {
    case 'day': dd.setDate(dd.getDate() + count); break;
    case 'week': dd.setDate(dd.getDate() + count * 7); break;
    case 'month': dd.setMonth(dd.getMonth() + count); break;
    case 'year': dd.setFullYear(dd.getFullYear() + count); break;
  }
  return dd;
}

function weekdayToGetDay(wd: Weekday) {
  const map: Record<Weekday, number> = { mo: 1, tu: 2, we: 3, th: 4, fr: 5, sa: 6, su: 0 };
  return map[wd];
}

function getAllDatesBetween(startIso: string, endIso: string) {
  const start = parseISODate(startIso);
  const end = parseISODate(endIso);
  const res: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    res.push(isoDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return res;
}

function getDatesByWeekdaysBetween(startIso: string, endIso: string, weekdays: Weekday[]) {
  if (!weekdays || weekdays.length === 0) return [];
  const all = getAllDatesBetween(startIso, endIso);
  const want = weekdays.map(weekdayToGetDay);
  return all.filter(iso => {
    const d = parseISODate(iso);
    return want.includes(d.getDay());
  });
}

function getDatesByIntervalBetween(startIso: string, endIso: string, step: number, unit: 'day'|'week'|'month'|'year') {
  const res: string[] = [];
  let cur = parseISODate(startIso);
  const end = parseISODate(endIso);
  while (cur <= end) {
    res.push(isoDateStr(cur));
    cur = addToDate(cur, step, unit);
  }
  return res;
}

function getFirstNDatesByWeekdays(startIso: string, count: number, weekdays: Weekday[]) {
  const res: string[] = [];
  if (!weekdays || weekdays.length === 0) return res;
  const want = weekdays.map(weekdayToGetDay);
  let cur = parseISODate(startIso);
  while (res.length < count) {
    if (want.includes(cur.getDay())) res.push(isoDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return res;
}

function getFirstNDatesByInterval(startIso: string, count: number, step: number, unit: 'day'|'week'|'month'|'year') {
  const res: string[] = [];
  let cur = parseISODate(startIso);
  for (let i = 0; res.length < count; i++) {
    res.push(isoDateStr(cur));
    cur = addToDate(cur, step, unit);
  }
  return res;
}

function getWeekdayForDate(year: number, month: number, day: number): number {
  return new Date(year, month, day).getDay();
}

export default function DateEndSelector({
  title,
  visible,
  date,
  onCancel,
  onChange,
  medicine = undefined,
  schedule = undefined,

  startDateOverride,
  intakeDaysOptionOverride,
  intakeTimesOptionOverride,
  formOverride,
  onComputed,

  minValueForCount,
  integerOnly,
}: Props) {
  const { dateOrder, dateSeparator, t, language } = useSettings();
  const { colors } = useTheme();

  const usesGenitive = dateOrder.indexOf('d') < dateOrder.indexOf('m');
  const months = language === 'ru' ? (usesGenitive ? t.date.monthsGen : t.date.months) : t.date.months;
  const weekdaysShort = t.date.weekdaysShort;

  const today = new Date();
  const currentYear = today.getFullYear();
  const years = useMemo(() => (
    Array.from({ length: YEARS_COUNT + (currentYear - YEARS_START) + 1 }, (_, i) => YEARS_START + i)
  ), [currentYear]);

  const [selectedDay, setSelectedDay] = useState(date.getDate());
  const [selectedMonth, setSelectedMonth] = useState(date.getMonth());
  const [selectedYear, setSelectedYear] = useState(date.getFullYear());

  const [endDateOption, setEndDateOption] = useState<'1'|'2'|'3'>('1');

  const [countInputValue, setCountInputValue] = useState('');
  const [computedEndIsoForCount, setComputedEndIsoForCount] = useState<string | undefined>(undefined);
  const [computedIntakeDaysLocal, setComputedIntakeDaysLocal] = useState<string[] | undefined>(undefined);
  const [computedRequiredLocal, setComputedRequiredLocal] = useState<number | undefined>(undefined);
  const [computedEndOptionLocal, setComputedEndOptionLocal] = useState<'1' | '2' | '3' | undefined>(undefined);
  const [computedEndOptionCountLocal, setComputedEndOptionCountLocal] = useState<number | undefined>(undefined);

  const suppressAutoSwitchRef = useRef<boolean>(false);
  const userSelectedManualRef = useRef<boolean>(false);

  const [showCountBlock, setShowCountBlock] = useState(false);
  const countBlockHeight = useSharedValue(0);
  const countBlockOpacity = useSharedValue(0);
  const countBlockStyle = useAnimatedStyle(() => ({
    height: countBlockHeight.value,
    opacity: countBlockOpacity.value,
    overflow: 'hidden',
  }));

  const dayScrollRef = useRef<ScrollView>(null!);
  const monthScrollRef = useRef<ScrollView>(null!);
  const yearScrollRef = useRef<ScrollView>(null!);

  const daysInMonth = useMemo(() => new Date(selectedYear, selectedMonth + 1, 0).getDate(), [selectedYear, selectedMonth]);
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);
  const daysWithWeekdays = useMemo(() => days.map(d => {
    const idx = getWeekdayForDate(selectedYear, selectedMonth, d);
    return `${d} (${weekdaysShort[idx]})`;
  }), [days, selectedYear, selectedMonth, weekdaysShort]);

  const totalColumnsWidth = COLUMN_WIDTHS.d + COLUMN_WIDTHS.m + COLUMN_WIDTHS.y;
  const availableGapSpace = SCREEN_WIDTH - 2 * TOTAL_SIDE_PADDING - totalColumnsWidth;
  const columnGap = availableGapSpace / 2;

  useEffect(() => {
    if (endDateOption === '3') {
      setShowCountBlock(true);
      countBlockHeight.value = withTiming(114, { duration: 200, easing: Easing.out(Easing.ease) });
      countBlockOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
    } else {
      countBlockHeight.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.ease) }, () => {
        scheduleOnRN(setShowCountBlock, false);
      });
      countBlockOpacity.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.ease) });
    }
  }, [endDateOption]);

  useEffect(() => {
    if (visible) {
      console.log('DateEndSelector opened with schedule:', schedule);
      console.log('Schedule endOption:', schedule?.endOption);
      console.log('Schedule endOptionCount:', schedule?.endOptionCount);
      console.log('Schedule intakeDays:', schedule?.intakeDays);
      console.log('Schedule requiredNumberOfIntake:', schedule?.requiredNumberOfIntake);
      
      const restoreIso = schedule?.endDate ?? undefined;
      const initialIso = restoreIso ?? (date ? isoDateStr(date) : undefined);
      
      if (initialIso) {
        const d = parseISODate(initialIso);
        setSelectedDay(d.getDate());
        setSelectedMonth(d.getMonth());
        setSelectedYear(d.getFullYear());
        setTimeout(() => {
          dayScrollRef.current?.scrollTo({ y: (d.getDate() - 1) * ITEM_HEIGHT, animated: false });
          monthScrollRef.current?.scrollTo({ y: d.getMonth() * ITEM_HEIGHT, animated: false });
          const yi = years.findIndex(y => y === d.getFullYear());
          if (yi >= 0) yearScrollRef.current?.scrollTo({ y: yi * ITEM_HEIGHT, animated: false });
        }, 40);
      } else {
        setSelectedDay(date.getDate());
        setSelectedMonth(date.getMonth());
        setSelectedYear(date.getFullYear());
      }

      if (schedule?.endOptionCount !== undefined && schedule.endOptionCount > 0) {
        console.log('Restoring countInputValue:', schedule.endOptionCount);
        setCountInputValue(String(schedule.endOptionCount));
      } else {
        console.log('No saved count, clearing input');
        setCountInputValue('');
      }
      
      if (schedule?.intakeDays && schedule.intakeDays.length > 0) {
        const lastDay = schedule.intakeDays[schedule.intakeDays.length - 1];
        console.log('Restoring computed values, last day:', lastDay);
        setComputedEndIsoForCount(lastDay);
        setComputedIntakeDaysLocal([...schedule.intakeDays]);
        setComputedRequiredLocal(schedule.requiredNumberOfIntake ?? undefined);
        setComputedEndOptionLocal(schedule.endOption);
        setComputedEndOptionCountLocal(schedule.endOptionCount);
      } else {
        console.log('No computed values to restore');
        setComputedEndIsoForCount(undefined);
        setComputedIntakeDaysLocal(undefined);
        setComputedRequiredLocal(undefined);
        setComputedEndOptionLocal(undefined);
        setComputedEndOptionCountLocal(undefined);
      }

      const savedEndOption = schedule?.endOption;
      
      if (savedEndOption && (savedEndOption === '1' || savedEndOption === '2' || savedEndOption === '3')) {
        console.log('Restoring saved endDateOption:', savedEndOption);
        setEndDateOption(savedEndOption);
      } else {
        console.log('No saved option, using default logic');
        if (schedule?.requiredNumberOfIntake || (schedule?.intakeDays && schedule.intakeDays.length > 0)) {
          console.log('Setting option 3 (by count)');
          setEndDateOption('3');
        } else if (medicine?.expiryDate && schedule?.endDate === medicine.expiryDate) {
          console.log('Setting option 2 (expiry)');
          setEndDateOption('2');
        } else {
          console.log('Setting option 1 (manual)');
          setEndDateOption('1');
        }
      }

      suppressAutoSwitchRef.current = false;
      userSelectedManualRef.current = false;
    }
  }, [visible]);

  useEffect(() => {
    if (selectedDay > daysInMonth) {
      const newDay = daysInMonth;
      setSelectedDay(newDay);
      setTimeout(() => dayScrollRef.current?.scrollTo({ y: (newDay - 1) * ITEM_HEIGHT, animated: true }), 50);
    }
  }, [selectedMonth, selectedYear, daysInMonth]);

  const scrollToIndex = (ref: React.RefObject<ScrollView>, index: number) => {
    ref.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
  };

  const handleMomentumScroll = (setFn: (i: number) => void, list: any[]) => (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    suppressAutoSwitchRef.current = false;
    userSelectedManualRef.current = false;
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.min(Math.max(Math.round(y / ITEM_HEIGHT), 0), list.length - 1);
    setFn(index);
  };

  const getIntakeTimesCount = (sched?: Schedule | TempSchedule) => {
    if (!sched) return 1;
    if (sched.intakeTimesOption?.option === 2) {
      return (sched.intakeTimesOption?.intakeTimes?.length ?? (sched.intakeTimesOption?.intervalDuration ? (sched.intakeTimesOption?.intakeTimes?.length ?? 0) : 1)) || 1;
    }
    return (sched.intakeTimesOption?.intakeTimes?.length ?? 1) || 1;
  };

  const setSelectedDateFromIso = (iso: string | undefined) => {
    if (!iso) return;
    const d = parseISODate(iso);
    setSelectedDay(d.getDate());
    setSelectedMonth(d.getMonth());
    setSelectedYear(d.getFullYear());
    setTimeout(() => {
      dayScrollRef.current?.scrollTo({ y: (d.getDate() - 1) * ITEM_HEIGHT, animated: true });
      monthScrollRef.current?.scrollTo({ y: d.getMonth() * ITEM_HEIGHT, animated: true });
      const yi = years.findIndex(y => y === d.getFullYear());
      if (yi >= 0) yearScrollRef.current?.scrollTo({ y: yi * ITEM_HEIGHT, animated: true });
    }, 80);
  };

  const formatIsoLocalized = (iso?: string) => {
    if (!iso) return '';
    const d = parseISODate(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear());
    const parts: Record<string, string> = { d: dd, m: months[d.getMonth()], M: mm, y: yy };
    const orderForString = dateOrder.replace('m', 'M');
    return orderForString.split('').map(k => parts[k]).join(dateSeparator);
  };

  useEffect(() => {
    const curIso = isoDateStr(new Date(selectedYear, selectedMonth, selectedDay));
    if (suppressAutoSwitchRef.current) return;
    if (userSelectedManualRef.current && endDateOption === '1') {
      setTimeout(() => { userSelectedManualRef.current = false; }, 700);
      return;
    }
    if (endDateOption === '2') {
      if (!medicine?.expiryDate || medicine.expiryDate !== curIso) {
        setEndDateOption('1');
      }
    } else if (endDateOption === '3') {
      if (computedEndIsoForCount && computedEndIsoForCount !== curIso) {
        setEndDateOption('1');
      }
    } else {
      if (medicine?.expiryDate && medicine.expiryDate === curIso) {
        setEndDateOption('2');
      } else if (computedEndIsoForCount && computedEndIsoForCount === curIso) {
        setEndDateOption('3');
      }
    }
  }, [selectedDay, selectedMonth, selectedYear, computedEndIsoForCount, medicine?.expiryDate, endDateOption]);

  const handleCalculateByCount = () => {
    const tempSchedule: Partial<Schedule> = {
      startDate: startDateOverride ?? schedule?.startDate ?? isoDateStr(new Date()),
      intakeDaysOption: intakeDaysOptionOverride ?? schedule?.intakeDaysOption,
      intakeTimesOption: intakeTimesOptionOverride ?? schedule?.intakeTimesOption,
      form: formOverride ?? schedule?.form,
    };

    const intakeTimesCount = getIntakeTimesCount(schedule ?? tempSchedule as any);
    const raw = countInputValue.replace(',', '.').trim();
    const userRequired = raw ? (integerOnly ? Math.floor(Number(raw)) : Number(raw)) : undefined;
    const userRequiredInt = (typeof userRequired === 'number' && !isNaN(userRequired) && userRequired > 0) ? Math.floor(userRequired) : undefined;

    const rightPartNotEditableOrZero = !(typeof medicine?.quantity === 'number' && medicine.quantity > 0 && (tempSchedule.form?.quantity !== undefined && tempSchedule.form?.quantity > 0));
    const medExpiryIso = medicine?.expiryDate;

    if (tempSchedule.startDate && schedule?.endDate) {
      const startD = parseISODate(tempSchedule.startDate);
      const endD = parseISODate(schedule.endDate);
      if (endD < startD) {
        Alert.alert(t.alerts.error, t.alerts.errorText1);
        return;
      }
    }

    const medQty = (typeof medicine?.quantity === 'number') ? medicine!.quantity : 0;
    const perDose = tempSchedule.form?.quantity ?? 1;
    const possibleIntakes = perDose > 0 ? Math.floor(medQty / (perDose || 1)) : 0;

    if (rightPartNotEditableOrZero) {
      if (userRequiredInt && userRequiredInt > 0) {
        const requiredIntake = userRequiredInt!;
        const daysNeeded = Math.ceil(requiredIntake / (intakeTimesCount || 1));
        if (tempSchedule.intakeDaysOption?.option === 1) {
          const days = getFirstNDatesByWeekdays(tempSchedule.startDate!, daysNeeded, tempSchedule.intakeDaysOption!.intakeWeekdays || []);
          tempSchedule.intakeDays = days;
          tempSchedule.requiredNumberOfIntake = requiredIntake;
          tempSchedule.endOption = '3';
          tempSchedule.endOptionCount = userRequiredInt;
        } else {
          const step = tempSchedule.intakeDaysOption?.intakeDaysInterval || 1;
          const unit = tempSchedule.intakeDaysOption?.intakeDaysType || 'day';
          const days = getFirstNDatesByInterval(tempSchedule.startDate!, daysNeeded, step, unit);
          tempSchedule.intakeDays = days;
          tempSchedule.requiredNumberOfIntake = requiredIntake;
          tempSchedule.endOption = '3';
          tempSchedule.endOptionCount = userRequiredInt;
        }
      } else {
        Alert.alert(t.alerts.info, t.alerts.infoText1);
        return;
      }
    } else {
      if (userRequiredInt && userRequiredInt > 0) {
        if (schedule?.endDate) {
          let availableDays: string[] = [];
          if (tempSchedule.intakeDaysOption?.option === 1) {
            availableDays = getDatesByWeekdaysBetween(tempSchedule.startDate!, schedule.endDate!, tempSchedule.intakeDaysOption!.intakeWeekdays || []);
          } else {
            const step = tempSchedule.intakeDaysOption?.intakeDaysInterval || 1;
            const unit = tempSchedule.intakeDaysOption?.intakeDaysType || 'day';
            availableDays = getDatesByIntervalBetween(tempSchedule.startDate!, schedule.endDate!, step, unit);
          }
          const maxIntakesInRange = (availableDays.length) * (intakeTimesCount || 1);

          const finalRequired = Math.min(userRequiredInt, possibleIntakes, maxIntakesInRange);
          const daysNeeded = Math.ceil(finalRequired / (intakeTimesCount || 1));
          tempSchedule.intakeDays = availableDays.slice(0, daysNeeded);
          tempSchedule.requiredNumberOfIntake = finalRequired;
          tempSchedule.endOption = '3';
          tempSchedule.endOptionCount = userRequiredInt;
        } else {
          const finalRequired = Math.min(userRequiredInt, possibleIntakes);
          const daysNeeded = Math.ceil(finalRequired / (intakeTimesCount || 1));
          if (tempSchedule.intakeDaysOption?.option === 1) {
            const days = getFirstNDatesByWeekdays(tempSchedule.startDate!, daysNeeded, tempSchedule.intakeDaysOption!.intakeWeekdays || []);
            tempSchedule.intakeDays = days;
            tempSchedule.requiredNumberOfIntake = finalRequired;
            tempSchedule.endOption = '3';
            tempSchedule.endOptionCount = userRequiredInt;
          } else {
            const step = tempSchedule.intakeDaysOption?.intakeDaysInterval || 1;
            const unit = tempSchedule.intakeDaysOption?.intakeDaysType || 'day';
            const days = getFirstNDatesByInterval(tempSchedule.startDate!, daysNeeded, step, unit);
            tempSchedule.intakeDays = days;
            tempSchedule.requiredNumberOfIntake = finalRequired;
            tempSchedule.endOption = '3';
            tempSchedule.endOptionCount = userRequiredInt;
          }
        }
      } else {
        if (schedule?.endDate) {
          let availableDays: string[] = [];
          if (tempSchedule.intakeDaysOption?.option === 1) {
            availableDays = getDatesByWeekdaysBetween(tempSchedule.startDate!, schedule.endDate!, tempSchedule.intakeDaysOption!.intakeWeekdays || []);
          } else {
            const step = tempSchedule.intakeDaysOption?.intakeDaysInterval || 1;
            const unit = tempSchedule.intakeDaysOption?.intakeDaysType || 'day';
            availableDays = getDatesByIntervalBetween(tempSchedule.startDate!, schedule.endDate!, step, unit);
          }
          const maxIntakesInRange = (availableDays.length) * (intakeTimesCount || 1);
          const requiredByStock = possibleIntakes;
          const finalRequired = Math.min(requiredByStock, maxIntakesInRange);

          const daysNeeded = Math.ceil(finalRequired / (intakeTimesCount || 1));
          tempSchedule.intakeDays = availableDays.slice(0, daysNeeded);
          tempSchedule.requiredNumberOfIntake = finalRequired;
          tempSchedule.endOption = '3';
          tempSchedule.endOptionCount = undefined;

          if (possibleIntakes > maxIntakesInRange) {
            // можно показать предупреждение
          }
        } else {
          const finalRequired = possibleIntakes;
          const daysNeeded = Math.ceil(finalRequired / (intakeTimesCount || 1));
          if (tempSchedule.intakeDaysOption?.option === 1) {
            const days = getFirstNDatesByWeekdays(tempSchedule.startDate!, daysNeeded, tempSchedule.intakeDaysOption!.intakeWeekdays || []);
            tempSchedule.intakeDays = days;
            tempSchedule.requiredNumberOfIntake = finalRequired;
            tempSchedule.endOption = '3';
            tempSchedule.endOptionCount = undefined;
          } else {
            const step = tempSchedule.intakeDaysOption?.intakeDaysInterval || 1;
            const unit = tempSchedule.intakeDaysOption?.intakeDaysType || 'day';
            const days = getFirstNDatesByInterval(tempSchedule.startDate!, daysNeeded, step, unit);
            tempSchedule.intakeDays = days;
            tempSchedule.requiredNumberOfIntake = finalRequired;
            tempSchedule.endOption = '3';
            tempSchedule.endOptionCount = undefined;
          }
        }
      }
    }

    const computedIso = (tempSchedule.intakeDays && tempSchedule.intakeDays.length) ? tempSchedule.intakeDays[tempSchedule.intakeDays.length - 1] : undefined;

    if (computedIso) {

      const computedDate = parseISODate(computedIso);
      const maxDate = new Date(currentYear + 100, 11, 31); // Максимальная дата в диапазоне
    
      if (computedDate > maxDate) {
        Alert.alert(
          t.alerts.error, t.alerts.errorText6
        );
        return;
      }
      
      setComputedEndIsoForCount(computedIso);
      setComputedIntakeDaysLocal(tempSchedule.intakeDays || undefined);
      setComputedRequiredLocal(tempSchedule.requiredNumberOfIntake || undefined);
      setComputedEndOptionLocal(tempSchedule.endOption as '3');
      setComputedEndOptionCountLocal(tempSchedule.endOptionCount);

      onComputed && onComputed({ 
        computedIso, 
        requiredNumberOfIntake: tempSchedule.requiredNumberOfIntake, 
        intakeDays: tempSchedule.intakeDays,
        endOption: tempSchedule.endOption as '3',
        endOptionCount: tempSchedule.endOptionCount
      });

      suppressAutoSwitchRef.current = true;
      setTimeout(() => {
        setSelectedDateFromIso(computedIso);
        setEndDateOption('3');
        setShowCountBlock(false);
        countBlockHeight.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.ease) });
        countBlockOpacity.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.ease) });
        setTimeout(() => { suppressAutoSwitchRef.current = false; }, 220);
      }, 30);
    } else {
      setComputedEndIsoForCount(undefined);
      setComputedIntakeDaysLocal(undefined);
      setComputedRequiredLocal(undefined);
      setComputedEndOptionLocal(undefined);
      setComputedEndOptionCountLocal(undefined);
      onComputed && onComputed({ 
        computedIso: undefined, 
        requiredNumberOfIntake: undefined, 
        intakeDays: undefined,
        endOption: undefined,
        endOptionCount: undefined
      });
    }

    if (medExpiryIso && computedIso) {
      const expiryD = parseISODate(medExpiryIso);
      const endD = parseISODate(computedIso);
      if (endD > expiryD) {
        Alert.alert(t.alerts.attention, t.alerts.attentionText);
      }
    }
  };

  const expiryIso = medicine?.expiryDate;
  const expiryDateObj = expiryIso ? parseISODate(expiryIso) : undefined;
  const scheduleEndIso = schedule?.endDate;
  const scheduleEndAfterExpiry = scheduleEndIso && expiryDateObj && (parseISODate(scheduleEndIso) > expiryDateObj);
  const computedAfterExpiry = computedEndIsoForCount && expiryDateObj && (parseISODate(computedEndIsoForCount) > expiryDateObj);
  const shouldShowExpiry = !!expiryIso && (scheduleEndAfterExpiry || computedAfterExpiry);

  useEffect(() => {
    if (!shouldShowExpiry && endDateOption === '2') {
      if (computedEndIsoForCount) {
        setEndDateOption('3');
        setSelectedDateFromIso(computedEndIsoForCount);
      } else {
        setEndDateOption('1');
      }
    }
  }, [shouldShowExpiry, computedEndIsoForCount]);

  const handleOptionChange = (val: '1'|'2'|'3') => {
    userSelectedManualRef.current = (val === '1');
    suppressAutoSwitchRef.current = false;

    if (val === '2') {
      if (!shouldShowExpiry) {
        Alert.alert(t.alerts.info, t.alerts.unavailable);
        return;
      }
      if (medicine?.expiryDate) {
        setEndDateOption('2');
        suppressAutoSwitchRef.current = true;
        setSelectedDateFromIso(medicine.expiryDate);
        setComputedEndIsoForCount(undefined);
        setComputedIntakeDaysLocal(undefined);
        setComputedRequiredLocal(undefined);
        setComputedEndOptionLocal(undefined);
        setComputedEndOptionCountLocal(undefined);
        onComputed && onComputed({ 
          computedIso: undefined, 
          requiredNumberOfIntake: undefined, 
          intakeDays: undefined,
          endOption: undefined,
          endOptionCount: undefined
        });
        setTimeout(() => { suppressAutoSwitchRef.current = false; }, 200);
      } else {
        Alert.alert(t.alerts.info, t.alerts.infoText2);
      }
      return;
    }
    if (val === '3') {
      setEndDateOption('3');
      if (!computedRequiredLocal) {
        setCountInputValue('');
      }
      return;
    }

    setEndDateOption('1');
    setComputedEndIsoForCount(undefined);
    setComputedIntakeDaysLocal(undefined);
    setComputedRequiredLocal(undefined);
    setComputedEndOptionLocal(undefined);
    setComputedEndOptionCountLocal(undefined);
    onComputed && onComputed({ 
      computedIso: undefined, 
      requiredNumberOfIntake: undefined, 
      intakeDays: undefined,
      endOption: undefined,
      endOptionCount: undefined
    });
  };

  const expiryLabel = (() => {
    const tmpl = t.schedule.expiryDateEndOption || 'По сроку годности - до {date}';
    const labelText = medicine?.expiryDate 
      ? tmpl.replace('{date}', formatIsoLocalized(medicine.expiryDate))
      : tmpl.replace(/\{[^}]*\}/, '').trim();
    return labelText;
  })();

  const countPlaceholder = (() => {
    const medQty = (typeof medicine?.quantity === 'number') ? medicine.quantity : undefined;
    const perDose = (formOverride?.quantity ?? schedule?.form?.quantity) ?? 1;
    const rightPartNotEditableOrZero = !(typeof medQty === 'number' && medQty > 0 && perDose > 0);
    if (rightPartNotEditableOrZero) return '0';
    const possible = Math.floor((medQty ?? 0) / (perDose || 1));
    return t.actions.max.replace('{N}', String(possible));
  })();

  const countMaxValue = (() => {
    const medQty = (typeof medicine?.quantity === 'number') ? medicine.quantity : undefined;
    const perDose = (formOverride?.quantity ?? schedule?.form?.quantity) ?? 1;
    const rightPartNotEditableOrZero = !(typeof medQty === 'number' && medQty > 0 && perDose > 0);
    if (rightPartNotEditableOrZero) return undefined;
    const possible = Math.floor((medQty ?? 0) / (perDose || 1));
    return possible;
  })();

  const countLabel = (() => {
    const tmpl = t.schedule.inputCountEndOption;
    let labelText = '';
    if (countInputValue && countInputValue.trim() !== '') {
      labelText = tmpl.replace('{ - N}', ` - ${countInputValue}`).replace('{N}', countInputValue);
    } else if (computedRequiredLocal !== undefined) {
      labelText = tmpl.replace(/\{[^\}]*\}/, ` - ${computedRequiredLocal}`);
    } else {
      labelText = tmpl.replace(/\s*\{[^}]*\}/, '').trim();
    }
    return labelText;
  })();

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
      let align: 'flex-start' | 'flex-end' | undefined;
      if (key === 'm' && index === 0) align = 'flex-start';
      if (key === 'm' && index === order.length - 1) align = 'flex-end';
      return (
        <View key={key} style={{ width: COLUMN_WIDTHS[key] }}>
          {key === 'd' && renderColumn(daysWithWeekdays, selectedDay - 1, (i) => setSelectedDay(i + 1), dayScrollRef, COLUMN_WIDTHS.d)}
          {key === 'm' && renderColumn(months, selectedMonth, setSelectedMonth, monthScrollRef, COLUMN_WIDTHS.m, align)}
          {key === 'y' && renderColumn(years, Math.max(0, years.findIndex(y => y === selectedYear)), (i) => {
            const idx = Math.min(i, years.length - 1);
            const y = years[idx];
            if (typeof y === 'number') setSelectedYear(y);
          }, yearScrollRef, COLUMN_WIDTHS.y)}
        </View>
      );
    });
  };

  const handleSelect = () => {
  const selected = new Date(selectedYear, selectedMonth, selectedDay);
  const selectedIso = isoDateStr(selected);
  
  // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: ВСЕГДА вычисляем intakeDays, независимо от опции
  const tempSchedule: Partial<Schedule> = {
    startDate: startDateOverride ?? schedule?.startDate ?? isoDateStr(new Date()),
    endDate: selectedIso,
    intakeDaysOption: intakeDaysOptionOverride ?? schedule?.intakeDaysOption,
    intakeTimesOption: intakeTimesOptionOverride ?? schedule?.intakeTimesOption,
    form: formOverride ?? schedule?.form,
  };

  const intakeTimesCount = getIntakeTimesCount(schedule ?? tempSchedule as any);
  let calculatedIntakeDays: string[] = [];
  
  // Вычисляем дни приёмов на основе выбранного периода
  if (tempSchedule.startDate && tempSchedule.endDate) {
    if (tempSchedule.intakeDaysOption?.option === 1) {
      // По дням недели
      calculatedIntakeDays = getDatesByWeekdaysBetween(
        tempSchedule.startDate, 
        tempSchedule.endDate, 
        tempSchedule.intakeDaysOption.intakeWeekdays || []
      );
    } else if (tempSchedule.intakeDaysOption?.option === 2) {
      // По интервалу
      const step = tempSchedule.intakeDaysOption.intakeDaysInterval || 1;
      const unit = tempSchedule.intakeDaysOption.intakeDaysType || 'day';
      calculatedIntakeDays = getDatesByIntervalBetween(
        tempSchedule.startDate, 
        tempSchedule.endDate, 
        step, 
        unit
      );
    }
  }

  const calculatedRequiredNumber = calculatedIntakeDays.length * intakeTimesCount;

  console.log('handleSelect: calculated data', {
    calculatedIntakeDays,
    calculatedRequiredNumber,
    endDateOption,
    selectedIso
  });

  if (endDateOption === '3' && computedIntakeDaysLocal && computedIntakeDaysLocal.length > 0) {
    // Если выбрана опция "по количеству" и есть вычисленные данные из handleCalculateByCount
    console.log('Using computed data from calculateByCount');
    onComputed && onComputed({
      computedIso: computedEndIsoForCount,
      requiredNumberOfIntake: computedRequiredLocal,
      intakeDays: computedIntakeDaysLocal,
      endOption: '3',
      endOptionCount: computedEndOptionCountLocal
    });
  } else {
    // Для опций "вручную" (1) и "по сроку годности" (2) используем вычисленные данные
    console.log('Using calculated data for manual/expiry selection');
    onComputed && onComputed({
      computedIso: selectedIso,
      requiredNumberOfIntake: calculatedRequiredNumber,
      intakeDays: calculatedIntakeDays,
      endOption: endDateOption,
      endOptionCount: undefined
    });
  }
  
  onChange(selected);
  onCancel();
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
      <View style={{ paddingHorizontal: SCREEN_PADDING }}>
        <AppTile simpleTile={true} backgroundColor={colors.surface} style={{ marginTop: 8 }}>
          <BaseCheckbox
            items={[
              { value: '1', label: '\u00A0' + t.schedule.inputDateEndOption },
              { value: '3', label: '\u00A0' + countLabel },
            ]}
            value={endDateOption}
            onChange={(a) => { if (a === '1' || a === '2' || a === '3') handleOptionChange(a); }}
            multiple={false}
            textPosition={'right'}
            checkedIcon={IconCalendarCheckBox}
            uncheckedIcon={IconCalendar}
            columns={1}
            spacing={8}
            style={{ padding: 14, paddingBottom: 8 }}
            textStyle={{ fontSize: 16 }}
          />
        </AppTile>

        <Animated.View style={countBlockStyle}>
          {showCountBlock && (
            <AppTile
              title={t.schedule.inputCountEndLAbel}
              backgroundColor={colors.surface}
              style={{ marginTop: 8 }}
              contentGap={12}>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <BaseTextInput
                  value={countInputValue}
                  onChangeText={(v) => {
                    let out = v;
                    out = out.replace(/[^\d]/g, '');
                    setCountInputValue(out);
                  }}
                  width={'40%'}
                  maxDigits={9}
                  keyboardType="decimal-pad"
                  placeholder={countPlaceholder}
                  borderColor={colors.outline}
                  minValue={1}
                  maxValue={countMaxValue}
                  integerOnly={true}
                />
                <BaseButton
                  label={t.actions.calculate ?? 'Рассчитать'}
                  textColor={colors.primary}
                  color={colors.surface}
                  style={{ flex: 1 }}
                  onPress={handleCalculateByCount}
                  borderColor={colors.outline}
                  
                />
              </View>
            </AppTile>
          )}
        </Animated.View>

        <AppTile simpleTile backgroundColor={colors.surface} style={{ marginVertical: 8 }}>
          <View style={[styles.pickerContainer, {
            marginTop: 8,
            marginBottom: 8,
            paddingLeft: TOTAL_SIDE_PADDING - SCREEN_PADDING,
            paddingRight: TOTAL_SIDE_PADDING - SCREEN_PADDING,
          }]}>
            <View style={[styles.selectionHighlight, { backgroundColor: colors.secondary, left: SCREEN_PADDING, right: SCREEN_PADDING }]} />
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
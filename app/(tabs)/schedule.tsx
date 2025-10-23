// ScheduleScreen.tsx
import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
  useSyncExternalStore,
} from 'react';
import {
  View,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Animated,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TextStyle,
  Alert,
} from 'react-native';
import { Text, useTheme as usePaperTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateSelector from '@/app/(modals)/date-selector';
import AddEditIntakeModal from '@/app/(modals)/edit-intake';
import { useSettings } from '@/contexts/SettingsContext';
import { useMedicine } from '@/contexts/MedicineContext';
import { useIntake } from '@/contexts/IntakeContext';
import {
  IconAlarm,
  IconDown,
  IconPlus,
  IconRight,
  IconUp,
  IconClockSimple,
  IconCheck,
  IconXBold,
} from '@/constants/icons';
import AppTile from '@/components/AppTile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId, Intake } from '@/contexts/types';
import Header from '@/components/Header';
import PrimaryButton, { PrimaryButtonRef } from '@/components/PrimaryButton';
import BaseButton from '@/components/BaseButton';
import { FlashList, ListRenderItem, type FlashListRef } from '@shopify/flash-list';
import { formatUnit } from '@/constants/locales/formatUnit';
import { useNotifications } from '@/hooks/useNotifications';

type IntakeAny = any;
const ONEOFF_KEY = 'oneoff_intakes_v1';

// Memoize AppTile once at module level to avoid recreating it on every render
const MemoAppTile = React.memo(AppTile);

// Estimated item size for FlashList (tune to your real tile height)
const ESTIMATED_ITEM_SIZE = 96;

/** Global ticker singleton (used by RemainingTimeText and ActionButtons) */
const createTicker = () => {
  let now = Date.now();
  const subs = new Set<() => void>();

  const tick = () => {
    now = Date.now();
    subs.forEach((cb) => cb());
  };

  setInterval(tick, 1000);

  return {
    subscribe: (cb: () => void) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    getSnapshot: () => now,
    getServerSnapshot: () => now,
  };
};
const TICKER = createTicker();

export default function ScheduleScreen() {
  useNotifications();
  const theme = usePaperTheme();
  const { colors } = theme;
  const { is12HourFormat, dateOrder, t, language } = useSettings();
  const insets = useSafeAreaInsets();
  const headerHeight = 68 + insets.top;

  // Animated FAB translate (hook must be inside component)
  const fabTranslateY = useRef(new Animated.Value(0)).current;

  // selectedDate is the date shown in header / date selector (uses local device date)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [currentTime, setCurrentTime] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const { medicines, updateMedicine } = useMedicine();
  // Intake context (source of truth)
  const { intakes: ctxIntakes, updateIntake, updateIntakeStatus } = useIntake();

  const [oneOffIntakes, setOneOffIntakes] = useState<IntakeAny[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [intakeToEdit, setIntakeToEdit] = useState<IntakeAny | null>(null);
  const [noIntakesNoticeVisible, setNoIntakesNoticeVisible] = useState(false);

  // optimistic status map: { [intakeId]: { status?, delayedIntakeTime?, _delayedTarget? } }
  const [optimisticStatusMap, setOptimisticStatusMap] = useState<Record<string, Partial<Intake & { _delayedTarget?: number }>>>({});

  // forcing re-render/remount for FlashList when necessary
  const [listVersion, setListVersion] = useState(0);
  const [flashKey, setFlashKey] = useState(0);

  // keep previous order to detect reorders (helps decide when to remount)
  const prevOrderRef = useRef<string[] | null>(null);

  type FlatItem =
    | { type: 'header'; id: string; title: string; ymd: string; height: number }
    | { type: 'item'; id: string; payload: IntakeAny; height: number };

  // FlashList ref (typed)
  const flashRef = useRef<FlashListRef<FlatItem> | null>(null);

  // notice opacity as ref to Animated.Value (use .current when using it)
  const noticeOpacity = useRef(new Animated.Value(0));

  // --- Helpers ---
  const normalizeToYMD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;

  function parseISODate(iso?: string): Date | null {
    if (!iso) return null;
    const parts = iso.split('-');
    if (parts.length === 3) {
      const year = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const day = Number(parts[2]);
      return new Date(year, month, day, 12, 0, 0, 0);
    }
    return null;
  }

  function getFormattedDateFn(date: Date): string {
    const day = date.getDate();
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const usesGenitive = dateOrder.indexOf('d') < dateOrder.indexOf('m');
    const months = language === 'ru' && usesGenitive ? t.date.monthsGen : t.date.months;
    const parts: Record<string, string> = { d: String(day), m: months[monthIndex], y: String(year) };
    return dateOrder.split('').map((key) => parts[key]).join(' ');
  }

  const getDateWithWeekday = useCallback(
    (date: Date) => {
      const weekday = t.date.weekdays[date.getDay()];
      const formatted = getFormattedDateFn(date);
      return `${weekday}, ${formatted}`;
    },
    [t, dateOrder, language]
  );

  const formattedDate = useMemo(() => getFormattedDateFn(selectedDate), [selectedDate, language, dateOrder]);

  // clock (local current time in header)
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const time = is12HourFormat
        ? `${hours % 12 || 12}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`
        : `${String(hours).padStart(2, '0')}:${minutes}`;
      setCurrentTime(time);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [is12HourFormat]);

  // persist one-off intakes
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ONEOFF_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setOneOffIntakes(parsed);
        }
      } catch (err) {
        console.error('Failed to load one-off intakes:', err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(ONEOFF_KEY, JSON.stringify(oneOffIntakes));
      } catch (err) {
        console.error('Failed to save one-off intakes:', err);
      }
    })();
  }, [oneOffIntakes]);

  // utilities
  const tryParseDateLike = useCallback((v: any): Date | null => {
    if (v instanceof Date) return v;
    if (typeof v === 'string' || typeof v === 'number') {
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }, []);

  const parseTimeStringToParts = useCallback((timeStr: string) => {
    if (!timeStr || typeof timeStr !== 'string') return { h: 0, m: 0 };
    const parts = timeStr.split(':').map(p => parseInt(p, 10));
    return { h: parts[0] || 0, m: parts[1] || 0 };
  }, []);

  // --- Build allIntakes ---
  const allIntakes = useMemo(() => {
    // Merge scheduled intakes (from medicines -> schedules -> intakes) with ctx overrides and optimistic overrides
    const list: IntakeAny[] = [];

    medicines.forEach((m) => {
      (m.schedules || []).forEach((s: any) => {
        (s.intakes || []).forEach((i: any) => {
          const { h, m: mm } = parseTimeStringToParts(i.intakeTime || '00:00');
          const d = tryParseDateLike(i.intakeDay);
          if (d) d.setHours(h, mm, 0, 0);

          const ctx = (ctxIntakes || []).find(ix => ix.id === i.id) || {};
          const optimistic = optimisticStatusMap[i.id] || {};

          const merged = {
            ...i,
            ...ctx,
            ...optimistic,
            _medicineId: m.id,
            _medicineName: m.name,
            _scheduleId: s.id,
            _dateTime: d,
            medicineName: m.name,
          };
          list.push(merged);
        });
      });
    });

    // one-off local intakes (we also apply optimistic override)
    oneOffIntakes.forEach(i => {
      const { h, m: mm } = parseTimeStringToParts(i.intakeTime || '00:00');
      const d = tryParseDateLike(i.intakeDay);
      if (d) d.setHours(h, mm, 0, 0);
      const optimistic = optimisticStatusMap[i.id] || {};
      const merged = { ...i, ...optimistic, _isOneOff: true, _dateTime: d, medicineName: i.medicineName ?? i._medicineName ?? '' };
      list.push(merged);
    });

    return list
      .filter(i => i._dateTime instanceof Date)
      .sort((a, b) => a._dateTime.getTime() - b._dateTime.getTime());
  }, [medicines, oneOffIntakes, parseTimeStringToParts, tryParseDateLike, ctxIntakes, optimisticStatusMap]);

  // reconcile optimistic map with context updates (remove optimistic entries when ctx has same state)
  useEffect(() => {
    if (!ctxIntakes || Object.keys(optimisticStatusMap).length === 0) return;
    let changed = false;
    const next = { ...optimisticStatusMap };
    Object.keys(optimisticStatusMap).forEach(id => {
      const ctx = ctxIntakes.find(i => i.id === id);
      if (ctx) {
        const opt = optimisticStatusMap[id];
        const sameStatus = opt.status ? opt.status === ctx.status : true;
        const sameDelayed = opt.delayedIntakeTime ? opt.delayedIntakeTime === ctx.delayedIntakeTime : true;
        if (sameStatus && sameDelayed) {
          delete next[id];
          changed = true;
        }
      }
    });
    if (changed) setOptimisticStatusMap(next);
    setListVersion(v => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctxIntakes]);

  // When oneOffIntakes change, bump list version (prevents blank space after save)
  useEffect(() => {
    setListVersion(v => v + 1);
  }, [oneOffIntakes]);

  // detect order/structure changes and force remount if big change (prevents blank holes)
  useEffect(() => {
    const ids = allIntakes.map(i => i.id);
    const prev = prevOrderRef.current;
    let needRemount = false;

    if (!prev) {
      prevOrderRef.current = ids;
      return;
    }

    if (prev.length !== ids.length) {
      needRemount = true;
    } else {
      for (let i = 0; i < ids.length; i++) {
        if (prev[i] !== ids[i]) {
          needRemount = true;
          break;
        }
      }
    }

    if (needRemount) {
      setListVersion(v => v + 1);
      setFlashKey(k => k + 1);
      prevOrderRef.current = ids;
    }
  }, [allIntakes]);

  // build sections
  const sections = useMemo(() => {
    const grouped: Record<string, IntakeAny[]> = {};
    const dateOrderArr: string[] = [];

    allIntakes.forEach(intake => {
      const ymd = normalizeToYMD(intake._dateTime);
      if (!grouped[ymd]) {
        grouped[ymd] = [];
        dateOrderArr.push(ymd);
      }
      grouped[ymd].push(intake);
    });

    return dateOrderArr.map(ymd => {
      const [yyyy, mm, dd] = ymd.split('-').map(Number);
      const date = new Date(yyyy, mm - 1, dd);
      return {
        ymd,
        title: getDateWithWeekday(date),
        data: grouped[ymd],
      };
    });
  }, [allIntakes, getDateWithWeekday]);

  // flatten to FlashList-friendly array (header items + normal items)
  const flatData = useMemo<FlatItem[]>(() => {
    const arr: FlatItem[] = [];
    for (const sec of sections) {
      arr.push({ type: 'header', id: `h-${sec.ymd}`, title: sec.title, ymd: sec.ymd, height: 44 });
      for (const it of sec.data) {
        const key = it.id ?? generateId();
        arr.push({ type: 'item', id: key, payload: it, height: ESTIMATED_ITEM_SIZE });
      }
    }
    return arr;
  }, [sections]);

  const headerIndexByYmd = useMemo(() => {
    const map = new Map<string, number>();
    flatData.forEach((it, idx) => {
      if (it.type === 'header') map.set(it.ymd, idx);
    });
    return map;
  }, [flatData]);

  // scroll to header/index
  const scrollToSectionIndex = useCallback((date: Date) => {
    const target = normalizeToYMD(date);
    const index = headerIndexByYmd.get(target);
    if (index !== undefined && flashRef.current) {
      try {
        flashRef.current.scrollToIndex({ index, animated: true, viewPosition: 0, viewOffset: -8});
      } catch (e) {
        // fallback: small timeout
        setTimeout(() => {
          try {
            flashRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0, viewOffset: -8});
          } catch (e2) {
            // swallow
          }
        }, 150);
      }
    }
  }, [headerIndexByYmd]);

  // When user picks date from DateSelector
  const handleDateChange = useCallback((newDate: Date) => {
    if (!(newDate instanceof Date)) return;
    setShowPicker(false);

    const headerIndex = headerIndexByYmd.get(normalizeToYMD(newDate));
    if (headerIndex !== undefined && flashRef.current) {
      setSelectedDate(newDate);
      setTimeout(() => {
        try {
          flashRef.current?.scrollToIndex({ index: headerIndex, animated: true, viewPosition: 0, viewOffset: -8});
        } catch (e) {}
      }, 250);
    } else {
      // если нет приёмов — вернуть шапку на сегодняшнюю дату и force remount
      setSelectedDate(new Date());
      setListVersion(v => v + 1);
      setFlashKey(k => k + 1);
      Animated.timing(noticeOpacity.current, { toValue: 1, duration: 200, useNativeDriver: true }).start(() => {
        setNoIntakesNoticeVisible(true);
        setTimeout(() => {
          Animated.timing(noticeOpacity.current, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setNoIntakesNoticeVisible(false));
        }, 2000);
      });
    }
  }, [headerIndexByYmd]);

  // per-intake label builder
  const buildPerIntakeLabel = useCallback((intake: Intake): string => {
    const dosageAmount =
      intake.dosage?.amount !== undefined && Number(intake.dosage.amount) !== 0
        ? String(intake.dosage.amount)
        : '';
    const dosageUnit = intake.dosage?.unit ? formatUnit(t.medicine.dosages, String(intake.dosage?.amount ?? ''), language, intake.dosage.unit) : '';
    const formQuantity =
      intake.form?.quantity !== undefined && Number(intake.form.quantity) !== 0 ? intake.form.quantity : '';
    const formForm = intake.form?.form ? formatUnit(t.medicine.units, String(formQuantity ?? ''), language, intake.form.form) : '';
    const formLabel = formQuantity !== '' && formForm ? `${formQuantity} ${formForm}` : '';
    const perIntakeSuffix = t.schedule.perIntake;
    if (formLabel && dosageAmount && dosageUnit) {
      return `${formLabel} - ${dosageAmount} ${dosageUnit} ${perIntakeSuffix}`;
    }
    if (formLabel) {
      return `${formLabel} ${perIntakeSuffix}`;
    }
    if (dosageAmount) {
      return `${dosageAmount} ${dosageUnit} ${perIntakeSuffix}`;
    }
    return '';
  }, [t, language]);

  // memoized styles (typed)
  const itemContainerStyle = useMemo(() => ({ marginBottom: 0 }), []);
  const timeTextStyle = useMemo<TextStyle>(() => ({ fontSize: 16, color: colors.onSurface }), [colors]);
  const perIntakeStyle = useMemo<TextStyle>(() => ({ fontSize: 16, fontWeight: '700' as TextStyle['fontWeight'], color: colors.onSurface }), [colors]);

  // ---------- remaining time ----------
  const getRemainingTimeString = useCallback((targetDt: Date, nowDt: Date) => {
    const diffMs = targetDt.getTime() - nowDt.getTime();
    if (diffMs <= 0) return '';

    const diffSec = Math.floor(diffMs / 1000);
    const days = Math.floor(diffSec / (24 * 3600));
    const hours = Math.floor((diffSec % (24 * 3600)) / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;

    const parts: string[] = [];

    if (days > 0) {
      parts.push(`${days} ${t.time.days}`);
    }

    if (diffSec < 7 * 24 * 3600 && hours > 0) {
      parts.push(`${hours} ${t.time.hours.h}`);
    }

    if (diffSec < 24 * 3600 && minutes > 0) {
      parts.push(`${minutes} ${t.time.min}`);
    }

    if (diffSec < 3600 && seconds > 0) {
      parts.push(`${seconds} ${t.time.sec}`);
    }

    return parts.join(' ');
  }, [t]);

  // ---------- urgency color interpolation ----------
  const hexToRgb = (hex: string) => {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(ch => ch + ch).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
  };
  const rgbToCss = (r: number, g: number, b: number) => `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;

  const getUrgencyColor = useCallback((hoursLeft: number | null) => {
    if (hoursLeft === null) return colors.onSurfaceVariant;
    if (hoursLeft <= 0) {
      return theme.dark ? '#ff8989' : '#EE2D38';
    }
    const threshold = 12;
    if (hoursLeft <= threshold) {
      const ratio = Math.max(0, Math.min(1, (threshold - hoursLeft) / threshold));
      const peakHex = theme.dark ? '#ff8989' : '#EE2D38';
      let baseRgb = { r: 140, g: 140, b: 140 };
      try {
        const cs = colors.onSurfaceVariant;
        if (cs.startsWith('#')) baseRgb = hexToRgb(cs);
        else if (cs.startsWith('rgb')) {
          const nums = cs.replace(/[^\d,]/g, '').split(',').map(n => Number(n));
          if (nums.length >= 3) baseRgb = { r: nums[0], g: nums[1], b: nums[2] };
        }
      } catch (e) {}
      const peakRgb = hexToRgb(peakHex);
      const r = baseRgb.r + (peakRgb.r - baseRgb.r) * ratio;
      const g = baseRgb.g + (peakRgb.g - baseRgb.g) * ratio;
      const b = baseRgb.b + (peakRgb.b - baseRgb.b) * ratio;
      return rgbToCss(r, g, b);
    }
    return colors.onSurfaceVariant;
  }, [colors, theme.dark]);

  /**
   * RemainingTimeText — подписывается на глобальный тикер и рендерит строку,
   * при этом окраска зависит от срочности; disabled -> colors.onSurfaceDisabled.
   */
  const RemainingTimeText = useCallback(React.memo(function RemainingTimeTextInner({
    target,
    timeLabel,
    status,
    delayedFlag,
  }: {
    target: Date | null;
    timeLabel: string;
    status?: string;
    delayedFlag?: boolean | string | undefined;
  }) {
    const nowMs = useSyncExternalStore(TICKER.subscribe, TICKER.getSnapshot, TICKER.getServerSnapshot);
    const now = new Date(nowMs);

    const remaining = target ? getRemainingTimeString(target, now) : '';

    const hoursLeftRaw = target ? (target.getTime() - now.getTime()) / (1000 * 60 * 60) : null;
    const hoursLeft = hoursLeftRaw !== null ? Math.ceil(hoursLeftRaw) : null;
    const urgencyColor = getUrgencyColor(hoursLeft);

    const st = status ?? 'active';

    let timeText: string;
    if (st === 'active') {
      if (remaining && remaining.length > 0) {
        timeText = `${timeLabel} ${t.schedule.intakeTimeLabel.stillTimeLeft.replace('{time}', remaining)}`;
      } else {
        timeText = `${timeLabel} ${t.schedule.intakeTimeLabel.ItsAboutTime}`;
      }
    } else if (st === 'successful') {
      if (delayedFlag) {
        timeText = t.schedule.intakeTimeLabel.doneLate.replace('{time}', timeLabel);
      } else {
        timeText = t.schedule.intakeTimeLabel.doneOnTime.replace('{time}', timeLabel);
      }
    } else if (st === 'missed') {
      timeText = t.schedule.intakeTimeLabel.missedIntake.replace('{time}', timeLabel);
    } else {
      if (remaining && remaining.length > 0) {
        timeText = `${timeLabel} ${t.schedule.intakeTimeLabel.stillTimeLeft.replace('{time}', remaining)}`;
      } else {
        timeText = `${timeLabel} ${t.schedule.intakeTimeLabel.ItsAboutTime}`;
      }
    }

    const disabled = st === 'successful' || st === 'missed';
    return <Text style={[timeTextStyle, { color: disabled ? colors.onSurfaceDisabled : urgencyColor }]}>{timeText}</Text>;
  }), [getRemainingTimeString, t, timeTextStyle, getUrgencyColor, colors]);

  /**
   * ЗАДАЧА 2 и 3: Логика уменьшения счетчика расписания и количества лекарства
   */
  const decrementScheduleCounter = useCallback(async (intake: IntakeAny) => {
    if (!intake._medicineId || !intake._scheduleId) return;
    
    const medicine = medicines.find(m => m.id === intake._medicineId);
    if (!medicine || !medicine.schedules) return;

    const schedule = medicine.schedules.find(s => s.id === intake._scheduleId);
    if (!schedule) return;

    // Уменьшаем счетчик requiredNumberOfIntake на 1
    const updatedSchedule = {
      ...schedule,
      requiredNumberOfIntake: Math.max(0, (schedule.requiredNumberOfIntake || 0) - 1),
    };

    const updatedSchedules = medicine.schedules.map(s => 
      s.id === schedule.id ? updatedSchedule : s
    );

    const updatedMedicine = {
      ...medicine,
      schedules: updatedSchedules,
    };

    await updateMedicine(updatedMedicine);
    console.log(`Счетчик расписания ${schedule.name} уменьшен на 1. Осталось: ${updatedSchedule.requiredNumberOfIntake}`);
  }, [medicines, updateMedicine]);

  const decrementMedicineQuantity = useCallback(async (intake: IntakeAny) => {
    if (!intake._medicineId || !intake._scheduleId) return;
    
    const medicine = medicines.find(m => m.id === intake._medicineId);
    if (!medicine) return;

    // Проверяем, совпадают ли формы
    const intakeForm = intake.form?.form;
    const intakeQuantity = intake.form?.quantity;
    const medicineForm = medicine.form;

    if (!intakeForm || !intakeQuantity || intakeForm !== medicineForm) {
      console.log('Формы не совпадают или нет данных о форме приема, пропускаем вычитание');
      return;
    }

    const newQuantity = medicine.quantity - intakeQuantity;

    if (newQuantity < 0) {
      // Не можем вычесть больше, чем есть
      console.log('Недостаточно лекарства для вычитания');
      return;
    }

    // Находим следующий активный прием этого расписания
    const schedule = medicine.schedules?.find(s => s.id === intake._scheduleId);
    const nextIntake = schedule?.intakes?.find(i => 
      i.status === 'active' && 
      i.id !== intake.id &&
      new Date(i.intakeDay + ' ' + i.intakeTime) > new Date(intake.intakeDay + ' ' + intake.intakeTime)
    );

    const nextIntakeQuantity = nextIntake?.form?.quantity || 0;

    // Обновляем количество лекарства
    const updatedMedicine = {
      ...medicine,
      quantity: newQuantity,
    };

    await updateMedicine(updatedMedicine);

    // Проверяем и показываем алерты
    if (newQuantity === 0) {
      Alert.alert(
        t.alerts?.medicineFinished?.title,
        t.alerts?.medicineFinished?.message?.replace('{medicine}', medicine.name),
        [{ text: 'OK' }]
      );
    } else if (nextIntake && newQuantity < nextIntakeQuantity) {
      Alert.alert(
        t.alerts?.medicineRunningOut?.title,
        t.alerts?.medicineRunningOut?.message
          ?.replace('{medicine}', medicine.name)
          ?.replace('{remaining}', String(newQuantity))
          ?.replace('{needed}', String(nextIntakeQuantity)),
        [{ text: 'OK' }]
      );
    }

    console.log(`Количество лекарства "${medicine.name}" уменьшено с ${medicine.quantity} до ${newQuantity}`);
  }, [medicines, updateMedicine, t]);

  /**
   * ActionButtons — показываются только если intake.status === 'active' И now >= target.
   * Скрываются, когда статус поменялся или при действиях.
   */
  const ActionButtons: React.FC<{
    target: Date | null;
    intake: IntakeAny;
  }> = ({ target, intake }) => {
    const nowMs = useSyncExternalStore(TICKER.subscribe, TICKER.getSnapshot, TICKER.getServerSnapshot);
    const now = new Date(nowMs);
    const [visible, setVisible] = useState(false);
    const anim = useRef(new Animated.Value(0)).current; // 0 hidden, 1 visible

    // compute current visible condition considering optimistic overrides
    const effectiveStatus = intake.status ?? 'active';
    const shouldShow = !!target && effectiveStatus === 'active' && now.getTime() >= target.getTime();

    useEffect(() => {
      if (shouldShow && !visible) {
        setVisible(true);
        Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      } else if (!shouldShow && visible) {
        Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setVisible(false));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nowMs, shouldShow]);

    const isOneOff = !!intake._isOneOff;

    // helper to run hide animation then do update
    const runHideThen = (onHidden: () => void) => {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setVisible(false);
        try {
          onHidden();
        } catch (e) {
          console.error('runHideThen handler failed', e);
        } finally {
          setTimeout(() => setListVersion(v => v + 1), 50);
        }
      });
    };

    const handleMarkMissed = async () => {
      Alert.alert(
        t.actions?.confirm,
        t.alerts.warningText,
        [
          { text: t.actions?.cancel, style: 'cancel' },
          {
            text: t.actions?.confirm,
            onPress: async () => {
              runHideThen(async () => {
                setOptimisticStatusMap(prev => ({ ...prev, [intake.id]: { status: 'missed' } }));
                
                // ЗАДАЧА 2: Уменьшаем счетчик расписания при пропуске
                await decrementScheduleCounter(intake);
                
                if (isOneOff) {
                  setOneOffIntakes(prev => prev.map(p => p.id === intake.id ? { ...p, status: 'missed' } : p));
                } else if (updateIntakeStatus) {
                  updateIntakeStatus(intake.id, 'missed');
                } else if (updateIntake) {
                  updateIntake({ ...intake, status: 'missed' });
                }
              });
            }
          }
        ]
      );
    };

    const handleMarkDone = async () => {
      runHideThen(async () => {
        setOptimisticStatusMap(prev => ({ ...prev, [intake.id]: { status: 'successful' } }));
        
        // ЗАДАЧА 2: Уменьшаем счетчик расписания при выполнении
        await decrementScheduleCounter(intake);
        
        // ЗАДАЧА 3: Уменьшаем количество лекарства при выполнении (только successful)
        await decrementMedicineQuantity(intake);
        
        if (isOneOff) {
          setOneOffIntakes(prev => prev.map(p => p.id === intake.id ? { ...p, status: 'successful' } : p));
        } else if (updateIntakeStatus) {
          updateIntakeStatus(intake.id, 'successful');
        } else if (updateIntake) {
          updateIntake({ ...intake, status: 'successful' });
        }
      });
    };

    const handleMarkLate = async () => {
      const later = new Date();
      later.setMinutes(later.getMinutes() + 10);
      const hh = String(later.getHours()).padStart(2, '0');
      const mm = String(later.getMinutes()).padStart(2, '0');
      const delayed = `${hh}:${mm}`;
      const delayedMs = later.getTime();

      runHideThen(() => {
        setOptimisticStatusMap(prev => ({ ...prev, [intake.id]: { delayedIntakeTime: delayed, _delayedTarget: delayedMs } }));
        if (isOneOff) {
          setOneOffIntakes(prev => prev.map(p => p.id === intake.id ? { ...p, delayedIntakeTime: delayed, _delayedTarget: delayedMs } : p));
        } else if (updateIntake) {
          updateIntake({ ...intake, delayedIntakeTime: delayed });
        }
      });
    };

    if (!visible) return null;

    const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
    const opacity = anim;

    return (
      <Animated.View style={{ transform: [{ translateY }], opacity, width: '100%', paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <BaseButton
            label={t.schedule.button.missed}
            onPress={handleMarkMissed}
            color={colors.error}
            textColor={colors.onError}
            style={{ flex: 1, marginRight: 4 }}
          />
          <BaseButton
            label={t.schedule.button.done}
            onPress={handleMarkDone}
            color={colors.primary}
            textColor={colors.onPrimary}
            style={{ flex: 1, marginLeft: 4 }}
          />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingTop: 8 }}>
          <BaseButton
            label={t.schedule.button.late}
            onPress={handleMarkLate}
            color={colors.surface}
            textColor={colors.primary}
            borderColor={colors.outline}
            style={{ flex: 1 }}
          />
        </View>
      </Animated.View>
    );
  };

  // helper: open editor by intake id but *fetch merged intake* (incl optimistic)
  const openEditById = useCallback((id: string) => {
    const intake = allIntakes.find(a => a.id === id) || null;
    if (!intake) {
      setIntakeToEdit(null);
      setModalVisible(true);
      return;
    }
    const copy = { ...intake };
    if (copy._delayedTarget && typeof copy._delayedTarget === 'number') {
      const d = new Date(copy._delayedTarget);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      copy.intakeTime = `${hh}:${mm}`;
      const yyyy = d.getFullYear();
      const mmn = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      copy.intakeDay = `${yyyy}-${mmn}-${dd}`;
    } else if (copy.delayedIntakeTime && typeof copy.delayedIntakeTime === 'string' && copy._dateTime instanceof Date) {
      const parts = copy.delayedIntakeTime.split(':').map((p: string) => parseInt(p, 10));
      if (parts.length >= 2 && !Number.isNaN(parts[0])) {
        const d = new Date(copy._dateTime);
        d.setHours(parts[0], parts[1], 0, 0);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        copy.intakeTime = `${hh}:${mm}`;
        const yyyy = d.getFullYear();
        const mmn = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        copy.intakeDay = `${yyyy}-${mmn}-${dd}`;
      }
    }
    setIntakeToEdit(copy);
    setModalVisible(true);
  }, [allIntakes]);

  // render item for FlashList
  const renderFlashItem: ListRenderItem<FlatItem> = useCallback(({ item }) => {
    if (item.type === 'header') {
      return (
        <View pointerEvents="none" style={{ paddingVertical: 6, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.onSurfaceVariant }}>
            {item.title}
          </Text>
        </View>
      );
    }

    const it = item.payload;
    const dt = (it._dateTime as Date) ?? null;

    let timeLabel = dt
      ? `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
      : (it.intakeTime ?? '');

    let effectiveDt: Date | null = null;

    if (it._delayedTarget && typeof it._delayedTarget === 'number') {
      effectiveDt = new Date(it._delayedTarget);
      timeLabel = `${String(effectiveDt.getHours()).padStart(2, '0')}:${String(effectiveDt.getMinutes()).padStart(2, '0')}`;
    } else if (it.delayedIntakeTime && typeof it.delayedIntakeTime === 'string') {
      const v = it.delayedIntakeTime.trim();
      if (dt) {
        if (v.includes(':')) {
          const parts = v.split(':').map((p: string) => parseInt(p, 10));
          const hh = parts[0] || 0;
          const mm = parts[1] || 0;
          effectiveDt = new Date(dt);
          effectiveDt.setHours(hh, mm, 0, 0);
          timeLabel = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
        } else if (v.includes('-')) {
          const parsedDay = parseISODate(v);
          if (parsedDay) {
            const timeParts = (it.intakeTime || timeLabel).split(':').map((p: string) => parseInt(p, 10));
            const hh = timeParts[0] || (dt.getHours ? dt.getHours() : 0);
            const mm = timeParts[1] || (dt.getMinutes ? dt.getMinutes() : 0);
            effectiveDt = new Date(parsedDay);
            effectiveDt.setHours(hh, mm, 0, 0);
            timeLabel = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
          } else {
            effectiveDt = dt;
          }
        } else {
          effectiveDt = dt;
        }
      }
    } else if (dt) {
      effectiveDt = dt;
    }

    const status = it.status ?? 'active';
    const isSchedule = it.type === 'schedule';
    const isOneOff = !!it._isOneOff;

    // MAIN ICON: if successful -> check (фиолетовая галочка), if missed -> red cross, otherwise normal alarm icon
    let mainIcon = IconAlarm;
    let mainIconColor = colors.primary;
    if (status === 'successful') {
      mainIcon = IconCheck;
      mainIconColor = (colors as any).primary ?? colors.primary;
    } else if (status === 'missed') {
      mainIcon = IconXBold;
      mainIconColor = colors.error;
    }

    // EDITABLE RULE: only one-off (разовые) intakes with status === 'active' are editable
    const editable = isOneOff && status === 'active';

    // trailing icon: arrow only for editable one-off active intakes
    const trailingIconNode = editable ? <IconRight width={24} height={24} fill={'#AEAEAE'} /> : undefined;

    const actionsText = it.scheduleName ? it.scheduleName : t.schedule.singleIntake;
    const disabled = status === 'successful' || status === 'missed';

    const titleColor = disabled ? colors.onSurfaceDisabled : colors.onSurface;
    const actionsTextColor = disabled ? colors.onSurfaceDisabled : colors.onSurfaceVariant;
    const dosageColor = disabled ? colors.onSurfaceDisabled : colors.onSurface;

    return (
      <View pointerEvents="box-none">
        <MemoAppTile
          key={it.id}
          pressColorFeedback={!!editable}
          title={it.medicineName}
          titleStyle={{ color: titleColor, fontSize: 16, fontWeight: '700' }}
          icon={mainIcon}
          iconColor={mainIconColor}
          backgroundColor={disabled ? (colors as any).surfaceDisabled ?? colors.surface : colors.surface}
          contentGap={6}
          childrenGap={8}
          style={itemContainerStyle}
          actions={trailingIconNode}
          actionsText={actionsText}
          actionsTextStyle={{ color: actionsTextColor, fontSize: 15 }}
          onPress={editable ? () => openEditById(it.id) : () => {}}
        >
          <RemainingTimeText target={effectiveDt} timeLabel={timeLabel} status={status} delayedFlag={it.delayedIntakeTime} />

          <Text style={[perIntakeStyle, { color: dosageColor }]}>
            {buildPerIntakeLabel(it)}
          </Text>

          <ActionButtons target={effectiveDt} intake={it} />
        </MemoAppTile>

        <View pointerEvents="none" style={{ height: 8 }} />
      </View>
    );
  }, [
    MemoAppTile,
    colors,
    itemContainerStyle,
    timeTextStyle,
    perIntakeStyle,
    buildPerIntakeLabel,
    getRemainingTimeString,
    t,
    optimisticStatusMap,
    openEditById,
  ]);

  const getItemType = useCallback((item: FlatItem) => item.type === 'header' ? 'header' : 'item', []);

  // save / delete one-off handlers (memoized)
  const handleSaveOneOff = useCallback((intake: any) => {
    if (!intake.id) intake.id = generateId();
    setOptimisticStatusMap(prev => {
      if (!prev[intake.id]) return prev;
      const next = { ...prev };
      delete next[intake.id];
      return next;
    });
    setOneOffIntakes(prev => {
      const idx = prev.findIndex(p => p.id === intake.id);
      if (idx >= 0) {
        const arr = [...prev];
        arr[idx] = intake;
        setTimeout(() => setListVersion(v => v + 1), 60);
        setTimeout(() => setFlashKey(k => k + 1), 80);
        return arr;
      }
      setTimeout(() => setListVersion(v => v + 1), 60);
      setTimeout(() => setFlashKey(k => k + 1), 80);
      return [...prev, intake];
    });
  }, []);

  const handleDeleteOneOff = useCallback((id: string) => {
    setOneOffIntakes(prev => {
      const next = prev.filter(i => i.id !== id);
      setTimeout(() => setListVersion(v => v + 1), 60);
      setTimeout(() => setFlashKey(k => k + 1), 80);
      return next;
    });
  }, []);

  // scroll / fab
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const screenHeight = Dimensions.get('screen').height;
  const SCROLL_THRESHOLD = screenHeight * 0.3;
  const scrollToTopFabRef = useRef<PrimaryButtonRef>(null);
  const addButtonRef = useRef<PrimaryButtonRef>(null);

  const scrollToTop = useCallback(() => {
    if (flashRef.current) {
      try {
        flashRef.current.scrollToIndex({ index: 0, animated: true, viewPosition: 0, viewOffset: -8});
      } catch (e) {}
    }
  }, []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    if (yOffset > SCROLL_THRESHOLD && !showScrollToTop) {
      setShowScrollToTop(true);
      scrollToTopFabRef.current?.show();
      Animated.timing(fabTranslateY, { toValue: -42, duration: 250, useNativeDriver: true }).start();
    } else if (yOffset <= SCROLL_THRESHOLD && showScrollToTop) {
      setShowScrollToTop(false);
      scrollToTopFabRef.current?.hide();
      Animated.timing(fabTranslateY, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [showScrollToTop, SCROLL_THRESHOLD, fabTranslateY]);

  // FlashList extra props
  const extraFlashProps: any = {
    estimatedItemSize: ESTIMATED_ITEM_SIZE,
    extraData: listVersion,
    getItemLayout: (data: FlatItem[] | undefined, index: number) => {
      try {
        if (!data || index < 0) return { length: ESTIMATED_ITEM_SIZE, offset: 0, index };
        let offset = 0;
        for (let i = 0; i < index; i++) {
          offset += data[i]?.height ?? ESTIMATED_ITEM_SIZE;
        }
        const length = data[index]?.height ?? ESTIMATED_ITEM_SIZE;
        return { length, offset, index };
      } catch (e) {
        return { length: ESTIMATED_ITEM_SIZE, offset: ESTIMATED_ITEM_SIZE * index, index };
      }
    },
  };

  // ----------------------------
  // Auto-detect local date change and auto-scroll to that date
  // ----------------------------
  const prevLocalYmdRef = useRef<string>(normalizeToYMD(new Date()));
  useEffect(() => {
    const checkIntervalMs = 15000; // check every 15 seconds
    const id = setInterval(() => {
      const nowYmd = normalizeToYMD(new Date());
      if (nowYmd !== prevLocalYmdRef.current) {
        // local day changed
        prevLocalYmdRef.current = nowYmd;
        // update selectedDate (header) to local now (new day)
        const now = new Date();
        setSelectedDate(now);
        // attempt to scroll to section for new date
        setTimeout(() => {
          scrollToSectionIndex(now);
        }, 300);
        // bump versions to re-render if necessary
        setListVersion(v => v + 1);
        setFlashKey(k => k + 1);
      }
    }, checkIntervalMs);
    return () => clearInterval(id);
  }, [scrollToSectionIndex]);

  // on mount scroll to selectedDate (today by default)
  useEffect(() => {
    const tmo = setTimeout(() => {
      scrollToSectionIndex(selectedDate);
    }, 300);
    return () => clearTimeout(tmo);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: headerHeight }]}>
      <Header backgroundColor={colors.surfaceVariant}>
        <View style={[styles.headerInner, { backgroundColor: colors.secondaryContainer, top: insets.top / 2 }]}>
          <Text style={{ fontSize: 18, color: colors.onSurface }}>{currentTime}</Text>

          <TouchableOpacity onPress={() => setShowPicker(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 18, color: colors.onSurface }}>{formattedDate}</Text>
            <IconDown width={26} height={26} fill={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </Header>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          {flatData.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: -12 + insets.top + screenHeight / 3.5 }}>
              <Text style={{ color: colors.primary, fontSize: 20, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 24 }}>
                {t.schedule.emptyState}
              </Text>
            </View>
          ) : (
            <FlashList
              key={`schedule-flash-${flashKey}`}
              ref={flashRef}
              data={flatData}
              renderItem={renderFlashItem}
              keyExtractor={(item) => String((item as FlatItem).id)}
              getItemType={getItemType}
              {...extraFlashProps}
              onScroll={handleScroll as any}
              showsVerticalScrollIndicator={false}
              initialNumToRender={10}
              maxToRenderPerBatch={8}
              windowSize={7}
              removeClippedSubviews={false}
              contentContainerStyle={{
                marginTop: 8,
                paddingHorizontal: 16,
                paddingBottom: showScrollToTop ? 184 : 150,
              }}
            />
          )}
        </View>
      </TouchableWithoutFeedback>

      <Animated.View style={{ transform: [{ translateY: fabTranslateY }] }}>
        <PrimaryButton
          ref={addButtonRef}
          label={t.schedule.fabLabel}
          icon={IconPlus}
          onPress={() => {
            // при добавлении — шапка меняется на сегодняшнюю дату
            setSelectedDate(new Date());
            setIntakeToEdit(null);
            setModalVisible(true);
          }}
          textColor={colors.onSecondary}
          style={{ position: 'absolute', right: 12, bottom: insets.bottom + 82 }}
        />
      </Animated.View>

      <PrimaryButton
        ref={scrollToTopFabRef}
        icon={IconUp}
        onPress={scrollToTop}
        style={{ position: 'absolute', right: 16, bottom: insets.bottom + 76, borderRadius: 20 }}
        iconSize={24}
        animated
        show={false}
      />

      <DateSelector title={t.title.intakeDateSelector} visible={showPicker} date={selectedDate} onChange={handleDateChange} onCancel={() => setShowPicker(false)} />

      <AddEditIntakeModal
        visible={modalVisible}
        onDismiss={() => { setModalVisible(false); setIntakeToEdit(null); }}
        intakeToEdit={intakeToEdit}
        onSave={(saved) => {
          handleSaveOneOff(saved);
          setOptimisticStatusMap(prev => {
            if (!prev[saved.id]) return prev;
            const next = { ...prev };
            delete next[saved.id];
            return next;
          });
          setTimeout(() => setListVersion(v => v + 1), 40);
          setTimeout(() => setFlashKey(k => k + 1), 80);
        }}
        onDelete={(id) => {
          handleDeleteOneOff(id);
          setTimeout(() => setListVersion(v => v + 1), 40);
          setTimeout(() => setFlashKey(k => k + 1), 80);
        }}
      />

      {noIntakesNoticeVisible && (
        <Animated.View
          style={[
            styles.notice,
            {
              outlineColor: colors.outline,
              outlineWidth: 1,
              backgroundColor: colors.surface,
              opacity: noticeOpacity.current,
              bottom: insets.bottom + 84,
            },
          ]}
        >
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 16 }}>
            {t.schedule.emptyDayState}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerInner: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notice: {
    position: 'absolute',
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});
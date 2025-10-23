// app/(modals)/edit-shedule.tsx
import React, { useMemo, useRef, useState, forwardRef, useEffect } from 'react';
import { View, ScrollView, Text, Alert, Keyboard, Dimensions } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSettings } from '@/contexts/SettingsContext';
import { useMedicine } from '@/contexts/MedicineContext';
import { useSchedule } from '@/contexts/ScheduleContext';
import { Schedule, TempMedicine, Weekday, Form as FormType } from '@/contexts/types';
import BaseModal, { BaseModalRef } from '@/app/(modals)/base-modal';
import BottomSheetSelector from '@/app/(modals)/bottom-sheet-selector';
import DateSelector from '@/app/(modals)/date-selector';
import DateEndSelector from './date-end-selector';
import TimeSelector from '@/app/(modals)/time-selector';
import {
  IconTag,
  IconDosage,
  IconClockCountdown,
  IconCalendarDots,
  IconCalendarCheckBox,
  IconCalendar,
  IconFlag,
  IconRight,
  IconPlusBold,
  IconBackspace,
  IconTrash
} from '@/constants/icons';
import AppTile from '@/components/AppTile';
import BaseTextInput from '@/components/BaseTextInput';
import BaseButton from '@/components/BaseButton';
import HorizontalScrollChips from '@/components/HorizontalScrollChips';
import BaseCheckbox from '@/components/BaseCheckbox';
import SegmentedPicker from '@/components/SegmentedPicker';
import { formatUnit } from '@/constants/locales/formatUnit';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  scheduleToEdit?: Schedule | null;
  medicineId?: string;
  modalHeight?: number | `${number}%`;
  tempMedicine?: TempMedicine | null;
}

function formatDate(date: Date, order: 'dmy' | 'ymd' | 'mdy' | 'ydm', sep: string): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  switch (order) {
    case 'dmy': return `${d}${sep}${m}${sep}${y}`;
    case 'ymd': return `${y}${sep}${m}${sep}${d}`;
    case 'mdy': return `${m}${sep}${d}${sep}${y}`;
    case 'ydm': return `${y}${sep}${d}${sep}${m}`;
    default: return date.toLocaleDateString();
  }
}

function parseISODate(isoDate: string): Date {
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day, 12, 0, 0, 0);
  }
  console.warn('Unexpected date format:', isoDate);
  return new Date();
}

const isoDateToYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const EditScheduleModal = forwardRef<BaseModalRef, Props>(({ 
  visible, 
  onDismiss, 
  scheduleToEdit = null,
  medicineId,
  modalHeight = '85%',
  tempMedicine,
}, ref) => {
  const { t, dateOrder, dateSeparator, is12HourFormat, language } = useSettings();
  const { createScheduleForMedicine, addScheduleToMedicine, updateMedicine, medicines, tempMedicine: ctxTemp} = useMedicine();
  const { addSchedule, updateSchedule, getScheduleCountForMedicine, deleteSchedule } = useSchedule();
  const { colors } = useTheme();
  const modalRef = useRef<BaseModalRef>(null);
  const isEditMode = !!scheduleToEdit;
  
  const [showStartDateSelector, setShowStartDateSelector] = useState(false);
  const [showEndDateSelector, setShowEndDateSelector] = useState(false);
  const [showDosageSelector, setShowDosageSelector] = useState(false);
  const [showTimeSelector, setShowTimeSelector] = useState(false);

  const [selectedTimeType, setSelectedTimeType] = useState<'specific' | 'start' | 'end' | 'interval'>('specific');
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);

  const [intakeTimesOption, setIntakeTimesOption] = useState<'1' | '2'>('1');
  const [intakeDaysOption, setIntakeDaysOption] = useState<'1' | '2'>('1');
  const [multipleWeekdays, setMultipleWeekdays] = useState<Weekday[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [intervalUnit, setIntervalUnit] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [intervalCount, setIntervalCount] = useState('1');
  const [editableForm, setEditableForm] = useState(false);
  const [initialSelectorTime, setInitialSelectorTime] = useState(new Date());

  const [intervalStartTime, setIntervalStartTime] = useState<string | null>(null);
  const [intervalEndTime, setIntervalEndTime] = useState<string | null>(null);
  const [intervalTimes, setIntervalTimes] = useState<string[]>([]);
  const [intervalDuration, setIntervalDuration] = useState<number | null>(null);

  const medicine = medicines.find(m => m.id === medicineId) || tempMedicine || ctxTemp || undefined;

  const [form, setForm] = useState({
    name: scheduleToEdit?.name || '',
    formAmount: scheduleToEdit?.form?.quantity?.toString() || '',
    dosageAmount: scheduleToEdit?.dosage?.amount?.toString() || '',
    dosageUnit: scheduleToEdit?.dosage?.unit || medicine?.dosage?.unit || '',
    startDate: scheduleToEdit?.startDate || '',
    endDate: scheduleToEdit?.endDate || '',
    form: medicine?.form || '',
    requiredNumberOfIntake: scheduleToEdit?.requiredNumberOfIntake?.toString() || '',
  });

  // ИСПРАВЛЕНИЕ: используем useRef для синхронного хранения вычисленных данных
  const computedDataRef = useRef<{
    intakeDays?: string[];
    requiredNumber?: number;
    endOption?: '1' | '2' | '3';
    endOptionCount?: number;
  }>({});

  const [computedIntakeDays, setComputedIntakeDays] = useState<string[] | undefined>(undefined);
  const [computedRequiredNumber, setComputedRequiredNumber] = useState<number | undefined>(undefined);
  const [computedEndOption, setComputedEndOption] = useState<'1' | '2' | '3' | undefined>(undefined);
  const [computedEndOptionCount, setComputedEndOptionCount] = useState<number | undefined>(undefined);

  const getIntakeTimesArray = () => {
    return intakeTimesOption === '1' ? [...timeSlots] : [...intervalTimes];
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hourNum = parseInt(hours, 10);
    if (is12HourFormat) {
      const period = hourNum >= 12 ? 'PM' : 'AM';
      const hour12 = hourNum % 12 || 12;
      return `${hour12}:${minutes}${period}`;
    }
    return `${hours}:${minutes}`;
  };

  const formatDuration = (dur: number) => {
    const hours = Math.floor(dur);
    const mins = Math.round((dur - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const getIntervalUnitLabel = (num: number) => {
    switch (intervalUnit) {
      case 'day': return formatUnit(t.schedule.day, num, language);
      case 'week': return formatUnit(t.schedule.week, num, language);
      case 'month': return formatUnit(t.schedule.month, num, language);
      case 'year': return formatUnit(t.schedule.year, num, language);
      default: return formatUnit(t.schedule.day, num, language);
    }
  };

  const dosageMax = useMemo(() => {
    if (
      medicine &&
      typeof medicine.quantity === 'number' &&
      medicine.dosage &&
      typeof medicine.dosage.amount === 'number'
    ) {
      return medicine.quantity * medicine.dosage.amount;
    }
    return undefined;
  }, [medicine]);

  const dosageOptions = useMemo(() => Object.keys(t.medicine.dosages.nominativeSing).map(key => ({
    label: formatUnit(t.medicine.dosages, form.dosageAmount, language, key),
    value: key
  })), [t, form.dosageAmount, language]);

  const scheduleIndex = useMemo(() => {
    if (!medicineId) return 1;
    return getScheduleCountForMedicine(medicineId) + 1;
  }, [medicineId, getScheduleCountForMedicine]);

  const defaultScheduleName = useMemo(() => {
    return t.schedule.title.replace('{index}', scheduleIndex.toString());
  }, [t, scheduleIndex]);

  const calculateIntervalTimes = () => {
    if (!intervalStartTime || !intervalEndTime || intervalDuration === null || intervalDuration <= 0) {
      setIntervalTimes([]);
      return;
    }

    const parseT = (timeStr: string) => {
      const [hh = '00', mm = '00'] = timeStr.split(':');
      const d = new Date('2000-01-01T00:00:00');
      d.setHours(parseInt(hh, 10) || 0, parseInt(mm, 10) || 0, 0, 0);
      return d;
    };

    const start = parseT(intervalStartTime);
    const end = parseT(intervalEndTime);

    const isOvernight = start > end;
    const endAdjusted = isOvernight ? new Date(end.getTime() + 24 * 60 * 60 * 1000) : end;

    const stepMs = Math.round((intervalDuration || 0) * 60 * 60 * 1000);
    if (stepMs <= 0) {
      setIntervalTimes([]);
      return;
    }

    const timesSet: string[] = [];
    let cur = new Date(start);

    while (cur.getTime() <= endAdjusted.getTime()) {
      const hours = cur.getHours().toString().padStart(2, '0');
      const mins = cur.getMinutes().toString().padStart(2, '0');
      timesSet.push(`${hours}:${mins}`);
      cur = new Date(cur.getTime() + stepMs);
    }

    const uniq = Array.from(new Set(timesSet));
    uniq.sort((a, b) => a.localeCompare(b));
    setIntervalTimes(uniq);
  };

  useEffect(() => {
    calculateIntervalTimes();
  }, [intervalStartTime, intervalEndTime, intervalDuration]);

  useEffect(() => {
    if (visible) {
      const remainder = medicine?.quantity || 0;
      let initialFormAmount = scheduleToEdit?.form?.quantity?.toString() || (remainder >= 1 ? '1' : remainder === 0 ? '0' : '');
      let initialDosageAmount = scheduleToEdit?.dosage?.amount?.toString() || '';

      if (remainder < 1 && remainder > 0 && medicine?.dosage?.amount) {
        initialFormAmount = remainder.toString();
        initialDosageAmount = (remainder * medicine.dosage.amount).toString();
      } else if (medicine?.dosage?.amount) {
        initialDosageAmount = medicine.dosage.amount.toString();
      }

      setForm({
        name: scheduleToEdit?.name || defaultScheduleName,
        formAmount: initialFormAmount,
        dosageAmount: initialDosageAmount,
        dosageUnit: scheduleToEdit?.dosage?.unit || medicine?.dosage?.unit || '',
        startDate: scheduleToEdit?.startDate || '',
        endDate: scheduleToEdit?.endDate || '',
        form: medicine?.form || '',
        requiredNumberOfIntake: scheduleToEdit?.requiredNumberOfIntake?.toString() || '',
      });

      const medQty = medicine?.quantity ?? 0;
      const unitMatches = medicine?.dosage ? (scheduleToEdit?.dosage?.unit || medicine?.dosage?.unit) === medicine.dosage.unit : true;
      setEditableForm(unitMatches && medQty !== 0);
      
      setIntakeTimesOption(scheduleToEdit?.intakeTimesOption?.option === 2 ? '2' : '1');
      setTimeSlots(scheduleToEdit?.intakeTimesOption?.intakeTimes || []);
      setIntervalStartTime(scheduleToEdit?.intakeTimesOption?.intervalStartTime ?? null);
      setIntervalEndTime(scheduleToEdit?.intakeTimesOption?.intervalEndTime ?? null);
      setIntervalDuration(scheduleToEdit?.intakeTimesOption?.intervalDuration ?? null);

      setIntakeDaysOption(scheduleToEdit?.intakeDaysOption?.option === 2 ? '2' : '1');
      setMultipleWeekdays(scheduleToEdit?.intakeDaysOption?.intakeWeekdays || []);

      if (scheduleToEdit?.intakeDaysOption?.intakeDaysInterval && scheduleToEdit?.intakeDaysOption?.intakeDaysType) {
        setIntervalCount(String(scheduleToEdit.intakeDaysOption.intakeDaysInterval));
        setIntervalUnit(scheduleToEdit.intakeDaysOption.intakeDaysType);
      } else {
        setIntervalCount('1');
        setIntervalUnit('day');
      }

      // Восстанавливаем вычисленные данные в state И в ref
      const restoredIntakeDays = scheduleToEdit?.intakeDays && scheduleToEdit.intakeDays.length ? [...scheduleToEdit.intakeDays] : undefined;
      const restoredRequired = scheduleToEdit?.requiredNumberOfIntake ?? undefined;
      const restoredEndOption = scheduleToEdit?.endOption ?? undefined;
      const restoredEndOptionCount = scheduleToEdit?.endOptionCount ?? undefined;
      
      setComputedIntakeDays(restoredIntakeDays);
      setComputedRequiredNumber(restoredRequired);
      setComputedEndOption(restoredEndOption);
      setComputedEndOptionCount(restoredEndOptionCount);
      
      // КРИТИЧЕСКИ ВАЖНО: также сохраняем в ref
      computedDataRef.current = {
        intakeDays: restoredIntakeDays,
        requiredNumber: restoredRequired,
        endOption: restoredEndOption,
        endOptionCount: restoredEndOptionCount,
      };
    }
  }, [visible, scheduleToEdit, medicine, defaultScheduleName]);

  const chipTimes1 = useMemo(() => [
    {
      id: 1,
      icon: IconPlusBold,
      colorIcon: colors.primary,
      onPress: () => {
        setSelectedTimeType('specific');
        setEditingTimeIndex(null);
        const initDate = new Date();
        initDate.setHours(12, 0, 0, 0);
        setInitialSelectorTime(initDate);
        setShowTimeSelector(true);
      },
    },
    ...timeSlots.map((time, index) => ({
      id: index + 2,
      label: formatTime(time),
      onPress: () => {
        setSelectedTimeType('specific');
        setEditingTimeIndex(index);
        const initDate = new Date();
        initDate.setSeconds(0, 0);
        const [h, m] = time.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          initDate.setHours(h, m);
        }
        setInitialSelectorTime(initDate);
        setShowTimeSelector(true);
      },
    })),
    ...(timeSlots.length > 0 ? [{
      id: -1,
      icon: IconBackspace,
      colorIcon: colors.error,
      onPress: () => setTimeSlots(prev => prev.slice(0, -1)),
    }] : []),
  ], [timeSlots, colors, is12HourFormat]);

  const chipTimes2 = useMemo(() => [
    ...intervalTimes.map((time, index) => ({
      id: index + 1,
      label: formatTime(time),
    })),
  ], [intervalTimes, is12HourFormat]);

  const getTimeSelectorTitle = () => {
    switch (selectedTimeType) {
      case 'specific':
        return editingTimeIndex !== null ? t.title.editIntakeTime : t.title.addIntakeTime;
      case 'start':
        return t.title.addStartTime;
      case 'end':
        return t.title.addEndTime;
      case 'interval':
        return t.title.intervalTime;
      default:
        return t.title.addIntakeTime;
    }
  };

  const handleDateSelect = (date: Date) => {
    const isoDate = isoDateToYMD(date);
    setForm(prev => ({
      ...prev,
      startDate: isoDate,
    }));
    setShowStartDateSelector(false);
  };

  const handleEndDateSelect = (date: Date) => {
    const isoDate = isoDateToYMD(date);
    setForm(prev => ({
      ...prev,
      endDate: isoDate,
    }));
    setComputedIntakeDays(undefined);
    setComputedRequiredNumber(undefined);
    setComputedEndOption(undefined);
    setComputedEndOptionCount(undefined);
    setShowEndDateSelector(false);
  };

  const handleDosageSelect = (value: string) => {
    setForm(prev => ({
      ...prev,
      dosageUnit: value,
      formAmount: value !== medicine?.dosage?.unit ? '' : prev.formAmount,
    }));

    const medQty = medicine?.quantity ?? 0;
    const unitMatches = value === medicine?.dosage?.unit;
    setEditableForm(unitMatches && medQty !== 0);
    setShowDosageSelector(false);
  };

  const handleTimeSelect = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    switch (selectedTimeType) {
      case 'specific':
        if (editingTimeIndex !== null) {
          if (intakeTimesOption === '1') {
            setTimeSlots(prev => prev.map((time, index) => index === editingTimeIndex ? timeString : time).sort());
          } else {
            setIntervalTimes(prev => prev.map((time, index) => index === editingTimeIndex ? timeString : time).sort());
          }
        } else {
          if (intakeTimesOption === '1') {
            if (!timeSlots.includes(timeString)) setTimeSlots(prev => [...prev, timeString].sort());
          } else {
            if (!intervalTimes.includes(timeString)) setIntervalTimes(prev => [...prev, timeString].sort());
          }
        }
        break;
      case 'start':
        setIntervalStartTime(timeString);
        break;
      case 'end':
        setIntervalEndTime(timeString);
        break;
      case 'interval':
        const hoursNum = date.getHours();
        const minsNum = date.getMinutes();
        const dur = hoursNum + minsNum / 60;
        setIntervalDuration(dur);
        break;
    }
    
    setShowTimeSelector(false);
    setEditingTimeIndex(null);
  };

  const cycleIntervalUnit = () => {
    setIntervalUnit(prev => {
      switch (prev) {
        case 'day': return 'week';
        case 'week': return 'month';
        case 'month': return 'year';
        case 'year': return 'day';
        default: return 'day';
      }
    });
  };

  const isInvalid = (): boolean => {
    const formAmt = parseFloat(form.formAmount || '0') || 0;
    const doseAmt = parseFloat(form.dosageAmount || '0') || 0;
    const hasNumber = (formAmt > 0) || (doseAmt > 0);
    if (!hasNumber) return true;

    if (intakeTimesOption === '1') {
      if (!timeSlots || timeSlots.length === 0) return true;
    } else {
      if (!intervalTimes || intervalTimes.length === 0) return true;
    }

    if (intakeDaysOption === '1') {
      if (!multipleWeekdays || multipleWeekdays.length === 0) return true;
    }

    if (!form.startDate || !form.endDate) return true;

    return false;
  };

  const handleSave = async () => {
    if (isInvalid()) {
      return;
    }

    const intakeTimesArr = getIntakeTimesArray();

    let formObj: FormType | undefined = undefined;
    const parsedFormQty = parseFloat(form.formAmount || '');
    if (!isNaN(parsedFormQty) && form.form) {
      formObj = {
        quantity: parsedFormQty,
        form: form.form,
      } as unknown as FormType;
    }

    // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: берём данные из ref вместо state
    const refData = computedDataRef.current;
    
    const finalIntakeDays = refData.intakeDays && refData.intakeDays.length > 0 
      ? [...refData.intakeDays] 
      : (scheduleToEdit?.intakeDays || []);
    
    const finalRequiredNumber = refData.requiredNumber !== undefined 
      ? refData.requiredNumber 
      : (form.requiredNumberOfIntake ? parseInt(form.requiredNumberOfIntake, 10) : scheduleToEdit?.requiredNumberOfIntake);
    
    const finalEndOption = refData.endOption || scheduleToEdit?.endOption;
    const finalEndOptionCount = refData.endOptionCount || scheduleToEdit?.endOptionCount;

    console.log('handleSave: using data from ref', {
      refData,
      finalIntakeDays,
      finalRequiredNumber,
      finalEndOption,
      finalEndOptionCount
    });

    const tempSchedule: Partial<Schedule> = {
      id: scheduleToEdit?.id || Date.now().toString(),
      name: form.name || defaultScheduleName,
      form: formObj,
      dosage: (form.dosageAmount && form.dosageUnit) ? { amount: parseFloat(form.dosageAmount), unit: form.dosageUnit } : undefined,
      intakeTimesOption: {
        option: intakeTimesOption === '2' ? 2 : 1,
        intervalStartTime: intakeTimesOption === '2' ? intervalStartTime ?? undefined : undefined,
        intervalEndTime: intakeTimesOption === '2' ? intervalEndTime ?? undefined : undefined,
        intervalDuration: intakeTimesOption === '2' ? intervalDuration ?? undefined : undefined,
        intakeTimes: intakeTimesArr,
      },
      intakeDaysOption: {
        option: intakeDaysOption === '2' ? 2 : 1,
        intakeWeekdays: intakeDaysOption === '1' ? [...multipleWeekdays] : undefined,
        intakeDaysInterval: intakeDaysOption === '2' ? (parseInt(intervalCount, 10) || 1) : undefined,
        intakeDaysType: intakeDaysOption === '2' ? intervalUnit : undefined,
      },
      startDate: form.startDate || isoDateToYMD(new Date()),
      endDate: form.endDate || undefined,
      intakeDays: finalIntakeDays,
      requiredNumberOfIntake: finalRequiredNumber,
      endOption: finalEndOption,
      endOptionCount: finalEndOptionCount,
      medicineIds: medicineId ? [medicineId] : undefined,
      status: scheduleToEdit?.status || 'active',
    };

    console.log('Saving schedule with data:', {
      intakeDays: tempSchedule.intakeDays,
      requiredNumberOfIntake: tempSchedule.requiredNumberOfIntake,
      endOption: tempSchedule.endOption,
      endOptionCount: tempSchedule.endOptionCount,
    });

    const newSchedule: Schedule = {
      id: tempSchedule.id as string,
      name: tempSchedule.name as string,
      form: tempSchedule.form,
      actualNumberOfIntake: tempSchedule.actualNumberOfIntake,
      requiredNumberOfIntake: tempSchedule.requiredNumberOfIntake,
      dosage: tempSchedule.dosage,
      intakeTimesOption: tempSchedule.intakeTimesOption as Schedule['intakeTimesOption'],
      intakeDaysOption: tempSchedule.intakeDaysOption as Schedule['intakeDaysOption'],
      startDate: tempSchedule.startDate as string,
      endDate: tempSchedule.endDate,
      intakeDays: tempSchedule.intakeDays || [],
      medicineIds: tempSchedule.medicineIds,
      intakes: tempSchedule.intakes,
      status: tempSchedule.status as Schedule['status'],
      endOption: tempSchedule.endOption,
      endOptionCount: tempSchedule.endOptionCount,
    };

    if (isEditMode) {
      updateSchedule(newSchedule);

      const med = medicines.find(m => m.id === medicineId);
      if (med) {
        const updatedMed: typeof med = {
          ...med,
          schedules: (med.schedules || []).map(s => s.id === newSchedule.id ? newSchedule : s),
        };
        await updateMedicine(updatedMed);
      }
    } else {
      try {
        const medExists = !!medicines.find(m => m.id === medicineId);

        if (medExists) {
          const scheduleDataForCreate = {
            name: newSchedule.name,
            form: newSchedule.form,
            actualNumberOfIntake: newSchedule.actualNumberOfIntake,
            requiredNumberOfIntake: newSchedule.requiredNumberOfIntake,
            dosage: newSchedule.dosage,
            intakeTimesOption: newSchedule.intakeTimesOption,
            intakeDaysOption: newSchedule.intakeDaysOption,
            startDate: newSchedule.startDate,
            endDate: newSchedule.endDate,
            intakeDays: newSchedule.intakeDays,
            status: newSchedule.status,
            endOption: newSchedule.endOption,
            endOptionCount: newSchedule.endOptionCount,
          };
          const created = await createScheduleForMedicine(medicineId!, scheduleDataForCreate);
          addSchedule(created);
        } else {
          const scheduleToAdd: Schedule = {
            ...newSchedule,
            id: newSchedule.id || Date.now().toString(),
            medicineIds: [medicineId!],
            intakes: newSchedule.intakes || [],
            status: newSchedule.status || 'active',
          };
          addSchedule(scheduleToAdd);
        }
      } catch (err) {
        console.error('Failed to create schedule:', err);
        Alert.alert(t.alerts.error, t.alerts.errorText5);
        return;
      }
    }

    onDismiss();
  };

  const firstFieldPlaceholder = useMemo(() => {
    if (form.dosageUnit !== medicine?.dosage?.unit) return '0';
    const qty = medicine?.quantity;
    if (typeof qty === 'number') {
      if (qty === 0) return '0';
      if (qty > 0 && qty < 1) return String(qty);
      if (qty >= 1) return '1';
    }
    return '1';
  }, [form.dosageUnit, medicine?.dosage?.unit, medicine?.quantity]);

  const handleDateSelectorComputed = (payload: { 
    computedIso?: string | undefined; 
    requiredNumberOfIntake?: number | undefined; 
    intakeDays?: string[] | undefined;
    endOption?: '1' | '2' | '3' | undefined;
    endOptionCount?: number | undefined;
  }) => {
    console.log('DateEndSelector computed:', payload);
    
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: сохраняем данные СИНХРОННО в ref
    computedDataRef.current = {
      intakeDays: payload.intakeDays,
      requiredNumber: payload.requiredNumberOfIntake,
      endOption: payload.endOption,
      endOptionCount: payload.endOptionCount,
    };
    
    // Также обновляем state для UI (но не полагаемся на него в handleSave)
    setComputedIntakeDays(payload.intakeDays);
    setComputedRequiredNumber(payload.requiredNumberOfIntake ?? undefined);
    setComputedEndOption(payload.endOption);
    setComputedEndOptionCount(payload.endOptionCount);
    
    if (payload.computedIso) {
      setForm(prev => ({ ...prev, endDate: payload.computedIso! }));
    }
  };

  const handleDeleteSchedule = async () => {
    if (!scheduleToEdit) return;
    try {
      await deleteSchedule(scheduleToEdit.id);
      onDismiss();
    } catch (err) {
      console.error('Failed to delete schedule:', err);
      Alert.alert(t.alerts.error, t.alerts.errorText4);
    }
  };

  return (
    <>
      <BaseModal
        ref={modalRef}
        visible={visible}
        onClose={onDismiss}
        title={isEditMode ? t.title.editSchedule : t.title.addSchedule}
        leftButtonText={t.actions.cancel}
        onLeftButtonPress={onDismiss}
        rightButtonText={t.actions.save}
        onRightButtonPress={handleSave}
        rightButtonDisabled={isInvalid()}
        maxHeight={modalHeight}
        minHeight={modalHeight}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 0 }}
          style={{ paddingHorizontal: 16 }}
        >
          <AppTile
            title={t.schedule.nameLabel}
            backgroundColor={colors.surface}
            icon={IconTag}
            iconColor={colors.primary}
            contentGap={8}
            style={{ marginVertical: 8 }}
          >
            <BaseTextInput
              value={form.name}
              onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
              placeholder={defaultScheduleName}
              borderColor={colors.outline}
              autoCapitalizeFirstLetter={true}
              centeredText={false}
            />
          </AppTile>

          <AppTile
            title={t.schedule.singleDosageLabel}
            backgroundColor={colors.surface}
            icon={IconDosage}
            iconColor={colors.primary}
            contentGap={8}
            childrenGap={8}
            style={{ marginBottom: 8 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BaseTextInput
                value={form.formAmount}
                onChangeText={(text) => {
                  const num = parseFloat(text);
                  if (!isNaN(num) && medicine?.dosage?.amount) {
                    setForm(prev => ({
                      ...prev,
                      formAmount: text,
                      dosageAmount: (num * (medicine.dosage?.amount ?? 0)).toString()
                    }));
                  } else {
                    setForm(prev => ({ ...prev, formAmount: text, dosageAmount: '' }));
                  }
                }}
                width={44}
                placeholder={firstFieldPlaceholder}
                maxDigits={4}
                keyboardType="decimal-pad"
                borderColor={colors.outline}
                editable={editableForm}
                maxValue={medicine?.quantity}
              />
              <Text
                style={{
                  fontSize: 16,
                  color: editableForm ? colors.onSurface : colors.onSurfaceDisabled,
                  fontWeight: '500',
                }}
              >
                {formatUnit(t.medicine.units, form.formAmount, language, form.form) || t.schedule.compactDosageLabel}
              </Text>
              <Text style={{ 
                fontSize: 16, 
                color: editableForm ? colors.onSurface : colors.onSurfaceDisabled, 
                fontWeight: '500',
              }}>
                {'-'}
              </Text>
              <BaseTextInput
                value={form.dosageAmount}
                onChangeText={(text) => {
                  const num = parseFloat(text);
                  if (!isNaN(num) && form.dosageUnit === medicine?.dosage?.unit && medicine?.dosage?.amount) {
                    setForm(prev => ({
                      ...prev,
                      dosageAmount: text,
                      formAmount: (num / (medicine.dosage?.amount ?? 0)).toString()
                    }));
                  } else {
                    setForm(prev => ({ ...prev, dosageAmount: text }));
                  }
                }}
                width={44}
                maxDigits={4}
                placeholder={medicine?.dosage?.amount?.toString() || ''}
                keyboardType="decimal-pad"
                borderColor={colors.outline}
                maxValue={editableForm ? dosageMax : undefined}
              />
              <BaseButton
                label={
                  form.dosageUnit ? formatUnit(t.medicine.dosages, form.dosageAmount, language, form.dosageUnit) : t.schedule.compactDosageLabel
                }
                textColor={colors.primary}
                style={{ flex: 1 }}
                color={colors.surface}
                onPress={() => setShowDosageSelector(true)}
                borderColor={colors.outline}
              />
            </View>
          </AppTile>

          <AppTile
            title={t.schedule.intakeTimesLabel}
            backgroundColor={colors.surface}
            icon={IconClockCountdown}
            iconColor={colors.primary}
            contentGap={8}
            childrenGap={8}
            style={{ marginBottom: 8 }}
          >
            <SegmentedPicker
              options={[
                { value: '1', label: t.schedule.specificTimeOption },
                { value: '2', label: t.schedule.intervalsOption },
              ]}
              value={intakeTimesOption}
              onChange={setIntakeTimesOption}
            />
            {intakeTimesOption === '1' ? (
              <HorizontalScrollChips items={chipTimes1} />
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', outlineColor: colors.outline }}>
                  <Text style={{ fontSize: 16, color: colors.onSurface, fontWeight: '500', textAlign: 'center' }}>
                    {t.schedule.timeLapseStart}
                  </Text>
                  {intervalStartTime ? (
                    <BaseButton 
                      style={{ height: 28 }}
                      textStyle={{ fontSize: 15 }}
                      label={formatTime(intervalStartTime)}
                      color={colors.surfaceDisabled} 
                      textColor={colors.primary}
                      onPress={() => {
                        setSelectedTimeType('start');
                        const initDate = new Date();
                        initDate.setSeconds(0, 0);
                        if (intervalStartTime) {
                          const [h, m] = intervalStartTime.split(':').map(Number);
                          if (!isNaN(h) && !isNaN(m)) {
                            initDate.setHours(h, m);
                          }
                        }
                        setInitialSelectorTime(initDate);
                        setShowTimeSelector(true);
                      }} 
                      width={'19%'} 
                    />
                  ) : (
                    <BaseButton 
                      style={{ height: 28 }}
                      icon={IconPlusBold}
                      color={colors.surfaceDisabled} 
                      textColor={colors.primary} 
                      onPress={() => {
                        setSelectedTimeType('start');
                        const initDate = new Date();
                        initDate.setHours(8, 0, 0, 0);
                        setInitialSelectorTime(initDate);
                        setShowTimeSelector(true);
                      }} 
                      width={'19%'} 
                    />
                  )}
                  <Text style={{ fontSize: 16, color: colors.onSurface, fontWeight: '500', textAlign: 'center' }}>
                    {t.schedule.timeLapseBeforeEnd}
                  </Text>
                  {intervalEndTime ? (
                    <BaseButton 
                      style={{ height: 28 }}
                      textStyle={{ fontSize: 15 }}
                      label={formatTime(intervalEndTime)}
                      color={colors.surfaceDisabled} 
                      textColor={colors.primary} 
                      onPress={() => {
                        setSelectedTimeType('end');
                        const initDate = new Date();
                        initDate.setSeconds(0, 0);
                        if (intervalEndTime) {
                          const [h, m] = intervalEndTime.split(':').map(Number);
                          if (!isNaN(h) && !isNaN(m)) {
                            initDate.setHours(h, m);
                          }
                        }
                        setInitialSelectorTime(initDate);
                        setShowTimeSelector(true);
                      }} 
                      width={'19%'} 
                    />
                  ) : (
                    <BaseButton 
                      style={{ height: 28 }}
                      icon={IconPlusBold}
                      color={colors.surfaceDisabled} 
                      textColor={colors.primary} 
                      onPress={() => {
                        setSelectedTimeType('end');
                        const initDate = new Date();
                        initDate.setHours(20, 0, 0, 0);
                        setInitialSelectorTime(initDate);
                        setShowTimeSelector(true);
                      }} 
                      width={'19%'} 
                    />
                  )}
                  <Text style={{ fontSize: 16, color: colors.onSurface, fontWeight: '500', textAlign: 'center' }}>
                    {t.schedule.intervalDays.nominativePlur}
                  </Text>
                  {intervalDuration !== null ? (
                    <BaseButton 
                      style={{ height: 28 }}
                      label={formatDuration(intervalDuration)}
                      color={colors.surfaceDisabled} 
                      textColor={colors.primary} 
                      onPress={() => {
                        setSelectedTimeType('interval');
                        const initDate = new Date();
                        initDate.setSeconds(0, 0);
                        if (intervalDuration !== null) {
                          const hours = Math.floor(intervalDuration);
                          const mins = Math.round((intervalDuration - hours) * 60);
                          initDate.setHours(hours, mins);
                        }
                        setInitialSelectorTime(initDate);
                        setShowTimeSelector(true);
                      }} 
                      width={'19%'} 
                    />
                  ) : (
                    <BaseButton 
                      style={{ height: 28 }}
                      icon={IconPlusBold} 
                      color={colors.surfaceDisabled} 
                      textColor={colors.primary} 
                      onPress={() => {
                        setSelectedTimeType('interval');
                        const initDate = new Date();
                        initDate.setHours(12, 0, 0, 0);
                        setInitialSelectorTime(initDate);
                        setShowTimeSelector(true);
                      }} 
                      width={'19%'} 
                    />
                  )}
                </View>
                <HorizontalScrollChips items={chipTimes2} />
              </>
            )}
          </AppTile>

          <AppTile
            title={t.schedule.intakeDaysLabel}
            backgroundColor={colors.surface}
            icon={IconCalendarDots}
            iconColor={colors.primary}
            contentGap={8}
            childrenGap={8}
            style={{ marginBottom: 8 }}
          >
            <SegmentedPicker
              options={[
                { value: '1', label: t.schedule.weekdaysOption },
                { value: '2', label: t.schedule.intervalsOption },
              ]}
              value={intakeDaysOption}
              onChange={setIntakeDaysOption}
            />
            {intakeDaysOption === '1' ? (
              <BaseCheckbox
                items={[
                  { value: 'mo', label: t.date.weekdaysShort[1] },
                  { value: 'tu', label: t.date.weekdaysShort[2] },
                  { value: 'we', label: t.date.weekdaysShort[3] },
                  { value: 'th', label: t.date.weekdaysShort[4] },
                  { value: 'fr', label: t.date.weekdaysShort[5] },
                  { value: 'sa', label: t.date.weekdaysShort[6] },
                  { value: 'su', label: t.date.weekdaysShort[0] },
                ]}
                value={multipleWeekdays}
                onChange={(v) => setMultipleWeekdays(v as Weekday[])}
                multiple={true}
                checkedIcon={IconCalendarCheckBox}
                uncheckedIcon={IconCalendar}
                columns={7}
              />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16, color: colors.onSurface, fontWeight: '500' }}>
                  {formatUnit(intervalUnit == 'week' ? t.schedule.intervalDaysF : t.schedule.intervalDays, parseInt(intervalCount, 10) || 1, language)}
                </Text>
                <BaseTextInput
                  value={intervalCount}
                  placeholder={'0'}
                  onChangeText={(text) => setIntervalCount(text)}
                  style={{ flex: 1 }}
                  maxDigits={5}
                  keyboardType="decimal-pad"
                  borderColor={colors.outline}
                  minValue={1}
                  integerOnly={true}
                />
                <BaseButton
                  label={getIntervalUnitLabel(parseInt(intervalCount, 10) || 1)}
                  color={colors.surface}
                  textColor={colors.primary}
                  onPress={cycleIntervalUnit}
                  width={(Dimensions.get('window').width - 72) / 2}
                  borderColor={colors.outline}
                />
              </View>
            )}
          </AppTile>

          <AppTile
            title={t.schedule.periodLabel}
            backgroundColor={colors.surface}
            icon={IconFlag}
            contentGap={8}
            iconColor={colors.primary}
            style={{ marginBottom: 8, paddingBottom: 8 }}
          >
            <AppTile
              title={t.schedule.dateStart}
              backgroundColor={colors.surface}
              style={{ marginHorizontal: -8, borderRadius: 12 }}
              titleStyle={{ fontWeight: '500' }}
              actions={<IconRight width={24} height={24} fill={'#AEAEAE'} />}
              actionsText={form.startDate ? formatDate(new Date(form.startDate), dateOrder as any, dateSeparator) : t.actions.select}
              paddingVertical={8}
              paddingHorizontal={8}
              onPress={() => {
                Keyboard.dismiss();
                setShowStartDateSelector(true);
              }}
            />
            <AppTile
              title={t.schedule.dateEnd}
              backgroundColor={colors.surface}
              style={{ marginHorizontal: -8, borderRadius: 12 }}
              titleStyle={{ fontWeight: '500' }}
              actions={<IconRight width={24} height={24} fill={'#AEAEAE'} />}
              actionsText={form.endDate ? formatDate(new Date(form.endDate), dateOrder as any, dateSeparator) : t.actions.select}
              paddingVertical={8}
              paddingHorizontal={8}
              onPress={() => {
                Keyboard.dismiss();
                setShowEndDateSelector(true);
              }}
            />
          </AppTile>

          {isEditMode && (
            <AppTile
              title={t.actions.deleteSchedule}
              backgroundColor={colors.surface}
              icon={IconTrash}
              iconColor={colors.error}
              style={{ marginVertical: 8 }}
              onPress={handleDeleteSchedule}
            />
          )}
        </ScrollView>

        <BottomSheetSelector
          visible={showDosageSelector}
          title={t.medicine.dosageLabel}
          options={dosageOptions}
          quantity={form.dosageAmount}
          onSelect={handleDosageSelect}
          onDismiss={() => setShowDosageSelector(false)}
          modalHeight={modalHeight}
          selectedValue={form.dosageUnit}
        />

        <DateSelector
          visible={showStartDateSelector}
          title={t.schedule.dateStart}
          date={form.startDate ? parseISODate(form.startDate) : new Date()}
          onCancel={() => setShowStartDateSelector(false)}
          onChange={handleDateSelect}
        />

        <DateEndSelector
          visible={showEndDateSelector}
          title={t.schedule.dateEnd}
          date={form.endDate ? parseISODate(form.endDate) : new Date()}
          onCancel={() => setShowEndDateSelector(false)}
          onChange={handleEndDateSelect}
          medicine={medicine}
          schedule={scheduleToEdit ?? undefined}
          startDateOverride={form.startDate || undefined}
          intakeDaysOptionOverride={{
            option: intakeDaysOption === '2' ? 2 : 1,
            intakeWeekdays: intakeDaysOption === '1' ? multipleWeekdays : undefined,
            intakeDaysInterval: intakeDaysOption === '2' ? (parseInt(intervalCount, 10) || 1) : undefined,
            intakeDaysType: intakeDaysOption === '2' ? intervalUnit : undefined,
          }}
          intakeTimesOptionOverride={{
            option: intakeTimesOption === '2' ? 2 : 1,
            intervalStartTime: intakeTimesOption === '2' ? intervalStartTime ?? undefined : undefined,
            intervalEndTime: intakeTimesOption === '2' ? intervalEndTime ?? undefined : undefined,
            intervalDuration: intakeTimesOption === '2' ? intervalDuration ?? undefined : undefined,
            intakeTimes: intakeTimesOption === '1' ? timeSlots : intervalTimes,
          }}
          formOverride={form.formAmount ? (isNaN(parseFloat(form.formAmount)) ? undefined : { quantity: parseFloat(form.formAmount), form: form.form } as unknown as Schedule['form']) : undefined}
          onComputed={handleDateSelectorComputed}
        />

        <TimeSelector
          visible={showTimeSelector}
          time={initialSelectorTime}
          onCancel={() => setShowTimeSelector(false)}
          onChange={handleTimeSelect}
          title={getTimeSelectorTitle()}
          force12HourFormat={selectedTimeType === 'interval' ? false : null}
        />
      </BaseModal>
    </>
  );
});
export default EditScheduleModal;
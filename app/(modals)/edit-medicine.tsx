// app/(modals)/AddMedicineModal.tsx
import React, { useMemo, useRef, useState, forwardRef, useEffect } from 'react';
import { View, Text, Alert, Keyboard, LayoutChangeEvent, Dimensions, Platform, Pressable } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useMedicine } from '@/contexts/MedicineContext';
import { useSchedule } from '@/contexts/ScheduleContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Medicine, TempMedicine, Schedule, Weekday } from '@/contexts/types';
import BaseModal, { BaseModalRef } from '@/app/(modals)/base-modal';
import BottomSheetSelector from '@/app/(modals)/bottom-sheet-selector';
import DateSelector from '@/app/(modals)/date-selector';
import EditScheduleModal from '@/app/(modals)/edit-shedule';
import {
  IconQuantity,
  IconDosage,
  IconTrash,
  IconPrescription,
  IconRight,
  IconPlusBold,
  IconCalendarDots,
  IconCalendarX,
  IconArchive,
  IconActive,
  IconCalendarSlash,
} from '@/constants/icons';
import AppTile from '@/components/AppTile';
import BaseTextInput from '@/components/BaseTextInput';
import BaseButton from '@/components/BaseButton';
import { formatUnit } from '@/constants/locales/formatUnit';
import HorizontalScrollChips from '@/components/HorizontalScrollChips';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  medicineToEdit?: Medicine | null;
}

function formatDate(
  date: Date,
  order: 'dmy' | 'ymd' | 'mdy' | 'ydm',
  sep: string
): string {
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
  console.warn('Unexpected expiryDate format:', isoDate);
  return new Date();
}

function getTodayLocalDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getLocalDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const AddMedicineModal = forwardRef<BaseModalRef, Props>(({ visible, onDismiss, medicineToEdit = null }, ref) => {
  const { addMedicine, updateMedicine, deleteMedicine, setTempMedicine, updateMedicineStatus, tempMedicine } = useMedicine();
  const { getSchedulesForMedicine, deleteSchedule } = useSchedule();
  const { dateOrder, dateSeparator, t, language } = useSettings();
  const { colors } = useTheme();
  const modalRef = useRef<BaseModalRef>(null);
  const isEditMode = !!medicineToEdit;
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [showFormSelector, setShowFormSelector] = useState(false);
  const [showDosageSelector, setShowDosageSelector] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [modalHeight, setModalHeight] = useState<number | `${number}%`>('90%');
  const [tempMedicineId] = useState(() => Math.random().toString());
  
  // Отслеживаем, была ли выбрана дата срока годности
  const [expiryDateSelected, setExpiryDateSelected] = useState(false);

  const [form, setForm] = useState({
    name: '',
    quantity: '',
    form: '',
    dosageAmount: '',
    dosageUnit: '',
    expiryDate: new Date(),
  });

  // schedules state
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showEditSchedule, setShowEditSchedule] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | undefined>(undefined);

  useEffect(() => {
    if (visible) {
      if (medicineToEdit) {
        setForm({
          name: medicineToEdit.name,
          quantity: String(medicineToEdit.quantity),
          form: medicineToEdit.form,
          dosageAmount: medicineToEdit.dosage?.amount ? String(medicineToEdit.dosage.amount) : '',
          dosageUnit: medicineToEdit.dosage?.unit ?? '',
          expiryDate: parseISODate(medicineToEdit.expiryDate),
        });
        setExpiryDateSelected(true);
      } else {
        setForm({
          name: '',
          quantity: '',
          form: '',
          dosageAmount: '',
          dosageUnit: '',
          expiryDate: new Date(),
        });
        setExpiryDateSelected(false);
      }
    }
  }, [medicineToEdit, visible]);

  // update temp medicine in context
  useEffect(() => {
    if (visible && !isInvalid()) {
      const quantity = parseFloat(String(form.quantity)) || 0;
      const dosageAmount = parseFloat(String(form.dosageAmount)) || 0;
      const expiryDateString = `${form.expiryDate.getFullYear()}-${String(form.expiryDate.getMonth() + 1).padStart(2, '0')}-${String(form.expiryDate.getDate()).padStart(2, '0')}`;

      const temp: TempMedicine = {
        id: isEditMode && medicineToEdit ? medicineToEdit.id : tempMedicineId,
        name: form.name,
        form: form.form,
        quantity,
        expiryDate: expiryDateSelected ? expiryDateString : undefined,
        dosage: form.dosageUnit === 'none' ? undefined : {
          amount: dosageAmount,
          unit: form.dosageUnit,
        },
      };

      setTempMedicine(temp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, visible, isEditMode, medicineToEdit, tempMedicineId]);

  // clear temp medicine on close
  useEffect(() => {
    if (!visible) {
      setTempMedicine(null);
    }
  }, [visible, setTempMedicine]);

  // scroll refs
  const scrollRef = useRef<any>(null);
  const scrollOffsetRef = useRef<number>(0);

  const formOptions = useMemo(() => [
    'piece', 'tablet', 'capsule', 'drops', 'ampoule', 'bottle',
    'dragee', 'lozenge', 'suppository', 'powder', 'granules',
    'syrup', 'ointment', 'patch', 'aerosol', 'inhaler',
    'solution', 'suspension', 'emulsion', 'substance'
  ].map((key) => ({
    label: formatUnit(t.medicine.units, form.quantity, language, key),
    value: key,
  })), [t, form.quantity, language]);

  const dosageOptions = useMemo(() => [
    'g', 'mg', 'mcg', 'mgPerG', 'mcgPerG', 'ml', 'gPerL', 'gPerMl',
    'mgPerMl', 'mcgPerMl', 'iu', 'iuPerG', 'iuPerMl', 'percent', 'mm', 'cm',
    'dose', 'drop', 'spray', 'inhalation', 'injection', 'suppository',
    'application', 'tsp', 'dsp', 'tbsp', 'cup', 'none'
  ].map((key) => ({
    label: formatUnit(t.medicine.dosages, form.dosageAmount, language, key),
    value: key,
  })), [t, form.dosageAmount, language]);

  const handleClose = () => {
    setTempMedicine(null);
    modalRef.current?.closeModal(onDismiss);
  };

  const isInvalid = () => {
    const quantity = parseFloat(String(form.quantity));
    return !form.name || !form.form || Number.isNaN(quantity) || !expiryDateSelected;
  };
  
  // Проверка: можно ли добавлять расписание
  const canAddSchedule = () => {
    const quantity = parseFloat(String(form.quantity));
    // 'form.form' - это единица измерения (напр. 'tablet'), она обязательна
    return form.form && !Number.isNaN(quantity) && expiryDateSelected;
  };
  
  // Проверка: есть ли уже расписание
  const hasSchedule = schedules.length > 0;

  const handleSubmit = async () => {
    const quantity = parseFloat(String(form.quantity)) || 0;
    const dosageAmount = parseFloat(String(form.dosageAmount)) || 0;
    if (isInvalid()) {
      try {
        scrollRef.current?.scrollToPosition?.(0, 0, true);
      } catch {
        try { scrollRef.current?.scrollTo?.({ y: 0, animated: true }); } catch {}
      }
      return;
    }
    // Проверка количества приемов
    const totalIntakes = schedules.reduce((sum, schedule) => {
      return sum + (schedule.requiredNumberOfIntake || 0);
    }, 0);
    const saveData = async () => {
      const expiryDateString = `${form.expiryDate.getFullYear()}-${String(form.expiryDate.getMonth() + 1).padStart(2, '0')}-${String(form.expiryDate.getDate()).padStart(2, '0')}`;
      const data: Medicine = {
        id: isEditMode && medicineToEdit ? medicineToEdit.id : tempMedicineId,
        name: form.name,
        form: form.form,
        quantity,
        expiryDate: expiryDateString,
        dosage: form.dosageUnit === 'none' ? undefined: {
          amount: dosageAmount,
          unit: form.dosageUnit,
        },
        schedules: schedules,
        intakesId: isEditMode && medicineToEdit ? medicineToEdit.intakesId : [],
        status: isEditMode && medicineToEdit ? medicineToEdit.status : 'active',
      };
      try {
        if (isEditMode && medicineToEdit) {
          await updateMedicine(data);
        } else {
          await addMedicine(data);
        }
      } catch (err) {
        console.error('Failed to save medicine:', err);
        Alert.alert(t.alerts.error, t.alerts.errorText3);
        return;
      }
      setTempMedicine(null);
      modalRef.current?.closeModal(onDismiss);
    };
    if (totalIntakes > 1500) {
      Alert.alert(
        t.alerts.warning,
        t.alerts.tooManyIntakes.replace('{N}', String(totalIntakes)),
        [
          {
            text: t.actions.cancel,
            style: "cancel",
            onPress: () => {}
          },
          {
            text: t.actions.save,
            style: "default",
            onPress: saveData
          }
        ],
        { cancelable: true }
      );
    } else {
      await saveData();
    }
  };

  const handleDeleteMedicine = async () => {
    if (!medicineToEdit) return;
    const quantity = parseFloat(String(form.quantity).replace(',', '.')) || 0;

    const expiryDate = getLocalDate(form.expiryDate);
    const today = getTodayLocalDate();
    const diffTime = expiryDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (quantity === 0 || daysLeft < 0) {
      try {
        await deleteMedicine(medicineToEdit.id);
        handleClose();
      } catch (err) {
        console.error('Failed to delete medicine:', err);
        Alert.alert(t.alerts.error, t.alerts.errorText2);
      }
    } else {
      Alert.alert(
        t.actions.confirm,
        t.alerts.deleteMedicineConfirm,
        [{
          text: t.actions.cancel,
          style: "cancel",
          onPress: () => {}
        }, {
          text: t.actions.delete,
          style: "destructive",
          onPress: confirmDelete
        }],
        { cancelable: true }
      );
    }
  };

  const confirmDelete = async () => {
    if (!medicineToEdit) return;
    try {
      await deleteMedicine(medicineToEdit.id);
      handleClose();
    } catch (err) {
      console.error('Failed to delete medicine:', err);
      Alert.alert(t.alerts.error, t.alerts.errorText2);
    }
  };

  // --- ИЗМЕНЕНИЕ (Пункт 1, 2): Новые функции для удаления расписания ---

  /**
   * Вызывается при нажатии на иконку удаления расписания.
   * Проверяет, есть ли приемы, и показывает алерт, если есть.
   */
  const handleDeleteSchedulePress = (scheduleToDelete: Schedule) => {
    // Проверяем, есть ли у расписания сгенерированные приемы
    // (intakes мог быть еще не сохранен в medicine, но он есть в объекте schedule из ScheduleContext)
    const hasIntakes = scheduleToDelete.intakes && scheduleToDelete.intakes.length > 0;
      Alert.alert(
        t.actions.confirm, // "Подтверждение"
        t.alerts.deleteScheduleConfirm, // "Все связанные приёмы..."
        [{
          text: t.actions.cancel, // "Отмена"
          style: "cancel",
          onPress: () => {}
        }, {
          text: t.actions.delete, // "Удалить"
          style: "destructive",
          onPress: () => confirmScheduleDelete(scheduleToDelete.id)
        }],
        { cancelable: true }
      );
  };

  /**
   * Окончательно удаляет расписание из глобального ScheduleContext
   * и из локального состояния этого модального окна.
   */
  const confirmScheduleDelete = (scheduleId: string) => {
    try {
      // 1. Удаляем из глобального ScheduleContext
      deleteSchedule(scheduleId);
      
      // 2. Обновляем локальный state, чтобы плитка исчезла
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));

    } catch (err) {
      console.error('Failed to delete schedule:', err);
      Alert.alert(t.alerts.error, t.alerts.errorText4); // 'Не удалось удалить расписание'
    }
  };
  // --- Конец новых функций ---

  const handleArchiveMedicine = async () => {
    if (medicineToEdit) {
      try {
        await updateMedicineStatus(medicineToEdit.id, 'archived');
      } catch (err) {
        console.error(err);
      }
    }
    handleClose();
  };

  const handleActivateMedicine = async () => {
    if (medicineToEdit) {
      try {
        await updateMedicineStatus(medicineToEdit.id, 'active');
      } catch (err) {
        console.error(err);
      }
    }
    handleClose();
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setModalHeight(`${Math.round((height + 128) / Dimensions.get('window').height * 100)}%`);
  };

  const unitLabel =
    t.medicine.units.genitiveSingHeading?.[form.form as keyof typeof t.medicine.units.nominativeSing] ??
    t.medicine.unitDefault;
  const unitLabelLower =
    unitLabel.charAt(0).toLowerCase() + unitLabel.slice(1);

  // ---- SCHEDULES: load schedules for this medicine (or temp medicine id) ----
  const medicineIdForSchedules = isEditMode && medicineToEdit ? medicineToEdit.id : tempMedicineId;

  useEffect(() => {
    if (visible) {
      const s = getSchedulesForMedicine(medicineIdForSchedules) || [];
      setSchedules(s);
    } else {
      setSchedules([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, medicineIdForSchedules, getSchedulesForMedicine, tempMedicine]);

  // Refresh schedules when schedule modal (edit/create) closes
  useEffect(() => {
    if (!showEditSchedule) {
      const s = getSchedulesForMedicine(medicineIdForSchedules) || [];
      setSchedules(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEditSchedule, getSchedulesForMedicine, medicineIdForSchedules]);

  const formatTimeForDisplay = (time?: string) => {
    if (!time) return '';
    const [h = '00', m = '00'] = time.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  };

  const weekdayToLabel = (wd: Weekday) => {
    switch (wd) {
      case 'mo': return t.date.weekdaysShort[1] ?? 'Mo';
      case 'tu': return t.date.weekdaysShort[2] ?? 'Tu';
      case 'we': return t.date.weekdaysShort[3] ?? 'We';
      case 'th': return t.date.weekdaysShort[4] ?? 'Th';
      case 'fr': return t.date.weekdaysShort[5] ?? 'Fr';
      case 'sa': return t.date.weekdaysShort[6] ?? 'Sa';
      case 'su': return t.date.weekdaysShort[0] ?? 'Su';
      default: return String(wd);
    }
  };

  const getIntervalUnitLabel = (num: number, unit?: 'day' | 'week' | 'month' | 'year') => {
    if (!unit) return unit ?? '';
    switch (unit) {
      case 'day': return formatUnit(t.schedule.day, num, language);
      case 'week': return formatUnit(t.schedule.week, num, language);
      case 'month': return formatUnit(t.schedule.month, num, language);
      case 'year': return formatUnit(t.schedule.year, num, language);
      default: return formatUnit(t.schedule.day, num, language);
    }
  };

  // Determine current medicine (existing or temp)
  const currentMedicine = (isEditMode && medicineToEdit) ? medicineToEdit : tempMedicine ?? undefined;

  const buildPerIntakeLabel = (schedule: Schedule): string => {
    const dosageAmount =
      schedule.dosage?.amount !== undefined && Number(schedule.dosage.amount) !== 0
        ? String(schedule.dosage.amount)
        : '';
    const dosageUnit = schedule.dosage?.unit
      ? formatUnit(t.medicine.dosages, String(schedule.dosage?.amount ?? ''), language, schedule.dosage.unit)
      : '';
    const formQuantity =
      schedule.form?.quantity !== undefined && Number(schedule.form.quantity) !== 0
        ? schedule.form.quantity
        : '';
    const formForm = schedule.form?.form
      ? formatUnit(t.medicine.units, String(formQuantity ?? ''), language, schedule.form.form)
      : '';
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
  };

  // Проверка: все ли дни недели выбраны
  const isAllWeekdays = (weekdays: Weekday[]) => {
    return weekdays.length === 7;
  };

  // Проверка: каждый день (интервал 1 день)
  const isEveryDay = (interval?: number, type?: 'day' | 'week' | 'month' | 'year') => {
    return interval === 1 && type === 'day';
  };

  const renderScheduleTile = (schedule: Schedule) => {
    console.log('Rendering schedule tile:', {
      id: schedule.id,
      name: schedule.name,
      requiredNumberOfIntake: schedule.requiredNumberOfIntake,
      intakeDays: schedule.intakeDays,
      endOption: schedule.endOption,
      endOptionCount: schedule.endOptionCount,
    });
    
    const times = schedule.intakeTimesOption?.intakeTimes ?? [];
    const chips = times.map((time, idx) => ({ id: idx.toString(), label: formatTimeForDisplay(time) }));

    // days display (either weekdays or "every N unit")
    let daysDisplay = '';
    if (schedule.intakeDaysOption?.option === 1) {
      const wk = schedule.intakeDaysOption?.intakeWeekdays ?? [];
      if (isAllWeekdays(wk)) {
        daysDisplay = t.schedule.allDays;
      } else {
        daysDisplay = wk.length > 0 ? wk.map(weekdayToLabel).join(', ') : '';
      }
    } else if (schedule.intakeDaysOption?.option === 2) {
      const cnt = schedule.intakeDaysOption?.intakeDaysInterval ?? undefined;
      const unit = schedule.intakeDaysOption?.intakeDaysType ?? undefined;
      if (isEveryDay(cnt, unit)) {
        daysDisplay = t.schedule.allDays;
      } else {
        daysDisplay = cnt ? `${formatUnit(unit === 'week' ? t.schedule.intervalDaysF : t.schedule.intervalDays, cnt, language)} ${cnt} ${getIntervalUnitLabel(cnt, unit)}` : '';
      }
    }

    const start = schedule.startDate ? formatDate(parseISODate(schedule.startDate), dateOrder, dateSeparator) : '';
    const end = schedule.endDate ? formatDate(parseISODate(schedule.endDate), dateOrder, dateSeparator) : '';
    const required = schedule.requiredNumberOfIntake !== undefined ? String(schedule.requiredNumberOfIntake) : '';

    console.log('Required number for display:', required);

    const perIntakeLabel = buildPerIntakeLabel(schedule);

    return (
      <AppTile
        key={schedule.id}
        title={schedule.name ?? ''}
        backgroundColor={colors.surface}
        icon={IconCalendarDots}
        iconColor={colors.primary}
        contentGap={8}
        style={{ marginBottom: 8 }}
        // onPress={() => { 
        //   console.log('Opening EditScheduleModal with schedule:', schedule); // ДОБАВЬТЕ ЭТО
        //   setEditingSchedule(schedule); // Убедитесь, что передаётся полный schedule
        //   setShowEditSchedule(true); 
        // }}
        actions={
          <Pressable style={{paddingRight: 2}} onPress={() => handleDeleteSchedulePress(schedule)}>
            <IconCalendarSlash width={24} height={24}  fill={colors.error} />
          </Pressable>
        }
      >
        {chips.length > 0 && <HorizontalScrollChips items={chips} />}

        {perIntakeLabel !== '' && (
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.onSurface, marginTop: 8 }}>
            {perIntakeLabel}
          </Text>
        )}

        <Text style={{ fontSize: 16, fontWeight: '500', color: colors.onSurface, marginTop: 8 }}>
          {t.schedule.intakeDays}{' '}{daysDisplay}
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '500', color: colors.onSurface, marginTop: 8 }}>
          {t.schedule.dateStart}{':'} {start}
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '500', color: colors.onSurface, marginTop: 8 }}>
          {t.schedule.dateEnd}{':'} {end}
        </Text>

        {required && (
          <Text style={{ fontSize: 16, fontWeight: '500', color: colors.onSurface, marginTop: 8 }}>
            {t.schedule.numberOfIntake.replace('{N}', required)}
          </Text>
        )}
      </AppTile>
    );
  };

  const handleAddSchedulePress = () => {
    if (!canAddSchedule()) {
      Alert.alert(
        t.alerts.info, t.alerts.infoText3.replace('{label}', t.medicine.quantityLabel)
      );
      return;
    }
    
    if (hasSchedule) {
      Alert.alert(
        t.alerts.info, t.alerts.infoText4
      );
      return;
    }
    
    setEditingSchedule(undefined);
    setShowEditSchedule(true);
    setShowScheduleModal(false);
  };

  return (
    <BaseModal
      ref={modalRef}
      visible={visible}
      onClose={handleClose}
      title={isEditMode ? t.title.editMedicine : t.title.addMedicine}
      leftButtonText={t.actions.cancel}
      onLeftButtonPress={handleClose}
      rightButtonText={t.actions.save}
      onRightButtonPress={handleSubmit}
      rightButtonDisabled={isInvalid()}
    >
      <KeyboardAwareScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 0, paddingHorizontal: 16 }}
        enableOnAndroid={true}
        keyboardOpeningTime={250}
        resetScrollToCoords={{ x: 0, y: 0 }}
        scrollToOverflowEnabled={true}
        enableAutomaticScroll={false}
        onScroll={(e) => {
          scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <AppTile
          title={t.medicine.nameLabel}
          backgroundColor={colors.surface}
          icon={IconPrescription}
          iconColor={colors.primary}
          contentGap={8}
          style={{ marginVertical: 8 }}
        >
          <BaseTextInput
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
            placeholder={t.medicine.namePlaceholderExample}
            borderColor={colors.outline}
            autoCapitalizeFirstLetter={true}
            centeredText={false}
            scrollViewRef={scrollRef}
            scrollOffsetRef={scrollOffsetRef}
            extraKeyboardOffset={20}
          />
        </AppTile>

        <AppTile
          title={t.medicine.quantityLabel}
          backgroundColor={colors.surface}
          icon={IconQuantity}
          iconColor={colors.primary}
          contentGap={8}
          style={{ marginBottom: 8 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <BaseTextInput
              value={form.quantity}
              onChangeText={(text) => setForm({ ...form, quantity: text })}
              width={'32%'}
              maxDigits={9}
              keyboardType="decimal-pad"
              placeholder="0"
              borderColor={colors.outline}
              scrollViewRef={scrollRef}
              scrollOffsetRef={scrollOffsetRef}
              extraKeyboardOffset={20}
            />
            <BaseButton
              label={form.form ? formOptions.find((f) => f.value === form.form)?.label
                ?? t.medicine.selectUnitPlaceholder : t.medicine.selectUnitPlaceholder}
              textColor={colors.primary}
              color={colors.surface}
              style={{ flex: 1 }}
              onPress={() => {
                setShowFormSelector(true);
                setShowDosageSelector(false);
              }}
              borderColor={colors.outline}
            />
          </View>
        </AppTile>

        <AppTile
          title={t.medicine.dosageLabelOneUnit.replace('{unit}', unitLabelLower)}
          backgroundColor={colors.surface}
          icon={IconDosage}
          iconColor={colors.primary}
          contentGap={8}
          style={{ marginBottom: 8 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <BaseTextInput
              value={form.dosageAmount}
              onChangeText={(text) => setForm({ ...form, dosageAmount: text })}
              width={'32%'}
              maxDigits={9}
              keyboardType="decimal-pad"
              placeholder="0"
              borderColor={colors.outline}
              scrollViewRef={scrollRef}
              scrollOffsetRef={scrollOffsetRef}
              extraKeyboardOffset={20}
            />
            <BaseButton
              label={form.dosageUnit ? dosageOptions.find((d) => d.value === form.dosageUnit)?.label
                ?? t.medicine.selectDosagePlaceholder : t.medicine.selectDosagePlaceholder}
              textColor={colors.primary}
              style={{ flex: 1 }}
              color={colors.surface}
              onPress={() => {
                setShowDosageSelector(true);
                setShowFormSelector(false);
              }}
              borderColor={colors.outline}
            />
          </View>
        </AppTile>

        <AppTile
          title={t.medicine.expiryDateLabel}
          backgroundColor={colors.surface}
          icon={IconCalendarX}
          iconColor={colors.primary}
          style={{ marginBottom: 8 }}
          actions={<IconRight width={24} height={24} fill={"#AEAEAE"} />}
          actionsText={expiryDateSelected ? formatDate(form.expiryDate, dateOrder, dateSeparator) : t.actions.select}
          onPress={() => {
            Keyboard.dismiss();
            setShowDateSelector(true);
          }}
        />
        
        <Text style={{ 
          marginLeft: 16, 
          marginVertical: 6, 
          fontSize: 17, 
          fontWeight: '700', 
          color: (!canAddSchedule() || hasSchedule) ? colors.onSurfaceDisabled : colors.onSurfaceVariant 
        }}>
          {t.subtitle.medSchedules}
        </Text>

        {/* Always show + tile. If no schedules -> show only this tile. */}
        <AppTile
          simpleTile={true}
          backgroundColor={(!canAddSchedule() || hasSchedule) ? colors.surfaceDisabled : colors.surface}
          style={{ marginBottom: 8 }}
          onPress={handleAddSchedulePress}
        >
          <View style={{ alignItems: 'center', justifyContent: 'center', padding: 14 }}>
            <IconPlusBold width={24} height={24} fill={(!canAddSchedule() || hasSchedule) ? colors.onSurfaceDisabled : colors.primary} />
          </View>
        </AppTile>

        {/* If schedules exist, render them. If none exist, do NOT render any "no schedules" placeholder. */}
        {schedules.length > 0 && schedules.map(renderScheduleTile)}

        {isEditMode && (
          <AppTile
            title={t.actions.deleteMedicine}
            backgroundColor={colors.surface}
            icon={IconTrash}
            iconColor={colors.error}
            style={{ marginVertical: 8 }}
            onPress={handleDeleteMedicine}
          />
        )}
      </KeyboardAwareScrollView>

      <BottomSheetSelector
        visible={showFormSelector}
        title={t.medicine.formLabel}
        options={formOptions}
        onDismiss={() => setShowFormSelector(false)}
        onSelect={(value) => {
          setForm({ ...form, form: value });
          setShowFormSelector(false);
        }}
        selectedValue={form.form}
        modalHeight={modalHeight}
      />

      <BottomSheetSelector
        visible={showDosageSelector}
        title={t.medicine.dosageLabel}
        options={dosageOptions}
        onDismiss={() => setShowDosageSelector(false)}
        onSelect={(value) => {
          setForm({ ...form, dosageUnit: value });
          setShowDosageSelector(false);
        }}
        selectedValue={form.dosageUnit}
        modalHeight={modalHeight}
      />

      <DateSelector
        visible={showDateSelector}
        date={form.expiryDate}
        title={t.medicine.expiryDateLabel}
        onCancel={() => setShowDateSelector(false)}
        onChange={(date) => {
          setForm({ ...form, expiryDate: date });
          setExpiryDateSelected(true);
          setShowDateSelector(false);
        }}
      />

      {/* Edit / Create schedule modal */}
      <EditScheduleModal
        visible={showEditSchedule}
        onDismiss={() => {
          setShowEditSchedule(false);
          // refresh schedules after editing/creating
          const s = getSchedulesForMedicine(medicineIdForSchedules) || [];
          setSchedules(s);
        }}
        modalHeight={modalHeight}
        scheduleToEdit={editingSchedule}
        medicineId={medicineIdForSchedules}
        tempMedicine={tempMedicine}
      />
    </BaseModal>
  );
});

export default AddMedicineModal;
// app/(modals)/AddEditIntakeModal.tsx
import React, { forwardRef, useEffect, useRef, useState, useMemo } from 'react';
import { View, Alert, Platform } from 'react-native';
import { useTheme } from 'react-native-paper';
import BaseModal, { BaseModalRef } from '@/app/(modals)/base-modal';
import AppTile from '@/components/AppTile';
import BaseTextInput from '@/components/BaseTextInput';
import BaseButton from '@/components/BaseButton';
import DateSelector from '@/app/(modals)/date-selector';
import TimeSelector from '@/app/(modals)/time-selector';
import BottomSheetSelector from '@/app/(modals)/bottom-sheet-selector';
import {
  IconPrescription,
  IconDosage,
  IconCalendarX,
  IconClockCountdown,
  IconTrash,
  IconRight,
  IconCalendarCheck,
} from '@/constants/icons';
import { useSettings } from '@/contexts/SettingsContext';
import { Intake, generateId } from '@/contexts/types';
import { formatUnit } from '@/constants/locales/formatUnit';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  intakeToEdit?: Intake | null;
  /**
   * callback when saving
   * should persist intake (parent/context)
   */
  onSave: (intake: Intake) => Promise<void> | void;
  /**
   * optional callback to delete intake (only when editing)
   */
  onDelete?: (intakeId: string) => Promise<void> | void;
}

const AddEditIntakeModal = forwardRef<BaseModalRef, Props>(({ visible, onDismiss, intakeToEdit = null, onSave, onDelete }, ref) => {
  const modalRef = useRef<BaseModalRef | null>(null);
  React.useImperativeHandle(ref, () => modalRef.current as BaseModalRef);

  const { t, dateOrder, dateSeparator, language, is12HourFormat } = useSettings();
  const { colors } = useTheme();

  const isEditMode = !!intakeToEdit;

  // form state
  const [medicineName, setMedicineName] = useState<string>('');
  const [dosageAmount, setDosageAmount] = useState<string>(''); // numeric string for amount
  const [dosageUnit, setDosageUnit] = useState<string>(''); // e.g. 'mg' key

  // date/time stored but we also track if user actually picked them (so tiles default to 'Выбрать')
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [hasPickedDate, setHasPickedDate] = useState<boolean>(false);
  const [hasPickedTime, setHasPickedTime] = useState<boolean>(false);

  // we need separate "initial values" for selectors so opening selector doesn't override tile until user confirms
  const [selectorInitialDate, setSelectorInitialDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [selectorInitialTime, setSelectorInitialTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });

  const [showDateSelector, setShowDateSelector] = useState(false);
  const [showTimeSelector, setShowTimeSelector] = useState(false);
  const [showDosageSelector, setShowDosageSelector] = useState(false);

  // Combined dosage options from both forms and dosages with translations
  const dosageOptions = useMemo(() => {
    // Form units (tablets, capsules, etc.)
    const formUnits = [
      'piece', 'tablet', 'capsule', 'drops', 'ampoule', 'bottle',
      'dragee', 'lozenge', 'suppository', 'powder', 'granules',
      'syrup', 'ointment', 'patch', 'aerosol', 'inhaler',
      'solution', 'suspension', 'emulsion', 'substance'
    ].map(key => ({
      label: formatUnit(t.medicine.units, dosageAmount, language, key),
      value: key,
      type: 'form' as const
    }));

    // Dosage units (mg, ml, etc.)
    const dosageUnits = [
      'g', 'mg', 'mcg', 'mgPerG', 'mcgPerG', 'ml', 'gPerL', 'gPerMl',
      'mgPerMl', 'mcgPerMl', 'iu', 'iuPerG', 'iuPerMl', 'percent', 'mm', 'cm',
      'dose', 'drop', 'spray', 'inhalation', 'injection',
      'application', 'tsp', 'dsp', 'tbsp', 'cup', 'none'
    ].map(key => ({
      label: formatUnit(t.medicine.dosages, dosageAmount, language, key),
      value: key,
      type: 'dosage' as const
    }));

    // Combine and sort alphabetically by label
    return [...formUnits, ...dosageUnits].sort((a, b) => a.label.localeCompare(b.label));
  }, [t, dosageAmount, language]);

  // When modal opens, restore values from intakeToEdit if present,
  // otherwise clear (but don't set selectorInitialTime/date incorrectly)
  useEffect(() => {
    if (visible) {
      if (intakeToEdit) {
        // read all properties so we don't lose anything when saving back
        setMedicineName(intakeToEdit.medicineName ?? '');
        // dosage
        if (intakeToEdit.dosage && typeof intakeToEdit.dosage.amount !== 'undefined') {
          setDosageAmount(String(intakeToEdit.dosage.amount));
          setDosageUnit(String(intakeToEdit.dosage.unit ?? ''));
        } else {
          setDosageAmount('');
          setDosageUnit('');
        }

        // intakeDay (string ISO yyyy-mm-dd or Date)
        if (intakeToEdit.intakeDay) {
          if (typeof intakeToEdit.intakeDay === 'string') {
            const parsed = new Date(intakeToEdit.intakeDay);
            if (!isNaN(parsed.getTime())) {
              const selectedDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
              setDate(selectedDate);
              setSelectorInitialDate(selectedDate);
              setHasPickedDate(true);
            } else {
              // try yyyy-mm-dd
              const parts = (intakeToEdit.intakeDay as string).split('-');
              if (parts.length === 3) {
                const y = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10) - 1;
                const d = parseInt(parts[2], 10);
                const selectedDate = new Date(y, m, d);
                setDate(selectedDate);
                setSelectorInitialDate(selectedDate);
                setHasPickedDate(true);
              } else {
                setDate(null);
                setHasPickedDate(false);
              }
            }
          } else if ((intakeToEdit.intakeDay as any) instanceof Date) {
            const d = intakeToEdit.intakeDay as Date;
            const selectedDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            setDate(selectedDate);
            setSelectorInitialDate(selectedDate);
            setHasPickedDate(true);
          } else {
            setDate(null);
            setHasPickedDate(false);
          }
        } else {
          setDate(null);
          setHasPickedDate(false);
        }

        // intakeTime like "HH:MM"
        if (intakeToEdit.intakeTime && typeof intakeToEdit.intakeTime === 'string') {
          const [hh, mm] = (intakeToEdit.intakeTime as string).split(':').map((s) => parseInt(s, 10));
          const init = new Date();
          if (!Number.isNaN(hh)) init.setHours(hh);
          if (!Number.isNaN(mm)) init.setMinutes(mm);
          init.setSeconds(0, 0);
          setTime(init);
          setSelectorInitialTime(init);
          setHasPickedTime(true);
        } else {
          setTime(null);
          setHasPickedTime(false);
        }
      } else {
        // creating new intake - clear fields; require user to pick date/time intentionally
        setMedicineName('');
        setDosageAmount('');
        setDosageUnit('');
        setDate(null);
        setTime(null);
        setHasPickedDate(false);
        setHasPickedTime(false);

        // keep selectorInitialDate = today and selectorInitialTime = 12:00 (already set by init)
      }
    }
  }, [visible, intakeToEdit]);

  const formatDateForAction = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    switch (dateOrder) {
      case 'dmy': return `${dd}${dateSeparator}${mm}${dateSeparator}${yyyy}`;
      case 'ymd': return `${yyyy}${dateSeparator}${mm}${dateSeparator}${dd}`;
      case 'mdy': return `${mm}${dateSeparator}${dd}${dateSeparator}${yyyy}`;
      case 'ydm': return `${yyyy}${dateSeparator}${dd}${dateSeparator}${mm}`;
      default: return `${dd}${dateSeparator}${mm}${dateSeparator}${yyyy}`;
    }
  };

  const formatTimeForActions = (d: Date) => {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    if (is12HourFormat) {
      const h = d.getHours();
      const suffix = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${mm} ${suffix}`;
    }
    return `${hh}:${mm}`;
  };

  const isInvalidForCreate = () => {
    // all fields except right dosage pair are required: medicineName, date, time
    if (!medicineName || medicineName.trim() === '') return true;
    if (!hasPickedDate || !date) return true;
    if (!hasPickedTime || !time) return true;
    return false;
  };

  const handleSave = async () => {
    if (!medicineName || medicineName.trim() === '') {
      return;
    }
    if (!hasPickedDate || !date) {
      return;
    }
    if (!hasPickedTime || !time) {
      return;
    }

    const hours = time.getHours();
    const minutes = time.getMinutes();
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const intakeTime = `${hh}:${mm}`;

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const intakeDay = `${y}-${m}-${d}`;

    // merge with existing intakeToEdit so we don't drop extra properties
    const base: any = intakeToEdit ? { ...intakeToEdit } : {};
    const intake: Intake = {
      ...base,
      id: base.id || generateId(),
      medicineName: medicineName.trim(),
      dosage: (dosageAmount && !Number.isNaN(Number(dosageAmount)))
        ? { amount: Number(dosageAmount), unit: dosageUnit || undefined }
        : (base.dosage ?? undefined),
      intakeTime,
      intakeDay,
      medicineIds: base.medicineIds || [],
      scheduleIds: base.scheduleIds || [],
      status: base.status || 'active',
      type: base.type || 'one-time',
    } as Intake;

    // If creating new intake (no intakeToEdit) ensure it is explicit one-time
    if (!intakeToEdit) intake.type = 'one-time';

    try {
      await onSave(intake);
      onDismiss();
    } catch (err) {
      console.error('Failed to save intake:', err);
      Alert.alert(t.alerts.error, t.alerts.errorText7);
    }
  };

  const handleDelete = async () => {
    if (!intakeToEdit || !onDelete) return;
    Alert.alert(
      t.actions.confirm,
      t.alerts.confirmText,
      [
        { text: t.actions.cancel, style: 'cancel' },
        {
          text: t.actions.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(intakeToEdit.id);
              onDismiss();
            } catch (err) {
              console.error('Failed to delete intake:', err);
              Alert.alert(t.alerts.error, t.alerts.errorText8);
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  // Date/Time selector handlers — use current values when opening selectors
  const openDateSelector = () => {
    // Use currently selected date if available, otherwise today
    const initialDate = date || new Date();
    setSelectorInitialDate(initialDate);
    setShowDateSelector(true);
  };

  const openTimeSelector = () => {
    // Use currently selected time if available, otherwise 12:00
    const initialTime = time || (() => {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      return d;
    })();
    setSelectorInitialTime(initialTime);
    setShowTimeSelector(true);
  };

  return (
    <BaseModal
      ref={modalRef}
      visible={visible}
      onClose={onDismiss}
      title={isEditMode ? t.title.editIntake : t.title.addIntake}
      leftButtonText={t.actions.cancel}
      onLeftButtonPress={onDismiss}
      rightButtonText={t.actions.save}
      onRightButtonPress={handleSave}
      rightButtonDisabled={!isEditMode && isInvalidForCreate()}
    >
      <View style={{ paddingHorizontal: 16, paddingBottom: 0 }}>
        {/* 1) medicine name */}
        <AppTile
          title={t.medicine.nameLabel}
          backgroundColor={colors.surface}
          icon={IconPrescription}
          iconColor={colors.primary}
          contentGap={8}
          style={{ marginVertical: 8 }}
        >
          <BaseTextInput
            value={medicineName}
            onChangeText={setMedicineName}
            placeholder={t.medicine.namePlaceholderExample}
            borderColor={colors.outline}
            autoCapitalizeFirstLetter={true}
            centeredText={false}
          />
        </AppTile>

        {/* 2) dosage — replace with two-field (число + выбор единицы) like in schedule modal */}
        <AppTile
          title={t.schedule.singleDosageLabel}
          backgroundColor={colors.surface}
          icon={IconDosage}
          iconColor={colors.primary}
          contentGap={8}
          childrenGap={8}
          style={{ marginBottom: 8 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <BaseTextInput
              value={dosageAmount}
              onChangeText={(text) => {
                // allow numeric with decimal
                setDosageAmount(text);
              }}
              placeholder={'0'}
              keyboardType="decimal-pad"
              width={'32%'}
              minValue={1}
              maxDigits={9}
              integerOnly={true}
              borderColor={colors.outline}
            />
            <BaseButton
              label={dosageUnit 
                ? (dosageOptions.find(opt => opt.value === dosageUnit)?.label || dosageUnit)
                : t.medicine.selectDosagePlaceholder}
              textColor={dosageUnit ? colors.onSurface : colors.primary}
              style={{ flex: 1 }}
              color={colors.surface}
              onPress={() => setShowDosageSelector(true)}
              borderColor={colors.outline}
            />
            </View>
        </AppTile>

        {/* 3) time tile */}
        <AppTile
          title={t.schedule.singleIntakeTime}
          backgroundColor={colors.surface}
          icon={IconClockCountdown}
          iconColor={colors.primary}
          style={{ marginBottom: 8 }}
          actions={<IconRight width={24} height={24} fill={'#AEAEAE'} />}
          actionsText={hasPickedTime && time ? formatTimeForActions(time) : t.actions.select}
          onPress={() => {
            openTimeSelector();
          }}
        />

        {/* 4) date tile */}
        <AppTile
          title={t.schedule.singleIntakeDay}
          backgroundColor={colors.surface}
          icon={IconCalendarCheck}
          iconColor={colors.primary}
          style={{ marginBottom: 8 }}
          actions={<IconRight width={24} height={24} fill={'#AEAEAE'} />}
          actionsText={hasPickedDate && date ? formatDateForAction(date) : t.actions.select}
          onPress={() => {
            openDateSelector();
          }}
        />

        {/* delete (only in edit mode) */}
        {isEditMode && (
          <AppTile
            title={t.actions.deleteIntake || 'Удалить приём'}
            backgroundColor={colors.surface}
            icon={IconTrash}
            iconColor={colors.error}
            style={{ marginVertical: 8 }}
            onPress={handleDelete}
          />
        )}
      </View>

      {/* Date selector: use selectorInitialDate and only set date when user confirms */}
      <DateSelector
        visible={showDateSelector}
        title={t.schedule.dateStart}
        date={selectorInitialDate}
        onCancel={() => setShowDateSelector(false)}
        onChange={(d) => {
          setDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
          setHasPickedDate(true);
          setShowDateSelector(false);
        }}
      />

      {/* Time selector: use selectorInitialTime and only set time when user confirms */}
      <TimeSelector
        visible={showTimeSelector}
        time={selectorInitialTime}
        onCancel={() => setShowTimeSelector(false)}
        onChange={(tDate) => {
          setTime(tDate);
          setHasPickedTime(true);
          setShowTimeSelector(false);
        }}
        title={t.title.addIntakeTime ?? t.schedule.intakeTimesLabel}
        force12HourFormat={null}
      />

      {/* Combined dosage unit selector bottom sheet */}
      <BottomSheetSelector
        visible={showDosageSelector}
        title={t.medicine.dosageLabel}
        options={dosageOptions.map(opt => ({ label: opt.label, value: opt.value }))}
        onSelect={(value: string) => {
          setDosageUnit(value);
          setShowDosageSelector(false);
        }}
        onDismiss={() => setShowDosageSelector(false)}
        modalHeight={'90%'}
        selectedValue={dosageUnit}
      />
    </BaseModal>
  );
});

export default AddEditIntakeModal;
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Divider,
  useTheme,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import Modal from 'react-native-modal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMedicine, Medicine } from '@/contexts/MedicineContext';
import { useSettings } from '@/contexts/SettingsContext';
import BottomSheetSelector from '@/components/BottomSheetSelector';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  medicineToEdit?: Medicine;
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


export default function AddMedicineModal({ visible, onDismiss, medicineToEdit }: Props) {
  const { t, language } = useLanguage();
  const { addMedicine, updateMedicine } = useMedicine();
  const { resolvedTheme, dateOrder, dateSeparator } = useSettings();
  const theme = useTheme();

  const isEditMode = !!medicineToEdit;

  const [form, setForm] = useState({
    name: medicineToEdit?.name ?? '',
    quantity: medicineToEdit?.quantity ? String(medicineToEdit.quantity) : '',
    form: medicineToEdit?.form ?? '',
    dosageAmount: medicineToEdit?.dosage?.amount ? String(medicineToEdit.dosage.amount) : '',
    dosageUnit: medicineToEdit?.dosage?.unit ?? '',
    expiryDate: medicineToEdit?.expiryDate
      ? new Date(medicineToEdit.expiryDate)
      : new Date(),
  });

  const scrollRef = useRef<ScrollView>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFormSelector, setShowFormSelector] = useState(false);
  const [showDosageSelector, setShowDosageSelector] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (visible) setModalVisible(true);
    else if (!isClosing) setModalVisible(false);
  }, [visible]);

  const formOptions = useMemo(() =>
    [
      'piece','tablet', 'capsule', 'drops', 'ampoule', 'bottle', 'syringe',
      'dragee', 'lozenge', 'suppository', 'powder', 'granules',
      'syrup', 'ointment', 'patch', 'aerosol', 'inhaler',
      'solution', 'suspension', 'emulsion',
    ].map((key) => ({
      label: t.medicine.units[key as keyof typeof t.medicine.units] ?? key,
      value: key,
    })), [t]
  );

  const dosageOptions = useMemo(() => [
    { label: t.medicine.dosages.none, value: 'none' },
    { label: t.medicine.dosages.g, value: 'g' },
    { label: t.medicine.dosages.mg, value: 'mg' },
    { label: t.medicine.dosages.ml, value: 'ml' },
    { label: t.medicine.dosages.iu, value: 'iu' },
    { label: t.medicine.dosages.percent, value: '%' },
  ], [t]);

  const handleStartClose = () => {
    setIsClosing(true);
    setModalVisible(false);
  };

  const handleCloseComplete = () => {
    setIsClosing(false);
    onDismiss();
  };

  const numericOnly = (text: string) =>
    text.replace(/[^0-9.,]/g, '').replace(',', '.');

  const handleSubmit = () => {
    const quantity = parseFloat(form.quantity.replace(',', '.')) || 0;
    const dosageAmount = parseFloat(form.dosageAmount.replace(',', '.')) || 0;

    const isInvalid =
    !form.name ||
    !form.form ||
    quantity === 0 ||
    (form.dosageUnit !== 'none' && dosageAmount === 0);

    if (isInvalid) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    const data: Medicine = {
      id: medicineToEdit?.id || Math.random().toString(),
      name: form.name,
      form: form.form,
      quantity,
      expiryDate: form.expiryDate.toISOString().split('T')[0],
      dosage:
        form.dosageUnit === 'none'
          ? undefined
          : {
              amount: dosageAmount,
              unit: form.dosageUnit,
            },
    };

    isEditMode ? updateMedicine(data) : addMedicine(data);
    handleStartClose();
  };

  const unitLabel =
    t.medicine.units[form.form as keyof typeof t.medicine.units] ??
    t.medicine.unitDefault;
  const unitLabelLower =
    unitLabel.charAt(0).toLowerCase() + unitLabel.slice(1);

  return (
    <Modal
      isVisible={isModalVisible}
      onBackdropPress={handleStartClose}
      onBackButtonPress={handleStartClose}
      onModalHide={() => isClosing && handleCloseComplete()}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropTransitionOutTiming={0}
      useNativeDriver
      style={styles.modal}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{  paddingBottom: 24}}
        >
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            {isEditMode ? t.medicine.editTitle : t.medicine.addTitle}
          </Text>

          <Text style={styles.label}>{t.medicine.nameLabel}</Text>
          <TextInput
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
            onBlur={() =>
              setForm((prev) => ({
                ...prev,
                name: prev.name.charAt(0).toUpperCase() + prev.name.slice(1),
              }))
            }
            onSubmitEditing={() =>
              setForm((prev) => ({
                ...prev,
                name: prev.name.charAt(0).toUpperCase() + prev.name.slice(1),
              }))
            }
            placeholder={t.medicine.namePlaceholderExample}
            autoCapitalize="sentences"
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
          />
          <Divider style={styles.dividerThin} />
          <Text style={styles.label}>{t.medicine.quantityLabel}</Text>
          <View style={styles.rowWrap}>
            <TextInput
              value={form.quantity}
              onChangeText={(text) => setForm({ ...form, quantity: numericOnly(text) })}
              keyboardType="decimal-pad"
              placeholder="0"
              style={[styles.smallInput, { backgroundColor: theme.colors.surface }]}
            />
            <Button
              mode="outlined"
              icon={!form.form ? 'format-list-bulleted' : undefined}
              onPress={() => {
                setShowFormSelector(true);
                setShowDosageSelector(false);
              }}
              style={styles.formButton}
              labelStyle={styles.unitButtonLabel}
              contentStyle={{ justifyContent: 'center' }}
            >
              {form.form
                ? formOptions.find((f) => f.value === form.form)?.label
                : t.medicine.selectUnitPlaceholder}
            </Button>
          </View>

          <Divider style={styles.dividerThin} />
          <Text style={styles.label}>
            {t.medicine.dosageLabelOneUnit.replace('{unit}', unitLabelLower)}
          </Text>
          <View style={styles.rowWrap}>
            <TextInput
              value={form.dosageAmount}
              onChangeText={(text) => setForm({ ...form, dosageAmount: numericOnly(text) })}
              keyboardType="decimal-pad"
              placeholder="0"
              editable={form.dosageUnit !== 'none'}
              style={[
                styles.smallInput,
                { backgroundColor: theme.colors.surface },
                form.dosageUnit === 'none' && { opacity: 0.5 },
              ]}
            />
            <Button
              mode="outlined"
              icon={!form.dosageUnit ? 'scale' : undefined}
              onPress={() => {
                setShowDosageSelector(true);
                setShowFormSelector(false);
              }}
              style={styles.unitButton}
              labelStyle={styles.unitButtonLabel}
              contentStyle={{ justifyContent: 'center' }}
            >
              {form.dosageUnit
                ? dosageOptions.find((d) => d.value === form.dosageUnit)?.label
                : t.medicine.selectDosagePlaceholder}
            </Button>
          </View>

          <Divider style={styles.dividerThin} />
          <Text style={styles.label}>{t.medicine.expiryDateLabel}</Text>
          <View style={styles.rowWrap}>
            <Text style={styles.labelInline}>{t.medicine.before}</Text>
            <Button
            icon="calendar"
            mode="outlined"
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
             >
            {formatDate(form.expiryDate, dateOrder, dateSeparator)}
          </Button>
          </View>
          {showDatePicker && Platform.OS !== 'web' && (
            <DateTimePicker
              value={form.expiryDate}
              mode="date"
              display="spinner"
              minimumDate={new Date()}
              themeVariant={resolvedTheme === 'dark' ? 'dark' : 'light'}
              locale={language === 'ru' ? 'ru-RU' : 'en-US'}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) setForm({ ...form, expiryDate: date });
              }}
            />
          )}

          <Divider style={styles.divider} />
          <View style={styles.buttons}>
            <Button
              mode="outlined"
              onPress={handleStartClose}
              style={styles.button}
              labelStyle={styles.unitButtonLabel}
            >
              {t.actions.cancel}
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              disabled={
                !form.name ||
                !form.form ||
                parseFloat(form.quantity) === 0 ||
                (form.dosageUnit !== 'none' && parseFloat(form.dosageAmount) === 0)
              }
              style={styles.button}
              labelStyle={styles.unitButtonLabel}
            >
              {t.actions.save}
            </Button>
          </View>
        </ScrollView>
      </View>

      <BottomSheetSelector
        visible={showFormSelector}
        title={t.medicine.formLabel}
        options={formOptions}
        onDismiss={() => setShowFormSelector(false)}
        onSelect={(value) => {
          setForm({ ...form, form: value });
          setShowFormSelector(false);
        }}
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
      />
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
    paddingRight: 20,
    paddingLeft: 20,
    paddingTop: 20,
    maxHeight: '85%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 16,
  },
  labelInline: {
    fontSize: 16,
    marginRight: 8,
    alignSelf: 'center',
  },
  input: {
    fontSize: 16,
    marginBottom: 8,
  },
  dateButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  divider: {
    marginVertical: 24,
    height: 1,
  },
  dividerThin: {
    marginVertical: 16,
    height: 1,
    backgroundColor: 'rgba(150,150,150,0.3)',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  smallInput: {
    width: 70,
    height: 48,
    paddingHorizontal: 8,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  formButton: {
    justifyContent: 'center',
    alignSelf: 'center',
  },
  unitButton: {
    justifyContent: 'center',
    alignSelf: 'center',
  },
  unitButtonLabel: {
    fontSize: 16,
    lineHeight: 20,
    textAlignVertical: 'center',
  },
});
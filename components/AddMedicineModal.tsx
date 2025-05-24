import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Divider,
  useTheme,
} from 'react-native-paper';
import { Medicine, useMedicine } from '@/contexts/MedicineContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSettings } from '@/contexts/SettingsContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import Modal from 'react-native-modal';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  medicineToEdit?: Medicine;
}

export default function AddMedicineModal({ visible, onDismiss, medicineToEdit }: Props) {
  const { t } = useLanguage();
  const { addMedicine, updateMedicine } = useMedicine();
  const theme = useTheme();
  const { resolvedTheme } = useSettings();

  const isEditMode = !!medicineToEdit;

  const [form, setForm] = useState({
    name: medicineToEdit?.name ?? '',
    unit: medicineToEdit?.unit ?? '',
    quantity: medicineToEdit?.quantity ?? 0,
    expiryDate: medicineToEdit ? new Date(medicineToEdit.expiryDate) : new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [isModalVisible, setModalVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
    } else {
      if (!isClosing) {
        setModalVisible(false);
      }
    }
  }, [visible]);

  const units = useMemo(
    () => [
      { label: t.units.tablet, value: 'tablet' },
      { label: t.units.capsule, value: 'capsule' },
      { label: t.units.injection, value: 'injection' },
      { label: t.units.bottle, value: 'bottle' },
      { label: t.units.pack, value: 'pack' },
    ],
    [t]
  );

  const handleStartClose = () => {
    setIsClosing(true);
    setModalVisible(false);
  };

  const handleCloseComplete = () => {
    setIsClosing(false);
    onDismiss();
  };

  const handleSubmit = () => {
    const formatted = {
      name: form.name,
      unit: form.unit,
      quantity: form.quantity,
      expiryDate: form.expiryDate.toISOString().split('T')[0],
    };

    if (isEditMode && medicineToEdit) {
      updateMedicine({ ...formatted, id: medicineToEdit.id });
    } else {
      addMedicine(formatted);
    }

    handleStartClose();
  };

  return (
    <Modal
      isVisible={isModalVisible}
      onBackdropPress={handleStartClose}
      onBackButtonPress={handleStartClose}
      onModalHide={() => {
        if (isClosing) handleCloseComplete();
      }}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationOutTiming={300}
      backdropTransitionOutTiming={0}
      style={styles.modal}
      useNativeDriver
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            {isEditMode ? t.medicine.editTitle : t.medicine.addTitle}
          </Text>

          <Text style={[styles.label, { color: theme.colors.onSurface }]}>
            {t.medicine.nameLabel}
          </Text>
          <TextInput
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
          />

          <Text style={[styles.label, { color: theme.colors.onSurface }]}>
            {t.medicine.quantity}
          </Text>
          <TextInput
            value={form.quantity.toString()}
            onChangeText={(text) =>
              setForm({ ...form, quantity: parseInt(text) || 0 })
            }
            keyboardType="numeric"
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
          />

          <Text style={[styles.label, { color: theme.colors.onSurface }]}>
            {t.medicine.selectUnit}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.unitButtonsContainer}
          >
            {units.map((unit) => (
              <TouchableOpacity
                key={unit.value}
                onPress={() => setForm({ ...form, unit: unit.value })}
                style={[
                  styles.unitButton,
                  {
                    backgroundColor:
                      form.unit === unit.value
                        ? theme.colors.primary
                        : theme.colors.surfaceVariant,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color:
                      form.unit === unit.value
                        ? theme.colors.onPrimary
                        : theme.colors.onSurfaceVariant,
                  }}
                >
                  {unit.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: theme.colors.onSurface }]}>
            {t.medicine.expiryDate}
          </Text>
          <Button
            onPress={() => setShowDatePicker(true)}
            icon="calendar"
            textColor={theme.colors.onSurface}
            style={styles.dateButton}
            labelStyle={styles.label}
          >
            {form.expiryDate.toLocaleDateString()}
          </Button>

          {showDatePicker && Platform.OS !== 'web' && (
            <DateTimePicker
              value={form.expiryDate}
              mode="date"
              display="spinner"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) setForm({ ...form, expiryDate: date });
              }}
              themeVariant={resolvedTheme === 'dark' ? 'dark' : 'light'}
              minimumDate={new Date()}
            />
          )}

          <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

          <View style={styles.buttonsContainer}>
            <Button
              mode="outlined"
              onPress={handleStartClose}
              style={styles.button}
              labelStyle={styles.label}
            >
              {t.actions.cancel}
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              disabled={!form.name || !form.unit || !form.quantity}
              style={styles.button}
              labelStyle={styles.label}
            >
              {t.actions.save}
            </Button>
          </View>
        </ScrollView>
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
    maxHeight: '90%',
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  input: {
    marginBottom: 16,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  unitButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  unitButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
  dateButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  divider: {
    marginVertical: 20,
    height: 1,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});

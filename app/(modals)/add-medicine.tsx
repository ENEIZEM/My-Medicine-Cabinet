import React, { useState, useMemo } from 'react';
import {
  Animated,
  ScrollView,
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  useTheme,
  TextInput as PaperTextInput,
  Button,
  Text as PaperText,
  Divider,
} from 'react-native-paper';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMedicine, Medicine } from '@/contexts/MedicineContext';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

interface AddMedicineModalProps {
  visible: boolean;
  medicineToEdit?: Medicine;
  onDismiss?: () => void;
}

const AddMedicineModal: React.FC<AddMedicineModalProps> = ({
  visible,
  medicineToEdit,
  onDismiss,
}) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const { addMedicine, updateMedicine } = useMedicine();
  const router = useRouter();

  const isEditMode = !!medicineToEdit;

  const [form, setForm] = useState({
    name: medicineToEdit?.name ?? '',
    unit: medicineToEdit?.unit ?? '',
    quantity: medicineToEdit?.quantity ?? 0,
    expiryDate: medicineToEdit
      ? new Date(medicineToEdit.expiryDate)
      : new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const [scaleValues] = useState(() =>
    units.map(() => new Animated.Value(1))
  );

  const handleUnitSelect = (label: string, index: number) => {
    setForm({ ...form, unit: units[index].value }); // сохраняем ключ
    Animated.sequence([
      Animated.timing(scaleValues[index], {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValues[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSubmit = () => {
    if (!form.name || !form.unit || !form.quantity || !form.expiryDate) return;

    const formatted = {
      name: form.name,
      unit: form.unit,
      quantity: form.quantity,
      expiryDate: form.expiryDate.toISOString().split('T')[0],
    };

    if (isEditMode && medicineToEdit) {
      updateMedicine({ ...formatted, id: medicineToEdit.id });
      onDismiss?.(); // ✅ при редактировании — закрыть модалку
    } else {
      addMedicine(formatted);
      router.replace('/medicine'); // ✅ при добавлении — перейти на вкладку
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={() => {
        isEditMode ? onDismiss?.() : router.replace('/medicine');
      }}
    >
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <PaperText
          style={[styles.title, { color: theme.colors.onBackground }]}
        >
          {isEditMode ? t.medicine.addTitle : t.medicine.addTitle}
        </PaperText>

        <PaperTextInput
          label={t.medicine.nameLabel}
          value={form.name}
          onChangeText={(text) => setForm({ ...form, name: text })}
          style={[styles.input, { backgroundColor: theme.colors.surface }]}
          theme={theme}
        />

        <View style={styles.unitContainer}>
          <PaperText style={[styles.label, { color: theme.colors.onSurface }]}>
            {t.medicine.selectUnit}
          </PaperText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.unitButtonsContainer}
          >
            {units.map((unit, index) => (
              <Animated.View
                key={unit.value}
                style={{ transform: [{ scale: scaleValues[index] }] }}
              >
                <TouchableOpacity
                  onPress={() => handleUnitSelect(unit.label, index)}
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
                  <PaperText
                    style={{
                      color:
                        form.unit === unit.value
                          ? theme.colors.onPrimary
                          : theme.colors.onSurfaceVariant,
                    }}
                  >
                    {unit.label}
                  </PaperText>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        <PaperTextInput
          label={t.medicine.quantity}
          value={form.quantity.toString()}
          onChangeText={(text) => {
            const num = parseInt(text) || 0;
            setForm({ ...form, quantity: num });
          }}
          keyboardType="numeric"
          style={[styles.input, { backgroundColor: theme.colors.surface }]}
          theme={theme}
        />

        <Button
          onPress={() => setShowDatePicker(true)}
          icon="calendar"
          textColor={theme.colors.onSurface}
          style={styles.dateButton}
        >
          {form.expiryDate.toLocaleDateString()}
        </Button>

        {showDatePicker && (
          <DateTimePicker
            value={form.expiryDate}
            mode="date"
            display="spinner"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setForm({ ...form, expiryDate: date });
            }}
            themeVariant={theme.dark ? 'dark' : 'light'}
            minimumDate={new Date()}
          />
        )}

        <Divider
          style={[styles.divider, { backgroundColor: theme.colors.outline }]}
        />

        <View style={styles.buttonsContainer}>
          <Button
            mode="outlined"
            onPress={() =>
              isEditMode ? onDismiss?.() : router.replace('/medicine')
            }
            style={styles.button}
          >
            {t.actions.cancel}
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            disabled={!form.name || !form.quantity || !form.unit}
          >
            {t.actions.save}
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  dateButton: {
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  divider: {
    marginVertical: 20,
    height: 1,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  unitContainer: {
    marginBottom: 16,
  },
  unitButtonsContainer: {
    paddingVertical: 8,
    gap: 8,
  },
  unitButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
  },
});

export default AddMedicineModal;

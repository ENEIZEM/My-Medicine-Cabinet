import { useState } from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { 
  useTheme, 
  TextInput as PaperTextInput, // Переименовываем импорт
  Button, 
  Text,
  Switch,
  Icon
} from 'react-native-paper';
import { useLanguage } from '@/contexts/LanguageContext';

interface AddMedicineModalProps {
  visible: boolean;
  onDismiss: () => void;
}

//
// Создаем кастомный TextInput с правильными пропсами
const TextInput = ({ label, ...props }: { label: string } & React.ComponentProps<typeof PaperTextInput>) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ color: props.theme?.colors?.onSurface, marginBottom: 4 }}>
      {label}
    </Text>
    <PaperTextInput {...props} />
  </View>
);

export default function AddMedicineModal({ visible, onDismiss }: AddMedicineModalProps) {
  const theme = useTheme();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: '',
    quantity: '1',
    expiryDate: new Date().toISOString().split('T')[0],
    hasReminder: false
  });

  return (
    <Modal visible={visible} animationType="slide">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Icon source="pill" size={32} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            {t.medicine.addTitle}
          </Text>
        </View>

        <TextInput
          label={t.medicine.nameLabel}
          value={form.name}
          onChangeText={(text) => setForm({...form, name: text})}
          style={{ backgroundColor: theme.colors.surface }}
          left={<PaperTextInput.Icon icon="pill" />}
          theme={theme}
        />

        <TextInput
          label={t.medicine.expiryDate}
          value={form.expiryDate}
          onChangeText={(text) => setForm({...form, expiryDate: text})}
          style={{ backgroundColor: theme.colors.surface }}
          left={<PaperTextInput.Icon icon="calendar" />}
          theme={theme}
        />

        <View style={styles.switchContainer}>
          <Text style={{ color: theme.colors.onSurface }}>
            {t.medicine.setReminder}
          </Text>
          <Switch
            value={form.hasReminder}
            onValueChange={(val) => setForm({...form, hasReminder: val})}
            color={theme.colors.primary}
          />
        </View>

        <Button 
          mode="contained" 
          onPress={onDismiss}
          style={{ marginTop: 24 }}
          icon="check"
          theme={theme}
        >
          {t.actions.save}
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  title: {
    fontSize: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});
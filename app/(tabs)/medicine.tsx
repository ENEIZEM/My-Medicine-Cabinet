import React, { useState } from 'react';
import { View, FlatList } from 'react-native';
import {
  Text,
  IconButton,
  Card,
  useTheme,
  Dialog,
  Portal,
  Button,
} from 'react-native-paper';
import { useMedicine, Medicine } from '@/contexts/MedicineContext';
import AddFab from '@/components/ui/AddFab';
import AddMedicineModal from '@/app/(modals)/add-medicine';
import { useLanguage } from '@/contexts/LanguageContext';
import { commonStyles } from '@/constants/styles';

export default function MedicineScreen() {
  const { medicines, deleteMedicine } = useMedicine();
  const { t } = useLanguage();
  const theme = useTheme();
  const { colors } = theme;

  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Medicine | null>(null);

  const handleConfirmDelete = () => {
    if (selectedForDelete) {
      deleteMedicine(selectedForDelete.id);
      setSelectedForDelete(null);
    }
  };

  return (
    <View style={[commonStyles.container, { backgroundColor: colors.background }]}>
      {medicines.length === 0 ? (
        <Text style={{ color: colors.onBackground }}>{t.medicine.emptyState}</Text>
      ) : (
        <FlatList
          data={medicines}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card
              style={{
                backgroundColor: colors.surface,
                marginBottom: 12,
                padding: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Контент лекарства слева */}
                <View>
                  <Text style={{ color: colors.onSurface }} variant="titleMedium">
                    {item.name}
                  </Text>
                  <Text style={{ color: colors.onSurface }}>
                    {item.quantity} {t.units[item.unit as keyof typeof t.units]}
                  </Text>
                  <Text style={{ color: colors.onSurface }}>{item.expiryDate}</Text>
                </View>

                {/* Кнопки справа */}
                <View style={{ flexDirection: 'row' }}>
                  <IconButton
                    icon="pencil"
                    size={20}
                    onPress={() => setEditingMedicine(item)}
                    iconColor={colors.primary}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => setSelectedForDelete(item)}
                    iconColor={colors.error}
                  />
                </View>
              </View>
            </Card>
          )}
        />
      )}

      <AddFab to="/(modals)/add-medicine" label={t.medicine.addTitle} />

      {/* Модалка редактирования */}
      {editingMedicine && (
        <AddMedicineModal
          visible={!!editingMedicine}
          medicineToEdit={editingMedicine}
          onDismiss={() => {
            setEditingMedicine(null); // ✅ гарантированно сбрасываем
          }}
        />
      )}

      {/* Кастомный диалог удаления */}
      <Portal>
        <Dialog visible={!!selectedForDelete} onDismiss={() => setSelectedForDelete(null)}>
          <Dialog.Title>{t.actions.confirm}</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: colors.onSurface }}>{t.actions.deleteConfirm}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSelectedForDelete(null)}>{t.actions.cancel}</Button>
            <Button onPress={handleConfirmDelete} textColor={colors.error}>
              {t.actions.delete}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

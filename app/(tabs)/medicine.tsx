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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MedicineScreen() {
  const { medicines, deleteMedicine } = useMedicine();
  const { t } = useLanguage();
  const theme = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();

  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Medicine | null>(null);

  const handleConfirmDelete = () => {
    if (selectedForDelete) {
      deleteMedicine(selectedForDelete.id);
      setSelectedForDelete(null);
    }
  };

  return (
    <View
      style={[
        commonStyles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
        {medicines.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '600',
                color: colors.primary,
                opacity: 0.9,
                textAlign: 'center',
                paddingHorizontal: 24,
              }}
            >
              {t.medicine.emptyState}
            </Text>
          </View>
        ) : (
        <FlatList
          data={medicines}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 8 }}
          renderItem={({ item }) => (
            <Card
              style={{
                backgroundColor: colors.surface,
                marginBottom: 12,
                padding: 12,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View>
                  <Text style={{ color: colors.onSurface }} variant="titleMedium">
                    {item.name}
                  </Text>
                  <Text style={{ color: colors.onSurface }}>
                    {item.quantity} {t.units[item.unit as keyof typeof t.units]}
                  </Text>
                  <Text style={{ color: colors.onSurface }}>{item.expiryDate}</Text>
                </View>

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

      {editingMedicine && (
        <AddMedicineModal
          visible={!!editingMedicine}
          medicineToEdit={editingMedicine}
          onDismiss={() => setEditingMedicine(null)}
        />
      )}

      <Portal>
        <Dialog
          visible={!!selectedForDelete}
          onDismiss={() => setSelectedForDelete(null)}
        >
          <Dialog.Title>{t.actions.confirm}</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: colors.onSurface }}>{t.actions.deleteConfirm}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSelectedForDelete(null)}>
              {t.actions.cancel}
            </Button>
            <Button onPress={handleConfirmDelete} textColor={colors.error}>
              {t.actions.delete}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

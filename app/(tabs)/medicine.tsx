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
  FAB,
} from 'react-native-paper';
import { useMedicine, Medicine } from '@/contexts/MedicineContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { commonStyles } from '@/constants/styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddMedicineModal from '@/components/AddMedicineModal';
import { useSettings } from '@/contexts/SettingsContext';

export default function MedicineScreen() {
  const { medicines, deleteMedicine } = useMedicine();
  const { t } = useLanguage();
  const theme = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();

  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Medicine | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleConfirmDelete = () => {
    if (selectedForDelete) {
      deleteMedicine(selectedForDelete.id);
      setSelectedForDelete(null);
    }
  };
  const { dateOrder, dateSeparator } = useSettings();
  const formatDate = (
    iso: string,
    order: 'dmy' | 'ymd' | 'mdy' | 'ydm',
    sep: string
  ): string => {
    const [y, m, d] = iso.split('-');
    switch (order) {
      case 'dmy': return `${d}${sep}${m}${sep}${y}`;
      case 'ymd': return `${y}${sep}${m}${sep}${d}`;
      case 'mdy': return `${m}${sep}${d}${sep}${y}`;
      case 'ydm': return `${y}${sep}${d}${sep}${m}`;
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
      <Text style={[commonStyles.title, { color: colors.onBackground }]}>
        {t.medicine.title}
      </Text>

      {medicines.length === 0 ? (
        <Text style={{ color: colors.onBackground, textAlign: 'center', marginTop: 32 }}>
          {t.medicine.emptyState}
        </Text>
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
                    {item.quantity}{' '}
                    {t.medicine.units[item.form as keyof typeof t.medicine.units] ?? item.form}
                  </Text>
                  <Text style={{ color: colors.onSurface }}>
                    {formatDate(item.expiryDate, dateOrder, dateSeparator)}
                  </Text>

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

      <FAB
        icon="plus"
        label={t.medicine.addTitle}
        onPress={() => setShowAddModal(true)}
        style={{
          position: 'absolute',
          margin: 16,
          right: 0,
          bottom: 0,
        }}
      />

      {showAddModal && (
        <AddMedicineModal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
        />
      )}

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
            <Text style={{ color: colors.onSurface }}>
              {t.actions.deleteConfirm}
            </Text>
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

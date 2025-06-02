import React, { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import {
  Text,
  IconButton,
  Card,
  useTheme,
  Dialog,
  Portal,
  Button,
  FAB,
  TextInput,
  Icon,
} from 'react-native-paper';
import { useMedicine, Medicine } from '@/contexts/MedicineContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { commonStyles } from '@/constants/styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddMedicineModal from '@/components/AddMedicineModal';
import { useSettings } from '@/contexts/SettingsContext';
import { BlurView } from 'expo-blur';

export default function MedicineScreen() {
  const { resolvedTheme } = useSettings();
  const { medicines, deleteMedicine } = useMedicine();
  const { t } = useLanguage();
  const theme = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();

  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Medicine | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  const handleConfirmDelete = () => {
    if (selectedForDelete) {
      deleteMedicine(selectedForDelete.id);
      setSelectedForDelete(null);
    }
  };

  const handleAddPress = () => {
    setSearchText('');
    setShowAddModal(true);
  };

  const { dateOrder, dateSeparator } = useSettings();
  const formatDate = (iso: string, order: 'dmy' | 'ymd' | 'mdy' | 'ydm', sep: string): string => {
    const [y, m, d] = iso.split('-');
    switch (order) {
      case 'dmy': return `${d}${sep}${m}${sep}${y}`;
      case 'ymd': return `${y}${sep}${m}${sep}${d}`;
      case 'mdy': return `${m}${sep}${d}${sep}${y}`;
      case 'ydm': return `${y}${sep}${d}${sep}${m}`;
    }
  };

  const filteredMedicines = medicines
    .filter((item) =>
      item.name.toLowerCase().includes(searchText.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.expiryDate).getTime();
      const dateB = new Date(b.expiryDate).getTime();
      return dateA - dateB;
    });

  const getDaysLeftText = (isoDate: string): string => {
    const today = new Date();
    const expiry = new Date(isoDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return t.expiry.dueIn.replace('{days}', String(diffDays));
    if (diffDays === 0) return t.expiry.dueToday;
    return t.expiry.expired.replace('{days}', String(Math.abs(diffDays)));
  };

  const getUrgencyColor = (daysLeft: number): string => {
    if (daysLeft <= 0) return colors.error;
    if (daysLeft <= 7) {
      const ratio = (7 - daysLeft) / 6;
      const red = 255;
      const green = Math.round(165 - ratio * 100);
      return `rgb(${red},${green},0)`;
    }
    return colors.onSurfaceVariant;
  };

  return (
    <View
      style={[
        {
          backgroundColor: resolvedTheme === 'dark' ? '#000' : colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        commonStyles.container,
      ]}
    >
      {/* Поле имени */}
      <BlurView
        intensity={50}
        tint={resolvedTheme === 'dark' ? 'dark' : 'light'}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 68 + insets.top,
          justifyContent: 'center',
          paddingHorizontal: 16,
          zIndex: 10,
        }}
      >
        <View style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: resolvedTheme === 'dark' ? 'rgba(80, 75, 105, 0.15)' : 'rgba(180, 175, 195, 0.15)',
        }} />
        <View
          style={{
            backgroundColor: resolvedTheme === 'dark' ? 'rgba(240, 227, 253, 0.15)' : 'rgba(95, 48, 128, 0.15)',
            borderRadius: 8,
            height: 44,
            top: insets.top/2,
            justifyContent: 'center',
          }}
        >
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder={t.actions.search}
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            style={{
              top: 0,
              height: 44,
              fontSize: 18,
              textAlign: 'center',
              backgroundColor: 'transparent',
            }}
          />
          <TextInput.Icon icon="magnify" size={26} style={{ position: 'absolute', left: 12 }} />
        </View>
      </BlurView>

      {/* Список лекарств */}
      {medicines.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 68 + insets.top }}>
          <Text style={{ color: colors.primary, fontSize: 20, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 24 }}>
            {t.medicine.emptyState}
          </Text>
        </View>
      ) : filteredMedicines.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 68 + insets.top  }}>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 20, fontWeight: '500', textAlign: 'center' }}>
            {t.actions.noResults}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMedicines}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 58 + insets.top, paddingBottom: 144 }}
          renderItem={({ item }) => {
            const expiryDate = new Date(item.expiryDate);
            const today = new Date();
            const diffTime = expiryDate.getTime() - today.getTime();
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isExpired = daysLeft < 0;

            return (
              <Card
                style={{
                  backgroundColor: isExpired ? colors.errorContainer : colors.surface,
                  marginBottom: 12,
                  padding: 12,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text numberOfLines={2} style={{ color: colors.onSurface, fontSize: 16, fontWeight: 'bold' }}>
                      {item.name}
                    </Text>
                    <Text style={{ color: colors.onSurface, fontSize: 16 }}>
                      {item.quantity}{' '}
                      {t.medicine.units[item.form as keyof typeof t.medicine.units] ?? item.form}
                    </Text>
                  </View>
                  <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'flex-start' }}>
                    <IconButton icon="pencil" size={25} onPress={() => setEditingMedicine(item)} iconColor={colors.primary} style={{ margin: 0, marginRight: 4 }} />
                    <IconButton icon="delete" size={26} onPress={() => setSelectedForDelete(item)} iconColor={colors.error} style={{ margin: 0 }} />
                  </View>
                </View>
                <Text style={{ fontSize: 14, marginTop: 6, color: isExpired ? colors.onErrorContainer : getUrgencyColor(daysLeft) }}>
                  {t.medicine.before} {formatDate(item.expiryDate, dateOrder, dateSeparator)} — {getDaysLeftText(item.expiryDate)}
                </Text>
              </Card>
            );
          }}
        />
      )}
      
      {/* Кнопка добавления */}
      <FAB
        icon="plus"
        label={t.medicine.addTitle}
        onPress={handleAddPress}
        style={{ position: 'absolute', right: 16, bottom: 84 }}
      />

      {/* Модалки */}
      {showAddModal && (
        <AddMedicineModal visible={showAddModal} onDismiss={() => setShowAddModal(false)} />
      )}
      {editingMedicine && (
        <AddMedicineModal visible={!!editingMedicine} medicineToEdit={editingMedicine} onDismiss={() => setEditingMedicine(null)} />
      )}

      <Portal>
        <Dialog visible={!!selectedForDelete} onDismiss={() => setSelectedForDelete(null)}>
          <Dialog.Title>{t.actions.confirm}</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: colors.onSurface, fontSize: 16 }}>
              {t.actions.deleteConfirm}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSelectedForDelete(null)}>
              <Text style={{ fontSize: 16 }}>{t.actions.cancel}</Text>
            </Button>
            <Button onPress={handleConfirmDelete} textColor={colors.error} labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>
              {t.actions.delete}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
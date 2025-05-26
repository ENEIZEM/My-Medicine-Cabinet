import React, { useState } from 'react';
import { View, FlatList } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
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
    const opacity = useSharedValue(0);

    useFocusEffect(
      React.useCallback(() => {
        opacity.value = 0;
        opacity.value = withTiming(1, { duration: 300 });
        return () => {
          opacity.value = 0;
        };
      }, [])
    );

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

  return (
    <Animated.View style={[animatedStyle, {
      backgroundColor: colors.background,
      paddingTop: insets.top + 16,
      paddingBottom: insets.bottom + 16,
      }, commonStyles.container]}>

      {medicines.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text
            style={{
              color: colors.primary,
              fontSize: 20,
              fontWeight: 'bold',
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
                  <Text style={{ color: colors.onSurface, fontSize: 16, fontWeight: 'bold', }} variant="titleMedium">
                    {item.name} 
                  </Text>
                  <Text style={{ color: colors.onSurface, fontSize: 16, }}>
                    {item.quantity}{' '}
                    {t.medicine.units[item.form as keyof typeof t.medicine.units] ?? item.form}
                  </Text>
                  <Text style={{ color: colors.onSurface, fontSize: 16, }}>
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
            <Text style={{ color: colors.onSurface, fontSize: 16, }}>
              {t.actions.deleteConfirm}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSelectedForDelete(null)}>
            <Text style={{ fontSize:16 }}>
              {t.actions.cancel}
              </Text>
            </Button>
            <Button
              onPress={handleConfirmDelete}
              textColor={colors.error}
              labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
            >
              {t.actions.delete}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Animated.View>
  );
}

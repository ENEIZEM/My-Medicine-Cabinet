import React, { useState } from 'react';
import { View, FlatList } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
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
  TextInput,
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
  const [visible, setVisible] = useState(false);

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
    setSearchText(''); // Очищаем поле поиска
    setShowAddModal(true); // Открываем модальное окно добавления
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

  useFocusEffect(
    React.useCallback(() => {
      setVisible(false);
      const timeout = setTimeout(() => setVisible(true), 10);
      return () => {
        clearTimeout(timeout);
        setVisible(false);
      };
    }, [])
  );

  const filteredMedicines = medicines.filter((item) =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View
      style={[
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        commonStyles.container,
      ]}
    >
      {visible && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(100)} style={{ flex: 1 }}>
        <View
          style={{
            height: 68,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.outline,
            justifyContent: 'center',
            paddingHorizontal: 16,
            backgroundColor: colors.background,
            marginHorizontal: -16,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surfaceVariant,
              borderRadius: 24,
              height: 44,
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
                height: 44,
                fontSize: 16,
                paddingVertical: 0,
                textAlign: 'center',
                backgroundColor: 'transparent',
              }}
            />
            <TextInput.Icon
              icon="magnify"
              style={{
                position: 'absolute',
                left: 12,
              }}
            />
          </View>
        </View>

          {medicines.length === 0 ? (
            <Animated.View 
              entering={FadeIn.duration(200)} 
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 20,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  paddingHorizontal: 24,
                  marginTop: 32,
                }}
              >
                {t.medicine.emptyState}
              </Text>
            </Animated.View>
          ) : filteredMedicines.length === 0 ? (
            <Animated.View 
              entering={FadeIn.duration(200)} 
              style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 20}}
            >
              <Text
                style={{
                  color: colors.onSurfaceVariant,
                  fontSize: 20,
                  fontWeight: '500',
                  textAlign: 'center',
                  marginTop: 32,
                }}
              >
                {t.actions.noResults}
              </Text>
            </Animated.View>
          ) : (
            <FlatList
              data={filteredMedicines}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: 72 }}
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
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text
                        numberOfLines={2}
                        ellipsizeMode="tail"
                        style={{
                          color: colors.onSurface,
                          fontSize: 16,
                          fontWeight: 'bold',
                        }}
                      >
                        {item.name}
                      </Text>
                      <Text style={{ color: colors.onSurface, fontSize: 16 }}>
                        {item.quantity}{' '}
                        {t.medicine.units[item.form as keyof typeof t.medicine.units] ?? item.form}
                      </Text>
                      <Text style={{ color: colors.onSurface, fontSize: 16 }}>
                        {formatDate(item.expiryDate, dateOrder, dateSeparator)}
                      </Text>
                    </View>
                    <View style={{ flexShrink: 0, flexDirection: 'row' }}>
                      <IconButton
                        icon="pencil"
                        size={25}
                        onPress={() => setEditingMedicine(item)}
                        iconColor={colors.primary}
                        style={{ margin: 0, marginRight: 4 }}
                      />
                      <IconButton
                        icon="delete"
                        size={26}
                        onPress={() => setSelectedForDelete(item)}
                        iconColor={colors.error}
                        style={{ margin: 0 }}
                      />
                    </View>
                  </View>
                </Card>
              )}
            />
          )}
        </Animated.View>
      )}

      {visible && (
        <Animated.View
          entering={FadeIn.delay(75).duration(200)}
          exiting={FadeOut.duration(100)}
          style={{
            position: 'absolute',
            right: 16,
            bottom: 16,
          }}
        >
          <FAB
            icon="plus"
            label={t.medicine.addTitle}
            onPress={handleAddPress} // Используем новую функцию с очисткой поиска
          />
        </Animated.View>
      )}

      {showAddModal && (
        <AddMedicineModal visible={showAddModal} onDismiss={() => setShowAddModal(false)} />
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
            <Text style={{ color: colors.onSurface, fontSize: 16 }}>
              {t.actions.deleteConfirm}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSelectedForDelete(null)}>
              <Text style={{ fontSize: 16 }}>{t.actions.cancel}</Text>
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
    </View>
  );
}
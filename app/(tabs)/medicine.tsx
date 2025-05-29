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

const filteredMedicines = medicines
  .filter((item) =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  )
  .sort((a, b) => {
    const dateA = new Date(a.expiryDate).getTime();
    const dateB = new Date(b.expiryDate).getTime();
    return dateA - dateB; // раньше — выше
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
    if (daysLeft <= 0) return colors.error; // Просрочено — цвет текста на красной карточке
    if (daysLeft <= 7) {
      // Градиент от оранжевого к красному
      const ratio = (7 - daysLeft) / 6; // 0 (7дн) ... 1 (1день)
      const red = Math.round(255);
      const green = Math.round(165 - ratio * 100); // 165 → 65
      const blue = Math.round(0);
      return `rgb(${red},${green},${blue})`; // от оранжевого к красному
    }
    return colors.onSurfaceVariant; // Нормальный цвет
  };

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
      {/* Верхний блок: имя и количество с кнопками */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
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
        </View>

        {/* Кнопки — подняты вверх и выровнены по top */}
        <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'flex-start' }}>
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

      {/* Нижний блок: дата и остаток */}
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{
          fontSize: 14,
          marginTop: 6,
          color: isExpired ? colors.onErrorContainer : getUrgencyColor(daysLeft),
        }}
      >
        {t.medicine.before} {formatDate(item.expiryDate, dateOrder, dateSeparator)} — {getDaysLeftText(item.expiryDate)}
      </Text>
    </Card>
  );
}}

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
import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  FlatList, 
  TouchableOpacity, 
  Dimensions, 
  TextInput as RNTextInput, 
  Keyboard, 
  TouchableWithoutFeedback,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useMedicine } from '@/contexts/MedicineContext';
import { Medicine } from '@/contexts/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddMedicineModal from '@/app/(modals)/edit-medicine';
import { useSettings } from '@/contexts/SettingsContext';
import PrimaryButton, { PrimaryButtonRef } from '@/components/PrimaryButton';
import {
  IconRight,
  IconPlus,
  IconMagnifying,
  IconXFill,
  IconPill,
  IconUp,
  IconDown,
} from '@/constants/icons';
import AppTile from '@/components/AppTile';
import { formatUnit } from '@/constants/locales/formatUnit';
import Header from '@/components/Header';

// Функция для получения сегодняшней даты в локальном времени (без времени)
function getTodayLocalDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Функция для создания даты из ISO строки в локальном времени
function parseISODateLocal(isoDate: string): Date {
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date();
}

// Порог прокрутки (30% высоты экрана)
const SCREEN_HEIGHT = Dimensions.get('screen').height;
const SCROLL_THRESHOLD = SCREEN_HEIGHT * 0.3;

export default function MedicineScreen() {
  const screenHeight = Dimensions.get('screen').height;
  const { medicines } = useMedicine();
  const theme = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef<RNTextInput>(null);

  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [editingMedicineId, setEditingMedicineId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const fabTranslateY = useRef(new Animated.Value(0)).current;
  const scrollToTopFabRef = useRef<PrimaryButtonRef>(null);
  const addButtonRef = useRef<PrimaryButtonRef>(null);

  const handleSaveSearchText = () => {
    searchInputRef.current?.blur();
    filteredMedicines.length === 0 && setSearchText('');
    Keyboard.dismiss();
  };

  // Обработчик прокрутки списка
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const yOffset = event.nativeEvent.contentOffset.y;
        
        // Показываем кнопку прокрутки вверх после определенного порога
        if (yOffset > SCROLL_THRESHOLD && !showScrollToTop) {
          setShowScrollToTop(true);
          scrollToTopFabRef.current?.show();
          
          // Поднимаем кнопку добавления
          Animated.timing(fabTranslateY, {
            toValue: -42,
            duration: 250,
            useNativeDriver: true,
          }).start();
        } else if (yOffset <= SCROLL_THRESHOLD && showScrollToTop) {
          setShowScrollToTop(false);
          scrollToTopFabRef.current?.hide();
          
          // Возвращаем кнопку добавления на место
          Animated.timing(fabTranslateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      },
    }
  );

  // Прокрутка к началу списка
  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // Получаем актуальные данные лекарства по ID
  const currentEditingMedicine = editingMedicineId 
    ? medicines.find(m => m.id === editingMedicineId) || null 
    : null;

  const handleAddPress = () => {
    setSearchText('');
    searchInputRef.current?.blur();
    setShowAddModal(true);
  };

  const handleEditPress = useCallback((medicine: Medicine) => {
    searchInputRef.current?.blur();
    setEditingMedicineId(medicine.id);
    setEditingMedicine(medicine);
  }, []);

  const handleEditDismiss = useCallback(() => {
    setEditingMedicineId(null);
    setEditingMedicine(null);
  }, []);

  const handleAddDismiss = useCallback(() => {
    setShowAddModal(false);
  }, []);

  const handleClearSearch = () => {
    setSearchText('');
    searchInputRef.current?.blur();
    Keyboard.dismiss();
  };

  const { dateOrder, dateSeparator, t, language } = useSettings();
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
    const today = getTodayLocalDate();
    const expiry = parseISODateLocal(isoDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return t.expiry.dueIn.replace('{days}', String(diffDays));
    if (diffDays === 0) return t.expiry.dueToday;
    return t.expiry.expired.replace('{days}', String(Math.abs(diffDays)));
  };

  // Утилита для конвертации hex в RGB
  const hexToRgb = (hex: string) => {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(ch => ch + ch).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
  };

  const rgbToCss = (r: number, g: number, b: number) => 
    `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;

  // ОБНОВЛЕННАЯ функция getUrgencyColor - как в ScheduleScreen
  const getUrgencyColor = useCallback((daysLeft: number): string => {
    if (daysLeft <= 0) {
      // Просрочено - используем красный цвет в зависимости от темы
      return theme.dark ? '#ff8989' : '#EE2D38';
    }
    
    const threshold = 14; // Порог срочности - 14 дней
    if (daysLeft <= threshold) {
      // Интерполяция цвета от базового к красному
      const ratio = Math.max(0, Math.min(1, (threshold - daysLeft) / threshold));
      const peakHex = theme.dark ? '#ff8989' : '#EE2D38';
      
      // Базовый цвет - onSurfaceVariant
      let baseRgb = { r: 140, g: 140, b: 140 };
      try {
        const cs = colors.onSurfaceVariant;
        if (cs.startsWith('#')) {
          baseRgb = hexToRgb(cs);
        } else if (cs.startsWith('rgb')) {
          const nums = cs.replace(/[^\d,]/g, '').split(',').map(n => Number(n));
          if (nums.length >= 3) {
            baseRgb = { r: nums[0], g: nums[1], b: nums[2] };
          }
        }
      } catch (e) {
        // Используем дефолтные значения
      }
      
      const peakRgb = hexToRgb(peakHex);
      const r = baseRgb.r + (peakRgb.r - baseRgb.r) * ratio;
      const g = baseRgb.g + (peakRgb.g - baseRgb.g) * ratio;
      const b = baseRgb.b + (peakRgb.b - baseRgb.b) * ratio;
      return rgbToCss(r, g, b);
    }
    
    return colors.onSurfaceVariant;
  }, [colors, theme.dark]);

  return (
    <View
      style={{
        backgroundColor: colors.background,
        paddingTop: insets.top - 14,
        paddingBottom: insets.bottom,
        paddingHorizontal: 3,
        flex: 1,
      }}
    >
    {/* Поисковая панель */}
    <Header
      hasInput
      inputRef={searchInputRef}
      value={searchText}
      onChangeText={setSearchText}
      onSubmitEditing={handleSaveSearchText}
      onBlur={handleSaveSearchText}
      placeholder={t.actions.search}
      icon={IconMagnifying}
      showClearButton
      onClear={handleClearSearch}
      clearIcon={IconXFill}
      iconProps={{ width: 28, height: 28 }}
    />

    {/* Список лекарств */}
    {medicines.length === 0 ? (
      <TouchableWithoutFeedback onPress={handleSaveSearchText}>
        <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 68 + insets.top + screenHeight / 3.5 }}>
          <Text style={{ color: colors.primary, fontSize: 20, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 24 }}>
            {t.medicine.emptyState}
          </Text>
        </View>
      </TouchableWithoutFeedback>
    ) : filteredMedicines.length === 0 ? (
      <TouchableWithoutFeedback onPress={handleSaveSearchText}>
        <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 68 + insets.top + screenHeight / 5 }}>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
            {t.actions.noResults}
          </Text>
        </View>
      </TouchableWithoutFeedback>
    ) : (
      <FlatList
        ref={flatListRef}
        data={filteredMedicines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 56 + insets.top, paddingBottom: showScrollToTop ? 184 : 142}}
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => {
          // Используем локальные даты для корректного расчета
          const expiryDate = parseISODateLocal(item.expiryDate);
          const today = getTodayLocalDate();
          const diffTime = expiryDate.getTime() - today.getTime();
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const urgencyColor = getUrgencyColor(daysLeft);

          return (
            <AppTile
              title={item.name}
              icon={IconPill}
              iconColor={colors.primary}
              backgroundColor={colors.surface}
              contentGap={6}
              style={{ marginBottom: 8, marginHorizontal: 13}}
              actions={<IconRight width={24} height={24} fill={"#AEAEAE"} />}
              onPress={() => handleEditPress(item)}
            >
              <Text style={{ color: colors.onSurface, fontSize: 16 }}>
                {item.quantity} {formatUnit(t.medicine.units, item.quantity, language, item.form)}
              </Text>
              <Text style={{ fontSize: 15, color: urgencyColor }}>
                {t.medicine.before} {formatDate(item.expiryDate, dateOrder, dateSeparator)} — {getDaysLeftText(item.expiryDate)}
              </Text>
            </AppTile>
          );
        }}
      />
    )}

    {/* Кнопка добавления с анимацией */}
    <Animated.View
      style={{
        transform: [{ translateY: fabTranslateY }],
      }}
    >
      <PrimaryButton
        ref={addButtonRef}
        label={t.medicine.fabLabel}
        icon={IconPlus}
        onPress={handleAddPress}
        textColor={colors.onSecondary}
        style={{
          position: 'absolute',
          right: 12,
          bottom: insets.bottom + 82,
        }}
      />
    </Animated.View>

    {/* Кнопка прокрутки вверх */}
    <PrimaryButton
      ref={scrollToTopFabRef}
      icon={IconUp}
      onPress={scrollToTop}
      style={{
        position: 'absolute',
        right: 16,
        bottom: insets.bottom + 76,
        borderRadius: 20,
      }}
      iconSize={24}
      animated
      show={false}
    />

    {/* Модалки */}
    {showAddModal && (
      <AddMedicineModal 
        visible={showAddModal} 
        onDismiss={handleAddDismiss} 
      />
    )}
    {currentEditingMedicine && (
      <AddMedicineModal 
        visible={!!currentEditingMedicine} 
        medicineToEdit={currentEditingMedicine} 
        onDismiss={handleEditDismiss} 
      />
    )}
  </View>
);
}
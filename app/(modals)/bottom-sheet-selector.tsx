import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import BaseModal from 'app/(modals)/base-modal';
import BaseTextInput from '@/components/BaseTextInput';
import AppTile from '@/components/AppTile';
import { IconCheck, IconUp } from '@/constants/icons';
import PrimaryButton, { PrimaryButtonRef } from '@/components/PrimaryButton';
import { useSettings } from '@/contexts/SettingsContext';
import { formatUnit, type WordForm } from '@/constants/locales/formatUnit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ITEM_HEIGHT = 50;
const SCROLL_THRESHOLD = 100;
let HEIGHT: number | `${number}%`;

type Option = {
  label: string;
  value: string;
};

interface Props {
  visible: boolean;
  title: string;
  options: Option[];
  onSelect: (value: string) => void;
  onDismiss: () => void;
  quantity?: string | number; // Добавляем количество как проп
  translationObject?: Record<WordForm, Record<string, string>>; // Объект переводов
  selectedValue?: string;
  showScrollToTopFab?: boolean;
  modalHeight: number | `${number}%`;
}

export default function BottomSheetSelector({
  visible,
  title,
  options,
  onSelect,
  onDismiss,
  quantity,
  translationObject,
  selectedValue,
  showScrollToTopFab = true,
  modalHeight
}: Props) {
  const { colors } = useTheme();
  const { t, language } = useSettings();
  const [search, setSearch] = useState('');
  const [tempSelectedValue, setTempSelectedValue] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const fabRef = useRef<PrimaryButtonRef>(null);
  const isScrolled = useRef(false);
  const insets = useSafeAreaInsets();
  HEIGHT = modalHeight;

  useEffect(() => {
    if (visible) {
      setTempSelectedValue(selectedValue || null);
      setSearch('');
      
      if (selectedValue && scrollViewRef.current) {
        setTimeout(() => {
          const selectedIndex = options.findIndex(opt => opt.value === selectedValue);
          if (selectedIndex >= 0) {
            scrollViewRef.current?.scrollTo({
              y: selectedIndex * ITEM_HEIGHT,
              animated: true
            });
          }
        }, 100);
      }
    } else {
      setSearch('');
      setTempSelectedValue(null);
      fabRef.current?.hide();
      isScrolled.current = false;
    }
  }, [visible, selectedValue, options]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!showScrollToTopFab) return;
    
    const yOffset = event.nativeEvent.contentOffset.y;
    
    if (yOffset > SCROLL_THRESHOLD && !isScrolled.current) {
      isScrolled.current = true;
      fabRef.current?.show();
    } else if (yOffset <= SCROLL_THRESHOLD && isScrolled.current) {
      isScrolled.current = false;
      fabRef.current?.hide();
    }
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    fabRef.current?.hide();
    isScrolled.current = false;
  };

  const sortedOptions = useMemo(() => {
    if (!selectedValue) return options;
    
    const selectedOption = options.find(opt => opt.value === selectedValue);
    const otherOptions = options.filter(opt => opt.value !== selectedValue);
    
    return selectedOption ? [selectedOption, ...otherOptions] : options;
  }, [options, selectedValue]);

  const filteredOptions = useMemo(() => {
    return sortedOptions.filter(opt => {
      const displayLabel = translationObject && quantity !== undefined 
        ? formatUnit(translationObject, quantity, opt.value, language)
        : opt.label;
      
      return displayLabel.toLowerCase().includes(search.toLowerCase());
    });
  }, [search, sortedOptions, translationObject, quantity, language]);

  const handleSelect = (value: string) => {
    setTempSelectedValue(prev => prev === value ? null : value);
  };

  const handleConfirmSelection = () => {
    if (tempSelectedValue) {
      onSelect(tempSelectedValue);
      setSearch('');
      setTempSelectedValue(null);
      onDismiss();
    }
  };

  const handleCancel = () => {
    setTempSelectedValue(null);
    setSearch('');
    onDismiss();
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onDismiss}
      title={title}
      maxHeight={modalHeight}
      minHeight={modalHeight}
      leftButtonText={t.actions.cancel}
      onLeftButtonPress={handleCancel}
      rightButtonText={t.actions.select}
      onRightButtonPress={handleConfirmSelection}
      rightButtonDisabled={!tempSelectedValue}
    >
      {filteredOptions.length > 0 ? (
        <ScrollView
          ref={scrollViewRef}
          style={{ marginTop: 50, height: modalHeight, zIndex: -2, }}
          contentContainerStyle={{paddingHorizontal: 16, paddingTop: 24, paddingBottom: 48}}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <AppTile
            simpleTile={true}
            backgroundColor={colors.surface}
            style={{paddingHorizontal: 16, marginBottom: 8 }}
          >
            {filteredOptions.map((item, index) => ( 
              <TouchableOpacity
                key={item.value}
                style={[
                  index < filteredOptions.length - 1 && styles.itemWithBorder,
                  { 
                    borderBottomColor: colors.outline, 
                    paddingVertical: tempSelectedValue === item.value ? 11 : 12,
                  },
                  styles.itemContainer,
                ]}
                onPress={() => {
                  handleSelect(item.value);
                  Keyboard.dismiss();
                }}
              >
                <Text style={{fontSize: 16, color: colors.onSurface, flex: 1 }}>
                  {translationObject && quantity !== undefined 
                    ? formatUnit(translationObject, quantity, item.value, language)
                    : item.label}
                </Text>
                {tempSelectedValue === item.value && (
                  <IconCheck width={22} height={22} fill={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </AppTile>
        </ScrollView>
      ) : (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.noResults}>
          <Text style={[styles.noResultsText, { color: colors.onSurfaceVariant }]}>
            {t.actions.noResults}
          </Text>
        </View>
        </TouchableWithoutFeedback>
      )}

      {showScrollToTopFab && (
        <PrimaryButton
          ref={fabRef}
          icon={IconUp}
          onPress={scrollToTop}
          style={{
            position: 'absolute',
            right: 16,
            bottom: 8,
            borderRadius: 20,
            zIndex: -1,
          }}
          iconSize={24}
          animated
          show={false}
        />
      )}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <AppTile
          simpleTile={true}
          style={{
            borderRadius: 8,
            marginHorizontal: 16,
            position: 'absolute', 
            left: 0, 
            top: 17,
            right: 0
          }}
        >
          <BaseTextInput
            placeholder={t.actions.search}
            value={search}
            onChangeText={setSearch}
            borderColor={colors.outline}
          />
        </AppTile>
      </TouchableWithoutFeedback>
    </BaseModal>
  );
}

const styles = StyleSheet.create({ 
  itemWithBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  noResults: {
    height: 1000,
    alignItems: 'center',
  },
  noResultsText: {
    top: 100,
    fontSize: 20,
    fontWeight: 'bold',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
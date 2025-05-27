import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Keyboard,
  Animated,
  Easing,
} from 'react-native';

import { Text, TextInput, useTheme } from 'react-native-paper';
import Modal from 'react-native-modal';
import { useLanguage } from '@/contexts/LanguageContext';

interface Option {
  label: string;
  value: string;
}

interface Props {
  visible: boolean;
  title?: string;
  options: Option[];
  onSelect: (value: string) => void;
  onDismiss: () => void;
}

const screenHeight = Dimensions.get('window').height;
const MAX_HEIGHT = screenHeight * 0.85;

export default function BottomSheetSelector({
  visible,
  title,
  options,
  onSelect,
  onDismiss,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  const translateY = useRef(new Animated.Value(0)).current;
  const animatedUp = useRef(false);

  const filteredOptions = useMemo(() => {
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, options]);

  const handleSelect = (value: string) => {
    onSelect(value);
    setSearch('');
  };

  // Сброс при повторном открытии
  useEffect(() => {
    if (visible) {
      setSearch('');
    }
    const offset = screenHeight * 0.15;

    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      Animated.timing(translateY, {
        toValue: -offset,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const handleInitialLayout = (e: any) => {
    if (!measuredHeight) {
      setMeasuredHeight(e.nativeEvent.layout.height);
    }
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onDismiss}
      onBackButtonPress={onDismiss}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropTransitionOutTiming={0}
      style={styles.modal}
      useNativeDriver
    >
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            backgroundColor: theme.colors.background,
            ...(keyboardVisible
              ? { height: MAX_HEIGHT, transform: [{ translateY: 0 }] } // 👈 без подъема!
              : { maxHeight: MAX_HEIGHT, transform: [{ translateY }] }),
          },
        ]}
        onLayout={handleInitialLayout}
      >
        <View style={styles.container}>
          {title && (
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              {title}
            </Text>
          )}

          <TextInput
            placeholder={t.actions.search}
            value={search}
            onChangeText={setSearch}
            style={[
              styles.input,
              { backgroundColor: theme.colors.surface, fontSize: 16 },
            ]}
          />

          {filteredOptions.length > 0 ? (
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text style={{ color: theme.colors.onSurface, fontSize: 16 }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            <View style={styles.noResults}>
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 20, fontWeight: 'bold'}}>
                {t.actions.noResults}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  animatedContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  container: {
    flexShrink: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  noResults: {
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
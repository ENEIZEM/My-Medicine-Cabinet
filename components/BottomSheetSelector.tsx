import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
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
  title?: string; // передаётся уже переведённая строка
  options: Option[];
  onSelect: (value: string) => void;
  onDismiss: () => void;
}

export default function BottomSheetSelector({
  visible,
  title,
  options,
  onSelect,
  onDismiss,
}: Props) {
  const theme = useTheme();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, options]);

  const handleSelect = (value: string) => {
    onSelect(value);
    setSearch('');
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
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {title && (
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            {title}
          </Text>
        )}

        <TextInput
          placeholder={t.actions.search}
          value={search}
          onChangeText={setSearch}
          style={[styles.input, { backgroundColor: theme.colors.surface }]}
        />

        <FlatList
          data={filteredOptions}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => handleSelect(item.value)}
            >
              <Text style={{ color: theme.colors.onSurface }}>{item.label}</Text>
            </TouchableOpacity>
          )}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  container: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '90%',
  },
  title: {
    fontSize: 18,
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
});

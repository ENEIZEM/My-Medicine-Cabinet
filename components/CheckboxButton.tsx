import React, { useRef, useEffect } from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useTheme } from 'react-native-paper';

type Option<T> = {
  value: T;
  label: string;
};

type SingleProps<T> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  single: true;
  columns?: number;
  marginTop?: number;
  marginBottom?: number;
};

type MultipleProps<T> = {
  options: Option<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  single?: false;
  columns?: number;
  marginTop?: number;
  marginBottom?: number;
};

type Props<T> = SingleProps<T> | MultipleProps<T>;

export default function CheckboxButtonGroup<T extends string | number>({
  options,
  value,
  onChange,
  single,
  columns,
  marginTop = 0,
  marginBottom = 0,
}: Props<T>) {
  const { colors } = useTheme();
  const animations = useRef<Record<string, Animated.Value>>({}).current;

  const isSelected = (val: T): boolean => {
    return single ? value === val : (value as T[]).includes(val);
  };

  const handlePress = (val: T) => {
    if (single) {
      (onChange as (val: T) => void)(val);
    } else {
      const selected = value as T[];
      const alreadySelected = selected.includes(val);
      const newSelected = alreadySelected
        ? selected.filter((v) => v !== val)
        : [...selected, val];
      (onChange as (val: T[]) => void)(newSelected);
    }
  };

  const getAnimation = (val: T) => {
    const key = String(val);
    if (!animations[key]) {
      animations[key] = new Animated.Value(isSelected(val) ? 1 : 0);
    }
    return animations[key];
  };

  const startAnimation = (val: T, toValue: number) => {
    const animation = getAnimation(val);
    Animated.timing(animation, {
      toValue,
      duration: 250,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    options.forEach(option => {
      const selected = isSelected(option.value);
      startAnimation(option.value, selected ? 1 : 0);
    });
  }, [value]);

  // Группируем по колонкам
  const chunked = columns
    ? options.reduce<Option<T>[][]>((acc, curr, i) => {
        const row = Math.floor(i / columns);
        if (!acc[row]) acc[row] = [];
        acc[row].push(curr);
        return acc;
      }, [])
    : [options];

  return (
    <View style={{ marginTop, marginBottom: marginBottom - 20 }}>
      {chunked.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((option, index) => {
            const selected = isSelected(option.value);
            const animation = getAnimation(option.value);

            // Обновленные цвета для неактивного состояния
            const backgroundColor = animation.interpolate({
              inputRange: [0, 1],
              outputRange: [colors.surfaceDisabled, colors.primary], // Неактивный фон → основной цвет
            });

            const borderColor = animation.interpolate({
              inputRange: [0, 1],
              outputRange: [colors.outlineVariant, colors.primary], // Неактивная граница → основной цвет
            });

            const textColor = animation.interpolate({
              inputRange: [0, 1],
              outputRange: [colors.onSurface, colors.onPrimary], // Неактивный текст → текст на primary
            });

            return (
              <View 
                key={String(option.value)}
                style={[
                  styles.buttonContainer,
                  {
                    flex: columns ? 1 : undefined,
                    marginLeft: columns && index > 0 ? 8 : 0,
                  },
                ]}
              >
                <Pressable
                  onPress={() => handlePress(option.value)}
                  style={styles.pressable}
                >
                  <Animated.View
                    style={[
                      styles.button,
                      {
                        backgroundColor,
                        borderColor,
                      },
                    ]}
                  >
                    <Animated.Text
                      style={{
                        color: textColor,
                        fontSize: 15,
                        fontWeight: '500',
                        textAlign: 'center',
                      }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {option.label}
                    </Animated.Text>
                  </Animated.View>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    width: '100%',
  },
  buttonContainer: {
    flex: 1,
    minWidth: 0,
  },
  pressable: {
    width: '100%',
  },
  button: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});
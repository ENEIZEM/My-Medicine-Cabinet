import React, { useRef, useEffect } from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SvgProps } from 'react-native-svg';
import { useTheme } from 'react-native-paper';

type CheckboxItem<T> = {
  value: T;
  label?: string; // опционально — если нет, будет просто чекбокс
};

type TextPosition = 'top' | 'right' | 'bottom' | 'left';

type BasePropsCommon<T> = {
  items: CheckboxItem<T>[];
  checkedIcon: React.FC<SvgProps>;
  uncheckedIcon: React.FC<SvgProps>;
  textPosition?: TextPosition;
  columns?: number;
  checkedIconColor?: string;
  uncheckedIconColor?: string;
  checkedTextColor?: string;
  uncheckedTextColor?: string;
  style?: ViewStyle;
  itemStyle?: ViewStyle;
  textStyle?: TextStyle;
  spacing?: number;
  checkboxSize?: number;
  marginTop?: number;
  marginBottom?: number;
};

type SingleProps<T> = BasePropsCommon<T> & {
  value: T | null;
  onChange: (value: T | null) => void;
  multiple?: false;
};

type MultipleProps<T> = BasePropsCommon<T> & {
  value: T[];
  onChange: (value: T[]) => void;
  multiple: true;
};

type Props<T> = SingleProps<T> | MultipleProps<T>;

export default function BaseCheckbox<T extends string | number>({
  items,
  value,
  onChange,
  multiple = false,
  checkedIcon: CheckedIcon,
  uncheckedIcon: UncheckedIcon,
  textPosition = 'bottom',
  columns,
  checkedIconColor,
  uncheckedIconColor,
  checkedTextColor,
  uncheckedTextColor,
  style,
  itemStyle,
  textStyle,
  spacing = 0,
  checkboxSize = 28,
  marginTop = 0,
  marginBottom = 0,
}: Props<T>) {
  const { colors } = useTheme();
  const pressAnimations = useRef<Record<string, Animated.Value>>({}).current;

  // Defaults как просили:
  const defaultCheckedIconColor = checkedIconColor ?? colors.primary;
  const defaultUncheckedIconColor = uncheckedIconColor ?? colors.outline;
  const defaultCheckedTextColor = checkedTextColor ?? colors.onSurface;
  const defaultUncheckedTextColor = uncheckedTextColor ?? colors.outline;

  const isSelected = (val: T): boolean => {
    if (multiple) {
      return (value as T[]).includes(val);
    }
    return value === val;
  };

  const handlePress = (val: T) => {
    if (multiple) {
      const selected = value as T[];
      const alreadySelected = selected.includes(val);
      const newSelected = alreadySelected
        ? selected.filter((v) => v !== val)
        : [...selected, val];
      (onChange as (val: T[]) => void)(newSelected);
    } else {
      const currentValue = value as T | null;
      const newValue = currentValue === val ? null : val;
      (onChange as (val: T | null) => void)(newValue);
    }
  };

  const getPressAnimation = (val: T) => {
    const key = String(val);
    if (!pressAnimations[key]) {
      pressAnimations[key] = new Animated.Value(0);
    }
    return pressAnimations[key];
  };

  const handlePressIn = (val: T) => {
    const pressAnimation = getPressAnimation(val);
    Animated.timing(pressAnimation, {
      toValue: 1,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (val: T) => {
    const pressAnimation = getPressAnimation(val);
    Animated.timing(pressAnimation, {
      toValue: 0,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    const currentItemValues = items.map(item => String(item.value));
    const pressAnimationKeys = Object.keys(pressAnimations);
    
    pressAnimationKeys.forEach(key => {
      if (!currentItemValues.includes(key)) {
        delete pressAnimations[key];
      }
    });
  }, [items]);

  const getContentLayout = () => {
    switch (textPosition) {
      case 'top':
        return {
          wrapper: { alignItems: 'center' as const },
          content: { flexDirection: 'column' as const, alignItems: 'center' as const },
          textAlignment: { textAlign: 'center' as const},
        };
      case 'right':
        return {
          wrapper: { alignItems: 'flex-start' as const },
          content: { flexDirection: 'row' as const, alignItems: 'center' as const },
        };
      case 'bottom':
        return {
          wrapper: { alignItems: 'center' as const },
          content: { flexDirection: 'column-reverse' as const, alignItems: 'center' as const },
          textAlignment: { textAlign: 'center' as const},
        };
      case 'left':
        return {
          wrapper: { alignItems: 'flex-start' as const },
          content: { flexDirection: 'row-reverse' as const, alignItems: 'center' as const },
        };
      default:
        return {
          wrapper: { alignItems: 'center' as const },
          content: { flexDirection: 'column-reverse' as const, alignItems: 'center' as const },
          textAlignment: { textAlign: 'center' as const},
        };
    }
  };

  const layout = getContentLayout();

  const renderCheckbox = (item: CheckboxItem<T>, index: number, rowItems: CheckboxItem<T>[] = []) => {
    const selected = isSelected(item.value);
    const pressAnimation = getPressAnimation(item.value);

    const currentIconColor = selected ? defaultCheckedIconColor : defaultUncheckedIconColor;
    const currentTextColor = selected ? defaultCheckedTextColor : defaultUncheckedTextColor;

    const scale = pressAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.9],
    });

    // Используем более точное вычисление ширины для колонок
    const itemWidth = columns ? (1 / columns) * 100 : undefined;

    return (
      <View 
        key={String(item.value)} 
        style={[
          styles.itemContainer, 
          { 
            marginBottom: spacing,
            // Используем flexBasis вместо width для более предсказуемого поведения
            flexBasis: itemWidth ? `${itemWidth}%` : undefined,
            maxWidth: itemWidth ? `${itemWidth}%` : undefined,
            alignItems: 'center',
            justifyContent: 'center',
          }, 
          itemStyle
        ]}
      >
        <View style={[layout.wrapper, { width: '100%' }]}>
          <Animated.View style={[{ transform: [{ scale }] }]}>
            <Pressable
              onPress={() => handlePress(item.value)}
              onPressIn={() => handlePressIn(item.value)}
              onPressOut={() => handlePressOut(item.value)}
              style={[styles.pressable]}
            >
              <View style={[styles.contentRow, layout.content]}>
                <View style={[styles.checkbox, { width: checkboxSize, height: checkboxSize }]}>
                  {selected ? (
                    <CheckedIcon
                      width={checkboxSize}
                      height={checkboxSize}
                      fill={currentIconColor}
                    />
                  ) : (
                    <UncheckedIcon
                      width={checkboxSize}
                      height={checkboxSize}
                      fill={currentIconColor}
                    />
                  )}
                </View>

                {/* Метка рендерится только если item.label присутствует */}
                {item.label ? (
                  <Text
                    style={[
                      styles.label,
                      { color: currentTextColor, fontWeight: selected ? '600' : '500' },
                      layout.textAlignment,
                      textStyle,
                    ]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item.label}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { marginTop, marginBottom }, style]}>
      {columns ? (
        <View style={styles.rowContainer}>
          {items.map((item, index) => renderCheckbox(item, index, items))}
        </View>
      ) : (
        items.map((item, index) => renderCheckbox(item, index))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  rowContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    // Убираем justifyContent: 'space-between' чтобы избежать конфликтов
    // alignItems: 'flex-start', // можно добавить если нужно
  },
  itemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // Убираем минимальную ширину, чтобы элементы могли сжиматься при необходимости
  },
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '400',
    flexShrink: 1,
    textAlign: 'center',
  },
});
import React, { useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
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

type ChipItem = {
  colorIcon?: string;
  id: string | number;
  label?: string;
  icon?: React.FC<SvgProps>;
  onPress?: () => void;
};

type Props = {
  items: ChipItem[];
  chipColor?: string;
  chipTextColor?: string;
  iconColor?: string;
  style?: ViewStyle;
  chipStyle?: ViewStyle;
  textStyle?: TextStyle;
  showsHorizontalScrollIndicator?: boolean;
  contentContainerStyle?: ViewStyle;
  spacing?: number;
  marginTop?: number;
  marginBottom?: number;
};

export default function HorizontalScrollChips({
  items,
  chipColor,
  chipTextColor,
  iconColor,
  style,
  chipStyle,
  textStyle,
  showsHorizontalScrollIndicator = false,
  contentContainerStyle,
  spacing = 6,
  marginTop = 0,
  marginBottom = 0,
}: Props) {
  const { colors } = useTheme();
  const pressAnimations = useRef<Record<string, Animated.Value>>({}).current;

  // Дефолтные цвета как у чекбоксов
  const defaultChipColor = chipColor ?? colors.surfaceDisabled;
  const defaultTextColor = chipTextColor ?? colors.onSurface;
  const defaultIconColor = iconColor ?? (chipTextColor ?? colors.onSurface);

  const getPressAnimation = (id: string | number) => {
    const key = String(id);
    if (!pressAnimations[key]) {
      pressAnimations[key] = new Animated.Value(0);
    }
    return pressAnimations[key];
  };

  const handlePressIn = (id: string | number) => {
    const pressAnimation = getPressAnimation(id);
    Animated.timing(pressAnimation, {
      toValue: 1,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (id: string | number) => {
    const pressAnimation = getPressAnimation(id);
    Animated.timing(pressAnimation, {
      toValue: 0,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handlePress = (item: ChipItem) => {
    if (item.onPress) {
      item.onPress();
    }
  };

  // Получаем цвет для нажатия
//   const getPressedColor = (baseColor: string) => {
//     const c = tinycolor(baseColor);
//     return c.isLight() ? c.darken(10).toString() : c.lighten(10).toString();
//   };

  // Очищаем анимации для удаленных элементов
  useEffect(() => {
    const currentItemIds = items.map(item => String(item.id));
    const pressAnimationKeys = Object.keys(pressAnimations);
    
    // Удаляем анимации для элементов, которых больше нет
    pressAnimationKeys.forEach(key => {
      if (!currentItemIds.includes(key)) {
        delete pressAnimations[key];
      }
    });
  }, [items]);

  const renderChip = (item: ChipItem, index: number) => {
    const pressAnimation = getPressAnimation(item.id);

    const scale = pressAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.9],
    });

    return (
      <Animated.View
        key={String(item.id)}
        style={[
          {
            marginLeft: index === 0 ? 0 : spacing,
            transform: [{ scale }],
          },
        ]}
      >
        <Pressable
          onPress={item.onPress ? () => handlePress(item) : undefined}
          onPressIn={item.onPress ? () => handlePressIn(item.id) : undefined}
          onPressOut={item.onPress ? () => handlePressOut(item.id) : undefined}
          style={styles.pressable}
        >
          <View
            style={[
              styles.chip,
              {
                backgroundColor: defaultChipColor,
              },
              chipStyle,
            ]}
          >
            <View style={styles.chipContent}>
              {item.icon && (
                <View 
                  style={[
                    styles.iconWrapper,
                    { marginRight: item.label ? 2 : 0 }
                  ]}
                >
                  <item.icon 
                    width={20} 
                    height={20} 
                    fill={item.colorIcon || defaultIconColor} 
                  />
                </View>
              )}
              {item.label && (
                <Text
                  style={[
                    styles.chipText,
                    { color: defaultTextColor },
                    textStyle,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.label}
                </Text>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      style={[styles.container, style]}
      contentContainerStyle={[
        styles.contentContainer, { 
          marginTop,
          marginBottom,
        },
        contentContainerStyle
      ]}
      decelerationRate="fast"
      onScrollBeginDrag={() => {
        // Блокируем родительский скролл при начале прокрутки
      }}
      scrollEventThrottle={16}
    >
      {items.map((item, index) => renderChip(item, index))}
    </ScrollView>
  );
}

// Удалим AnimatedIcon так как он больше не нужен

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  contentContainer: {
    alignItems: 'center',
    paddingVertical: 0,
  },
  pressable: {
    // Обеспечиваем правильную область нажатия
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 0,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 20,
    height: 20,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
});
import React, { useRef, useEffect } from 'react';
import {
  Pressable,
  View,
  StyleSheet,
  Animated,
  Easing,
  Keyboard,
  TextStyle,
  ViewStyle,
  DimensionValue,
} from 'react-native';
import { SvgProps } from 'react-native-svg';
import tinycolor from 'tinycolor2';
import { useTheme } from 'react-native-paper';

type Props = {
  label?: string;
  onPress: () => void;
  icon?: React.FC<SvgProps>;
  color?: string;
  textColor?: string;
  borderColor?: string;
  disabledColor?: string;
  disabledTextColor?: string;
  disabledBorderColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  width?: DimensionValue;
  disabled?: boolean;
};

export default function BaseButton({
  label,
  onPress,
  icon: Icon,
  color,
  textColor,
  borderColor = 'transparent',
  disabledColor,
  disabledTextColor,
  disabledBorderColor,
  style,
  textStyle,
  width = '100%',
  disabled = false,
}: Props) {
  const { colors } = useTheme();

  const pressAnimation = useRef(new Animated.Value(0)).current;
  const stateAnimation = useRef(new Animated.Value(disabled ? 1 : 0)).current;

  // --- Цвета ---
  const baseColor = color ?? 'transparent';
  const baseTextColor = textColor ?? colors.onSurface;
  const baseBorderColor = borderColor;

  const inactiveColor = disabledColor ?? colors.surfaceDisabled;
  const inactiveTextColor = disabledTextColor ?? colors.onSurfaceDisabled;
  const inactiveBorderColor = disabledBorderColor ?? colors.outlineVariant;

  // --- Анимированные состояния ---
  const backgroundColor = stateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [baseColor, inactiveColor],
  });

  const animatedTextColor = stateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [baseTextColor, inactiveTextColor],
  });

  const animatedBorderColor = stateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [baseBorderColor, inactiveBorderColor],
  });

  // --- Цвет при нажатии ---
  const isTransparent = baseColor === 'transparent';
  const getPressedColor = () => {
    if (isTransparent) {
      return tinycolor(colors.primary).setAlpha(0.25).toRgbString();
    }
    const c = tinycolor(baseColor);
    return c.isLight() ? c.darken(25).toString() : c.lighten(25).toString();
  };
  const pressedColor = getPressedColor();

  // --- Обработчики ---
  const handlePress = () => {
    if (disabled) return;
    Keyboard.dismiss();
    onPress();
  };

  const handlePressIn = () => {
    if (disabled) return;
    Animated.timing(pressAnimation, {
      toValue: 1,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.timing(pressAnimation, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  // --- Анимация состояния disabled ---
  useEffect(() => {
    Animated.timing(stateAnimation, {
      toValue: disabled ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [disabled]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.button, { width }, style]}
      // 👇 Перехватываем событие и предотвращаем всплытие в AppTile
      onStartShouldSetResponder={() => true}
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Фон кнопки */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor,
            borderRadius: 8,
            borderColor: animatedBorderColor,
            borderWidth: borderColor === 'transparent' ? 0 : 1,
          },
        ]}
      />

      {/* Полупрозрачный слой при нажатии */}
      {!disabled && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: pressedColor,
              borderRadius: 8,
              opacity: pressAnimation,
            },
          ]}
        />
      )}

      {/* Контент */}
      <View style={styles.content}>
        {Icon && (
          <View style={label ? styles.iconWrapper : null}>
            <AnimatedSvgIcon
              Icon={Icon}
              width={20}
              height={20}
              fill={animatedTextColor as unknown as string}
            />
          </View>
        )}

        {label ? (
          <Animated.Text
            style={[styles.label, { color: animatedTextColor }, textStyle]}
          >
            {label}
          </Animated.Text>
        ) : null}
      </View>
    </Pressable>
  );
}

// --- Обёртка для SVG-иконки ---
const AnimatedSvgIcon = Animated.createAnimatedComponent(
  (props: SvgProps & { Icon: React.FC<SvgProps> }) => {
    const { Icon, ...rest } = props;
    return <Icon {...rest} />;
  }
);

const styles = StyleSheet.create({
  button: {
    height: 40,
    borderRadius: 8,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    height: '100%',
    zIndex: 1,
  },
  iconWrapper: {
    width: 20,
    height: 20,
    marginRight: 4,
    marginLeft: -4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
});

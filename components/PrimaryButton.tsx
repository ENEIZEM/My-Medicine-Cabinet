import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  Pressable, 
  Animated, 
  Easing,
  Text,
  ViewStyle,
  TextStyle,
  View
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { SvgProps } from 'react-native-svg';
import tinycolor from 'tinycolor2';

type Props = {
  label?: string;
  icon?: React.FC<SvgProps>;
  onPress: () => void;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  iconSize?: number;
  show?: boolean; // Новый проп для управления видимостью
  animated?: boolean; // Включить анимацию появления
};

export type PrimaryButtonRef = {
  show: () => void;
  hide: () => void;
};

const PrimaryButton = forwardRef<PrimaryButtonRef, Props>(({
  label = '',
  icon: Icon,
  onPress,
  color,
  textColor,
  style,
  textStyle,
  iconSize = 25,
  show = true,
  animated = true,
}, ref) => {
  const { colors } = useTheme();
  const pressAnimValue = useRef(new Animated.Value(0)).current;
  const visibilityAnimValue = useRef(new Animated.Value(show ? 1 : 0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Цвета
  const baseColor = color ?? colors.secondary;
  const contentColor = textColor ?? colors.onSecondary;
  const pressedColor = tinycolor(baseColor)
    [tinycolor(baseColor).isDark() ? 'lighten' : 'darken'](25)
    .toString();

  // Управление видимостью извне
  useImperativeHandle(ref, () => ({
    show: () => handleVisibilityChange(true),
    hide: () => handleVisibilityChange(false),
  }));

  // Анимация нажатия
  const startPressAnimation = (toValue: number, duration: number) => {
    animationRef.current?.stop();
    animationRef.current = Animated.timing(pressAnimValue, {
      toValue,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    });
    animationRef.current.start();
  };

  // Анимация видимости
  const handleVisibilityChange = (visible: boolean) => {
    if (!animated) {
      visibilityAnimValue.setValue(visible ? 1 : 0);
      return;
    }

    Animated.timing(visibilityAnimValue, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Обработчики нажатия
  const handlePressIn = () => {
    startPressAnimation(1, 150);
  };

  const handlePressOut = () => {
    startPressAnimation(0, 250);
  };

  // Эффект для синхронизации с пропом show
  useEffect(() => {
    handleVisibilityChange(show);
  }, [show]);

  // Очистка анимаций
  useEffect(() => {
    return () => {
      animationRef.current?.stop();
    };
  }, []);

  // Анимированные стили
  const animatedPressStyles = {
    backgroundColor: pressAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: [baseColor, pressedColor],
    }),
  };

  const animatedVisibilityStyles = {
    opacity: visibilityAnimValue,
    transform: [
      {
        translateY: visibilityAnimValue.interpolate({
          inputRange: [0, 1],
          outputRange: [100, 0],
        }),
      },
    ],
  };

  // Извлекаем позиционирование из style пропса
  const { position, top, right, bottom, left, zIndex, ...restStyle } = (style as any) || {};
  const positionStyle = { position, top, right, bottom, left, zIndex };

  return (
    <Animated.View
      style={[
        positionStyle,
        animated && animatedVisibilityStyles,
        {
          zIndex: positionStyle.zIndex || 9999,
        }
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: Icon && !label ? 8 : 12,
              paddingVertical: Icon && !label ? 8 : 14,
              borderRadius: 12,
              overflow: 'hidden',

            },
            animatedPressStyles,
            restStyle,
          ]}
        >
          {Icon && (
            <Icon 
              width={iconSize} 
              height={iconSize} 
              fill={contentColor} 
              style={label ? { marginRight: 8 } : undefined} 
            />
          )}
          {label ? (
            <Text
              style={[
                {
                  fontSize: 15,
                  fontWeight: '500',
                  color: contentColor,
                },
                textStyle,
              ]}
            >
              {label}
            </Text>
          ) : null}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

export default PrimaryButton;
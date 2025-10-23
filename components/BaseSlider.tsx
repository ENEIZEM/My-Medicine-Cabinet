import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Animated, StyleSheet, ViewStyle, DimensionValue, LayoutChangeEvent, Easing } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from 'react-native-paper';

type Props = {
  value: number;
  onValueChange: (value: number) => void;
  onSlidingStart?: () => void;
  onSlidingComplete?: (value: number) => void;
  activeColor?: string;
  inactiveColor?: string;
  thumbColor?: string;
  style?: ViewStyle;
  width?: DimensionValue;
  height?: number;
  thumbSize?: number;
  disabled?: boolean;
  marginTop?: number;
  marginBottom?: number;
  min?: number;
  max?: number;
  step?: number;
  animationDuration?: number;
  delayRender?: number; // Новый проп для задержки рендера
};

export default function BaseSlider({
  value,
  onValueChange,
  onSlidingStart,
  onSlidingComplete,
  activeColor,
  inactiveColor,
  thumbColor,
  style,
  width = '100%',
  height = 4,
  thumbSize = 20,
  disabled = false,
  marginTop = -8,
  marginBottom = -8,
  min = 0,
  max = 100,
  step = 1,
  animationDuration = 100,
  delayRender = 100, // Задержка перед рендером слайдера
}: Props) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const positionAnim = useRef(new Animated.Value(0)).current;
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isLayoutMeasured, setIsLayoutMeasured] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const sliderRef = useRef<any>(null);
  const isDragging = useRef(false);
  const prevMin = useRef(min);
  const prevMax = useRef(max);
  const initialValueSet = useRef(false);

  const finalActiveColor = activeColor || colors.primary;
  const finalInactiveColor = inactiveColor || colors.surfaceDisabled;
  const finalThumbColor = thumbColor || colors.primary;

  // Задержка рендера для синхронизации с анимацией модалки
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delayRender);

    return () => clearTimeout(timer);
  }, [delayRender]);

  const clampValue = useCallback((val: number) => {
    return Math.min(Math.max(val, min), max);
  }, [min, max]);

  const calculateThumbPosition = useCallback((val: number, width: number) => {
    const clampedVal = clampValue(val);
    const position = ((clampedVal - min) / (max - min)) * (width - thumbSize);
    return Math.max(0, position);
  }, [min, max, thumbSize, clampValue]);

  const updateThumbPosition = useCallback((val: number, width: number, animate: boolean = true) => {
    if (width > 0) {
      const thumbLeft = calculateThumbPosition(val, width);
      if (animate && !isDragging.current && initialValueSet.current) {
        animatePosition(thumbLeft);
      } else {
        positionAnim.setValue(thumbLeft);
      }
    }
  }, [calculateThumbPosition, positionAnim]);

  const animateScale = useCallback((toValue: number) => {
    Animated.spring(scaleAnim, {
      toValue,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  }, [scaleAnim]);

  const animatePosition = useCallback((toValue: number) => {
    Animated.timing(positionAnim, {
      toValue,
      duration: animationDuration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [positionAnim, animationDuration]);

  const handleSlidingStart = () => {
    isDragging.current = true;
    onSlidingStart?.();
    animateScale(1.3);
  };

  const handleSlidingComplete = (val: number) => {
    const clampedValue = clampValue(val);
    isDragging.current = false;
    onSlidingComplete?.(clampedValue);
    animateScale(1);
    updateThumbPosition(clampedValue, sliderWidth);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setSliderWidth(width);
    setIsLayoutMeasured(true);
    
    // Устанавливаем начальную позицию без анимации
    if (!initialValueSet.current) {
      updateThumbPosition(internalValue, width, false);
      initialValueSet.current = true;
    }
  };

  // Инициализация позиции при монтировании
  useEffect(() => {
    if (sliderWidth > 0 && !initialValueSet.current) {
      updateThumbPosition(value, sliderWidth, false);
      initialValueSet.current = true;
    }
  }, [sliderWidth, value, updateThumbPosition]);

  // Синхронизация внутреннего значения с внешним
  useEffect(() => {
    const clampedValue = clampValue(value);
    if (!isDragging.current) {
      setInternalValue(clampedValue);
      if (isLayoutMeasured && initialValueSet.current) {
        updateThumbPosition(clampedValue, sliderWidth, true);
      }
    }
  }, [value, clampValue, updateThumbPosition, sliderWidth, isLayoutMeasured]);

  const handleValueChange = (val: number) => {
    const clampedValue = clampValue(val);
    setInternalValue(clampedValue);
    onValueChange(clampedValue);
    updateThumbPosition(clampedValue, sliderWidth, false);
  };

  if (!shouldRender) {
    return (
      <View style={[styles.container, { width, marginTop, marginBottom }, style]} />
    );
  }

  return (
    <View style={[styles.container, { width, marginTop, marginBottom }, style]} onLayout={onLayout}>
      <Slider
        ref={sliderRef}
        style={{ width: '100%', height, opacity: isLayoutMeasured ? 1 : 0 }}
        minimumValue={min}
        maximumValue={max}
        value={internalValue}
        step={step}
        disabled={disabled}
        minimumTrackTintColor={finalActiveColor}
        maximumTrackTintColor={finalInactiveColor}
        thumbTintColor="transparent"
        onValueChange={handleValueChange}
        onSlidingStart={handleSlidingStart}
        onSlidingComplete={handleSlidingComplete}
      />

      {isLayoutMeasured && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: thumbSize,
            height: thumbSize,
            backgroundColor: disabled ? colors.onSurfaceDisabled : finalThumbColor,
            borderRadius: thumbSize / 2,
            transform: [
              { translateX: positionAnim },
              { scale: scaleAnim },
            ],
            opacity: isLayoutMeasured ? 1 : 0,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    height: 40,
  }
});
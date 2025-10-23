import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  Animated,
  Easing,
  LayoutChangeEvent,
} from 'react-native';
import { useTheme } from 'react-native-paper';

type Option<T> = {
  value: T;
  label: string;
};

type Props<T> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  marginTop?: number;
  marginBottom?: number
  // borderWidht?: number
};

export default function SegmentedPicker<T extends string | number>({
  options,
  value,
  onChange,
  marginTop = 0,
  marginBottom = 0,
  // borderWidht = 0,
}: Props<T>) {
  const { colors } = useTheme();
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);

  const selectedIndex = options.findIndex(option => option.value === value);

  useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: selectedIndex,
      duration: 250,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [selectedIndex]);

  const handlePress = (val: T) => {
    onChange(val);
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width - 6); // минус padding слева и справа (3*2)
  };

  const segmentWidthPixels = containerWidth / options.length - 1;

  const translateX = slideAnimation.interpolate({
    inputRange: options.map((_, index) => index),
    outputRange: options.map((_, index) => index * segmentWidthPixels),
    extrapolate: 'clamp',
  });

  return (
    <View style={{ marginTop, marginBottom }}>
      <View 
        style={[styles.container, { 
          backgroundColor: colors.surfaceDisabled,
          borderColor: colors.outlineVariant,
        }]}
        onLayout={handleLayout}
      >
        {/* Анимированный выбранный прямоугольник */}
        {containerWidth > 0 && (
          <Animated.View
            style={[
              styles.selectedSegment,
              {
                width: segmentWidthPixels,
                backgroundColor: colors.primary,
                transform: [{ translateX }],
              },
            ]}
          >
            {/* Белый текст внутри выбранного прямоугольника */}
            <Animated.View 
              style={[
                styles.selectedTextContainer,
                {
                  transform: [{ translateX: slideAnimation.interpolate({
                    inputRange: options.map((_, index) => index),
                    outputRange: options.map((_, index) => -(index * (segmentWidthPixels + 1))),
                    extrapolate: 'clamp',
                  }) }],
                }
              ]}
            >
              {options.map((option) => (
                <View key={`selected-${String(option.value)}`} style={[styles.segment, { width: segmentWidthPixels + 1 }]}>
                  <Text
                    style={[
                      styles.segmentText,
                      { color: colors.onPrimary }
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {option.label}
                  </Text>
                </View>
              ))}
            </Animated.View>
          </Animated.View>
        )}
        
        {/* Варианты выбора с обычным текстом */}
        {options.map((option) => (
          <Pressable
            key={String(option.value)}
            onPress={() => handlePress(option.value)}
            style={[styles.segment, { flex: 1 }]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: colors.onSurface }
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 8,
    padding: 4,
    position: 'relative',
    // borderWidth: 1,
  },
  selectedSegment: {
    position: 'absolute',
    height: 32,
    top: 4,
    left: 4,
    borderRadius: 6,
    zIndex: 10, // Увеличил z-index
    overflow: 'hidden',
  },
  selectedTextContainer: {
    flexDirection: 'row',
    width: '100%',
    zIndex: 11, // Белый текст должен быть выше всего
  },
  segment: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Понизил z-index обычного текста
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});
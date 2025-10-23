// AppTile.tsx
import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text as RNText,
  ViewStyle,
  TextStyle,
  Animated,
  Easing,
  Pressable,
  NativeTouchEvent,
} from 'react-native';
import { SvgProps } from 'react-native-svg';
import { useTheme } from 'react-native-paper';
import tinycolor from 'tinycolor2';

type Props = {
  title?: string;
  children?: React.ReactNode;
  icon?: React.FC<SvgProps>;
  onPress?: () => void;
  borderColor?: string;
  borderWidth?: number;
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  contentGap?: number;
  childrenGap?: number;
  actions?: React.ReactNode;
  actionsText?: string;
  actionsTextColor?: string;
  actionsTextStyle?: TextStyle;
  simpleTile?: boolean;
  paddingVertical?: number;
  paddingHorizontal?: number;

  /** Новый проп — включает/выключает цветовую анимацию нажатия */
  pressColorFeedback?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AppTile({
  title,
  children,
  icon: Icon,
  onPress,
  borderColor = 'transparent',
  borderWidth = 0,
  backgroundColor = 'transparent',
  textColor,
  iconColor,
  style,
  titleStyle,
  contentGap = 0,
  childrenGap = 0,
  actions,
  actionsText,
  actionsTextColor,
  actionsTextStyle,
  simpleTile = false,
  paddingVertical,
  paddingHorizontal,
  pressColorFeedback = true, // <--- по умолчанию включено
}: Props) {
  const { colors } = useTheme();
  const animation = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const baseColor = backgroundColor || 'transparent';
  const baseTextColor = textColor || colors.onSurface;
  const baseIconColor = iconColor || (title ? baseTextColor : colors.onSurface);
  const baseActionsTextColor = actionsTextColor || "#AEAEAE";
  const isTransparent = baseColor === 'transparent';

  const SWIPE_THRESHOLD = 12;

  const isPressActive = useRef(false);
  const isSwipeDetected = useRef(false);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  const getPressedColor = () => {
    if (isTransparent) {
      return tinycolor(colors.primary).setAlpha(0.15).toRgbString();
    }
    const c = tinycolor(baseColor);
    return c.isLight() ? c.darken(25).toString() : c.lighten(25).toString();
  };

  const pressedColor = getPressedColor();

  const startAnimation = (toValue: number, duration: number) => {
    animationRef.current?.stop();
    animationRef.current = Animated.timing(animation, {
      toValue,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    });
    animationRef.current.start();
  };

  const handlePressIn = () => {
    if (!pressColorFeedback) return; // <-- не анимируем, если выключено
    if (!isSwipeDetected.current) {
      isPressActive.current = true;
      startAnimation(1, 150);
    }
  };

  const handlePressOut = () => {
    if (!pressColorFeedback) return; // <-- не анимируем, если выключено
    isSwipeDetected.current = false;
    if (isPressActive.current) {
      isPressActive.current = false;
      startAnimation(0, 200);
    }
  };

  useEffect(() => {
    animationRef.current?.stop();
    animation.setValue(0);
    animationRef.current = null;
    isPressActive.current = false;
    isSwipeDetected.current = false;
    startX.current = null;
    startY.current = null;
  }, [animation, onPress, baseColor, pressedColor]);

  useEffect(() => {
    return () => {
      animationRef.current?.stop();
    };
  }, []);

  const animatedBackground = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [baseColor, pressedColor],
  });

  const onTouchStart = (e: { nativeEvent: NativeTouchEvent }) => {
    const { pageX, pageY } = e.nativeEvent;
    startX.current = pageX;
    startY.current = pageY;
    isSwipeDetected.current = false;
    handlePressIn();
  };

  const onTouchMove = (e: { nativeEvent: NativeTouchEvent }) => {
    if (isSwipeDetected.current) return;

    const { pageX, pageY } = e.nativeEvent;
    const sx = startX.current ?? pageX;
    const sy = startY.current ?? pageY;

    if (
      Math.abs(pageX - sx) > SWIPE_THRESHOLD ||
      Math.abs(pageY - sy) > SWIPE_THRESHOLD
    ) {
      isSwipeDetected.current = true;
      if (isPressActive.current) {
        isPressActive.current = false;
        animationRef.current?.stop();
        animation.setValue(0);
      }
    }
  };

  const onTouchEnd = () => {
    handlePressOut();
    startX.current = null;
    startY.current = null;
    isSwipeDetected.current = false;
  };

  const onPressInternal = () => {
    if (onPress && !isSwipeDetected.current) {
      onPress();
    }
  };

  const renderSimpleContent = () => (
    <View style={[styles.simpleContentContainer, { gap: childrenGap }]}>
      {children}
    </View>
  );

  const renderFullContent = () => {
    const hasActions = !!(actions || actionsText);
    return (
      <>
        <View style={styles.headerContainer}>
          <View style={styles.titleRow}>
            {Icon && (
              <View style={styles.iconWrapper}>
                <Icon width={24} height={24} fill={baseIconColor} />
              </View>
            )}
            {title && (
              <RNText style={[styles.title, { color: baseTextColor }, titleStyle]}>
                {title}
              </RNText>
            )}
          </View>
          {hasActions && (
            <View style={styles.actionsContainer}>
              {actionsText && (
                <RNText
                  style={[
                    styles.actionsText,
                    { color: baseActionsTextColor },
                    actionsTextStyle,
                  ]}
                >
                  {actionsText}
                </RNText>
              )}
              {actions && <View style={styles.actionsIconsContainer}>{actions}</View>}
            </View>
          )}
        </View>
        {!!children && (
          <View
            style={[
              styles.childrenContainer,
              { marginTop: contentGap, gap: childrenGap },
            ]}
          >
            {children}
          </View>
        )}
      </>
    );
  };

  const contentToRender = simpleTile ? renderSimpleContent() : renderFullContent();
  const tileStyle: ViewStyle = {
    borderRadius: 16,
    borderWidth,
    borderColor,
    paddingTop: paddingVertical
      ? paddingVertical
      : simpleTile
      ? 0
      : !!Icon
      ? 14
      : 16,
    paddingBottom: paddingVertical
      ? paddingVertical
      : simpleTile
      ? 0
      : !!children
      ? 16
      : !!Icon
      ? 14
      : 16,
    overflow: 'hidden',
  };

  const ContentWrapper = ({ children }: { children: React.ReactNode }) => (
    <View style={{ paddingHorizontal: paddingHorizontal ?? 16 }}>{children}</View>
  );

  // Выбираем подходящий компонент — AnimatedPressable если есть цветовая анимация
  if (onPress) {
    const Wrapper = pressColorFeedback ? AnimatedPressable : Pressable;
    const bgStyle: any = pressColorFeedback
      ? { backgroundColor: animatedBackground }
      : { backgroundColor: baseColor };

    return (
      <Wrapper
        style={[tileStyle, bgStyle, style]}
        onPress={onPressInternal}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        pressRetentionOffset={{
          left: SWIPE_THRESHOLD,
          right: SWIPE_THRESHOLD,
          top: SWIPE_THRESHOLD,
          bottom: SWIPE_THRESHOLD,
        }}
        android_ripple={undefined}
      >
        {simpleTile ? contentToRender : <ContentWrapper>{contentToRender}</ContentWrapper>}
      </Wrapper>
    );
  }

  // Если нет onPress — обычный View
  return (
    <View
      style={[
        tileStyle,
        { backgroundColor: baseColor },
        style,
        { pointerEvents: 'box-none' },
      ]}
    >
      {simpleTile ? (
        <View
          style={[
            styles.simpleContentContainer,
            { gap: childrenGap },
            { pointerEvents: 'box-none' },
          ]}
        >
          {children}
        </View>
      ) : (
        <View
          style={{
            paddingHorizontal: paddingHorizontal ?? 16,
            pointerEvents: 'box-none',
          }}
        >
          {contentToRender}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  simpleContentContainer: {
    flexDirection: 'column',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 1,
    alignItems: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexShrink: 1,
    alignItems: 'center',
    marginLeft: 8,
  },
  actionsText: {
    fontSize: 16,
    fontWeight: '500',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  actionsIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: -4,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    marginRight: 4,
    marginLeft: -2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  childrenContainer: {
    flexDirection: 'column',
  },
});
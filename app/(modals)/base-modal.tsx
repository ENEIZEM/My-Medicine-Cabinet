import React, { ReactNode, useEffect, useState, forwardRef } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  ViewStyle,
  Dimensions,
  Platform,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from 'react-native-paper';
import tinycolor from 'tinycolor2';
import NavigationBar from 'react-native-system-navigation-bar';
import { IconXFill } from '@/constants/icons';
import { useSettings } from '@/contexts/SettingsContext';
import { StatusBar } from 'react-native';
import BaseButton from '@/components/BaseButton';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  titleColor?: string;
  contentColor?: string;
  headerColor?: string;
  containerStyle?: ViewStyle | ViewStyle[];
  backdropColor?: string;
  backdropOpacity?: number;
  animationDuration?: number;
  borderRadius?: number;
  headerPadding?: number;
  contentPadding?: number;
  leftButtonText?: string;
  rightButtonText?: string;
  onLeftButtonPress?: () => void;
  onRightButtonPress?: () => void;
  rightButtonDisabled?: boolean;
  maxHeight?: number | `${number}%`;
  minHeight?: number | `${number}%`;
}

export interface BaseModalRef {
  closeModal: (cb?: () => void) => void;
}

const BUTTONS_CONTAINER_HEIGHT = 72;

const BaseModal = forwardRef<BaseModalRef, Props>(({
  visible,
  onClose,
  children,
  title,
  titleColor,
  contentColor,
  headerColor,
  containerStyle,
  backdropColor = 'black',
  backdropOpacity = 0.5,
  animationDuration = 250,
  borderRadius = 16,
  headerPadding = 16,
  contentPadding = 0,
  leftButtonText,
  rightButtonText,
  onLeftButtonPress,
  onRightButtonPress,
  rightButtonDisabled = false,
  maxHeight = '90%',
  minHeight = '0%',
}, ref) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const translateY = useSharedValue(Dimensions.get('window').height);
  const opacity = useSharedValue(0);
  const windowHeight = Dimensions.get('window').height;
  const { colors } = useTheme();
  const { resolvedTheme, bottomInset } = useSettings();

  const effectiveBottomInset = bottomInset;

  titleColor = titleColor || colors.onSurfaceVariant;
  contentColor = contentColor || colors.background;
  headerColor = headerColor || colors.surfaceVariant;

  // const barMode = resolvedTheme === 'dark' ? 'light' : 'dark';

  // const setNavBarMode = () => {
  //   if (Platform.OS === 'android') {
  //     NavigationBar.setBarMode(barMode, 'navigation').catch(() => {});
  //   }
  // };

  const backdropAnimated = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const containerAnimated = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const closeModal = (cb?: () => void) => {
    opacity.value = withTiming(0, { duration: animationDuration });
    translateY.value = withTiming(
      windowHeight,
      {
        duration: animationDuration,
        easing: Easing.inOut(Easing.cubic)
      },
      (finished) => {
        if (finished) {
          runOnJS(setIsModalVisible)(false);
          runOnJS(onClose)();
          if (cb) runOnJS(cb)();
          // runOnJS(setNavBarMode)();
        }
      }
    );
  };

  React.useImperativeHandle(ref, () => ({
    closeModal: (cb) => {
      closeModal(cb);
    }
  }));

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (visible) {
      // КРИТИЧЕСКИ ВАЖНО: устанавливаем начальные значения ДО setIsModalVisible
      translateY.value = windowHeight;
      opacity.value = 0;
      
      // Теперь показываем модал
      setIsModalVisible(true);

      // Используем setTimeout вместо requestAnimationFrame для большей надежности
      timer = setTimeout(() => {
        translateY.value = withTiming(0, {
          duration: animationDuration,
          easing: Easing.inOut(Easing.cubic)
        });
        opacity.value = withTiming(backdropOpacity, { 
          duration: animationDuration 
        });
      }, 16); // ~1 frame at 60fps

      // if (Platform.OS === 'android') {
      //   const navBarTimer = setTimeout(() => {
      //     setNavBarMode();
      //   }, animationDuration + 50);
        
      //   return () => {
      //     if (timer) clearTimeout(timer);
      //     clearTimeout(navBarTimer);
      //   };
      // }

      StatusBar.setBarStyle(
        resolvedTheme === 'dark' ? 'light-content' : 'dark-content', 
        true
      );
    } else if (isModalVisible) {
      closeModal();
      StatusBar.setBarStyle(
        resolvedTheme === 'dark' ? 'light-content' : 'dark-content', 
        true
      );
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible, resolvedTheme, backdropOpacity, animationDuration, windowHeight]);

  const backdropBgColor = resolvedTheme === 'dark'
    ? tinycolor(backdropColor).lighten(50).toString()
    : backdropColor;

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="none"
      onRequestClose={() => closeModal()}
      statusBarTranslucent
      navigationBarTranslucent={Platform.OS === 'android' ? true : undefined}
      presentationStyle={Platform.OS === 'android' ? 'overFullScreen' : undefined}
    >
      <TouchableWithoutFeedback onPress={() => closeModal()}>
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: backdropBgColor },
            backdropAnimated
          ]}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: contentColor,
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
            maxHeight: maxHeight,
            minHeight: minHeight,
            bottom: 0,
          },
          containerStyle,
          containerAnimated,
        ]}
      >
        <View style={[
          styles.headerContainer,
          {
            backgroundColor: headerColor,
            paddingVertical: headerPadding,
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }
        ]}>
          <Text style={{
            color: titleColor,
            fontSize: 20,
            fontWeight: '700',
            marginLeft: 16,
          }}>
            {title}
          </Text>

          <TouchableOpacity
            style={{ marginRight: 16 }}
            onPress={() => closeModal()}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <IconXFill width={24} height={24} fill={titleColor} />
          </TouchableOpacity>
        </View>

        <View style={[
          styles.content,
          {
            padding: contentPadding,
            paddingTop: 0,
            paddingBottom: 0,
          }
        ]}>
          {children}
        </View>

        {(onLeftButtonPress || onRightButtonPress) && (
          <View style={[
            styles.buttonsContainer,
            {
              backgroundColor: headerColor,
              height: BUTTONS_CONTAINER_HEIGHT,
              paddingHorizontal: 16,
              paddingTop: 16,
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
            }
          ]}>
            {onLeftButtonPress && leftButtonText && (
              <BaseButton
                label={leftButtonText}
                onPress={onLeftButtonPress}
                color={colors.surface}
                textColor={colors.primary}
                borderColor={colors.outline}
                style={{ flex: 1, marginRight: 4 }}
              />
            )}
            {onRightButtonPress && rightButtonText && (
              <BaseButton
                label={rightButtonText}
                onPress={onRightButtonPress}
                color={colors.primary}
                textColor={colors.onPrimary}
                style={{ flex: 1, marginLeft: 4 }}
                disabled={rightButtonDisabled}
              />
            )}
          </View>
        )}

        {Platform.OS === 'android' && effectiveBottomInset > 0 && (
          <View
            style={{
              height: effectiveBottomInset,
              backgroundColor: colors.surfaceVariant,
              width: '100%',
            }}
          />
        )}
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    left: 0,
    right: 0,
    position: 'absolute',
    overflow: 'hidden',
    flexGrow: 0,
  },
  headerContainer: {
    width: '100%',
  },
  content: {
    width: '100%',
    flexShrink: 1,
  },
  buttonsContainer: {
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
});

export default BaseModal;
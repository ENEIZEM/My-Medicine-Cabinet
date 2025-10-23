import React, { ReactNode } from 'react';
import {
  View,
  TextInput as RNTextInput,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInputType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';

interface IconProps {
  width?: number;
  height?: number;
  fill?: string;
  style?: object;
}

interface HeaderProps {
  /** Включить прямоугольник ввода текста */
  hasInput?: boolean;
  /** Текущее значение инпута */
  value?: string;
  /** Обработчик изменения текста */
  onChangeText?: (text: string) => void;
  /** Обработчик отправки */
  onSubmitEditing?: () => void;
  /** Обработчик потери фокуса */
  onBlur?: () => void;
  /** Текст-подсказка */
  placeholder?: string;
  /** Основная иконка слева от поля ввода (показывается, когда нет текста или showClearButton=false) */
  icon?: React.ComponentType<any>;
  /** Настройки иконки (используются как для основной, так и для clear, если не переопределено) */
  iconProps?: IconProps;
  /** Показывать кнопку очистки при непустом value */
  showClearButton?: boolean;
  /** Иконка для кнопки очистки (показывается вместо основной иконки, когда value непустой) */
  clearIcon?: React.ComponentType<any>;
  /** Настройки для иконки очистки (если не указано — возьмутся из iconProps, а цвет по умолчанию colors.error) */
  clearIconProps?: IconProps;
  /** Обработчик нажатия очистки */
  onClear?: () => void;
  /** Кастомный контент внутри шапки (если есть, отображается вместо инпута) */
  children?: ReactNode;
  /** Переопределение фонового цвета шапки */
  backgroundColor?: string;
  /** Кастомный стиль контейнера */
  style?: object;
  /** Проброс ref на RNTextInput (если нужен доступ к focus/blur) */
  inputRef?: React.Ref<RNTextInputType>;
}

export default function Header({
  hasInput = false,
  value,
  onChangeText,
  onSubmitEditing,
  onBlur,
  placeholder,
  icon: IconComponent,
  iconProps,
  showClearButton = false,
  clearIcon: ClearIconComponent,
  clearIconProps,
  onClear,
  children,
  backgroundColor,
  style,
  inputRef,
}: HeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // размеры и цвета иконок (общие)
  const iconWidth = iconProps?.width ?? 28;
  const iconHeight = iconProps?.height ?? 28;

  // fill для обычной иконки
  const iconFill = iconProps?.fill ?? colors.onSurfaceVariant;
  // fill для clear иконки: если передан в clearIconProps — используем его, иначе дефолт colors.error
  const clearFill = clearIconProps?.fill ?? iconProps?.fill ?? colors.error;

  const shouldShowClear = showClearButton && !!value && value.length > 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: backgroundColor ?? colors.surface,
          height: 68 + insets.top,
          paddingTop: 0, // ты ставил 0 — оставил
        },
        style,
      ]}
    >
      {hasInput ? (
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.secondaryContainer,
              top: insets.top / 2,
            },
          ]}
        >
          <RNTextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmitEditing}
            onBlur={onBlur}
            placeholder={placeholder}
            cursorColor={colors.primary}
            clearButtonMode="never"
            placeholderTextColor={colors.onSurfaceVariant}
            style={[
              styles.input,
              {
                color: colors.onSecondaryContainer,
              },
            ]}
          />

          {/* Левая область: либо кнопка очистки (Touchable), либо обычная иконка (если есть) */}
          <View style={[styles.iconWrapper, iconProps?.style]}>
            {shouldShowClear && ClearIconComponent ? (
              <TouchableOpacity
                onPress={onClear}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="clear-input"
                accessibilityRole="button"
              >
                <ClearIconComponent
                  width={clearIconProps?.width ?? iconWidth}
                  height={clearIconProps?.height ?? iconHeight}
                  fill={clearFill}
                />
              </TouchableOpacity>
            ) : IconComponent ? (
              <IconComponent
                width={iconWidth}
                height={iconHeight}
                fill={iconFill}
              />
            ) : null}
          </View>
        </View>
      ) : (
        children && <View>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  inputContainer: {
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
  },
  input: {
    height: 44,
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: 'transparent',
    paddingLeft: 16,
    paddingRight: 16,
  },
  iconWrapper: {
    position: 'absolute',
    left: 12,
    top: 9,
  },
});
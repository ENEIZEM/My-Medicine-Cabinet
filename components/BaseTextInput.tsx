// BaseTextInput.tsx
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  Platform,
  DimensionValue,
  Text,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
  TextInputKeyPressEventData,
  findNodeHandle,
  UIManager,
  Keyboard,
  KeyboardEvent,
  Dimensions,
} from 'react-native';
import { useTheme } from 'react-native-paper';

type ScrollOffsetRefCompat = React.RefObject<number> | { current: number } | null;

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmitEditing?: () => void;
  placeholder?: string;
  containerColor?: string;
  borderColor?: string;
  focusedBorderColor?: string;
  width?: DimensionValue;
  borderRadius?: number;
  keyboardType?: TextInputProps['keyboardType'];
  centeredText?: boolean;
  autoCapitalizeFirstLetter?: boolean;
  marginTop?: number;
  marginBottom?: number;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  maxDigits?: number;
  editable?: boolean;
  onBlur?: () => void;
  returnKeyType?: TextInputProps['returnKeyType'];
  maxValue?: number;
  minValue?: number;
  maxLength?: number;
  // автоскролл
  scrollViewRef?: React.RefObject<any> | null; // accepts KeyboardAwareScrollView or ScrollView ref
  scrollOffsetRef?: ScrollOffsetRefCompat;
  extraKeyboardOffset?: number;
  autoScroll?: boolean; // default true

  // 🔢 new: only allow integers
  integerOnly?: boolean;
};

const ZWSP = '\u200B';
const MEASURE_DELAY_MS = 150;

export default function BaseTextInput({
  value,
  onChangeText,
  onSubmitEditing,
  placeholder,
  containerColor,
  borderColor,
  focusedBorderColor,
  width = '100%',
  borderRadius = 8,
  keyboardType = 'default',
  centeredText = true,
  autoCapitalizeFirstLetter = false,
  marginTop = 0,
  marginBottom = 0,
  style,
  inputStyle,
  maxDigits = 15,
  editable = true,
  onBlur,
  returnKeyType = 'done',
  maxValue,
  minValue,
  maxLength,
  scrollViewRef = null,
  scrollOffsetRef = null,
  extraKeyboardOffset = 12,
  autoScroll = true,
  integerOnly = false,
}: Props) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput | null>(null);
  const [focused, setFocused] = useState(false);
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const ignoreNextOnChangeRef = useRef(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const resolvedContainerColor = containerColor || colors.surface;
  const resolvedBorderColor = focused ? (focusedBorderColor || colors.primary) : (borderColor || 'transparent');

  const isNumericInput =
    keyboardType === 'decimal-pad' ||
    keyboardType === 'numeric' ||
    keyboardType === 'number-pad' ||
    keyboardType === 'phone-pad';

  // ---------- helpers ----------
  const enforceMaxDigitsTotal = (raw: string, maxDigitsNum?: number) => {
    if (!maxDigitsNum || !raw) return raw;
    const negative = raw.startsWith('-');
    let s = negative ? raw.slice(1) : raw;
    if (s === '.') return (negative ? '-' : '') + s;
    const parts = s.split('.');
    const intPart = parts[0] || '0';
    const fracPart = parts[1] || '';
    const totalDigits = (intPart + fracPart).replace(/[^0-9]/g, '').length;
    if (totalDigits <= maxDigitsNum) return (negative ? '-' : '') + s;
    const intDigits = intPart.replace(/[^0-9]/g, '').length;
    if (intDigits >= maxDigitsNum) {
      const intOnlyDigits = intPart.replace(/[^0-9]/g, '').slice(0, maxDigitsNum);
      const trimmed = intOnlyDigits.replace(/^0+/, '') || '0';
      return (negative ? '-' : '') + trimmed;
    }
    const allowedFrac = maxDigitsNum - intDigits;
    const numeric = parseFloat((negative ? '-' : '') + intPart + (fracPart ? '.' + fracPart : ''));
    if (isNaN(numeric)) return (negative ? '-' : '') + s;
    let rounded = numeric.toFixed(allowedFrac);
    if (rounded.indexOf('.') >= 0) rounded = rounded.replace(/\.?0+$/, '');
    return rounded;
  };

  const displayHasZWSP = value === '';
  const displayToRawIndex = (displayIndex: number) => (displayHasZWSP ? Math.max(0, displayIndex - 1) : displayIndex);
  const rawToDisplayIndex = (rawIndex: number) => (displayHasZWSP ? rawIndex + 1 : rawIndex);

  // ---------- text handling ----------
  const handleTextChange = (rawText: string) => {
    if (ignoreNextOnChangeRef.current) {
      ignoreNextOnChangeRef.current = false;
      return;
    }

    let text = rawText.replace(new RegExp(ZWSP, 'g'), '');
    let cleaned = text;

    if (isNumericInput) {
      // keep only digits, dot/comma and minus
      cleaned = cleaned.replace(/[^0-9.,-]/g, '');
      if ((cleaned.match(/-/g) || []).length > 1) cleaned = cleaned.replace(/-+/g, '-');
      if (cleaned.includes('-') && !cleaned.startsWith('-')) {
        cleaned = cleaned.replace(/-/g, '');
        cleaned = '-' + cleaned;
      }
      cleaned = cleaned.replace(/,/g, '.');

      if (integerOnly) {
        // remove fractional part entirely (truncate)
        // but keep single leading '-' if present
        const negative = cleaned.startsWith('-');
        let core = negative ? cleaned.slice(1) : cleaned;
        // remove everything starting from first dot
        const dotIndex = core.indexOf('.');
        if (dotIndex >= 0) core = core.slice(0, dotIndex);
        // remove non-digits (safety)
        core = core.replace(/[^0-9]/g, '');
        core = core.replace(/^0+/, '') || '0';
        cleaned = (negative ? '-' : '') + core;
      } else {
        // allow one dot only
        const parts = cleaned.split('.');
        if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
        if (cleaned.length > 1 && !cleaned.startsWith('0.') && !cleaned.startsWith('-0.')) {
          const sign = cleaned.startsWith('-') ? '-' : '';
          let core = sign ? cleaned.slice(1) : cleaned;
          if (core.includes('.')) {
            const [intP, fracP] = core.split('.');
            const intTrim = intP.replace(/^0+/, '') || '0';
            core = intTrim + (fracP ? '.' + fracP : '');
          } else {
            core = core.replace(/^0+/, '') || '0';
          }
          cleaned = (sign ? '-' : '') + core;
        }
      }

      const digitCount = cleaned.replace(/[^0-9]/g, '').length;
      if (digitCount > (maxDigits ?? 15)) cleaned = enforceMaxDigitsTotal(cleaned, maxDigits);
      if (maxValue !== undefined && cleaned !== '' && cleaned !== '.' && cleaned !== '-') {
        const numericValue = integerOnly ? parseInt(cleaned, 10) : parseFloat(cleaned);
        if (!isNaN(numericValue) && numericValue > maxValue) cleaned = maxValue.toString();
      }
    } else {
      if (maxLength !== undefined && cleaned.length > maxLength) return;
    }

    if (autoCapitalizeFirstLetter && cleaned.length === 1) cleaned = cleaned.toUpperCase();
    onChangeText(cleaned);
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    const key = (e && e.nativeEvent && (e.nativeEvent as any).key) ?? undefined;
    if (!isNumericInput) return;
    // If integerOnly, ignore '.' and ',' presses (do nothing)
    if (integerOnly && (key === '.' || key === ',')) {
      // prevent insertion — we don't set ignoreNextOnChangeRef because we don't change the value
      return;
    }
    if (key === '.' || key === ',') {
      const dispSelStart = selection.start ?? (displayHasZWSP ? 1 : value.length);
      const dispSelEnd = selection.end ?? dispSelStart;
      const rawStart = displayToRawIndex(dispSelStart);
      const rawEnd = displayToRawIndex(dispSelEnd);
      const before = value.slice(0, rawStart);
      const after = value.slice(rawEnd);
      let candidate = before + '.' + after;
      const dots = (candidate.match(/\./g) || []).length;
      if (dots > 1) {
        const first = candidate.indexOf('.');
        candidate = candidate.slice(0, first + 1) + candidate.slice(first + 1).replace(/\./g, '');
      }
      ignoreNextOnChangeRef.current = true;
      onChangeText(candidate);
      const newRawPos = before.length + 1;
      const newDispPos = rawToDisplayIndex(newRawPos);
      setSelection({ start: newDispPos, end: newDispPos });
    }
  };

  const handleSelectionChange = (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    const sel = e.nativeEvent.selection;
    if (sel && typeof sel.start === 'number' && typeof sel.end === 'number') setSelection(sel);
  };

  const handleBlur = () => {
    setFocused(false);
    let finalValue = value;
    if (isNumericInput) {
      // if integerOnly, truncate fractional part
      if (integerOnly && finalValue && finalValue.includes('.')) {
        const negative = finalValue.startsWith('-');
        let core = negative ? finalValue.slice(1) : finalValue;
        core = core.split('.')[0].replace(/[^0-9]/g, '') || '0';
        finalValue = (negative ? '-' : '') + core;
      }

      if (minValue !== undefined && finalValue !== '' && finalValue !== '.' && finalValue !== '-') {
        const numericValue = integerOnly ? parseInt(finalValue, 10) : parseFloat(finalValue);
        if (!isNaN(numericValue) && numericValue < minValue) finalValue = minValue.toString();
      }

      if (maxDigits !== undefined) finalValue = enforceMaxDigitsTotal(finalValue, maxDigits);
    }
    onChangeText(finalValue);
    onBlur?.();
  };

  const horizontalPadding = value === '' || !isNumericInput ? 12 : 0;

  // ---------- autoscroll (only when gap > 0) ----------
  const ensureVisible = (kbHeight: number) => {
    if (!autoScroll) return;
    const scroll = (scrollViewRef as React.RefObject<any>)?.current;
    if (!scroll) return;
    const inputHandle = findNodeHandle(inputRef.current);
    if (!inputHandle) return;

    // Prefer measureLayout relative to scroll if possible
    const scrollHandle = findNodeHandle(scroll as any) ?? null;

    const tryScrollTo = (y: number) => {
      try {
        if (typeof scroll.scrollTo === 'function') {
          scroll.scrollTo({ y, animated: true });
          return true;
        }
      } catch {}
      try {
        if (typeof scroll.scrollToPosition === 'function') {
          scroll.scrollToPosition(0, y, true);
          return true;
        }
      } catch {}
      try {
        const responder = (scroll as any).getScrollResponder?.() || (scroll as any).getScrollableNode?.();
        if (responder && typeof responder.scrollResponderScrollNativeHandleToKeyboard === 'function') {
          responder.scrollResponderScrollNativeHandleToKeyboard(inputHandle, extraKeyboardOffset, true);
          return true;
        }
      } catch {}
      return false;
    };

    if (scrollHandle) {
      UIManager.measureLayout(
        inputHandle,
        scrollHandle,
        // onFail -> fallback to measureInWindow
        () => {
          UIManager.measureInWindow(inputHandle, (x: number, y: number, w: number, h: number) => {
            const windowHeight = Dimensions.get('window').height;
            const componentBottom = y + h;
            const keyboardTop = windowHeight - kbHeight;
            const gap = componentBottom - (keyboardTop - extraKeyboardOffset);
            if (gap > 0) {
              // target scroll amount: gap (approx). try several apis
              tryScrollTo(gap);
            }
          });
        },
        (left: number, top: number, width_: number, height_: number) => {
          const componentBottomRelativeToScroll = top + height_;
          const windowHeight = Dimensions.get('window').height;
          const keyboardTop = windowHeight - kbHeight;
          const currentScroll =
            scrollOffsetRef && 'current' in scrollOffsetRef ? (scrollOffsetRef as any).current : (scrollOffsetRef as any)?.current ?? 0;
          const componentBottomInWindow = componentBottomRelativeToScroll - (currentScroll ?? 0);
          const gap = componentBottomInWindow - (keyboardTop - extraKeyboardOffset);

          if (gap > 0) {
            const targetY = Math.max(0, (currentScroll ?? 0) + gap);
            tryScrollTo(targetY);
          }
        }
      );
    } else {
      UIManager.measureInWindow(inputHandle, (x: number, y: number, w: number, h: number) => {
        const windowHeight = Dimensions.get('window').height;
        const componentBottom = y + h;
        const keyboardTop = windowHeight - kbHeight;
        const gap = componentBottom - (keyboardTop - extraKeyboardOffset);
        if (gap > 0) tryScrollTo(gap);
      });
    }
  };

  // keyboard listeners
  useEffect(() => {
    const onShow = (e: KeyboardEvent) => {
      const h = e.endCoordinates ? e.endCoordinates.height : (Platform.OS === 'ios' ? 300 : 250);
      setKeyboardHeight(h);
      setTimeout(() => ensureVisible(h), MEASURE_DELAY_MS);
    };
    const onHide = () => setKeyboardHeight(0);
    const showSub = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollViewRef, scrollOffsetRef, extraKeyboardOffset, autoScroll]);

  useEffect(() => {
    if (focused && keyboardHeight > 0) setTimeout(() => ensureVisible(keyboardHeight), MEASURE_DELAY_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused, keyboardHeight]);

  const displayValue = value === '' ? ZWSP : value;
  const showPlaceholderOverlay = !!placeholder && value === '';

  const handleFocus = () => {
    setFocused(true);
    if (value === '') {
      setSelection({ start: 1, end: 1 });
      setTimeout(() => {
        try {
          inputRef.current?.setNativeProps?.({ selection: { start: 1, end: 1 } });
        } catch {
          // ignore
        }
      }, 0);
    }
    setTimeout(() => ensureVisible(keyboardHeight), MEASURE_DELAY_MS);
  };

  // clamp selection if needed
  useEffect(() => {
    const maxDisp = displayValue.length;
    if (selection.start > maxDisp || selection.end > maxDisp) {
      const pos = displayToRawIndex(Math.min(selection.start, displayValue.length));
      const dispPos = rawToDisplayIndex(pos);
      setSelection({ start: dispPos, end: dispPos });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayValue]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: resolvedContainerColor,
          borderColor: resolvedBorderColor,
          borderWidth: (borderColor || focused) ? 1 : 0,
          borderRadius,
          width,
          marginTop,
          marginBottom,
        },
        style,
      ]}
    >
      <TextInput
        ref={inputRef}
        value={displayValue}
        onChangeText={handleTextChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={onSubmitEditing}
        placeholder={''}
        placeholderTextColor={'rgba(120, 120, 120, 0.5)'}
        style={[
          styles.input,
          {
            color: colors.onBackground,
            textAlign: centeredText ? 'center' : 'left',
            paddingLeft: horizontalPadding,
            paddingRight: horizontalPadding,
            paddingTop: Platform.OS === 'ios' ? 10 : 6,
            paddingBottom: Platform.OS === 'ios' ? 10 : 6,
            textAlignVertical: 'center',
            ...(Platform.OS === 'android' && isNumericInput && value !== '' ? { writingDirection: 'ltr' as 'ltr' } : {}),
          },
          inputStyle,
          !editable && styles.disabled,
        ]}
        keyboardType={keyboardType}
        cursorColor={colors.primary}
        selectionColor={colors.primary}
        allowFontScaling={false}
        editable={editable}
        keyboardAppearance={Platform.OS === 'ios' ? 'default' : undefined}
        textContentType={Platform.OS === 'ios' ? 'none' : undefined}
        importantForAutofill="no"
        returnKeyType={returnKeyType}
        selection={selection}
        onSelectionChange={handleSelectionChange}
        onKeyPress={handleKeyPress}
      />

      {showPlaceholderOverlay && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.placeholderWrapper}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.placeholderText, { color: 'rgba(120,120,120,0.5)' }]}>
              {placeholder}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    height: '100%',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  placeholderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
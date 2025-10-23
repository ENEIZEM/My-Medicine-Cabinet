// src/utils/i18n/formatUnit.ts
export type WordForm = 'nominativeSing' | 'nominativePlur' | 'genitiveSing' | 'genitivePlur';

// Функция определения формы
function getWordForm(input: string, lang: string, gender?: 'm' | 'f' | 'n',): WordForm {
  if (input.trim() === '') return 'nominativePlur';
  const n = parseFloat(input.replace(',', '.'));
  if (isNaN(n)) return 'nominativePlur';
  const isInteger = Number.isInteger(n);
    
  switch (lang) {
    case 'ru':
      if (!isInteger) {
        const integerPart = Math.floor(n);
        if (integerPart === 1) return "genitiveSing";
        return "genitivePlur";
      }
      const lastTwoDigits = n % 100;
      const lastDigit = n % 10;
      if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "genitivePlur";
      switch (lastDigit) {
        case 1: return "nominativeSing";
        case 2:
        case 3:
        case 4: return "genitiveSing";
        default: return "genitivePlur";
      }
    case 'en':
    default:
      return n === 1 ? "nominativeSing" : "nominativePlur";
  }
}

/**
 * Универсальный форматтер
 * Сам определяет тип структуры:
 * - Если t[form][key] → значит, это units (вложенная структура)
 * - Если t[form] → значит, это days (простая структура)
 */
export function formatUnit(
  t: Record<WordForm, Record<string, string>> | Record<WordForm, string>,
  quantity: string | number,
  language: string,
  key?: string,
  gender?: 'm' | 'f' | 'n',
): string {
  const n = typeof quantity === 'string' ? quantity : String(quantity);
  const form = getWordForm(n, language, gender);
  
  // Определяем тип: вложенный (units) или плоский (days)
  if (key !== undefined) {
    // Предполагаем, что это t.medicine.units
    const nested = t as Record<WordForm, Record<string, string>>;
    return (
      nested?.[form]?.[key] ??
      nested?.nominativePlur?.[key] ??
      nested?.nominativeSing?.[key] ??
      key
    );
  }
  
  // Предполагаем, что это t.schedule.days
  const flat = t as Record<WordForm, string>;
  return (
    flat?.[form] ??
    flat?.nominativePlur ??
    flat?.nominativeSing ??
    String(quantity)
  );
}
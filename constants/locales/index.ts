import en from './en';
import ru from './ru';

export const translations = { en, ru };
export type Language = keyof typeof translations;
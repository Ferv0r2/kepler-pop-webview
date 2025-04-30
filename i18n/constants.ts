export const SUPPORTED_LOCALES = [
  'ko',
  'en',
  'ja',
  'zh',
  'zh-TW',
  'es',
  'fr',
  'de',
  'ru',
  'pt',
  'it',
  'ar',
  'hi',
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const isSupportedLocale = (locale: string): locale is Locale => {
  return SUPPORTED_LOCALES.includes(locale as Locale);
};

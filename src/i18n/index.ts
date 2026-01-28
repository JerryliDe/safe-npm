import { en, type I18nKey } from './en.js';
import { zh } from './zh.js';
import { getConfig } from '../utils/config.js';

const translations = { en, zh };

export type Language = 'en' | 'zh';

export function t(key: I18nKey): string {
  const lang = getConfig().language;
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}

export function setLanguage(lang: Language): void {
  // Will be handled via config
}

export type { I18nKey };

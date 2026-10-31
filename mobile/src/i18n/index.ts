import { LanguageCode } from "../api/types";
import { translations, TranslationDictionary } from "./translations";

let currentLang: LanguageCode = "en";

export function setLanguage(lang: LanguageCode): void {
  currentLang = lang;
}

export function getLanguage(): LanguageCode {
  return currentLang;
}

export function t<K extends keyof TranslationDictionary>(key: K): string {
  const dict = translations[currentLang] || translations.en;
  return dict[key] || translations.en[key] || (key as string);
}

export function getDamageClassName(code: string, lang: LanguageCode = currentLang): string {
  const dict = translations[lang] || translations.en;
  const key = `class_${code}` as keyof TranslationDictionary;
  return dict[key] || code;
}


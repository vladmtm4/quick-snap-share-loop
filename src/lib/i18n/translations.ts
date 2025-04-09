import { SupportedLanguage, TranslationCache } from './types';

// Core translations that we keep locally to avoid API calls for common text
export const coreTranslations: TranslationCache = {
  appName: {
    en: 'QuickSnap',
    he: 'קוויקסנאפ'
  },
  loading: {
    en: 'Loading...',
    he: 'טוען...'
  },
  language: {
    en: 'Language',
    he: 'שפה'
  },
  english: {
    en: 'English',
    he: 'אנגלית'
  },
  hebrew: {
    en: 'Hebrew',
    he: 'עברית'
  }
};

// Translation cache to avoid unnecessary API calls
export const translationCache: TranslationCache = { ...coreTranslations };

// Helper function for external modules
export function t(key: string, language: SupportedLanguage = 'en'): string {
  if (coreTranslations[key]?.[language]) {
    return coreTranslations[key][language];
  }
  
  if (translationCache[key]?.[language]) {
    return translationCache[key][language];
  }
  
  return key;
}

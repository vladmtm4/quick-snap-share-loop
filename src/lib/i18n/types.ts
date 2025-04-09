
// Define the supported languages
export type SupportedLanguage = 'en' | 'he';

// Define the translation cache structure
export interface TranslationCache {
  [key: string]: {
    [lang: string]: string;
  };
}

// Interface for our language context
export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  translate: (key: string) => string;
  translateAsync: (text: string) => Promise<string>;
  isLoading: boolean;
}

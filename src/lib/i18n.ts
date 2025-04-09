import React, { createContext, useContext, useState, useEffect } from 'react';

export type SupportedLanguage = 'en' | 'he';

// Define the translation cache structure
interface TranslationCache {
  [key: string]: {
    [lang: string]: string;
  };
}

// Core translations that we keep locally to avoid API calls for common text
const coreTranslations = {
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
const translationCache: TranslationCache = { ...coreTranslations };

// Function to translate text via API
async function translateViaAPI(text: string, targetLang: SupportedLanguage): Promise<string> {
  if (!text) return '';
  
  // If the text is in the cache, return it
  if (translationCache[text]?.[targetLang]) {
    return translationCache[text][targetLang];
  }
  
  // For demonstration, we'll use a mock API call
  // In a real app, this would be replaced with an actual API call to a service like Google Translate
  try {
    console.log(`Translating "${text}" to ${targetLang}`);
    
    // This is where you would integrate with a real translation API
    // For now, we'll simulate a translation with a delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock translation (in real implementation, this would come from the API)
    let translatedText: string;
    
    if (targetLang === 'he') {
      // Simple mock Hebrew translation by reversing the text (this is just for demo)
      translatedText = text.split('').reverse().join('') + ' (HE)';
    } else {
      // For English, just return the original text
      translatedText = text;
    }
    
    // Cache the result
    if (!translationCache[text]) {
      translationCache[text] = {};
    }
    translationCache[text][targetLang] = translatedText;
    
    return translatedText;
  } catch (error) {
    console.error('Translation API error:', error);
    return text; // Fallback to original text
  }
}

// Interface for our language context
interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  translate: (key: string) => string;
  translateAsync: (text: string) => Promise<string>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  translate: (key) => key,
  translateAsync: async (text) => text,
  isLoading: false
});

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [loading, setLoading] = useState(false);
  
  // Function to get translation for core UI elements (synchronous)
  const translate = (key: string): string => {
    if (coreTranslations[key]?.[language]) {
      return coreTranslations[key][language];
    }
    
    if (translationCache[key]?.[language]) {
      return translationCache[key][language];
    }
    
    // If not in cache, return the key itself
    return key;
  };
  
  // Function to translate arbitrary text (asynchronous)
  const translateAsync = async (text: string): Promise<string> => {
    if (!text) return '';
    
    setLoading(true);
    try {
      const result = await translateViaAPI(text, language);
      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      console.error('Translation error:', error);
      return text; // Fallback to original text
    }
  };
  
  return (
    <LanguageContext.Provider 
      value={{ 
        language, 
        setLanguage, 
        translate, 
        translateAsync,
        isLoading: loading 
      }}
    >
      <div dir={language === 'he' ? 'rtl' : 'ltr'} className="min-h-screen">
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

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

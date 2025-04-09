
import React, { createContext, useContext, useState } from 'react';
import { SupportedLanguage, LanguageContextType } from './types';
import { coreTranslations, translationCache } from './translations';
import { translateViaAPI } from './translationApi';

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

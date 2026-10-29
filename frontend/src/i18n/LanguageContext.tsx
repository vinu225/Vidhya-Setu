import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  SUPPORTED_LANGUAGES, 
  LanguageOption, 
  TranslationKey, 
  getTranslation 
} from './translations';

interface LanguageContextType {
  language: string;
  setLanguage: (code: string) => void;
  currentLanguage: LanguageOption;
  languages: LanguageOption[];
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'apaar_selected_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
        return saved;
      }
    } catch {
      // ignore localStorage errors in non-browser context
    }
    return 'en';
  });

  const setLanguage = (code: string) => {
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore
    }
  };

  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  const t = (key: TranslationKey): string => {
    return getTranslation(language, key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currentLanguage, languages: SUPPORTED_LANGUAGES, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

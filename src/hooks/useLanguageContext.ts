import { createContext, useContext } from 'react';

export interface LanguageContextType {
  currentLanguage: string;
  setCurrentLanguage: (language: string) => void;
  availableLanguages: Array<{
    code: string;
    name: string;
    isDefault: boolean;
  }>;
  t: (key: string, fallback?: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
}
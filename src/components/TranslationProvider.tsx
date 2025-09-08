import React, { createContext, useContext, ReactNode } from 'react';
import { useUITranslations } from '@/hooks/useUITranslations';
import { TranslationContextType } from '@/hooks/useTranslationContext';

const TranslationContext = createContext<TranslationContextType | null>(null);

interface TranslationProviderProps {
  children: ReactNode;
  language?: string;
}

export function TranslationProvider({ children, language }: TranslationProviderProps) {
  const {
    translations,
    loading,
    userLanguage,
    t,
    changeLanguage,
    reload
  } = useUITranslations(language);

  const value: TranslationContextType = {
    t,
    language: userLanguage,
    changeLanguage,
    loading,
    translations,
    isLoaded: !loading,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  
  if (!context) {
    // Provide a fallback implementation
    console.warn('useTranslation used outside of TranslationProvider');
    return {
      t: (key: string, fallback?: string) => fallback || key,
      language: 'de',
      changeLanguage: async () => {},
      loading: false,
      translations: {},
      isLoaded: false,
    };
  }
  
  return context;
}
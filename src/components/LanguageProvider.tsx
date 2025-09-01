import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EnhancedTranslationService } from '@/services/enhancedTranslationService';
import { useUITranslations } from '@/hooks/useUITranslations';

export interface LanguageContextType {
  currentLanguage: string;
  setCurrentLanguage: (language: string) => void;
  availableLanguages: Array<{
    code: string;
    name: string;
    isDefault: boolean;
  }>;
  t: (key: string, fallback?: string) => string;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<string>('de');
  const [availableLanguages, setAvailableLanguages] = useState<Array<{
    code: string;
    name: string;
    isDefault: boolean;
  }>>([]);
  
  const { t, loading, changeLanguage } = useUITranslations(currentLanguage);

  useEffect(() => {
    loadAvailableLanguages();
    loadUserPreference();
  }, []);

  const loadAvailableLanguages = async () => {
    try {
      const languages = await EnhancedTranslationService.getSystemLanguages();
      setAvailableLanguages(languages.map(lang => ({
        code: lang.language_code,
        name: lang.language_name,
        isDefault: lang.is_default
      })));
    } catch (error) {
      console.error('Failed to load available languages:', error);
      // Fallback to default languages
      setAvailableLanguages([
        { code: 'de', name: 'Deutsch', isDefault: true },
        { code: 'en', name: 'English', isDefault: false }
      ]);
    }
  };

  const loadUserPreference = async () => {
    try {
      const preferredLanguage = await EnhancedTranslationService.getUserLanguagePreference();
      setCurrentLanguage(preferredLanguage);
    } catch (error) {
      console.error('Failed to load user language preference:', error);
    }
  };

  const handleLanguageChange = async (language: string) => {
    setCurrentLanguage(language);
    await changeLanguage(language);
  };

  const value: LanguageContextType = {
    currentLanguage,
    setCurrentLanguage: handleLanguageChange,
    availableLanguages,
    t,
    loading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
}
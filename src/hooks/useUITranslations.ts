import { useState, useEffect } from 'react';
import { EnhancedTranslationService } from '@/services/enhancedTranslationService';
import { useToast } from '@/hooks/use-toast';

export interface UITranslations {
  [key: string]: string;
}

export function useUITranslations(languageCode?: string) {
  const [translations, setTranslations] = useState<UITranslations>({});
  const [loading, setLoading] = useState(true);
  const [userLanguage, setUserLanguage] = useState<string>('de');
  const { toast } = useToast();

  useEffect(() => {
    loadUserLanguagePreference();
  }, []);

  useEffect(() => {
    if (userLanguage) {
      loadUITranslations(languageCode || userLanguage);
    }
  }, [languageCode, userLanguage]);

  const loadUserLanguagePreference = async () => {
    try {
      const preferredLanguage = await EnhancedTranslationService.getUserLanguagePreference();
      setUserLanguage(preferredLanguage);
    } catch (error) {
      console.error('Failed to load user language preference:', error);
      setUserLanguage('de'); // fallback
    }
  };

  const loadUITranslations = async (lang: string) => {
    setLoading(true);
    try {
      // Load ALL UI translations for the language using batch loading
      const allTranslations = await EnhancedTranslationService.getAllUITranslationsForLanguage(lang);
      setTranslations(allTranslations);
    } catch (error) {
      console.error('Failed to load UI translations:', error);
      toast({
        title: "Translation Error",
        description: "Failed to load interface translations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const t = (key: string, fallback?: string): string => {
    const translation = translations[key];
    
    // Enhanced fallback chain with validation
    if (!translation) {
      // Development-only warning for missing translation keys
      if (process.env.NODE_ENV === 'development') {
        console.warn(`🌐 Missing translation for key: "${key}" in language "${languageCode || userLanguage}"`);
      }
      
      // Fallback chain: provided fallback -> key itself
      return fallback || key;
    }
    
    // Validate translation is not empty
    if (translation.trim() === '') {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`🌐 Empty translation for key: "${key}" in language "${languageCode || userLanguage}"`);
      }
      
      return fallback || key;
    }
    
    return translation;
  };

  const changeLanguage = async (newLanguage: string) => {
    try {
      await EnhancedTranslationService.updateUserLanguagePreference(newLanguage);
      setUserLanguage(newLanguage);
      await loadUITranslations(newLanguage);
      
      toast({
        title: t('LANGUAGE_CHANGED', 'Language Changed'),
        description: `Interface language changed to ${newLanguage.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Failed to change language:', error);
      toast({
        title: "Error",
        description: "Failed to change language preference",
        variant: "destructive",
      });
    }
  };

  return {
    translations,
    loading,
    userLanguage,
    t,
    changeLanguage,
    reload: () => loadUITranslations(languageCode || userLanguage)
  };
}
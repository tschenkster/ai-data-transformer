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
      // Load common UI translations
      const commonKeys = [
        'NAV_HOME', 'NAV_DASHBOARD', 'NAV_REPORTS', 'NAV_STRUCTURES', 'NAV_ADMIN',
        'BTN_SAVE', 'BTN_CANCEL', 'BTN_DELETE', 'BTN_EDIT', 'BTN_CREATE',
        'LABEL_LANGUAGE', 'LABEL_STATUS', 'LABEL_CREATED', 'LABEL_UPDATED'
      ];

      const translationPromises = commonKeys.map(async (key) => {
        const translation = await EnhancedTranslationService.getUITranslation(key, lang);
        return { key, translation };
      });

      const results = await Promise.all(translationPromises);
      const translationsMap = results.reduce((acc, { key, translation }) => {
        acc[key] = translation;
        return acc;
      }, {} as UITranslations);

      setTranslations(translationsMap);
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
    return translations[key] || fallback || key;
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
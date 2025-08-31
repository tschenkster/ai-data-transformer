import { useState, useEffect, useCallback } from 'react';
import { TranslationService } from '@/services/translationService';

interface UseTranslationsOptions {
  entityType: 'report_structure' | 'report_line_item';
  entityUuid: string;
  fields: string[];
  language?: string;
}

interface TranslationState {
  translations: Record<string, string>;
  loading: boolean;
  error: string | null;
}

export function useTranslations({ 
  entityType, 
  entityUuid, 
  fields, 
  language 
}: UseTranslationsOptions) {
  const [state, setState] = useState<TranslationState>({
    translations: {},
    loading: false,
    error: null
  });

  const loadTranslations = useCallback(async () => {
    if (!entityUuid || fields.length === 0) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const translations: Record<string, string> = {};
      
      // Load translations for all requested fields
      await Promise.all(
        fields.map(async (fieldKey) => {
          const translation = await TranslationService.getTranslation(
            entityType,
            entityUuid,
            fieldKey,
            language
          );
          translations[fieldKey] = translation;
        })
      );

      setState({
        translations,
        loading: false,
        error: null
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load translations'
      }));
    }
  }, [entityType, entityUuid, fields, language]);

  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);

  const getTranslation = useCallback((fieldKey: string): string => {
    return state.translations[fieldKey] || `[missing:${fieldKey}]`;
  }, [state.translations]);

  const reload = useCallback(() => {
    loadTranslations();
  }, [loadTranslations]);

  return {
    translations: state.translations,
    loading: state.loading,
    error: state.error,
    getTranslation,
    reload
  };
}

// Hook for managing the current language preference
export function useLanguagePreference() {
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('preferred_language') || 'de';
  });

  const changeLanguage = useCallback((newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem('preferred_language', newLanguage);
  }, []);

  return {
    language,
    changeLanguage
  };
}
// Legacy compatibility layer - redirects to UnifiedTranslationProvider
import { useTranslation } from '@/contexts/UnifiedTranslationProvider';

export interface UITranslations {
  [key: string]: string;
}

/**
 * @deprecated Use useTranslation from UnifiedTranslationProvider instead
 * This hook is maintained for backward compatibility only
 */
export function useUITranslations(languageCode?: string) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('useUITranslations is deprecated. Use useTranslation from UnifiedTranslationProvider instead.');
  }
  
  const { t, language, changeLanguage, loading, isLoaded } = useTranslation();
  
  // Legacy compatibility interface
  return {
    translations: {} as UITranslations, // Empty for backward compatibility
    loading,
    userLanguage: language,
    t,
    changeLanguage,
    reload: () => {
      // Reload functionality can be implemented if needed
      console.log('Reload translations requested');
    }
  };
}
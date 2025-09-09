import { useUnifiedTranslation } from '@/contexts/UnifiedTranslationProvider';

/**
 * Hook to replace the old useLanguagePreference for content language
 * Provides backward compatibility while using the new ContentLanguageProvider
 */
export function useContentLanguagePreference() {
  const { contentLanguage, setContentLanguage } = useUnifiedTranslation();
  
  return {
    language: contentLanguage,
    changeLanguage: setContentLanguage
  };
}
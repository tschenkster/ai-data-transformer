import { useContentLanguage } from '@/contexts/ContentLanguageProvider';

/**
 * Hook to replace the old useLanguagePreference for content language
 * Provides backward compatibility while using the new ContentLanguageProvider
 */
export function useContentLanguagePreference() {
  const { contentLanguage, setContentLanguage } = useContentLanguage();
  
  return {
    language: contentLanguage,
    changeLanguage: setContentLanguage
  };
}
import { useSearchParams } from 'react-router-dom';
import { useLanguageContext } from '@/hooks/useLanguageContext';

/**
 * Hook for managing ?lang=<iso> query parameter support
 * This implements Phase 3 requirement for universal language parameter
 */
export function useLanguageQuery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentLanguage, setCurrentLanguage } = useLanguageContext();

  // Get language from URL parameter, fallback to context
  const activeLanguage = searchParams.get('lang') || currentLanguage;

  // Update language via URL parameter
  const setLanguageParam = (languageCode: string) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (languageCode === currentLanguage) {
      // Remove param if it matches user's default
      newParams.delete('lang');
    } else {
      newParams.set('lang', languageCode);
    }
    
    setSearchParams(newParams);
  };

  // Update user's default language (persisted)  
  const updateUserLanguage = (languageCode: string) => {
    setCurrentLanguage(languageCode);
    // Remove URL param if it now matches user default
    if (searchParams.get('lang') === languageCode) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('lang');
      setSearchParams(newParams);
    }
  };

  return {
    activeLanguage,
    setLanguageParam,
    updateUserLanguage,
    hasLanguageParam: searchParams.has('lang')
  };
}
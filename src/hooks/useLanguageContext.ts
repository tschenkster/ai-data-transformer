// Re-export the useLanguageContext hook from LanguageProvider to unify the context
import { useUnifiedTranslation } from '@/contexts/UnifiedTranslationProvider';
export type { LanguageContextType } from '@/components/LanguageProvider';

/**
 * @deprecated Use useUnifiedTranslation instead
 * This is maintained for backward compatibility only
 */
export function useLanguageContext() {
  const { uiLanguage, setUILanguage, availableLanguages, t, loading } = useUnifiedTranslation();
  
  return {
    currentLanguage: uiLanguage,
    setCurrentLanguage: setUILanguage,
    availableLanguages,
    t,
    loading
  };
}

// New export for components that want to use the new system
export { useUnifiedTranslation };
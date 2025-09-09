// Legacy compatibility - redirects to UnifiedTranslationProvider
import { useUnifiedTranslation } from '@/contexts/UnifiedTranslationProvider';

/**
 * @deprecated Use UnifiedTranslationProvider instead
 * This is maintained for backward compatibility only
 */
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

export function useLanguageContext(): LanguageContextType {
  console.warn('useLanguageContext is deprecated. Use useUnifiedTranslation instead.');
  
  const { uiLanguage, setUILanguage, availableLanguages, t, loading } = useUnifiedTranslation();
  
  return {
    currentLanguage: uiLanguage,
    setCurrentLanguage: setUILanguage,
    availableLanguages,
    t,
    loading
  };
}

// This component is no longer needed but kept for compatibility
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  console.warn('LanguageProvider is deprecated. Use UnifiedTranslationProvider instead.');
  return <>{children}</>;
}
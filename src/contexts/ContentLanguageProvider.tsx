// Legacy compatibility - redirects to UnifiedTranslationProvider
import { useUnifiedTranslation } from '@/contexts/UnifiedTranslationProvider';

export interface ContentLanguageContextType {
  contentLanguage: string;
  setContentLanguage: (language: string) => Promise<void>;
  availableLanguages: Array<{
    code: string;
    name: string;
    isDefault: boolean;
  }>;
  loading: boolean;
  hasUrlOverride: boolean;
}

/**
 * @deprecated Use useUnifiedTranslation instead
 * This hook is maintained for backward compatibility only
 */
export function useContentLanguage(): ContentLanguageContextType {
  if (process.env.NODE_ENV === 'development') {
    console.warn('useContentLanguage is deprecated. Use useUnifiedTranslation instead.');
  }
  
  const { 
    contentLanguage, 
    setContentLanguage, 
    availableLanguages, 
    loading, 
    hasUrlOverride 
  } = useUnifiedTranslation();
  
  return {
    contentLanguage,
    setContentLanguage,
    availableLanguages,
    loading,
    hasUrlOverride
  };
}

// Legacy component for backward compatibility
export function ContentLanguageProvider({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('ContentLanguageProvider is deprecated. Use UnifiedTranslationProvider instead.');
  }
  return <>{children}</>;
}
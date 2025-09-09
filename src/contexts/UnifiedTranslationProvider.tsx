import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { EnhancedTranslationService } from '@/services/enhancedTranslationService';

export interface UnifiedTranslationContextType {
  // Content language (for reports and data)
  contentLanguage: string;
  setContentLanguage: (language: string) => Promise<void>;
  
  // UI language (for interface)
  uiLanguage: string;
  setUILanguage: (language: string) => Promise<void>;
  
  // Translation function
  t: (key: string, fallback?: string) => string;
  
  // Available languages
  availableLanguages: Array<{
    code: string;
    name: string;
    isDefault: boolean;
  }>;
  
  // Loading states
  loading: boolean;
  translationsLoaded: boolean;
  
  // URL override
  hasUrlOverride: boolean;
}

const UnifiedTranslationContext = createContext<UnifiedTranslationContextType | undefined>(undefined);

interface UnifiedTranslationProviderProps {
  children: ReactNode;
}

export function UnifiedTranslationProvider({ children }: UnifiedTranslationProviderProps) {
  const [searchParams] = useSearchParams();
  const { user, authLoading } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [contentLanguage, setContentLanguageState] = useState<string>('de');
  const [uiLanguage, setUILanguageState] = useState<string>('de');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [availableLanguages] = useState([
    { code: 'de', name: 'Deutsch', isDefault: true },
    { code: 'en', name: 'English', isDefault: false }
  ]);
  const [loading, setLoading] = useState(true);
  const [translationsLoaded, setTranslationsLoaded] = useState(false);

  // Check for URL override (?lang=de)
  const urlLanguage = searchParams.get('lang');
  const hasUrlOverride = !!urlLanguage;
  const activeContentLanguage = urlLanguage || contentLanguage;
  const activeUILanguage = urlLanguage || uiLanguage;

  // Translation function with fallback chain
  const t = (key: string, fallback?: string): string => {
    const translation = translations[key];
    if (translation && translation.trim()) {
      return translation;
    }
    
    // Development warning for missing translations
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing translation for key: ${key}`);
    }
    
    return fallback || key;
  };

  // Initialize on mount or auth change
  useEffect(() => {
    if (!authLoading) {
      initializeTranslations();
    }
  }, [user, authLoading]);

  // Update localStorage for backward compatibility
  useEffect(() => {
    if (activeContentLanguage) {
      localStorage.setItem('contentLanguage', activeContentLanguage);
      localStorage.setItem('preferred_language', activeUILanguage);
    }
  }, [activeContentLanguage, activeUILanguage]);

  const initializeTranslations = async () => {
    setLoading(true);
    
    try {
      // Load user preferences if logged in
      if (user) {
        await loadUserLanguagePreferences();
      } else {
        // Guest defaults
        setContentLanguageState('de');
        setUILanguageState('de');
      }
      
      // Load UI translations for the active language
      await loadUITranslations(activeUILanguage);
      
    } catch (error) {
      console.error('Failed to initialize translations:', error);
      // Set fallback values on error
      setContentLanguageState('de');
      setUILanguageState('de');
    } finally {
      setLoading(false);
      setTranslationsLoaded(true);
    }
  };

  const loadUserLanguagePreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('preferred_content_language, preferred_ui_language')
        .eq('supabase_user_uuid', user.id)
        .single();

      if (error) throw error;

      const contentLang = data?.preferred_content_language || 'de';
      const uiLang = data?.preferred_ui_language || 'de';
      
      setContentLanguageState(contentLang);
      setUILanguageState(uiLang);
    } catch (error) {
      console.error('Failed to load user language preferences:', error);
      // Use defaults on error
      setContentLanguageState('de');
      setUILanguageState('de');
    }
  };

  const loadUITranslations = async (languageCode: string) => {
    try {
      const translationsData = await EnhancedTranslationService.getAllUITranslationsForLanguage(languageCode);
      setTranslations(translationsData);
    } catch (error) {
      console.error('Failed to load UI translations:', error);
      setTranslations({}); // Empty object as fallback
    }
  };

  const setContentLanguage = async (language: string): Promise<void> => {
    if (!user) {
      // Guest users - only update local state
      setContentLanguageState(language);
      return;
    }

    try {
      const { error } = await supabase
        .from('user_accounts')
        .update({ preferred_content_language: language })
        .eq('supabase_user_uuid', user.id);

      if (error) throw error;

      setContentLanguageState(language);
      
      toast({
        title: "Content Language Updated",
        description: `Report content will now display in ${language.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Failed to update content language preference:', error);
      toast({
        title: "Error",
        description: "Failed to save content language preference",
        variant: "destructive",
      });
    }
  };

  const setUILanguage = async (language: string): Promise<void> => {
    // Update local state immediately for better UX
    setUILanguageState(language);
    
    // Load new translations
    await loadUITranslations(language);
    
    // Update user preference if logged in
    if (user) {
      try {
        const { error } = await supabase
          .from('user_accounts')
          .update({ preferred_ui_language: language })
          .eq('supabase_user_uuid', user.id);

        if (error) throw error;

        toast({
          title: "Interface Language Updated",
          description: `Interface will now display in ${language.toUpperCase()}`,
        });
      } catch (error) {
        console.error('Failed to update UI language preference:', error);
        toast({
          title: "Error",
          description: "Failed to save UI language preference",
          variant: "destructive",
        });
      }
    }
  };

  const value: UnifiedTranslationContextType = {
    contentLanguage: activeContentLanguage,
    setContentLanguage,
    uiLanguage: activeUILanguage,
    setUILanguage,
    t,
    availableLanguages,
    loading,
    translationsLoaded,
    hasUrlOverride
  };

  return (
    <UnifiedTranslationContext.Provider value={value}>
      {children}
    </UnifiedTranslationContext.Provider>
  );
}

export function useUnifiedTranslation() {
  const context = useContext(UnifiedTranslationContext);
  if (!context) {
    throw new Error('useUnifiedTranslation must be used within a UnifiedTranslationProvider');
  }
  return context;
}

// Legacy compatibility exports
export const useContentLanguage = () => {
  const { contentLanguage, setContentLanguage, availableLanguages, loading, hasUrlOverride } = useUnifiedTranslation();
  return { contentLanguage, setContentLanguage, availableLanguages, loading, hasUrlOverride };
};

export const useTranslation = () => {
  const { t, uiLanguage: language, setUILanguage: changeLanguage, loading, translationsLoaded } = useUnifiedTranslation();
  return { 
    t, 
    language, 
    changeLanguage, 
    loading, 
    translations: {}, // Legacy compatibility
    isLoaded: translationsLoaded 
  };
};
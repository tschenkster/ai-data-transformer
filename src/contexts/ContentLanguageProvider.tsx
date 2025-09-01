import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

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

const ContentLanguageContext = createContext<ContentLanguageContextType | undefined>(undefined);

interface ContentLanguageProviderProps {
  children: ReactNode;
}

export function ContentLanguageProvider({ children }: ContentLanguageProviderProps) {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [contentLanguage, setContentLanguageState] = useState<string>('de');
  const [availableLanguages] = useState([
    { code: 'de', name: 'Deutsch', isDefault: true },
    { code: 'en', name: 'English', isDefault: false }
  ]);
  const [loading, setLoading] = useState(true);

  // Check for URL override (?lang=de)
  const urlLanguage = searchParams.get('lang');
  const hasUrlOverride = !!urlLanguage;
  const activeLanguage = urlLanguage || contentLanguage;

  useEffect(() => {
    if (user) {
      loadUserContentLanguagePreference();
    } else {
      // If no user, use default
      setContentLanguageState('de');
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Sync to localStorage for backward compatibility with existing code
    if (activeLanguage) {
      localStorage.setItem('contentLanguage', activeLanguage);
    }
  }, [activeLanguage]);

  const loadUserContentLanguagePreference = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('preferred_content_language')
        .eq('supabase_user_uuid', user.id)
        .single();

      if (error) throw error;

      const preferredLanguage = data?.preferred_content_language || 'de';
      setContentLanguageState(preferredLanguage);
    } catch (error) {
      console.error('Failed to load user content language preference:', error);
      setContentLanguageState('de'); // fallback
    } finally {
      setLoading(false);
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

  const value: ContentLanguageContextType = {
    contentLanguage: activeLanguage,
    setContentLanguage,
    availableLanguages,
    loading,
    hasUrlOverride
  };

  return (
    <ContentLanguageContext.Provider value={value}>
      {children}
    </ContentLanguageContext.Provider>
  );
}

export function useContentLanguage() {
  const context = useContext(ContentLanguageContext);
  if (!context) {
    throw new Error('useContentLanguage must be used within a ContentLanguageProvider');
  }
  return context;
}
import { createContext, useContext } from 'react';
import React from 'react';

/**
 * Enhanced translation context with performance optimizations and type safety
 */
export interface TranslationContextType {
  t: (key: string, fallback?: string) => string;
  language: string;
  changeLanguage: (language: string) => Promise<void>;
  loading: boolean;
  translations: Record<string, string>;
  isLoaded: boolean;
}

export const TranslationContext = createContext<TranslationContextType | null>(null);

/**
 * Hook to access translation context with error boundaries
 */
export function useTranslationContext(): TranslationContextType {
  const context = useContext(TranslationContext);
  
  if (!context) {
    // Provide a fallback implementation for components outside the provider
    console.warn('useTranslationContext used outside of TranslationProvider');
    return {
      t: (key: string, fallback?: string) => fallback || key,
      language: 'de',
      changeLanguage: async () => {},
      loading: false,
      translations: {},
      isLoaded: false,
    };
  }
  
  return context;
}

/**
 * Higher-order component for translation context
 */
export function withTranslation<T extends object>(Component: React.ComponentType<T>) {
  return function WrappedComponent(props: T) {
    const translationProps = useTranslationContext();
    return React.createElement(Component, { ...props, ...translationProps });
  };
}
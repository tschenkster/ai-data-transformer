/**
 * Type definitions for multilingual feature
 * Following naming conventions from codebase standards
 */

export interface UITranslation {
  ui_translation_id: number;
  ui_translation_uuid: string;
  ui_key: string;
  language_code_original?: string;
  language_code_target: string;
  source_field_name: string;
  original_text?: string;
  translated_text?: string;
  source: 'manual' | 'ai' | 'import';
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface SystemLanguage {
  language_code: string;
  language_name: string;
  is_enabled: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface TranslationLoadResult {
  success: boolean;
  translationsCount: number;
  missingKeys: string[];
  errorMessage?: string;
}

export interface TranslationServiceConfig {
  defaultLanguage: string;
  fallbackLanguage: string;
  enableDevWarnings: boolean;
  cacheEnabled: boolean;
}

export interface UITranslationContext {
  currentLanguage: string;
  availableLanguages: SystemLanguage[];
  translations: Record<string, string>;
  loading: boolean;
  error?: string;
  changeLanguage: (languageCode: string) => Promise<void>;
  t: (key: string, fallback?: string) => string;
  reload: () => Promise<void>;
}

export type TranslationKey = 
  | `MENU_${string}`
  | `BTN_${string}`
  | `LABEL_${string}`
  | `MSG_${string}`
  | `ERROR_${string}`;

export interface TranslationCache {
  [languageCode: string]: {
    translations: Record<string, string>;
    loadedAt: number;
    expiresAt: number;
  };
}
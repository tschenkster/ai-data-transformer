// Multilingual support exports
export { useLanguageQuery } from './hooks/useLanguageQuery';
export { LanguageQuerySelector } from './components/LanguageQuerySelector';
export { TranslationManagementUI } from './components/TranslationManagementUI';
export { EnhancedReportService } from './services/enhancedReportService';

// Types
export interface MultilingualConfig {
  defaultLanguage: string;
  supportedLanguages: string[];
  fallbackLanguage: string;
}

export interface TranslationMetadata {
  fieldKey: string;
  originalLanguage: string;
  targetLanguage: string;
  source: 'manual' | 'ai' | 'import';
  confidence?: number;
}
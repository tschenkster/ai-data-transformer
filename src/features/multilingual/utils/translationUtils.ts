/**
 * Translation utilities for multilingual support
 * Following naming conventions from codebase standards
 */

export interface TranslationKey {
  key: string;
  category: 'MENU' | 'BTN' | 'LABEL' | 'MSG' | 'ERROR';
  fallback: string;
}

export interface TranslationMap {
  [key: string]: string;
}

/**
 * Validate if a translation key follows the correct naming convention
 */
export function validateTranslationKey(key: string): boolean {
  // Keys should be UPPER_SNAKE_CASE with category prefix
  const validPattern = /^(MENU|BTN|LABEL|MSG|ERROR)_[A-Z0-9_]+$/;
  return validPattern.test(key);
}

/**
 * Generate translation key from category and identifier
 */
export function generateTranslationKey(category: string, identifier: string): string {
  const normalizedCategory = category.toUpperCase();
  const normalizedIdentifier = identifier.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  return `${normalizedCategory}_${normalizedIdentifier}`;
}

/**
 * Extract category from translation key
 */
export function getTranslationKeyCategory(key: string): string | null {
  const match = key.match(/^(MENU|BTN|LABEL|MSG|ERROR)_/);
  return match ? match[1] : null;
}

/**
 * Common menu translation keys used throughout the application
 */
export const MENU_TRANSLATION_KEYS = {
  DASHBOARD: 'MENU_DASHBOARD',
  REPORT_STRUCTURES: 'MENU_REPORT_STRUCTURES',
  COA_TRANSLATOR: 'MENU_COA_TRANSLATOR',
  FINANCIAL_REPORTS: 'MENU_FINANCIAL_REPORTS',
  SYSTEM_ADMINISTRATION: 'MENU_SYSTEM_ADMINISTRATION',
  USER_MANAGEMENT: 'MENU_USER_MANAGEMENT',
  LOGOUT: 'MENU_LOGOUT',
  ADMIN: 'MENU_ADMIN',
  CONVERT: 'MENU_CONVERT',
  ACCOUNT_PROFILE: 'MENU_ACCOUNT_PROFILE',
  PRICING: 'MENU_PRICING'
} as const;

/**
 * Common button translation keys
 */
export const BUTTON_TRANSLATION_KEYS = {
  SAVE: 'BTN_SAVE',
  CANCEL: 'BTN_CANCEL',
  DELETE: 'BTN_DELETE',
  EDIT: 'BTN_EDIT',
  CREATE: 'BTN_CREATE'
} as const;

/**
 * Common label translation keys
 */
export const LABEL_TRANSLATION_KEYS = {
  LANGUAGE: 'LABEL_LANGUAGE',
  STATUS: 'LABEL_STATUS',
  CREATED: 'LABEL_CREATED',
  UPDATED: 'LABEL_UPDATED'
} as const;

/**
 * Type for all translation keys
 */
export type MenuTranslationKey = typeof MENU_TRANSLATION_KEYS[keyof typeof MENU_TRANSLATION_KEYS];
export type ButtonTranslationKey = typeof BUTTON_TRANSLATION_KEYS[keyof typeof BUTTON_TRANSLATION_KEYS];
export type LabelTranslationKey = typeof LABEL_TRANSLATION_KEYS[keyof typeof LABEL_TRANSLATION_KEYS];
export type AllTranslationKeys = MenuTranslationKey | ButtonTranslationKey | LabelTranslationKey;

/**
 * Check if translation map has all required keys
 */
export function hasRequiredTranslations(
  translations: TranslationMap, 
  requiredKeys: string[]
): { isComplete: boolean; missingKeys: string[] } {
  const missingKeys = requiredKeys.filter(key => !translations[key]);
  return {
    isComplete: missingKeys.length === 0,
    missingKeys
  };
}

/**
 * Get fallback translation for a key based on naming convention
 */
export function getFallbackTranslation(key: string): string {
  // Extract the identifier part and convert to human-readable format
  const parts = key.split('_');
  if (parts.length < 2) return key;
  
  const identifier = parts.slice(1).join(' ');
  return identifier.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Debug helper to log translation coverage
 */
export function logTranslationCoverage(
  translations: TranslationMap,
  language: string,
  isDevelopment = process.env.NODE_ENV === 'development'
): void {
  if (!isDevelopment) return;
  
  const totalKeys = Object.keys(translations).length;
  const translatedKeys = Object.values(translations).filter(value => value && value.trim() !== '').length;
  const coverage = totalKeys > 0 ? (translatedKeys / totalKeys * 100).toFixed(1) : '0';
  
  console.log(`🌐 Translation coverage for ${language}: ${coverage}% (${translatedKeys}/${totalKeys} keys)`);
  
  // Log missing translations
  const missingKeys = Object.entries(translations)
    .filter(([_, value]) => !value || value.trim() === '')
    .map(([key]) => key);
    
  if (missingKeys.length > 0) {
    console.warn(`🚨 Missing translations for ${language}:`, missingKeys);
  }
}
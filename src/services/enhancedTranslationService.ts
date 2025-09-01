import { supabase } from '@/integrations/supabase/client';

export interface EnhancedTranslation {
  entityUuid: string;
  fieldKey: string;
  languageCodeOriginal: string;
  languageCodeTarget: string;
  originalText: string;
  translatedText: string;
  source: 'manual' | 'ai' | 'import';
}

export interface TranslationRequest {
  entityType: 'report_structure' | 'report_line_item';
  entityUuid: string;
  sourceTexts: Record<string, string>;
  sourceLanguage?: string;
}

export class EnhancedTranslationService {
  /**
   * Get translation with proper fallback logic
   */
  static async getTranslationWithFallback(
    entityType: string,
    entityUuid: string,
    fieldKey: string,
    languageCode = 'de'
  ): Promise<string> {
    const { data, error } = await supabase.rpc('get_translation_with_fallback', {
      p_entity_type: entityType,
      p_entity_uuid: entityUuid,
      p_source_field_name: fieldKey,
      p_language_code: languageCode
    });

    if (error) {
      console.error('Translation fallback error:', error);
      return `[error:${fieldKey}]`;
    }

    return data || `[missing:${fieldKey}]`;
  }

  /**
   * Get UI translation
   */
  static async getUITranslation(
    uiKey: string,
    languageCode = 'de'
  ): Promise<string> {
    return this.getTranslationWithFallback('ui', uiKey, 'text', languageCode);
  }

  /**
   * Get all translations for an entity
   */
  static async getEntityTranslations(
    entityType: 'report_structure' | 'report_line_item',
    entityUuid: string,
    languageCode?: string
  ): Promise<Record<string, string>> {
    const tableName = entityType === 'report_structure' 
      ? 'report_structures_translations' 
      : 'report_line_items_translations';

    const uuidField = entityType === 'report_structure'
      ? 'report_structure_uuid'
      : 'report_line_item_uuid';

    let query = supabase
      .from(tableName as any)
      .select('source_field_name, translated_text')
      .eq(uuidField, entityUuid);

    if (languageCode) {
      query = query.eq('language_code_target', languageCode);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching entity translations:', error);
      return {};
    }

    if (!data) return {};

    return data.reduce((acc: Record<string, string>, translation: any) => {
      acc[translation.source_field_name] = translation.translated_text || '';
      return acc;
    }, {});
  }

  /**
   * Save translations with complete metadata
   */
  static async saveTranslations(
    entityType: 'report_structure' | 'report_line_item',
    entityUuid: string,
    translations: Record<string, Record<string, string>>, // fieldKey -> { lang -> text }
    sourceLanguage = 'de'
  ): Promise<void> {
    const tableName = entityType === 'report_structure' 
      ? 'report_structures_translations' 
      : 'report_line_items_translations';

    const uuidField = entityType === 'report_structure'
      ? 'report_structure_uuid'
      : 'report_line_item_uuid';

    const insertData = [];

    for (const [fieldKey, langMap] of Object.entries(translations)) {
      for (const [langCode, translatedText] of Object.entries(langMap)) {
        insertData.push({
          [uuidField]: entityUuid,
          language_code_original: sourceLanguage,
          language_code_target: langCode,
          source_field_name: fieldKey,
          original_text: translations[fieldKey][sourceLanguage] || '',
          translated_text: translatedText,
          source: langCode === sourceLanguage ? 'import' : 'ai'
        });
      }
    }

    const { error } = await supabase
      .from(tableName as any)
      .upsert(insertData, {
        onConflict: `${uuidField},language_code_target,source_field_name`
      });

    if (error) {
      throw new Error(`Failed to save translations: ${error.message}`);
    }
  }

  /**
   * Ensure translation completeness for an entity
   */
  static async ensureTranslationCompleteness(
    entityType: 'report_structure' | 'report_line_item',
    entityUuid: string,
    sourceTexts: Record<string, string>,
    sourceLanguage = 'de'
  ): Promise<void> {
    const tableName = entityType === 'report_structure' 
      ? 'report_structures_translations' 
      : 'report_line_items_translations';

    const uuidField = entityType === 'report_structure'
      ? 'report_structure_uuid'
      : 'report_line_item_uuid';

    const languages = await this.getSystemLanguages();
    const insertData = [];

    for (const [fieldKey, fieldValue] of Object.entries(sourceTexts)) {
      for (const lang of languages) {
        insertData.push({
          [uuidField]: entityUuid,
          language_code_original: sourceLanguage,
          language_code_target: lang.language_code,
          source_field_name: fieldKey,
          original_text: fieldValue,
          translated_text: lang.language_code === sourceLanguage ? fieldValue : null,
          source: lang.language_code === sourceLanguage ? 'import' : 'ai'
        });
      }
    }

    const { error } = await supabase
      .from(tableName as any)
      .upsert(insertData, {
        onConflict: `${uuidField},language_code_target,source_field_name`
      });

    if (error) {
      throw new Error(`Failed to ensure translation completeness: ${error.message}`);
    }
  }

  /**
   * Generate AI translations for missing fields
   */
  static async generateMissingTranslations(
    entityType: 'report_structure' | 'report_line_item',
    entityUuid: string,
    targetLanguages = ['en']
  ): Promise<void> {
    // Get existing translations to identify missing ones
    const existingTranslations = await this.getEntityTranslations(entityType, entityUuid);
    
    // Call the bulk translation migration function for AI generation
    const { error } = await supabase.functions.invoke('bulk-translation-migration', {
      body: {
        operation: 'generate_translations',
        entityType,
        entityUuid,
        targetLanguages
      }
    });

    if (error) {
      throw new Error(`Failed to generate AI translations: ${error.message}`);
    }
  }

  /**
   * Get system languages
   */
  static async getSystemLanguages() {
    const { data, error } = await supabase
      .from('system_languages')
      .select('*')
      .eq('is_enabled', true)
      .order('is_default', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch system languages: ${error.message}`);
    }

    return data;
  }

  /**
   * Get default language code
   */
  static async getDefaultLanguage(): Promise<string> {
    const { data, error } = await supabase
      .from('system_languages')
      .select('language_code')
      .eq('is_default', true)
      .eq('is_enabled', true)
      .single();

    if (error || !data) {
      return 'de'; // fallback
    }

    return data.language_code;
  }

  /**
   * Update user's preferred UI language
   */
  static async updateUserLanguagePreference(languageCode: string): Promise<void> {
    const { error } = await supabase
      .from('user_accounts')
      .update({ preferred_ui_language: languageCode })
      .eq('supabase_user_uuid', (await supabase.auth.getUser()).data.user?.id);

    if (error) {
      throw new Error(`Failed to update language preference: ${error.message}`);
    }
  }

  /**
   * Get user's preferred UI language
   */
  static async getUserLanguagePreference(): Promise<string> {
    const { data, error } = await supabase
      .from('user_accounts')
      .select('preferred_ui_language')
      .eq('supabase_user_uuid', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (error || !data?.preferred_ui_language) {
      return await this.getDefaultLanguage();
    }

    return data.preferred_ui_language;
  }

  /**
   * Get all UI translations for a specific language
   * Returns key-value mapping for efficient lookup
   */
  static async getAllUITranslationsForLanguage(languageCode: string): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from('ui_translations')
      .select('ui_key, translated_text')
      .eq('language_code_target', languageCode);

    if (error) {
      console.error('Error fetching UI translations:', error);
      return {};
    }

    if (!data) return {};

    return data.reduce((acc: Record<string, string>, translation: any) => {
      acc[translation.ui_key] = translation.translated_text || '';
      return acc;
    }, {});
  }
}
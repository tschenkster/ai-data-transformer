import { supabase } from '@/integrations/supabase/client';

export interface SystemLanguage {
  language_code: string;
  language_name: string;
  is_default: boolean;
  is_enabled: boolean;
}

export interface Translation {
  field_key: string;
  translated_text: string;
  language_code: string;
  source: 'manual' | 'ai' | 'import';
}

export interface TranslationRequest {
  texts: Array<{
    field_key: string;
    text: string;
  }>;
  sourceLanguage?: string;
  targetLanguages?: string[];
  entityType?: string;
  entityUuid?: string;
  autoSave?: boolean;
}

export class TranslationService {
  // Get all available languages
  static async getLanguages(): Promise<SystemLanguage[]> {
    const { data, error } = await supabase
      .from('system_languages')
      .select('*')
      .eq('is_enabled', true)
      .order('is_default', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get default language
  static async getDefaultLanguage(): Promise<string> {
    const { data, error } = await supabase
      .from('system_languages')
      .select('language_code')
      .eq('is_default', true)
      .single();

    if (error) throw error;
    return data?.language_code || 'de';
  }

  // Get translation for a specific entity and field
  static async getTranslation(
    entityType: 'report_structure' | 'report_line_item',
    entityUuid: string,
    fieldKey: string,
    languageCode?: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('get_translation', {
      p_entity_type: entityType,
      p_entity_uuid: entityUuid,
      p_field_key: fieldKey,
      p_language_code: languageCode
    });

    if (error) throw error;
    return data || `[missing:${fieldKey}]`;
  }

  // Get translation with language parameter support and enhanced fallback
  static async getTranslationWithLang(
    entityType: string,
    entityUuid: string,
    fieldKey: string,
    languageCode?: string
  ): Promise<string> {
    // Use dynamic import to avoid circular dependency
    const { EnhancedTranslationService } = await import('./enhancedTranslationService');
    return EnhancedTranslationService.getTranslationWithFallback(
      entityType,
      entityUuid,
      fieldKey,
      languageCode || 'de'
    );
  }

  // Get all translations for an entity
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
      .select('source_field_name, translated_text, language_code_target')
      .eq(uuidField, entityUuid);

    if (languageCode) {
      query = query.eq('language_code_target', languageCode);
    }

    const { data, error } = await query;
    if (error) throw error;

    const translations: Record<string, string> = {};
    if (data) {
      data.forEach((item: any) => {
        const key = languageCode ? item.source_field_name : `${item.source_field_name}_${item.language_code_target}`;
        translations[key] = item.translated_text || '';
      });
    }

    return translations;
  }

  // Create or update translations
  static async saveTranslations(
    entityType: 'report_structure' | 'report_line_item',
    entityUuid: string,
    translations: Array<{ field_key: string; lang_code: string; text_value: string }>,
    sourceLanguage: string = 'de'
  ): Promise<void> {
    const { error } = await supabase.rpc('create_translation_entries', {
      p_entity_type: entityType,
      p_entity_uuid: entityUuid,
      p_translations: translations,
      p_source_language: sourceLanguage
    });

    if (error) throw error;
  }

  // Generate AI translations
  static async generateTranslations(request: TranslationRequest): Promise<any> {
    const { data, error } = await supabase.functions.invoke('ai-translation', {
      body: request
    });

    if (error) throw error;
    return data;
  }

  // Migrate existing data to translation tables
  static async migrateExistingData(): Promise<any> {
    const { data, error } = await supabase.rpc('migrate_existing_translations');
    if (error) throw error;
    return data;
  }

  // Auto-generate missing translations for an entity
  static async autoGenerateTranslations(
    entityType: 'report_structure' | 'report_line_item',
    entityUuid: string,
    sourceTexts: Record<string, string>,
    sourceLanguage: string = 'de'
  ): Promise<void> {
    const texts = Object.entries(sourceTexts)
      .filter(([_, text]) => text && text.trim())
      .map(([field_key, text]) => ({ field_key, text }));

    if (texts.length === 0) return;

    await this.generateTranslations({
      texts,
      sourceLanguage,
      targetLanguages: ['en'], // Generate English by default
      entityType,
      entityUuid,
      autoSave: true
    });
  }
}
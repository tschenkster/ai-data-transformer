import { supabase } from '@/integrations/supabase/client';
import { ReportStructure, ReportLineItem } from '@/features/report-structures/types';
import { EnhancedTranslationService } from '@/services/enhancedTranslationService';

/**
 * Enhanced report service with comprehensive multilingual support
 * Implements Phase 3 requirements for extended field coverage
 */
export class EnhancedReportService {
  
  /**
   * Fetch report structures with all translatable fields
   * Supports all PRD-specified fields: report_structure_name, description
   */
  static async fetchStructuresWithTranslations(languageCode = 'de'): Promise<ReportStructure[]> {
    const { data: structures, error } = await supabase
      .from('report_structures')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!structures) return [];

    // Apply translations to all structures
    const translatedStructures = await Promise.all(
      structures.map(async (structure) => ({
        ...structure,
        report_structure_name: await EnhancedTranslationService.getTranslationWithFallback(
          'report_structure',
          structure.report_structure_uuid,
          'report_structure_name',
          languageCode
        )
      }))
    );

    return translatedStructures;
  }

  /**
   * Fetch report line items with extended field coverage
   * Supports: report_line_item_description, level_1..7_line_item_description, description_of_leaf
   */
  static async fetchLineItemsWithTranslations(
    structureUuid: string, 
    languageCode = 'de'
  ): Promise<ReportLineItem[]> {
    const { data: items, error } = await supabase
      .from('report_line_items')
      .select('*')
      .eq('report_structure_uuid', structureUuid)
      .order('sort_order');

    if (error) throw error;
    if (!items) return [];

    // Apply translations to all translatable fields
    const translatedItems = await Promise.all(
      items.map(async (item) => {
        const translated = { ...item };

        // Main description
        if (item.report_line_item_description) {
          translated.report_line_item_description = await EnhancedTranslationService.getTranslationWithFallback(
            'report_line_item',
            item.report_line_item_uuid,
            'report_line_item_description',
            languageCode
          );
        }

        // Level descriptions (1-7)
        for (let level = 1; level <= 7; level++) {
          const fieldKey = `level_${level}_line_item_description` as keyof ReportLineItem;
          if (item[fieldKey]) {
            (translated as any)[fieldKey] = await EnhancedTranslationService.getTranslationWithFallback(
              'report_line_item',
              item.report_line_item_uuid,
              fieldKey as string,
              languageCode
            );
          }
        }

        // Description of leaf (if exists)
        if ((item as any).description_of_leaf) {
          (translated as any).description_of_leaf = await EnhancedTranslationService.getTranslationWithFallback(
            'report_line_item',
            item.report_line_item_uuid,
            'description_of_leaf',
            languageCode
          );
        }

        // Build localized hierarchy path from translated descriptions
        translated.hierarchy_path = this.buildLocalizedHierarchyPath(translated);

        return translated;
      })
    );

    return translatedItems;
  }

  /**
   * Ensure translations exist for an existing structure
   */
  static async ensureStructureTranslations(
    structureUuid: string,
    sourceLanguage = 'de'
  ): Promise<void> {
    // Get current structure data
    const { data: structure, error } = await supabase
      .from('report_structures')
      .select('report_structure_name')
      .eq('report_structure_uuid', structureUuid)
      .single();

    if (error || !structure) return;

    const sourceTexts: Record<string, string> = {
      report_structure_name: structure.report_structure_name
    };

    await EnhancedTranslationService.ensureTranslationCompleteness(
      'report_structure',
      structureUuid,
      sourceTexts,
      sourceLanguage
    );

    // Generate AI translations for missing languages
    await EnhancedTranslationService.generateMissingTranslations(
      'report_structure',
      structureUuid,
      ['en', 'de'].filter(lang => lang !== sourceLanguage)
    );
  }

  /**
   * Ensure translations exist for line items
   */
  static async ensureLineItemTranslations(
    itemUuid: string,
    sourceLanguage = 'de'
  ): Promise<void> {
    // Get current item data
    const { data: item, error } = await supabase
      .from('report_line_items')
      .select('*')
      .eq('report_line_item_uuid', itemUuid)
      .single();

    if (error || !item) return;

    // Create translations for all translatable fields
    const sourceTexts: Record<string, string> = {};
    
    if (item.report_line_item_description) {
      sourceTexts['report_line_item_description'] = item.report_line_item_description;
    }

    // Level descriptions
    for (let level = 1; level <= 7; level++) {
      const fieldKey = `level_${level}_line_item_description`;
      if ((item as any)[fieldKey]) {
        sourceTexts[fieldKey] = (item as any)[fieldKey];
      }
    }

    if ((item as any).description_of_leaf) {
      sourceTexts['description_of_leaf'] = (item as any).description_of_leaf;
    }

    await EnhancedTranslationService.ensureTranslationCompleteness(
      'report_line_item',
      itemUuid,
      sourceTexts,
      sourceLanguage
    );

    // Generate AI translations
    await EnhancedTranslationService.generateMissingTranslations(
      'report_line_item',
      itemUuid,
      ['en', 'de'].filter(lang => lang !== sourceLanguage)
    );
  }

  /**
   * Build localized hierarchy path from translated descriptions
   * This replaces the monolingual canonical path with a localized display path
   */
  private static buildLocalizedHierarchyPath(item: ReportLineItem): string {
    const segments: string[] = [];
    
    // Use translated level descriptions to build path
    for (let level = 1; level <= 7; level++) {
      const description = (item as any)[`level_${level}_line_item_description`];
      if (description && description.trim()) {
        segments.push(description.trim());
      }
    }

    return segments.join(' > ');
  }
}
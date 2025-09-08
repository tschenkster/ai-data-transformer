import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentItem {
  entityType: 'ui' | 'report_structure' | 'report_line_item';
  entityUuid: string;
  entityId?: string;
  fieldKey: string;
  originalText: string;
  detectedLanguage?: string;
  confidence?: number;
}

interface TranslationGap {
  entityType: string;
  entityUuid: string;
  fieldKey: string;
  sourceLanguage: string;
  targetLanguage: string;
  originalText: string;
}

interface MigrationAnalysis {
  totalContentItems: number;
  detectedLanguages: Record<string, number>;
  translationGaps: TranslationGap[];
  uiKeysToBootstrap: string[];
  contentByType: {
    ui: number;
    report_structure: number;
    report_line_item: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { operation = 'analyze', filters = {} } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (operation === 'analyze') {
      console.log('Starting comprehensive content analysis...');
      const analysis = await performComprehensiveAnalysis(supabase);
      
      return new Response(JSON.stringify({ 
        success: true,
        operation: 'analyze',
        result: analysis
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (operation === 'migrate') {
      console.log('Starting intelligent translation migration...');
      const result = await performIntelligentMigration(supabase, filters);
      
      return new Response(JSON.stringify({ 
        success: true,
        operation: 'migrate',
        result
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid operation. Use "analyze" or "migrate"');

  } catch (error) {
    console.error('Error in intelligent-translation-migration function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function performComprehensiveAnalysis(supabase: any): Promise<MigrationAnalysis> {
  const contentItems: ContentItem[] = [];
  const analysis: MigrationAnalysis = {
    totalContentItems: 0,
    detectedLanguages: {},
    translationGaps: [],
    uiKeysToBootstrap: [],
    contentByType: {
      ui: 0,
      report_structure: 0,
      report_line_item: 0
    }
  };

  // Get enabled system languages
  const { data: systemLanguages, error: langError } = await supabase
    .from('system_languages')
    .select('language_code, language_name')
    .eq('is_enabled', true);

  if (langError) {
    throw new Error(`Failed to fetch system languages: ${langError.message}`);
  }

  const enabledLanguages = systemLanguages.map((l: any) => l.language_code);
  console.log('Enabled system languages:', enabledLanguages);

  // 1. Discover UI content gaps
  console.log('Analyzing UI translations...');
  const uiKeys = await scanForUIKeys();
  analysis.uiKeysToBootstrap = uiKeys;
  analysis.contentByType.ui = uiKeys.length;

  // Sample UI keys for language detection
  if (uiKeys.length > 0) {
    const sampleUITexts = uiKeys.slice(0, 10);
    const uiLanguage = await detectLanguage(supabase, sampleUITexts);
    analysis.detectedLanguages[uiLanguage.language] = (analysis.detectedLanguages[uiLanguage.language] || 0) + uiKeys.length;
  }

  // 2. Discover report structures
  console.log('Analyzing report structures...');
  const { data: structures, error: structError } = await supabase
    .from('report_structures')
    .select('report_structure_uuid, report_structure_name, description')
    .not('report_structure_name', 'is', null);

  if (structError) {
    throw new Error(`Failed to fetch structures: ${structError.message}`);
  }

  for (const structure of structures || []) {
    const fields = {
      'report_structure_name': structure.report_structure_name,
      ...(structure.description && { 'description': structure.description })
    };

    for (const [fieldKey, text] of Object.entries(fields)) {
      if (text) {
        contentItems.push({
          entityType: 'report_structure',
          entityUuid: structure.report_structure_uuid,
          fieldKey,
          originalText: text as string
        });
      }
    }
  }
  analysis.contentByType.report_structure = structures?.length || 0;

  // 3. Discover report line items
  console.log('Analyzing report line items...');
  const { data: lineItems, error: itemError } = await supabase
    .from('report_line_items')
    .select(`
      report_line_item_uuid, 
      report_line_item_description,
      level_1_line_item_description,
      level_2_line_item_description,
      level_3_line_item_description,
      level_4_line_item_description,
      level_5_line_item_description,
      level_6_line_item_description,
      level_7_line_item_description,
      description_of_leaf
    `);

  if (itemError) {
    throw new Error(`Failed to fetch line items: ${itemError.message}`);
  }

  for (const item of lineItems || []) {
    const fields = {
      'report_line_item_description': item.report_line_item_description,
      'level_1_line_item_description': item.level_1_line_item_description,
      'level_2_line_item_description': item.level_2_line_item_description,
      'level_3_line_item_description': item.level_3_line_item_description,
      'level_4_line_item_description': item.level_4_line_item_description,
      'level_5_line_item_description': item.level_5_line_item_description,
      'level_6_line_item_description': item.level_6_line_item_description,
      'level_7_line_item_description': item.level_7_line_item_description,
      'description_of_leaf': item.description_of_leaf
    };

    for (const [fieldKey, text] of Object.entries(fields)) {
      if (text) {
        contentItems.push({
          entityType: 'report_line_item',
          entityUuid: item.report_line_item_uuid,
          fieldKey,
          originalText: text as string
        });
      }
    }
  }
  analysis.contentByType.report_line_item = lineItems?.length || 0;

  // 4. Detect languages for all content items
  console.log('Detecting languages for content items...');
  const batchSize = 20;
  for (let i = 0; i < contentItems.length; i += batchSize) {
    const batch = contentItems.slice(i, i + batchSize);
    const texts = batch.map(item => item.originalText);
    
    try {
      const detectionResult = await detectLanguage(supabase, texts);
      const detectedLang = detectionResult.language;
      
      // Apply detection result to batch
      batch.forEach(item => {
        item.detectedLanguage = detectedLang;
        item.confidence = detectionResult.confidence;
      });

      analysis.detectedLanguages[detectedLang] = (analysis.detectedLanguages[detectedLang] || 0) + batch.length;
    } catch (error) {
      console.warn(`Language detection failed for batch ${i}-${i + batchSize}, defaulting to 'en':`, error);
      batch.forEach(item => {
        item.detectedLanguage = 'en';
        item.confidence = 0.3;
      });
      analysis.detectedLanguages['en'] = (analysis.detectedLanguages['en'] || 0) + batch.length;
    }
  }

  // 5. Identify translation gaps
  console.log('Identifying translation gaps...');
  for (const item of contentItems) {
    const sourceLanguage = item.detectedLanguage || 'en';
    
    for (const targetLanguage of enabledLanguages) {
      if (sourceLanguage !== targetLanguage) {
        // Check if translation already exists
        const translationExists = await checkTranslationExists(supabase, item, targetLanguage);
        
        if (!translationExists) {
          analysis.translationGaps.push({
            entityType: item.entityType,
            entityUuid: item.entityUuid,
            fieldKey: item.fieldKey,
            sourceLanguage,
            targetLanguage,
            originalText: item.originalText
          });
        }
      }
    }
  }

  analysis.totalContentItems = contentItems.length;
  
  console.log('Analysis complete:', {
    totalItems: analysis.totalContentItems,
    detectedLanguages: analysis.detectedLanguages,
    translationGaps: analysis.translationGaps.length,
    uiKeysToBootstrap: analysis.uiKeysToBootstrap.length
  });

  return analysis;
}

async function performIntelligentMigration(supabase: any, filters: any) {
  const results = {
    uiElementsProcessed: 0,
    structuresProcessed: 0,
    lineItemsProcessed: 0,
    translationsGenerated: 0,
    errors: [] as string[]
  };

  // Get the analysis first
  const analysis = await performComprehensiveAnalysis(supabase);
  
  console.log(`Starting migration for ${analysis.translationGaps.length} translation gaps...`);

  // 1. Bootstrap UI translations if needed
  if (analysis.uiKeysToBootstrap.length > 0) {
    console.log(`Bootstrapping ${analysis.uiKeysToBootstrap.length} UI keys...`);
    try {
      await bootstrapUITranslations(supabase, analysis.uiKeysToBootstrap, filters.sourceLanguage || 'en');
      results.uiElementsProcessed = analysis.uiKeysToBootstrap.length;
    } catch (error) {
      results.errors.push(`UI bootstrap failed: ${error.message}`);
    }
  }

  // 2. Process translation gaps in batches
  const BATCH_SIZE = 10;
  const gapsByType = groupTranslationGapsByType(analysis.translationGaps);

  for (const [entityType, gaps] of Object.entries(gapsByType)) {
    console.log(`Processing ${gaps.length} ${entityType} translation gaps...`);
    
    for (let i = 0; i < gaps.length; i += BATCH_SIZE) {
      const batch = gaps.slice(i, i + BATCH_SIZE);
      
      try {
        const translationResults = await translateBatch(supabase, batch);
        results.translationsGenerated += translationResults.length;
        
        if (entityType === 'report_structure') {
          results.structuresProcessed += new Set(batch.map(g => g.entityUuid)).size;
        } else if (entityType === 'report_line_item') {
          results.lineItemsProcessed += new Set(batch.map(g => g.entityUuid)).size;
        }
      } catch (error) {
        results.errors.push(`${entityType} batch ${i}-${i + BATCH_SIZE} failed: ${error.message}`);
      }
    }
  }

  return results;
}

async function scanForUIKeys(): Promise<string[]> {
  // This would ideally scan the codebase for translation keys
  // For now, return common UI keys that should exist
  return [
    'WELCOME_MESSAGE',
    'NAVIGATION_HOME',
    'NAVIGATION_REPORTS',
    'NAVIGATION_ADMIN',
    'BUTTON_SAVE',
    'BUTTON_CANCEL',
    'BUTTON_DELETE',
    'ERROR_GENERIC',
    'ERROR_NETWORK',
    'SUCCESS_SAVED',
    'LOADING_PLEASE_WAIT',
    'CONFIRM_DELETE',
    'TABLE_NO_DATA',
    'SEARCH_PLACEHOLDER',
    'LANGUAGE_CHANGED'
  ];
}

async function detectLanguage(supabase: any, texts: string[]) {
  const { data, error } = await supabase.functions.invoke('detect-language', {
    body: { texts }
  });

  if (error) {
    console.warn('Language detection failed, defaulting to English:', error);
    return { language: 'en', confidence: 0.3 };
  }

  return data;
}

async function checkTranslationExists(supabase: any, item: ContentItem, targetLanguage: string): Promise<boolean> {
  let tableName: string;
  let uuidField: string;

  if (item.entityType === 'ui') {
    const { data } = await supabase
      .from('ui_translations')
      .select('ui_translation_id')
      .eq('ui_key', item.entityUuid)
      .eq('language_code_target', targetLanguage)
      .eq('source_field_name', 'text')
      .single();
    return !!data;
  } else if (item.entityType === 'report_structure') {
    tableName = 'report_structures_translations';
    uuidField = 'report_structure_uuid';
  } else if (item.entityType === 'report_line_item') {
    tableName = 'report_line_items_translations';
    uuidField = 'report_line_item_uuid';
  } else {
    return false;
  }

  const { data } = await supabase
    .from(tableName)
    .select('*')
    .eq(uuidField, item.entityUuid)
    .eq('language_code_target', targetLanguage)
    .eq('source_field_name', item.fieldKey)
    .single();

  return !!data;
}

async function bootstrapUITranslations(supabase: any, uiKeys: string[], sourceLanguage: string) {
  const insertData = [];
  
  for (const key of uiKeys) {
    insertData.push({
      ui_key: key,
      language_code_original: sourceLanguage,
      language_code_target: sourceLanguage,
      source_field_name: 'text',
      original_text: key,
      translated_text: key, // Bootstrap with key as text
      source: 'bootstrap'
    });
  }

  const { error } = await supabase
    .from('ui_translations')
    .upsert(insertData, {
      onConflict: 'ui_key,language_code_target,source_field_name'
    });

  if (error) {
    throw new Error(`Failed to bootstrap UI translations: ${error.message}`);
  }
}

function groupTranslationGapsByType(gaps: TranslationGap[]): Record<string, TranslationGap[]> {
  return gaps.reduce((acc: Record<string, TranslationGap[]>, gap) => {
    if (!acc[gap.entityType]) {
      acc[gap.entityType] = [];
    }
    acc[gap.entityType].push(gap);
    return acc;
  }, {});
}

async function translateBatch(supabase: any, gaps: TranslationGap[]): Promise<any[]> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  // Group by source->target language pairs for efficient prompting
  const languagePairs = gaps.reduce((acc: Record<string, TranslationGap[]>, gap) => {
    const key = `${gap.sourceLanguage}->${gap.targetLanguage}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(gap);
    return acc;
  }, {});

  const results = [];

  for (const [languagePair, pairGaps] of Object.entries(languagePairs)) {
    const [sourceLanguage, targetLanguage] = languagePair.split('->');
    
    const textsToTranslate = pairGaps.map(gap => ({
      id: `${gap.entityType}_${gap.entityUuid}_${gap.fieldKey}`,
      text: gap.originalText
    }));

    const prompt = `Translate these ${getLanguageName(sourceLanguage)} financial/accounting terms to ${getLanguageName(targetLanguage)}. 
Maintain professional terminology and context. Respond with translations in the same order:

${textsToTranslate.map((item, index) => `${index + 1}. ${item.text}`).join('\n')}

Provide only the translations, one per line, numbered.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a professional financial translator. Provide accurate, contextual translations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.1
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const translatedContent = data.choices[0].message.content;
      
      // Parse translations
      const translations = translatedContent
        .split('\n')
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((line: string) => line.length > 0);

      // Save translations
      for (let i = 0; i < pairGaps.length && i < translations.length; i++) {
        const gap = pairGaps[i];
        const translatedText = translations[i];

        await saveTranslation(supabase, gap, translatedText);
        results.push({
          entityType: gap.entityType,
          entityUuid: gap.entityUuid,
          fieldKey: gap.fieldKey,
          sourceLanguage: gap.sourceLanguage,
          targetLanguage: gap.targetLanguage,
          translatedText
        });
      }
    } catch (error) {
      console.error(`Translation failed for ${languagePair}:`, error);
      throw error;
    }
  }

  return results;
}

async function saveTranslation(supabase: any, gap: TranslationGap, translatedText: string) {
  if (gap.entityType === 'ui') {
    const { error } = await supabase
      .from('ui_translations')
      .upsert({
        ui_key: gap.entityUuid,
        language_code_original: gap.sourceLanguage,
        language_code_target: gap.targetLanguage,
        source_field_name: 'text',
        original_text: gap.originalText,
        translated_text: translatedText,
        source: 'ai_generated'
      }, {
        onConflict: 'ui_key,language_code_target,source_field_name'
      });

    if (error) throw error;
  } else {
    const { error } = await supabase.rpc('create_translation_entries', {
      p_entity_type: gap.entityType,
      p_entity_uuid: gap.entityUuid,
      p_translations: JSON.stringify([{
        field_key: gap.fieldKey,
        lang_code: gap.targetLanguage,
        text_value: translatedText
      }]),
      p_source_language: gap.sourceLanguage
    });

    if (error) throw error;
  }
}

function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    'en': 'English',
    'de': 'German',
    'fr': 'French',
    'es': 'Spanish',
    'it': 'Italian',
    'sv': 'Swedish'
  };
  return names[code] || code;
}
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Global type declaration for translation key mapping
declare global {
  var translationKeyMap: Record<string, string>;
}

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
    const { operation = 'analyze', filters = {}, contentTypes = [], userId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Selective analysis operations
    if (operation === 'analyze' || operation.startsWith('analyze-')) {
      console.log(`Starting ${operation} content analysis...`);
      const analysis = await performSelectiveAnalysis(supabase, operation, contentTypes);
      
      return new Response(JSON.stringify({ 
        success: true,
        operation,
        result: analysis
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Selective migration operations
    if (operation === 'migrate' || operation.startsWith('migrate-')) {
      console.log(`Starting ${operation} translation migration...`);
      const result = await performSelectiveMigration(supabase, operation, contentTypes, filters, userId);
      
      return new Response(JSON.stringify({ 
        success: true,
        operation,
        result
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid operation. Supported: analyze, analyze-ui, analyze-structures, analyze-line-items, migrate, migrate-ui, migrate-structures, migrate-line-items');

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

async function performSelectiveAnalysis(supabase: any, operation: string, contentTypes: string[] = []): Promise<MigrationAnalysis> {
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

  // Determine what to analyze based on operation
  const shouldAnalyzeUI = operation === 'analyze' || operation === 'analyze-ui' || contentTypes.includes('ui');
  const shouldAnalyzeStructures = operation === 'analyze' || operation === 'analyze-structures' || contentTypes.includes('report_structure');
  const shouldAnalyzeLineItems = operation === 'analyze' || operation === 'analyze-line-items' || contentTypes.includes('report_line_item');

  // 1. Discover UI content gaps
  if (shouldAnalyzeUI) {
    console.log('Analyzing UI translations...');
    const uiKeys = await scanForUIKeys(supabase);
    analysis.uiKeysToBootstrap = uiKeys;
    analysis.contentByType.ui = uiKeys.length;

    // Sample UI keys for language detection
    if (uiKeys.length > 0) {
      const sampleUITexts = uiKeys.slice(0, 10).map(k => ( (globalThis as any).translationKeyMap?.[k] || k ));
      const uiLanguage = await detectLanguage(supabase, sampleUITexts);
      analysis.detectedLanguages[uiLanguage.language] = (analysis.detectedLanguages[uiLanguage.language] || 0) + uiKeys.length;
    }
  }

  // 2. Discover report structures
  if (shouldAnalyzeStructures) {
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
  }

  // 3. Discover report line items
  if (shouldAnalyzeLineItems) {
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
  }

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

async function performSelectiveMigration(supabase: any, operation: string, contentTypes: string[] = [], filters: any = {}, userId?: string) {
  const results = {
    uiElementsProcessed: 0,
    structuresProcessed: 0,
    lineItemsProcessed: 0,
    translationsGenerated: 0,
    errors: [] as string[]
  };

  // Get the analysis first - use selective analysis for efficiency
  const analysisContentTypes = operation === 'migrate' ? [] : 
    operation === 'migrate-ui' ? ['ui'] :
    operation === 'migrate-structures' ? ['report_structure'] :
    operation === 'migrate-line-items' ? ['report_line_item'] : contentTypes;
  
  const analysis = await performSelectiveAnalysis(supabase, operation === 'migrate' ? 'analyze' : `analyze-${operation.split('-')[1]}`, analysisContentTypes);
  
  console.log(`Starting migration for ${analysis.translationGaps.length} translation gaps...`);

  // Report back analyzed counts expected by UI
  const analyzedTotals = {
    ui: analysis.contentByType.ui,
    report_structure: analysis.contentByType.report_structure,
    report_line_item: analysis.contentByType.report_line_item,
  };
  if (operation === 'migrate') {
    (results as any).totalItemsAnalyzed = analyzedTotals.ui + analyzedTotals.report_structure + analyzedTotals.report_line_item;
  } else {
    const analyzeFor = analysisContentTypes.length ? analysisContentTypes : [];
    const itemsAnalyzed = (analyzeFor.includes('ui') ? analyzedTotals.ui : 0)
      + (analyzeFor.includes('report_structure') ? analyzedTotals.report_structure : 0)
      + (analyzeFor.includes('report_line_item') ? analyzedTotals.report_line_item : 0);
    (results as any).itemsAnalyzed = itemsAnalyzed;
  }

  // 1. Bootstrap UI translations if needed
  if (analysis.uiKeysToBootstrap.length > 0) {
    console.log(`Bootstrapping ${analysis.uiKeysToBootstrap.length} UI keys...`);
    try {
      const sourceLanguage = filters.sourceLanguage || 'en';
      await bootstrapUITranslations(supabase, analysis.uiKeysToBootstrap, sourceLanguage, userId);
      results.uiElementsProcessed = analysis.uiKeysToBootstrap.length;

      // Now generate missing target-language translations for UI keys
      const { data: sysLangs, error: sysErr } = await supabase
        .from('system_languages')
        .select('language_code')
        .eq('is_enabled', true);
      if (sysErr) throw sysErr;
      const enabledLangs = (sysLangs || []).map((l: any) => l.language_code);

      const translationKeyMap: Record<string, string> = (globalThis as any).translationKeyMap || {};
      const uiGaps: TranslationGap[] = [];

      for (const key of analysis.uiKeysToBootstrap) {
        const original = translationKeyMap[key] || key;
        for (const target of enabledLangs) {
          if (target === sourceLanguage) continue;
          // Skip if already translated (but not placeholder entries)
          const { data: existing, error: existErr } = await supabase
            .from('ui_translations')
            .select('ui_translation_id, language_code_original, language_code_target')
            .eq('ui_key', key)
            .eq('language_code_target', target)
            .eq('source_field_name', 'text')
            .limit(1);
          if (existErr) throw existErr;
          // Only skip if there's a real translation (not a placeholder where source === target)
          if (existing && existing.length > 0 && existing[0].language_code_original !== existing[0].language_code_target) continue;

          uiGaps.push({
            entityType: 'ui',
            entityUuid: key,
            fieldKey: 'text',
            sourceLanguage,
            targetLanguage: target,
            originalText: original
          });
        }
      }

      if (uiGaps.length > 0) {
        console.log(`Translating ${uiGaps.length} UI entries to target languages...`);
        try {
          const uiResults = await translateBatch(supabase, uiGaps, userId);
          results.translationsGenerated += uiResults.length;
        } catch (aiErr) {
          console.warn('AI translation failed for UI keys, falling back to placeholders:', aiErr?.message || aiErr);
          const upserted = await upsertPlaceholderUiTranslations(supabase, uiGaps, userId);
          results.translationsGenerated += upserted;
        }
      }
    } catch (error: any) {
      results.errors.push(`UI bootstrap/translation failed: ${error.message}`);
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
        const translationResults = await translateBatch(supabase, batch, userId);
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

interface TranslationKeyWithText {
  key: string;
  fallbackText: string;
  file: string;
  line: number;
}

async function scanForUIKeys(supabase: any): Promise<string[]> {
  console.log('Scanning codebase for UI translation keys...');
  
  try {
    // Call the new codebase scanner to get translation keys with their fallback text
    const { data, error } = await supabase.functions.invoke('scan-codebase-translations', {
      body: {}
    });

    if (error) {
      throw new Error(`Codebase scan failed: ${error.message}`);
    }

    const translationKeys = data.translationKeys as TranslationKeyWithText[];
    console.log(`Found ${translationKeys.length} UI translation keys with fallback text`);
    
    // Store the mapping globally for use in bootstrap
    ;(globalThis as any).translationKeyMap = translationKeys.reduce((acc, item) => {
      acc[item.key] = item.fallbackText;
      return acc;
    }, {} as Record<string, string>);
    
    return translationKeys.map(t => t.key);
    
  } catch (error) {
    console.error('Error scanning for UI keys:', error);
    // Fallback to basic keys if scanning fails
    return [
      'MSG_LOADING', 'APP_TITLE', 'MENU_DASHBOARD', 'BTN_SAVE', 'BTN_CANCEL',
      'ERROR_GENERIC', 'SUCCESS_SAVED', 'LOADING_PLEASE_WAIT', 'CONFIRM_DELETE'
    ];
  }
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

async function bootstrapUITranslations(supabase: any, uiKeys: string[], sourceLanguage: string, userId?: string) {
  const actorId = userId || '00000000-0000-0000-0000-000000000001';
  
  // Get the translation key mapping from global storage (set by scanForUIKeys)
  const translationKeyMap = (globalThis as any).translationKeyMap || {};
  
  const insertData = [] as any[];
  
  for (const key of uiKeys) {
    const fallbackText = translationKeyMap[key] || key; // Use fallback text or key as fallback
    
    insertData.push({
      ui_key: key,
      language_code_original: sourceLanguage,
      language_code_target: sourceLanguage,
      source_field_name: 'text',
      original_text: fallbackText, // Use the actual fallback text
      translated_text: fallbackText, // Bootstrap with fallback text
      source: 'system',
      created_by: actorId,
      updated_by: actorId
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
  
  console.log(`Bootstrapped ${insertData.length} UI translations with actual fallback text`);
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

async function translateBatch(supabase: any, gaps: TranslationGap[], userId?: string): Promise<any[]> {
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

        try {
          await saveTranslation(supabase, gap, translatedText, userId);
          results.push({
            entityType: gap.entityType,
            entityUuid: gap.entityUuid,
            fieldKey: gap.fieldKey,
            sourceLanguage: gap.sourceLanguage,
            targetLanguage: gap.targetLanguage,
            translatedText
          });
        } catch (saveError: any) {
          console.error(`Translation failed for ${gap.sourceLanguage}->${gap.targetLanguage}:`, saveError);
        }
      }
    } catch (error) {
      console.error(`Translation failed for ${languagePair}:`, error);
      throw error;
    }
  }

  return results;
}

async function saveTranslation(supabase: any, gap: TranslationGap, translatedText: string, userId?: string) {
  const actorId = userId || '00000000-0000-0000-0000-000000000001';

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
        source: 'ai_generated',
        created_by: actorId,
        updated_by: actorId
      }, {
        onConflict: 'ui_key,language_code_target,source_field_name'
      });

    if (error) throw error;
    return;
  }

  if (gap.entityType === 'report_structure') {
    const { error } = await supabase
      .from('report_structures_translations')
      .upsert({
        report_structure_uuid: gap.entityUuid,
        language_code_original: gap.sourceLanguage,
        language_code_target: gap.targetLanguage,
        source_field_name: (gap.fieldKey === 'structure_name' || gap.fieldKey === 'name') ? 'report_structure_name' : gap.fieldKey,
        original_text: gap.originalText,
        translated_text: translatedText,
        source: 'ai_generated',
        created_by: actorId,
        updated_by: actorId
      }, {
        onConflict: 'report_structure_uuid,language_code_target,source_field_name'
      });

    if (error) throw error;
    return;
  }

  if (gap.entityType === 'report_line_item') {
    const { error } = await supabase
      .from('report_line_items_translations')
      .upsert({
        report_line_item_uuid: gap.entityUuid,
        language_code_original: gap.sourceLanguage,
        language_code_target: gap.targetLanguage,
        source_field_name: gap.fieldKey,
        original_text: gap.originalText,
        translated_text: translatedText,
        source: 'ai_generated',
        created_by: actorId,
        updated_by: actorId
      }, {
        onConflict: 'report_line_item_uuid,language_code_target,source_field_name'
      });

    if (error) throw error;
    return;
  }
}



async function upsertPlaceholderUiTranslations(supabase: any, gaps: TranslationGap[], userId?: string): Promise<number> {
  const actorId = userId || '00000000-0000-0000-0000-000000000001';
  if (!gaps || gaps.length === 0) return 0;

  const rows = gaps.map(gap => ({
    ui_key: gap.entityUuid,
    language_code_original: gap.sourceLanguage,
    language_code_target: gap.targetLanguage,
    source_field_name: 'text',
    original_text: gap.originalText,
    translated_text: gap.originalText, // placeholder equals original
    source: 'system',
    created_by: actorId,
    updated_by: actorId
  }));

  const { error } = await supabase
    .from('ui_translations')
    .upsert(rows, { onConflict: 'ui_key,language_code_target,source_field_name' });

  if (error) {
    console.error('Placeholder UI upsert failed:', error);
    return 0;
  }

  return rows.length;
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
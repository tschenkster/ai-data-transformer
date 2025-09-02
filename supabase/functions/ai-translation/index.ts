import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      texts,
      sourceLanguage = 'de',
      targetLanguages = ['en'],
      entityType,
      entityUuid,
      autoSave = true
    } = await req.json();

    if (!texts || !Array.isArray(texts)) {
      throw new Error('texts array is required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const results: any[] = [];

    // Language name mapping for better AI context
    const languageNames: Record<string, string> = {
      'de': 'German',
      'en': 'English',
      'fr': 'French',
      'es': 'Spanish',
      'it': 'Italian',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish',
      'nl': 'Dutch'
    };

    // Process each target language
    for (const targetLang of targetLanguages) {
      const sourceLangName = languageNames[sourceLanguage] || sourceLanguage;
      const targetLangName = languageNames[targetLang] || targetLang;
      
      // Create batch translation request
      const textEntries = texts.map((text: any) => `${text.field_key}: ${text.text}`).join('\n');
      
      const prompt = `Translate the following ${sourceLangName} financial/accounting terms to ${targetLangName}. 
      These are report structure names, line item descriptions, and other financial terminology.
      Maintain professional financial language and context. 
      Keep the same format with field_key: translated_text for each line.
      If a term should not be translated (like proper nouns), keep it as is.
      
      ${textEntries}`;

      console.log('Translating to', targetLang, ':', prompt);

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
              content: 'You are a professional financial translator. Translate financial and accounting terms accurately while maintaining their professional context. Always preserve the field_key: text format in your response.'
            },
            {
              role: 'user', 
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const translatedContent = data.choices[0].message.content;

      console.log('Translation result:', translatedContent);

      // Parse the translated content back to structured format
      const translatedTexts = translatedContent
        .split('\n')
        .filter((line: string) => line.trim() && line.includes(':'))
        .map((line: string) => {
          const [fieldKey, ...textParts] = line.split(':');
          return {
            field_key: fieldKey.trim(),
            lang_code: targetLang,
            text_value: textParts.join(':').trim()
          };
        });

      results.push({
        target_language: targetLang,
        translations: translatedTexts
      });

      // Auto-save to database if requested
      if (autoSave && entityType && entityUuid) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        try {
          // Validate and clean field keys before saving
          const validTranslations = translatedTexts.filter(t => 
            t.field_key && t.text_value && t.field_key.length <= 500
          );

          if (validTranslations.length === 0) {
            console.warn('No valid translations to save');
            continue;
          }

          const { error } = await supabase.rpc('create_translation_entries', {
            p_entity_type: entityType,
            p_entity_uuid: entityUuid,
            p_translations: validTranslations,
            p_source_language: sourceLanguage
          });

          if (error) {
            console.error('Error saving translations:', error);
            throw new Error(`Failed to save translations: ${error.message}`);
          }

          console.log(`Successfully saved ${validTranslations.length} translations for ${targetLang}`);
        } catch (saveError) {
          console.error('Translation save failed:', saveError);
          throw saveError;
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      translations: results,
      source_language: sourceLanguage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-translation function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
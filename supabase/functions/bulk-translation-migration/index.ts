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
    const { operation = 'migrate' } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (operation === 'migrate') {
      // Execute the migration to populate translation tables
      console.log('Starting migration of existing data to translation tables...');
      
      const { data: migrationResult, error: migrationError } = await supabase.rpc('migrate_existing_translations');
      
      if (migrationError) {
        console.error('Migration error:', migrationError);
        throw new Error(`Migration failed: ${migrationError.message}`);
      }
      
      console.log('Migration completed:', migrationResult);
      
      return new Response(JSON.stringify({ 
        success: true,
        operation: 'migrate',
        result: migrationResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (operation === 'generate_translations') {
      // Generate English translations for all existing German content
      console.log('Starting bulk translation generation...');
      
      // Get all report structures that need translations
      const { data: structures, error: structuresError } = await supabase
        .from('report_structures')
        .select('report_structure_uuid, report_structure_name')
        .eq('source_language_code', 'de');

      if (structuresError) {
        throw new Error(`Failed to fetch structures: ${structuresError.message}`);
      }

      // Get all line items that need translations
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('report_line_items')
        .select('report_line_item_uuid, report_line_item_description')
        .eq('source_language_code', 'de')
        .not('report_line_item_description', 'is', null);

      if (lineItemsError) {
        throw new Error(`Failed to fetch line items: ${lineItemsError.message}`);
      }

      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured');
      }

      let processed = 0;
      const total = (structures?.length || 0) + (lineItems?.length || 0);
      const results = {
        structures_processed: 0,
        line_items_processed: 0,
        total_processed: 0,
        errors: [] as string[]
      };

      // Process structures in batches
      if (structures && structures.length > 0) {
        for (let i = 0; i < structures.length; i += 10) {
          const batch = structures.slice(i, i + 10);
          
          try {
            const texts = batch
              .filter(s => s.report_structure_name)
              .map(s => ({
                field_key: 'report_structure_name',
                text: s.report_structure_name
              }));

            if (texts.length > 0) {
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
                      content: 'You are a professional financial translator. Translate German financial and accounting terms to English accurately. Always preserve the field_key: text format in your response.'
                    },
                    {
                      role: 'user',
                      content: `Translate these German financial report structure names to English:\n${texts.map(t => `${t.field_key}: ${t.text}`).join('\n')}`
                    }
                  ],
                  max_tokens: 1000,
                }),
              });

              if (response.ok) {
                const data = await response.json();
                const translatedContent = data.choices[0].message.content;
                
                // Parse translations and save them
                const translations = translatedContent
                  .split('\n')
                  .filter((line: string) => line.trim() && line.includes(':'))
                  .map((line: string, index: number) => {
                    const [fieldKey, ...textParts] = line.split(':');
                    const original = texts[index]?.text || '';
                    return {
                      source_field_name: fieldKey.trim(),
                      lang_code: 'en',
                      text_value: textParts.join(':').trim(),
                      original_text: original
                    };
                  });

                // Save translations for each structure in the batch
                for (let j = 0; j < batch.length && j < translations.length; j++) {
                  const structure = batch[j];
                  const translation = translations[j];
                  
                  if (translation) {
                    const { error: saveError } = await supabase.rpc('create_translation_entries', {
                      p_entity_type: 'report_structure',
                      p_entity_uuid: structure.report_structure_uuid,
                      p_translations: JSON.stringify([translation]),
                      p_source_language: 'de'
                    });

                    if (saveError) {
                      console.error(`Error saving structure translation ${structure.report_structure_uuid}:`, saveError);
                      results.errors.push(`Structure ${structure.report_structure_name}: ${saveError.message}`);
                    } else {
                      results.structures_processed++;
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error processing structure batch:', error);
            results.errors.push(`Structure batch ${i}-${i+9}: ${error.message}`);
          }
        }
      }

      // Process line items in batches
      if (lineItems && lineItems.length > 0) {
        for (let i = 0; i < lineItems.length; i += 10) {
          const batch = lineItems.slice(i, i + 10);
          
          try {
            const texts = batch
              .filter(item => item.report_line_item_description)
              .map(item => ({
                field_key: 'report_line_item_description',
                text: item.report_line_item_description
              }));

            if (texts.length > 0) {
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
                      content: 'You are a professional financial translator. Translate German financial and accounting terms to English accurately. Always preserve the field_key: text format in your response.'
                    },
                    {
                      role: 'user',
                      content: `Translate these German financial line item descriptions to English:\n${texts.map(t => `${t.field_key}: ${t.text}`).join('\n')}`
                    }
                  ],
                  max_tokens: 2000,
                }),
              });

              if (response.ok) {
                const data = await response.json();
                const translatedContent = data.choices[0].message.content;
                
                // Parse translations and save them
                const translations = translatedContent
                  .split('\n')
                  .filter((line: string) => line.trim() && line.includes(':'))
                  .map((line: string, index: number) => {
                    const [fieldKey, ...textParts] = line.split(':');
                    const original = texts[index]?.text || '';
                    return {
                      source_field_name: fieldKey.trim(),
                      lang_code: 'en',
                      text_value: textParts.join(':').trim(),
                      original_text: original
                    };
                  });

                // Save translations for each item in the batch
                for (let j = 0; j < batch.length && j < translations.length; j++) {
                  const item = batch[j];
                  const translation = translations[j];
                  
                  if (translation) {
                    const { error: saveError } = await supabase.rpc('create_translation_entries', {
                      p_entity_type: 'report_line_item',
                      p_entity_uuid: item.report_line_item_uuid,
                      p_translations: JSON.stringify([translation]),
                      p_source_language: 'de'
                    });

                    if (saveError) {
                      console.error(`Error saving line item translation ${item.report_line_item_uuid}:`, saveError);
                      results.errors.push(`Line item ${item.report_line_item_description}: ${saveError.message}`);
                    } else {
                      results.line_items_processed++;
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error processing line item batch:', error);
            results.errors.push(`Line item batch ${i}-${i+9}: ${error.message}`);
          }
        }
      }

      results.total_processed = results.structures_processed + results.line_items_processed;
      
      return new Response(JSON.stringify({ 
        success: true,
        operation: 'generate_translations',
        result: results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid operation');

  } catch (error) {
    console.error('Error in bulk-translation-migration function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
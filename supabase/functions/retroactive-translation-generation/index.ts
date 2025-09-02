import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { structureUuid } = await req.json();

    if (!structureUuid) {
      throw new Error('structureUuid is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Generating retroactive translations for structure: ${structureUuid}`);

    // Get structure details
    const { data: structure, error: structureError } = await supabase
      .from('report_structures')
      .select('report_structure_uuid, report_structure_name, source_language_code')
      .eq('report_structure_uuid', structureUuid)
      .single();

    if (structureError || !structure) {
      throw new Error(`Structure not found: ${structureError?.message}`);
    }

    const sourceLanguage = structure.source_language_code || 'de';
    const targetLanguages = sourceLanguage === 'de' ? ['en'] : ['de'];

    // Generate structure translation
    const structureTexts = [{
      field_key: 'report_structure_name',
      text: structure.report_structure_name
    }];

    const { data: structureTranslationResult, error: structureTranslationError } = await supabase.functions.invoke('ai-translation', {
      body: {
        texts: structureTexts,
        sourceLanguage,
        targetLanguages,
        entityType: 'report_structure',
        entityUuid: structureUuid,
        autoSave: true
      }
    });

    if (structureTranslationError) {
      console.error('Structure translation failed:', structureTranslationError);
    } else {
      console.log('Structure translation generated successfully');
    }

    // Get all line items for this structure
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('report_line_items')
      .select('report_line_item_uuid, report_line_item_key, report_line_item_description')
      .eq('report_structure_uuid', structureUuid);

    if (lineItemsError) {
      throw new Error(`Failed to fetch line items: ${lineItemsError.message}`);
    }

    console.log(`Found ${lineItems?.length || 0} line items to translate`);

    let successCount = 0;
    let failureCount = 0;

    // Process line items individually
    if (lineItems && lineItems.length > 0) {
      for (const item of lineItems) {
        if (item.report_line_item_description) {
          try {
            const { data: lineItemTranslationResult, error: lineItemTranslationError } = await supabase.functions.invoke('ai-translation', {
              body: {
                texts: [{
                  field_key: `${item.report_line_item_key}_description`,
                  text: item.report_line_item_description
                }],
                sourceLanguage,
                targetLanguages,
                entityType: 'report_line_item',
                entityUuid: item.report_line_item_uuid,
                autoSave: true
              }
            });

            if (lineItemTranslationError) {
              console.error(`Translation failed for line item ${item.report_line_item_uuid}:`, lineItemTranslationError);
              failureCount++;
            } else {
              console.log(`Translation generated for line item ${item.report_line_item_uuid}`);
              successCount++;
            }

            // Brief delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (error) {
            console.error(`Error processing line item ${item.report_line_item_uuid}:`, error);
            failureCount++;
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Retroactive translation generation completed`,
      structureUuid,
      lineItemsProcessed: lineItems?.length || 0,
      successCount,
      failureCount,
      sourceLanguage,
      targetLanguages
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in retroactive-translation-generation:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
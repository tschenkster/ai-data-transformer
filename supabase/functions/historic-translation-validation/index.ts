import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  operation: string;
  rule_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { operation, rule_id }: RequestBody = await req.json();
    
    console.log(`Historic Translation Validation - Operation: ${operation}`);

    let result;

    switch (operation) {
      case 'validate_all':
        const { data: validation, error } = await supabaseClient.rpc('validate_translation_data_integrity');
        if (error) throw error;
        
        result = {
          success: true,
          results: validation.validation_results,
          overall_status: validation.overall_status,
          timestamp: validation.timestamp
        };
        break;

      case 'quick_fix':
        if (!rule_id) {
          throw new Error('rule_id is required for quick_fix operation');
        }

        // Apply quick fixes based on rule_id
        switch (rule_id) {
          case 'no_null_original_lang':
          case 'no_null_original_text':
            // Run all migration functions
            await supabaseClient.rpc('migrate_ui_translations_null_values');
            await supabaseClient.rpc('migrate_report_structures_translations_null_values');
            await supabaseClient.rpc('migrate_report_line_items_translations_null_values');
            break;
          
          default:
            throw new Error(`No quick fix available for rule: ${rule_id}`);
        }

        result = {
          success: true,
          message: `Quick fix applied for rule: ${rule_id}`,
          timestamp: new Date().toISOString()
        };
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Historic Translation Validation Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
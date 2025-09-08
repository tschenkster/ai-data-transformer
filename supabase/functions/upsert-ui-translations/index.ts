import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpsertEntry {
  ui_key: string;
  language_code_target: string;
  original_text?: string | null;
  translated_text?: string | null;
  source_field_name?: string | null; // e.g. 'label', 'title'
  source?: 'manual' | 'ai' | 'import';
}

interface RequestBody {
  entries: UpsertEntry[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Check auth header (required)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), { status: 401, headers: corsHeaders });
    }

    // Create service client for DB writes
    const supabase = createClient(supabaseUrl, serviceKey);

    const body: RequestBody = await req.json();
    if (!body || !Array.isArray(body.entries) || body.entries.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid payload. Provide entries array.' }), { status: 400, headers: corsHeaders });
    }

    let processed = 0;
    let upserted = 0;
    const results: Array<{ ui_key: string; target: string; detected_original: string; status: 'upserted' | 'skipped'; reason?: string; }>
      = [];

    for (const entry of body.entries) {
      processed++;
      const { ui_key, language_code_target, original_text, translated_text } = entry;

      if (!ui_key || !language_code_target) {
        results.push({ ui_key: ui_key || '(missing)', target: language_code_target || '(missing)', detected_original: 'n/a', status: 'skipped', reason: 'Missing ui_key or language_code_target' });
        continue;
      }

      const textForDetection = (original_text && original_text.trim().length > 0)
        ? original_text
        : (translated_text && translated_text.trim().length > 0 ? translated_text : null);

      if (!textForDetection) {
        results.push({ ui_key, target: language_code_target, detected_original: 'n/a', status: 'skipped', reason: 'No text provided' });
        continue;
      }

      // Use functions.invoke to detect language of the provided text
      const clientForInvoke = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
      const { data: detection, error: detectError } = await clientForInvoke.functions.invoke('detect-language', {
        body: { texts: [textForDetection] }
      });

      if (detectError) {
        console.warn('detect-language error for ui_key', ui_key, detectError);
        results.push({ ui_key, target: language_code_target, detected_original: 'en', status: 'skipped', reason: 'Language detection failed' });
        continue;
      }

      const detectedOriginal = (detection?.language || detection?.overallLanguage || 'en').toLowerCase();

      const row = {
        ui_key,
        language_code_target: language_code_target.toLowerCase(),
        language_code_original: detectedOriginal,
        source_field_name: entry.source_field_name || 'label',
        original_text: original_text ?? null,
        translated_text: translated_text ?? null,
        source: entry.source || 'manual',
      };

      const { error: upsertError } = await supabase
        .from('ui_translations')
        .upsert(row, { onConflict: 'ui_key,language_code_target' });

      if (upsertError) {
        console.error('Upsert failed for ui_key', ui_key, upsertError);
        results.push({ ui_key, target: language_code_target, detected_original: detectedOriginal, status: 'skipped', reason: upsertError.message });
        continue;
      }

      upserted++;
      results.push({ ui_key, target: language_code_target, detected_original: detectedOriginal, status: 'upserted' });
    }

    return new Response(JSON.stringify({ success: true, processed, upserted, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('upsert-ui-translations error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
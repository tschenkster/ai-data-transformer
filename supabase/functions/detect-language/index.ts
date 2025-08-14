import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { accounts } = await req.json();

    console.log(`Detecting language for ${accounts.length} accounts`);

    // Sample first 10 accounts for detection to avoid token limits
    const sampleAccounts = accounts.slice(0, 10);
    const accountTexts = sampleAccounts.map((acc: any) => acc.originalDescription).join('\n');

    const prompt = `You are analyzing accounting/financial descriptions to detect their language.

Account descriptions to analyze:
${accountTexts}

Guidelines:
- German: compound words, umlauts (ä, ö, ü, ß), capitalized nouns
- French: accents (é, è, à, ç), articles (le, la, les, du, des)
- Spanish: ñ, accents (á, é, í, ó, ú), articles (el, la, los, las)
- Italian: double consonants, endings in -o/-a/-e, articles (il, la, gli, le)
- English: articles (the, a, an), no special characters
- Return JSON with detections array and overallLanguage
- Use two-letter language codes (en, de, fr, es, it, etc.)
- Set overallLanguage to "mixed" if multiple languages detected

Return JSON format:
{
  "detections": [
    {"accountNumber": "1000", "language": "en", "confidence": 0.95},
    {"accountNumber": "1100", "language": "en", "confidence": 0.92}
  ],
  "overallLanguage": "en"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    console.log('Claude response:', content);

    // Parse Claude's JSON response
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      // Fallback to English if parsing fails
      result = {
        detections: sampleAccounts.map((acc: any) => ({
          accountNumber: acc.accountNumber,
          language: 'en',
          confidence: 0.5
        })),
        overallLanguage: 'en'
      };
    }

    console.log(`Language detection complete. Overall language: ${result.overallLanguage}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in detect-language function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
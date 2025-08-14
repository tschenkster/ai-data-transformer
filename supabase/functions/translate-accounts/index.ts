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
    const { 
      accounts, 
      sourceLanguage, 
      targetLanguage, 
      sessionId,
      batchInfo 
    } = await req.json();

    console.log(`Translating batch ${batchInfo.currentBatch}/${batchInfo.totalBatches} for session ${sessionId}`);

    // Create translation prompt
    const accountsText = accounts.map((acc: any) => 
      `${acc.accountNumber}: ${acc.originalDescription}`
    ).join('\n');

    const prompt = `You are a professional translator specializing in accounting and financial terminology.

Context: You are translating Chart of Accounts descriptions from ${sourceLanguage} to ${targetLanguage}.

Guidelines:
- Maintain professional accounting terminology
- Keep translations concise and business-appropriate
- Preserve account numbering and structure
- Use consistent terminology throughout
- Focus on accuracy for financial/accounting context

Accounts to translate:
${accountsText}

Return JSON format with translations array:
{
  "translations": [
    {
      "accountNumber": "1000",
      "originalDescription": "Cash and Cash Equivalents",
      "translatedDescription": "[translation]",
      "confidence": 0.95
    }
  ]
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
        max_tokens: 2000,
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
    
    console.log('Claude translation response:', content);

    // Parse Claude's JSON response
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      // Fallback translation if parsing fails
      result = {
        translations: accounts.map((acc: any) => ({
          accountNumber: acc.accountNumber,
          originalDescription: acc.originalDescription,
          translatedDescription: `[Translation Error] ${acc.originalDescription}`,
          confidence: 0.1
        }))
      };
    }

    // Update session progress in database
    await supabase
      .from('coa_translation_sessions')
      .update({ 
        processed_accounts: batchInfo.currentBatch * 10,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    console.log(`Translation batch ${batchInfo.currentBatch} complete`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in translate-accounts function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
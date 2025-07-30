import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accounts, sessionId, userId } = await req.json();

    if (!anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      throw new Error('No accounts provided');
    }

    console.log(`Processing ${accounts.length} accounts for session ${sessionId}`);

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Process accounts in batches to avoid token limits
    const batchSize = 10;
    const decisions = [];

    for (let i = 0; i < accounts.length; i += batchSize) {
      const batch = accounts.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(accounts.length / batchSize)}`);

      // Get similar historical accounts for this batch
      const similarAccountsPromises = batch.map(async (account) => {
        try {
          const { data: similarData } = await supabase.functions.invoke('similarity-search', {
            body: { 
              accountName: account,
              userId: userId,
              limit: 5
            }
          });
          return {
            account,
            similar: similarData?.results || []
          };
        } catch (error) {
          console.error(`Error finding similar accounts for ${account}:`, error);
          return { account, similar: [] };
        }
      });

      const similarResults = await Promise.all(similarAccountsPromises);

      const prompt = `You are an expert financial account mapping assistant with access to historical mapping data. I will provide you with account names and their most similar historical mappings from our database.

Use the historical mappings as precedents to make accurate mapping decisions. Pay special attention to accounts with high similarity scores (>0.8) as these are very reliable precedents.

For each account, analyze the historical precedents and provide a JSON response with this structure:
{
  "original": "original account name",
  "suggested": "standardized category name", 
  "confidence": 0.85,
  "reasoning": "explanation based on historical precedents and similarity analysis"
}

HISTORICAL PRECEDENTS:
${similarResults.map(result => {
  if (result.similar.length === 0) {
    return `Account: "${result.account}" - No similar historical mappings found`;
  }
  return `Account: "${result.account}" - Similar historical mappings:
${result.similar.map(sim => 
  `  • "${sim.original_account_name}" → "${sim.mapped_account_name}" (similarity: ${(sim.similarity * 100).toFixed(1)}%, confidence: ${sim.confidence_score})`
).join('\n')}`;
}).join('\n\n')}

Account names to process:
${batch.map((account, index) => `${i + index + 1}. "${account}"`).join('\n')}

Respond with a JSON array where each object has this structure:
{
  "original": "original account name",
  "suggested": "suggested standardized name", 
  "confidence": 0.85,
  "reasoning": "explanation of the mapping decision"
}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          temperature: 0.1,
          system: 'You are a financial account mapping expert. Always respond with valid JSON only, no additional text.',
          messages: [
            { role: 'user', content: prompt }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const aiContent = aiResponse.content[0].text;
      
      let batchMappings;
      try {
        batchMappings = JSON.parse(aiContent);
      } catch (parseError) {
        console.error('Failed to parse AI response:', aiContent);
        // Fallback to simple mappings if AI response is malformed
        batchMappings = batch.map(account => ({
          original: account,
          suggested: account.trim().replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, ' '),
          confidence: 0.5,
          reasoning: 'Fallback mapping due to AI parsing error'
        }));
      }

      // Store decisions in database
      for (const mapping of batchMappings) {
        const { data: decision, error } = await supabase
          .from('mapping_decisions')
          .insert({
            session_id: sessionId,
            user_id: userId,
            original_account_name: mapping.original,
            suggested_mapping: mapping.suggested,
            confidence_score: mapping.confidence,
            reasoning: mapping.reasoning,
            status: 'pending'
          })
          .select()
          .single();

        if (error) {
          console.error('Database error:', error);
          throw error;
        }

        decisions.push({
          id: decision.id,
          originalAccount: mapping.original,
          suggestedMapping: mapping.suggested,
          confidenceScore: mapping.confidence,
          reasoning: mapping.reasoning,
          status: 'pending'
        });
      }

      // Small delay to avoid rate limiting
      if (i + batchSize < accounts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Successfully processed ${decisions.length} decisions`);

    return new Response(JSON.stringify({ 
      success: true,
      decisions,
      totalProcessed: decisions.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-account-mapper function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
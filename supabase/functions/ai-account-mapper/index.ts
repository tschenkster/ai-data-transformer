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
      
      const prompt = `You are an expert at standardizing and mapping financial account names. 
      
Your task is to analyze the following account names and suggest standardized, professional mappings that follow these principles:
- Use clear, descriptive names that reflect the account's purpose
- Follow standard accounting terminology
- Remove unnecessary codes, abbreviations, or formatting
- Group similar accounts under consistent naming patterns
- Maintain the essential meaning while improving clarity

For each account, provide:
1. A suggested standardized mapping
2. A confidence score (0.0 to 1.0) based on how certain you are about the mapping
3. A brief reasoning for your suggestion

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
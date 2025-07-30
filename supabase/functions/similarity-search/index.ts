import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const googleApiKey = Deno.env.get('GOOGLE_AI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accountName, userId, limit = 5 } = await req.json();

    if (!googleApiKey) {
      throw new Error('Google AI API key not configured');
    }

    if (!accountName || typeof accountName !== 'string') {
      throw new Error('Account name is required');
    }

    console.log(`Searching for similar accounts to: ${accountName}`);

    // Generate embedding for the search account - using correct Google Gemini API format
    const embeddingResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: {
          parts: [{ 
            text: accountName 
          }]
        },
        taskType: "SEMANTIC_SIMILARITY",
        title: "Account Search Embedding"
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error(`Google AI API error for search "${accountName}":`, errorText);
      console.error(`Response status: ${embeddingResponse.status}`);
      throw new Error(`Google AI embedding API error: ${embeddingResponse.status} - ${errorText}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.embedding.values;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Search for similar accounts using cosine similarity
    const { data: similarAccounts, error } = await supabase.rpc('match_account_embeddings', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: limit,
      filter_user_id: userId
    });

    if (error) {
      console.error('Error searching similar accounts:', error);
      throw new Error(`Database search error: ${error.message}`);
    }

    console.log(`Found ${similarAccounts?.length || 0} similar accounts`);

    // Format the results with similarity scores
    const formattedResults = similarAccounts?.map(account => ({
      id: account.id,
      original_account_name: account.original_account_name,
      mapped_account_name: account.mapped_account_name,
      confidence_score: account.confidence_score,
      reasoning: account.reasoning,
      similarity: account.similarity,
      validated: account.validated,
      created_at: account.created_at
    })) || [];

    return new Response(JSON.stringify({
      success: true,
      query: accountName,
      results: formattedResults,
      count: formattedResults.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in similarity-search function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
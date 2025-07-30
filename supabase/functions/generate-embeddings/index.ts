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
    const { accounts, batchSize = 10 } = await req.json();

    if (!googleApiKey) {
      throw new Error('Google AI API key not configured');
    }

    if (!accounts || !Array.isArray(accounts)) {
      throw new Error('Invalid accounts data provided');
    }

    console.log(`Processing ${accounts.length} accounts for embedding generation`);

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const results = [];

    // Process accounts in batches to avoid rate limits
    for (let i = 0; i < accounts.length; i += batchSize) {
      const batch = accounts.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(accounts.length / batchSize)}`);

      for (const account of batch) {
        try {
          const accountName = account.original_account_name || account.account_name;
          console.log(`Processing account: "${accountName}"`);
          
          // Generate embedding - simplified request format
          const requestBody = {
            content: {
              parts: [{ text: accountName }]
            }
          };
          
          console.log(`Sending request to Google AI for: "${accountName}"`);
          console.log(`Request body:`, JSON.stringify(requestBody));
          
          const embeddingResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${googleApiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          console.log(`Response status: ${embeddingResponse.status}`);
          
          if (!embeddingResponse.ok) {
            const errorText = await embeddingResponse.text();
            console.error(`Google AI API error for account "${accountName}":`, errorText);
            throw new Error(`Google AI embedding API error: ${embeddingResponse.status} - ${errorText}`);
          }

          const embeddingData = await embeddingResponse.json();
          console.log(`Received embedding data for "${accountName}":`, embeddingData);
          
          if (!embeddingData.embedding || !embeddingData.embedding.values) {
            console.error(`Invalid embedding response for "${accountName}":`, embeddingData);
            throw new Error(`Invalid embedding response format`);
          }
          
          const embedding = embeddingData.embedding.values;

          // Store or update the account mapping with embedding
          const { data, error } = await supabase
            .from('account_mappings')
            .upsert({
              original_account_name: account.original_account_name || account.account_name,
              mapped_account_name: account.mapped_account_name || account.account_name,
              user_id: account.user_id,
              confidence_score: account.confidence_score || 1.0,
              reasoning: account.reasoning || 'Historical mapping',
              validated: account.validated || false,
              embedding: embedding
            }, {
              onConflict: 'original_account_name,user_id'
            })
            .select();

          if (error) {
            console.error('Error storing account mapping:', error);
            results.push({
              account: account.original_account_name || account.account_name,
              success: false,
              error: error.message
            });
          } else {
            results.push({
              account: account.original_account_name || account.account_name,
              success: true,
              id: data[0]?.id
            });
          }

        } catch (error) {
          console.error(`Error processing account ${account.original_account_name || account.account_name}:`, error);
          results.push({
            account: account.original_account_name || account.account_name,
            success: false,
            error: error.message
          });
        }
      }

      // Small delay between batches to respect rate limits
      if (i + batchSize < accounts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Embedding generation completed: ${successCount} successful, ${failureCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      results,
      summary: {
        total: accounts.length,
        successful: successCount,
        failed: failureCount
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-embeddings function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
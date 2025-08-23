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

// Local language detection fallback
function detectLanguageLocally(accounts: any[]) {
  const accountingTerms = {
    en: ['cash', 'bank', 'asset', 'liability', 'equity', 'revenue', 'expense', 'account', 'receivable', 'payable'],
    de: ['kasse', 'bank', 'vermögen', 'verbindlichkeit', 'eigenkapital', 'umsatz', 'ausgaben', 'konto', 'forderung'],
    fr: ['caisse', 'banque', 'actif', 'passif', 'capitaux', 'revenus', 'charges', 'compte', 'créances'],
    es: ['caja', 'banco', 'activo', 'pasivo', 'patrimonio', 'ingresos', 'gastos', 'cuenta', 'cobrar'],
    sv: ['kassa', 'bank', 'tillgång', 'skuld', 'eget', 'intäkt', 'kostnad', 'konto', 'fordran'],
    it: ['cassa', 'banca', 'attivo', 'passivo', 'patrimonio', 'ricavi', 'costi', 'conto', 'crediti']
  };

  const characterPatterns = {
    de: /[äöüßÄÖÜ]/,
    fr: /[éèàçêëîïôùûüÉÈÀÇ]/,
    es: /[ñáéíóúüÑÁÉÍÓÚÜ]/,
    sv: /[åäöÅÄÖ]/,
    it: /[àèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ]/
  };

  const combinedText = accounts.map((acc: any) => acc.originalDescription).join(' ').toLowerCase();
  const scores: { [key: string]: number } = {};

  // Initialize scores
  Object.keys(accountingTerms).forEach(lang => {
    scores[lang] = 0;
  });

  // Check accounting terms
  Object.entries(accountingTerms).forEach(([lang, terms]) => {
    terms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = combinedText.match(regex);
      if (matches) {
        scores[lang] += matches.length * 2;
      }
    });
  });

  // Check character patterns
  Object.entries(characterPatterns).forEach(([lang, pattern]) => {
    const matches = combinedText.match(pattern);
    if (matches) {
      scores[lang] += matches.length;
    }
  });

  const bestLang = Object.entries(scores).reduce((best, [lang, score]) => 
    score > best[1] ? [lang, score] : best, ['en', 0]
  )[0];

  return {
    detections: accounts.map((acc: any) => ({
      accountNumber: acc.accountNumber,
      language: bestLang,
      confidence: 0.7
    })),
    overallLanguage: bestLang
  };
}

// Retry function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

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

    // Try Claude API with retry logic
    try {
      const result = await retryWithBackoff(async () => {
        const accountTexts = sampleAccounts.map((acc: any) => acc.originalDescription).join('\n');

        const prompt = `Analyze these accounting/financial descriptions to detect their language.

Account descriptions:
${accountTexts}

Language detection rules:
- German: compound words, umlauts (ä, ö, ü, ß), capitalized nouns
- French: accents (é, è, à, ç), articles (le, la, les, du, des)  
- Spanish: ñ, accents (á, é, í, ó, ú), articles (el, la, los, las)
- Italian: double consonants, endings in -o/-a/-e, articles (il, la, gli, le)
- English: articles (the, a, an), no special characters
- Swedish: å, ä, ö characters, compound words, articles (den, det, en, ett)

CRITICAL: Return ONLY valid JSON with NO explanations, analysis, or additional text.

Required JSON format:
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

        // Handle specific error types
        if (response.status === 529) {
          throw new Error('Service temporarily unavailable');
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        if (!response.ok) {
          throw new Error(`Claude API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.content[0].text;
        
        console.log('Claude response:', content);

        // Parse Claude's JSON response with improved extraction
        try {
          return JSON.parse(content);
        } catch (parseError) {
          console.error('Direct JSON parse failed, attempting extraction:', parseError);
          
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
          throw new Error('Invalid response format');
        }
      });

      console.log(`Claude API success. Overall language: ${result.overallLanguage}`);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (claudeError) {
      console.error('Claude API failed after retries, using local fallback:', claudeError);
      
      // Use local detection as fallback
      const fallbackResult = detectLanguageLocally(sampleAccounts);
      
      console.log(`Local detection fallback. Overall language: ${fallbackResult.overallLanguage}`);
      return new Response(JSON.stringify({
        ...fallbackResult,
        fallback: true,
        claudeError: claudeError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Critical error in detect-language function:', error);
    
    // Last resort fallback
    const accounts = await req.json().then(body => body.accounts || []).catch(() => []);
    const fallbackResult = {
      detections: accounts.slice(0, 10).map((acc: any) => ({
        accountNumber: acc?.accountNumber || '0000',
        language: 'en',
        confidence: 0.3
      })),
      overallLanguage: 'en',
      fallback: true,
      error: error.message
    };

    return new Response(JSON.stringify(fallbackResult), {
      status: 200, // Return 200 to avoid breaking the UI flow
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
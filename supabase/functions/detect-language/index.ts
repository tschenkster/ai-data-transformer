import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Enhanced local language detection with improved English recognition
function detectLanguageLocally(texts: string[]) {
  const accountingTerms = {
    // Expanded English terms with common accounting phrases
    en: [
      'cash', 'bank', 'asset', 'liability', 'equity', 'revenue', 'expense', 'account', 'receivable', 'payable',
      'balance', 'sheet', 'profit', 'loss', 'income', 'statement', 'current', 'non-current', 'total',
      'assets', 'liabilities', 'accounts', 'inventory', 'property', 'plant', 'equipment', 'retained',
      'earnings', 'capital', 'stock', 'bonds', 'notes', 'shareholders', 'comprehensive', 'consolidated',
      'subsidiaries', 'goodwill', 'intangible', 'tangible', 'depreciation', 'amortization', 'provisions',
      'third', 'party', 'related', 'treasury', 'dividend', 'common', 'preferred'
    ],
    de: [
      'kasse', 'bank', 'vermögen', 'verbindlichkeit', 'eigenkapital', 'umsatz', 'ausgaben', 'konto', 'forderung',
      'bilanz', 'gewinn', 'verlust', 'anlagevermögen', 'umlaufvermögen', 'rückstellungen', 'abschreibungen',
      'gesellschaft', 'kapital', 'ergebnis', 'aufwand', 'ertrag', 'stammkapital', 'jahresüberschuss'
    ],
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

  const combinedText = texts.join(' ').toLowerCase();
  const scores: { [key: string]: number } = {};

  // Initialize scores with English having slight preference
  Object.keys(accountingTerms).forEach(lang => {
    scores[lang] = lang === 'en' ? 2 : 0; // Give English a stronger preference
  });

  // Check accounting terms with higher weight for exact matches
  Object.entries(accountingTerms).forEach(([lang, terms]) => {
    terms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = combinedText.match(regex);
      if (matches) {
        scores[lang] += matches.length * (lang === 'en' ? 3 : 2); // Higher weight for English
      }
    });
  });

  // Check character patterns (strong indicators for non-English)
  Object.entries(characterPatterns).forEach(([lang, pattern]) => {
    const matches = combinedText.match(pattern);
    if (matches) {
      scores[lang] += matches.length * 10; // Strong weight for special characters
    }
  });

  // English pattern bonuses
  const englishPatterns = [
    /\b(the|and|of|to|in|for|with|by)\b/g,
    /\b(total|current|non.?current|third.?party|related.?party)\b/g,
    /\b(balance\s+sheet|income\s+statement|cash\s+flow)\b/g
  ];
  
  englishPatterns.forEach(pattern => {
    const matches = combinedText.match(pattern);
    if (matches) {
      scores.en += matches.length * 5;
    }
  });

  // Default to English if no clear winner or scores are very low
  const maxScore = Math.max(...Object.values(scores));
  const bestLang = maxScore < 5 ? 'en' : Object.entries(scores).reduce((best, [lang, score]) => 
    score > best[1] ? [lang, score] : best, ['en', 0]
  )[0];

  console.log('Language detection scores:', scores, 'Best:', bestLang);

  return {
    language: bestLang,
    confidence: Math.min(maxScore / 10, 0.9)
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
    const requestBody = await req.json();
    
    // Extract text data based on different input formats
    let texts: string[] = [];
    let detectionItems: any[] = [];
    
    if (requestBody.accounts) {
      // CoA Translator format: { accounts: [{accountNumber, originalDescription}] }
      texts = requestBody.accounts.map((acc: any) => acc.originalDescription || '').filter(Boolean);
      detectionItems = requestBody.accounts;
    } else if (requestBody.lineItems) {
      // Report Structure Manager format: { lineItems: [{key, description}] }
      texts = requestBody.lineItems.map((item: any) => item.description || '').filter(Boolean);
      detectionItems = requestBody.lineItems;
    } else if (requestBody.texts) {
      // Generic text array format: { texts: ["text1", "text2"] }
      texts = requestBody.texts.filter(Boolean);
      detectionItems = requestBody.texts.map((text: string, index: number) => ({ id: index, text }));
    } else if (requestBody.text) {
      // Single text format: { text: "sample text" }
      texts = [requestBody.text];
      detectionItems = [{ id: 0, text: requestBody.text }];
    } else {
      throw new Error('Invalid input format. Expected accounts, lineItems, texts, or text field.');
    }

    if (texts.length === 0) {
      throw new Error('No text content provided for language detection');
    }

    console.log(`Detecting language for ${texts.length} text items`);

    // Sample first 10 items for detection to avoid token limits
    const sampleTexts = texts.slice(0, 10);
    const sampleItems = detectionItems.slice(0, 10);

    // Try OpenAI API with retry logic
    try {
      const result = await retryWithBackoff(async () => {
        const combinedTexts = sampleTexts.join('\n');

        const prompt = `Analyze these financial/accounting descriptions to detect their language. Focus on these indicators:

Text samples:
${combinedTexts}

Language detection rules:
- English: "cash", "account", "balance", "total", "current", "assets", "liabilities", articles (the, a, an)
- German: "kasse", "konto", "bilanz", compound words, umlauts (ä, ö, ü, ß), capitalized nouns
- French: "caisse", "compte", "bilan", accents (é, è, à, ç), articles (le, la, les)
- Spanish: "caja", "cuenta", "balance", ñ, accents (á, é, í, ó, ú), articles (el, la, los)
- Italian: "cassa", "conto", "bilancio", double consonants, articles (il, la, gli)
- Swedish: "kassa", "konto", "balans", å/ä/ö characters, articles (den, det, en)

Respond with ONLY a JSON object in this exact format (no explanations):
{
  "language": "en",
  "confidence": 0.95
}`;

        if (!openaiApiKey) {
          throw new Error('OpenAI API key not configured');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a language detection specialist for financial/accounting terminology. Respond only with valid JSON.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 100,
            temperature: 0.1
          }),
        });

        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        console.log('OpenAI response:', content);

        // Parse OpenAI's JSON response
        try {
          const result = JSON.parse(content);
          
          // For backwards compatibility, create detections array based on input format
          if (requestBody.accounts) {
            return {
              detections: sampleItems.map((acc: any) => ({
                accountNumber: acc.accountNumber,
                language: result.language,
                confidence: result.confidence
              })),
              overallLanguage: result.language
            };
          } else {
            // Return simple format for lineItems, texts, or text input
            return {
              language: result.language,
              confidence: result.confidence
            };
          }
        } catch (parseError) {
          console.error('JSON parse failed, attempting extraction:', parseError);
          
          const jsonMatch = content.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return requestBody.accounts ? {
              detections: sampleItems.map((acc: any) => ({
                accountNumber: acc.accountNumber,
                language: result.language,
                confidence: result.confidence
              })),
              overallLanguage: result.language
            } : result;
          }
          throw new Error('Invalid OpenAI response format');
        }
      });

      console.log(`OpenAI API success. Detected language: ${result.language || result.overallLanguage}`);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (openaiError) {
      console.error('OpenAI API failed after retries, using local fallback:', openaiError);
      
      // Use local detection as fallback
      const fallbackResult = detectLanguageLocally(sampleTexts);
      
      console.log(`Local detection fallback. Language: ${fallbackResult.language}`);
      
      // Format result based on input type
      const result = requestBody.accounts ? {
        detections: sampleItems.map((acc: any) => ({
          accountNumber: acc.accountNumber,
          language: fallbackResult.language,
          confidence: fallbackResult.confidence
        })),
        overallLanguage: fallbackResult.language,
        fallback: true,
        openaiError: openaiError.message
      } : {
        ...fallbackResult,
        fallback: true,
        openaiError: openaiError.message
      };
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Critical error in detect-language function:', error);
    
    // Last resort fallback - always default to English
    const fallbackResult = {
      language: 'en',
      confidence: 0.3,
      fallback: true,
      error: error.message
    };

    return new Response(JSON.stringify(fallbackResult), {
      status: 200, // Return 200 to avoid breaking the UI flow
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
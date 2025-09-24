// GPT-5 powered account description inference
// This helper function uses GPT-5 to infer German account descriptions from account numbers

const GERMAN_ACCOUNT_PATTERNS = {
  '1': 'Anlagevermögen',
  '10': 'Immaterielle Vermögensgegenstände',
  '11': 'Grundstücke und Gebäude',
  '12': 'Technische Anlagen und Maschinen',
  '13': 'Andere Anlagen, Betriebs- und Geschäftsausstattung',
  '14': 'Geleistete Anzahlungen',
  '2': 'Umlaufvermögen',
  '20': 'Vorräte',
  '21': 'Forderungen aus Lieferungen und Leistungen',
  '22': 'Sonstige Vermögensgegenstände',
  '23': 'Wertpapiere',
  '24': 'Kassenbestand, Bundesbankguthaben, Guthaben bei Kreditinstituten',
  '3': 'Eigenkapital',
  '30': 'Gezeichnetes Kapital',
  '31': 'Kapitalrücklage',
  '32': 'Gewinnrücklagen',
  '33': 'Gewinnvortrag/Verlustvortrag',
  '4': 'Rückstellungen und Verbindlichkeiten',
  '40': 'Rückstellungen',
  '41': 'Verbindlichkeiten gegenüber Kreditinstituten',
  '42': 'Erhaltene Anzahlungen',
  '43': 'Verbindlichkeiten aus Lieferungen und Leistungen',
  '44': 'Sonstige Verbindlichkeiten',
  '5': 'Erträge',
  '50': 'Umsatzerlöse',
  '51': 'Erhöhung des Bestands',
  '52': 'Andere aktivierte Eigenleistungen',
  '53': 'Sonstige betriebliche Erträge',
  '6': 'Betriebliche Aufwendungen',
  '60': 'Materialaufwand',
  '61': 'Personalaufwand',
  '62': 'Abschreibungen',
  '63': 'Sonstige betriebliche Aufwendungen',
  '7': 'Finanz- und außerordentliche Erträge/Aufwendungen',
  '70': 'Zinsen und ähnliche Erträge',
  '71': 'Zinsen und ähnliche Aufwendungen',
  '72': 'Außerordentliche Erträge',
  '73': 'Außerordentliche Aufwendungen',
  '8': 'Steuern',
  '80': 'Steuern vom Einkommen und Ertrag',
  '81': 'Sonstige Steuern',
  '9': 'Eröffnungs- und Abschlusskonten',
  '90': 'Eröffnungsbilanzkonto',
  '91': 'Abschlussbilanz',
  '92': 'Gewinn- und Verlustrechnung'
};

export function inferAccountDescription(accountNumber: string, currencyCode: string = 'EUR'): string | null {
  if (!accountNumber) return null;
  
  // Try exact pattern matching first
  const exactMatch = GERMAN_ACCOUNT_PATTERNS[accountNumber];
  if (exactMatch) return exactMatch;
  
  // Try prefix matching for more specific accounts
  for (let i = accountNumber.length; i > 0; i--) {
    const prefix = accountNumber.substring(0, i);
    const match = GERMAN_ACCOUNT_PATTERNS[prefix];
    if (match) {
      // Return a more specific description based on the full account number
      return generateSpecificDescription(accountNumber, match);
    }
  }
  
  return null;
}

function generateSpecificDescription(accountNumber: string, baseDescription: string): string {
  // Common German accounting suffixes and their meanings
  const suffixPatterns = [
    { pattern: /0$/, suffix: 'Allgemein' },
    { pattern: /1$/, suffix: 'Inland' },
    { pattern: /2$/, suffix: 'Ausland' },
    { pattern: /3$/, suffix: 'EU' },
    { pattern: /5$/, suffix: 'Steuerlich' },
    { pattern: /7$/, suffix: '7%' },
    { pattern: /9$/, suffix: '19%' }
  ];
  
  for (const { pattern, suffix } of suffixPatterns) {
    if (pattern.test(accountNumber)) {
      return `${baseDescription} ${suffix}`;
    }
  }
  
  return `${baseDescription} (${accountNumber})`;
}

export async function inferAccountDescriptionWithGPT5(
  accountNumber: string, 
  contextData: any[] = [],
  currencyCode: string = 'EUR'
): Promise<string | null> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    return inferAccountDescription(accountNumber, currencyCode);
  }

  try {
    const prompt = `You are a German accounting expert. Infer the German account description for account number "${accountNumber}" in the context of German accounting standards (HGB/IFRS).

Context:
- Currency: ${currencyCode}
- Account number: ${accountNumber}
- This is for a German trial balance/BWA

Provide only the German account description (Kontenbezeichnung), nothing else. Be concise and use standard German accounting terminology.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: 'You are a German accounting expert specializing in account classifications according to German GAAP (HGB) and standard German chart of accounts.' },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 100,
      }),
    });

    if (!response.ok) {
      console.warn(`GPT-5 API error: ${response.status}`);
      return inferAccountDescription(accountNumber, currencyCode);
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim();
    
    if (description && description.length > 0 && description.length < 200) {
      return description;
    }
    
    return inferAccountDescription(accountNumber, currencyCode);
  } catch (error) {
    console.warn('GPT-5 account description inference failed:', error);
    return inferAccountDescription(accountNumber, currencyCode);
  }
}
// Local language detection utility with pattern matching and linguistic analysis

export interface LanguageDetection {
  language: string;
  confidence: number;
}

// Common accounting terms by language
const accountingTerms = {
  en: ['cash', 'bank', 'asset', 'liability', 'equity', 'revenue', 'expense', 'account', 'receivable', 'payable', 'inventory', 'depreciation'],
  de: ['kasse', 'bank', 'vermögen', 'verbindlichkeit', 'eigenkapital', 'umsatz', 'ausgaben', 'konto', 'forderung', 'schulden', 'lager', 'abschreibung'],
  fr: ['caisse', 'banque', 'actif', 'passif', 'capitaux', 'revenus', 'charges', 'compte', 'créances', 'dettes', 'stock', 'amortissement'],
  es: ['caja', 'banco', 'activo', 'pasivo', 'patrimonio', 'ingresos', 'gastos', 'cuenta', 'cobrar', 'pagar', 'inventario', 'depreciación'],
  it: ['cassa', 'banca', 'attivo', 'passivo', 'patrimonio', 'ricavi', 'costi', 'conto', 'crediti', 'debiti', 'magazzino', 'ammortamento'],
  sv: ['kassa', 'bank', 'tillgång', 'skuld', 'eget', 'intäkt', 'kostnad', 'konto', 'fordran', 'skulder', 'lager', 'avskrivning'],
  nl: ['kas', 'bank', 'activa', 'passiva', 'eigen', 'opbrengst', 'kosten', 'rekening', 'debiteuren', 'crediteuren', 'voorraad', 'afschrijving']
};

// Character patterns by language
const characterPatterns = {
  de: /[äöüßÄÖÜ]/,
  fr: /[éèàçêëîïôùûüÉÈÀÇ]/,
  es: /[ñáéíóúüÑÁÉÍÓÚÜ]/,
  it: /[àèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ]/,
  sv: /[åäöÅÄÖ]/,
  nl: /[ëïöüËÏÖÜ]/
};

// Common words/particles by language
const languageMarkers = {
  de: ['der', 'die', 'das', 'und', 'für', 'von', 'zu', 'mit', 'auf', 'bei'],
  fr: ['le', 'la', 'les', 'du', 'des', 'et', 'pour', 'de', 'avec', 'sur'],
  es: ['el', 'la', 'los', 'las', 'del', 'de', 'y', 'para', 'con', 'en'],
  it: ['il', 'la', 'gli', 'le', 'del', 'della', 'e', 'per', 'di', 'con'],
  sv: ['den', 'det', 'en', 'ett', 'och', 'för', 'av', 'till', 'med', 'på'],
  nl: ['de', 'het', 'een', 'en', 'voor', 'van', 'met', 'op', 'bij', 'tot']
};

export function detectLanguageLocally(texts: string[]): LanguageDetection {
  const combinedText = texts.join(' ').toLowerCase();
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
        scores[lang] += matches.length * 3; // Higher weight for accounting terms
      }
    });
  });

  // Check character patterns
  Object.entries(characterPatterns).forEach(([lang, pattern]) => {
    const matches = combinedText.match(pattern);
    if (matches) {
      scores[lang] += matches.length * 2;
    }
  });

  // Check language markers
  Object.entries(languageMarkers).forEach(([lang, markers]) => {
    markers.forEach(marker => {
      const regex = new RegExp(`\\b${marker}\\b`, 'gi');
      const matches = combinedText.match(regex);
      if (matches) {
        scores[lang] += matches.length;
      }
    });
  });

  // Find best match
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  if (totalScore === 0) {
    return { language: 'en', confidence: 0.3 }; // Default fallback
  }

  const bestLang = Object.entries(scores).reduce((best, [lang, score]) => 
    score > best[1] ? [lang, score] : best
  )[0];

  const confidence = Math.min(0.95, scores[bestLang] / totalScore);

  return {
    language: bestLang,
    confidence: Math.max(0.1, confidence)
  };
}

// Analyze individual account descriptions for batch results
export function analyzeAccountDescriptions(accounts: Array<{ accountNumber: string; originalDescription: string }>) {
  const texts = accounts.map(acc => acc.originalDescription);
  const overallDetection = detectLanguageLocally(texts);
  
  // Individual detections (simplified - use overall for consistency)
  const detections = accounts.map(acc => ({
    accountNumber: acc.accountNumber,
    language: overallDetection.language,
    confidence: overallDetection.confidence
  }));

  return {
    detections,
    overallLanguage: overallDetection.language,
    confidence: overallDetection.confidence
  };
}
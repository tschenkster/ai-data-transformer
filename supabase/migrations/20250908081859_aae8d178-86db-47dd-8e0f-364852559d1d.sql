-- Fix translation data structure: Correct language_code_original and original_text relationships
-- Problem: English translations currently have language_code_original='de' but original_text in English
-- Solution: Set language_code_original to match the language of original_text

-- Step 1: Update English translations to have correct language_code_original
UPDATE ui_translations 
SET language_code_original = 'en'
WHERE language_code_target = 'en' 
  AND language_code_original = 'de';

-- Step 2: For consistency, we should have proper translation pairs where:
-- - German entries are the source (language_code_original = language_code_target = 'de')
-- - English entries reference German originals but are translated to English

-- Let's restructure to make this clearer by updating English entries 
-- to reference the corresponding German original text where it exists
WITH german_originals AS (
  SELECT 
    ui_key,
    original_text as german_text,
    translated_text as german_translated
  FROM ui_translations 
  WHERE language_code_target = 'de'
)
UPDATE ui_translations 
SET 
  language_code_original = 'de',
  original_text = COALESCE(go.german_text, go.german_translated, ui_translations.original_text)
FROM german_originals go
WHERE ui_translations.language_code_target = 'en' 
  AND ui_translations.ui_key = go.ui_key
  AND ui_translations.language_code_original = 'en';

-- Step 3: Add a comment to document the expected structure
COMMENT ON TABLE ui_translations IS 'UI translations table. language_code_original should match the source language of original_text. For translation pairs, original_text should be in the source language (typically German) and translated_text in the target language.';

-- Step 4: Add validation to prevent future inconsistencies
CREATE OR REPLACE FUNCTION validate_translation_language_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow same-language entries (source language entries)
  IF NEW.language_code_original = NEW.language_code_target THEN
    RETURN NEW;
  END IF;
  
  -- For different language pairs, ensure we have a corresponding source entry
  IF NOT EXISTS (
    SELECT 1 FROM ui_translations 
    WHERE ui_key = NEW.ui_key 
      AND language_code_target = NEW.language_code_original
      AND language_code_original = NEW.language_code_original
  ) THEN
    RAISE WARNING 'Translation entry for ui_key % should have a corresponding source entry in language %', NEW.ui_key, NEW.language_code_original;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate translation consistency
DROP TRIGGER IF EXISTS validate_translation_consistency ON ui_translations;
CREATE TRIGGER validate_translation_consistency
  BEFORE INSERT OR UPDATE ON ui_translations
  FOR EACH ROW
  EXECUTE FUNCTION validate_translation_language_consistency();
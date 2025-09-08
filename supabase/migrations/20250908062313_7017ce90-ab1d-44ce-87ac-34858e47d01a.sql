-- Phase 1: Clean existing NULL values in ui_translations
-- Step 1: Update NULL language_code_original values
-- Most UI keys are likely sourced from German (de) based on the system pattern
UPDATE ui_translations 
SET language_code_original = 'de'::bpchar
WHERE language_code_original IS NULL;

-- Step 2: Update NULL original_text values
-- Use translated_text as fallback when language_code_original matches language_code_target
UPDATE ui_translations 
SET original_text = translated_text
WHERE original_text IS NULL 
  AND language_code_original = language_code_target;

-- For remaining NULL original_text where languages don't match, use the UI key as fallback
UPDATE ui_translations 
SET original_text = ui_key
WHERE original_text IS NULL;

-- Phase 2: Add NOT NULL constraints to prevent future NULL values
ALTER TABLE ui_translations 
  ALTER COLUMN language_code_original SET NOT NULL,
  ALTER COLUMN original_text SET NOT NULL;

-- Phase 3: Create enhanced validation function for UI translations
CREATE OR REPLACE FUNCTION validate_ui_translation_completeness()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure language_code_original is not NULL
  IF NEW.language_code_original IS NULL THEN
    NEW.language_code_original := 'de'::bpchar;
  END IF;
  
  -- Ensure original_text is not NULL
  IF NEW.original_text IS NULL THEN
    -- Use translated_text if languages match, otherwise use ui_key
    IF NEW.language_code_original = NEW.language_code_target THEN
      NEW.original_text := COALESCE(NEW.translated_text, NEW.ui_key);
    ELSE
      NEW.original_text := NEW.ui_key;
    END IF;
  END IF;
  
  -- Ensure translated_text defaults exist
  IF NEW.translated_text IS NULL THEN
    -- Use original_text as fallback if languages match
    IF NEW.language_code_original = NEW.language_code_target THEN
      NEW.translated_text := NEW.original_text;
    ELSE
      -- Use ui_key as final fallback
      NEW.translated_text := NEW.ui_key;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to validate UI translations before insert/update
DROP TRIGGER IF EXISTS validate_ui_translations_trigger ON ui_translations;
CREATE TRIGGER validate_ui_translations_trigger
  BEFORE INSERT OR UPDATE ON ui_translations
  FOR EACH ROW
  EXECUTE FUNCTION validate_ui_translation_completeness();

-- Phase 4: Create monitoring function for translation data integrity
CREATE OR REPLACE FUNCTION check_ui_translation_integrity()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  total_records integer;
  null_original_lang integer;
  null_original_text integer;
  null_translated_text integer;
BEGIN
  -- Count NULL values
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE language_code_original IS NULL),
    COUNT(*) FILTER (WHERE original_text IS NULL),
    COUNT(*) FILTER (WHERE translated_text IS NULL)
  INTO total_records, null_original_lang, null_original_text, null_translated_text
  FROM ui_translations;
  
  result := jsonb_build_object(
    'validation_timestamp', now(),
    'total_records', total_records,
    'null_language_code_original', null_original_lang,
    'null_original_text', null_original_text,
    'null_translated_text', null_translated_text,
    'data_integrity_score', 
      CASE WHEN total_records > 0 THEN
        ROUND(((total_records - null_original_lang - null_original_text - null_translated_text) * 100.0) / (total_records * 3), 2)
      ELSE 100
      END,
    'status', 
      CASE WHEN (null_original_lang + null_original_text + null_translated_text) = 0 THEN 
        'HEALTHY' 
      ELSE 
        'NEEDS_ATTENTION' 
      END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
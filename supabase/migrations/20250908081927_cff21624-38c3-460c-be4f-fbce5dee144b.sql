-- Fix security issue: Set search_path for the validation function
CREATE OR REPLACE FUNCTION validate_translation_language_consistency()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;
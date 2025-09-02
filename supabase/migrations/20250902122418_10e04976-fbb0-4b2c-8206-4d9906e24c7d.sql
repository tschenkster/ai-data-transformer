-- Step 1: Drop all existing source check constraints to avoid conflicts
ALTER TABLE report_line_items_translations DROP CONSTRAINT IF EXISTS report_line_items_translations_source_check;
ALTER TABLE report_structures_translations DROP CONSTRAINT IF EXISTS report_structures_translations_source_check;
ALTER TABLE ui_translations DROP CONSTRAINT IF EXISTS ui_translations_source_check;

-- Step 2: Update all invalid source values
UPDATE report_structures_translations 
SET source = 'ai_generated' 
WHERE source = 'ai';

UPDATE report_line_items_translations 
SET source = 'ai_generated' 
WHERE source = 'ai';

UPDATE ui_translations 
SET source = 'ai_generated' 
WHERE source = 'ai';

-- Step 3: Add the constraints back with correct values
ALTER TABLE report_line_items_translations 
ADD CONSTRAINT report_line_items_translations_source_check 
CHECK (source IN ('manual', 'ai_generated', 'import', 'system'));

ALTER TABLE report_structures_translations 
ADD CONSTRAINT report_structures_translations_source_check 
CHECK (source IN ('manual', 'ai_generated', 'import', 'system'));

ALTER TABLE ui_translations 
ADD CONSTRAINT ui_translations_source_check 
CHECK (source IN ('manual', 'ai_generated', 'import', 'system'));

-- Step 4: Create the missing RPC function for saving translations
CREATE OR REPLACE FUNCTION public.create_translation_entries(
  p_entity_type text,
  p_entity_uuid uuid,
  p_translations jsonb,
  p_source_language text DEFAULT 'de'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  translation_record jsonb;
  field_key text;
  text_value text;
  lang_code text;
BEGIN
  -- Validate entity type
  IF p_entity_type NOT IN ('report_structure', 'report_line_item') THEN
    RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
  END IF;

  -- Process each translation record
  FOR translation_record IN SELECT * FROM jsonb_array_elements(p_translations)
  LOOP
    field_key := translation_record->>'field_key';
    text_value := translation_record->>'text_value';
    lang_code := translation_record->>'lang_code';
    
    IF field_key IS NULL OR text_value IS NULL OR lang_code IS NULL THEN
      CONTINUE; -- Skip invalid entries
    END IF;
    
    -- Insert into appropriate translations table
    IF p_entity_type = 'report_structure' THEN
      INSERT INTO report_structures_translations (
        report_structure_uuid,
        language_code_target,
        source_field_name,
        translated_text,
        language_code_original,
        original_text,
        source
      ) VALUES (
        p_entity_uuid,
        lang_code::char(2),
        field_key,
        text_value,
        p_source_language::char(2),
        text_value,
        'ai_generated'
      )
      ON CONFLICT (report_structure_uuid, source_field_name, language_code_target)
      DO UPDATE SET
        translated_text = EXCLUDED.translated_text,
        updated_at = now(),
        source = 'ai_generated';
        
    ELSIF p_entity_type = 'report_line_item' THEN
      INSERT INTO report_line_items_translations (
        report_line_item_uuid,
        language_code_target,
        source_field_name,
        translated_text,
        language_code_original,
        original_text,
        source
      ) VALUES (
        p_entity_uuid,
        lang_code::char(2),
        field_key,
        text_value,
        p_source_language::char(2),
        text_value,
        'ai_generated'
      )
      ON CONFLICT (report_line_item_uuid, source_field_name, language_code_target)
      DO UPDATE SET
        translated_text = EXCLUDED.translated_text,
        updated_at = now(),
        source = 'ai_generated';
    END IF;
  END LOOP;
END;
$$;
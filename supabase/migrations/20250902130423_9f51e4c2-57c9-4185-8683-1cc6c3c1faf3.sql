-- Fix the create_translation_entries function to properly preserve original text
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
  original_text_value text;
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
    original_text_value := NULL;
    
    IF field_key IS NULL OR text_value IS NULL OR lang_code IS NULL THEN
      CONTINUE; -- Skip invalid entries
    END IF;
    
    -- Get the original text from the source entity
    IF p_entity_type = 'report_structure' THEN
      -- For report structures, get the name
      SELECT report_structure_name INTO original_text_value
      FROM report_structures 
      WHERE report_structure_uuid = p_entity_uuid;
      
    ELSIF p_entity_type = 'report_line_item' THEN
      -- For report line items, extract the field from the description based on field_key
      IF field_key LIKE '%_description' THEN
        SELECT report_line_item_description INTO original_text_value
        FROM report_line_items 
        WHERE report_line_item_uuid = p_entity_uuid;
      END IF;
    END IF;
    
    -- Use text_value as fallback if we can't find the original text
    IF original_text_value IS NULL OR original_text_value = '' THEN
      original_text_value := text_value;
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
        original_text_value,
        'ai_generated'
      )
      ON CONFLICT (report_structure_uuid, source_field_name, language_code_target)
      DO UPDATE SET
        translated_text = EXCLUDED.translated_text,
        original_text = EXCLUDED.original_text,
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
        original_text_value,
        'ai_generated'
      )
      ON CONFLICT (report_line_item_uuid, source_field_name, language_code_target)
      DO UPDATE SET
        translated_text = EXCLUDED.translated_text,
        original_text = EXCLUDED.original_text,
        updated_at = now(),
        source = 'ai_generated';
    END IF;
  END LOOP;
END;
$$;
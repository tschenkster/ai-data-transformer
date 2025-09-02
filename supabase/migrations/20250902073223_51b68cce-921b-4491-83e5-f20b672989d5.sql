-- Phase 1: Fix immediate data issue
-- Update the current structure's source_language_code
UPDATE report_structures 
SET source_language_code = 'de' 
WHERE report_structure_uuid = 'a4d2f1fc-9d58-4ee3-b2c4-b453b3612f3a';

-- Add RPC function to create translation entries (if not exists)
CREATE OR REPLACE FUNCTION public.create_translation_entries(
  p_entity_type text,
  p_entity_uuid uuid,
  p_translations jsonb,
  p_source_language text DEFAULT 'de'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  translation_record jsonb;
  field_key text;
  translated_text text;
  target_lang text;
  line_item_exists boolean;
  structure_exists boolean;
BEGIN
  -- Validate entity exists
  IF p_entity_type = 'report_line_item' THEN
    SELECT EXISTS(SELECT 1 FROM report_line_items WHERE report_line_item_uuid = p_entity_uuid) INTO line_item_exists;
    IF NOT line_item_exists THEN
      RAISE EXCEPTION 'Report line item with UUID % does not exist', p_entity_uuid;
    END IF;
  ELSIF p_entity_type = 'report_structure' THEN
    SELECT EXISTS(SELECT 1 FROM report_structures WHERE report_structure_uuid = p_entity_uuid) INTO structure_exists;
    IF NOT structure_exists THEN
      RAISE EXCEPTION 'Report structure with UUID % does not exist', p_entity_uuid;
    END IF;
  END IF;

  -- Process each translation in the array
  FOR translation_record IN SELECT * FROM jsonb_array_elements(p_translations)
  LOOP
    field_key := translation_record->>'field_key';
    translated_text := translation_record->>'text_value';
    target_lang := translation_record->>'lang_code';
    
    -- Skip empty translations
    IF translated_text IS NULL OR trim(translated_text) = '' THEN
      CONTINUE;
    END IF;
    
    -- Insert translation based on entity type
    IF p_entity_type = 'report_line_item' THEN
      -- Extract the actual field name from field_key (remove the item key prefix)
      IF field_key LIKE '%_description' THEN
        field_key := 'report_line_item_description';
      ELSIF field_key LIKE '%_hierarchy_path' THEN
        field_key := 'hierarchy_path';
      END IF;
      
      INSERT INTO report_line_items_translations (
        report_line_item_uuid,
        source_field_name,
        language_code_target,
        language_code_original,
        translated_text,
        original_text,
        source
      ) VALUES (
        p_entity_uuid,
        field_key,
        target_lang::bpchar,
        p_source_language::bpchar,
        translated_text,
        (SELECT CASE 
          WHEN field_key = 'report_line_item_description' THEN report_line_item_description
          WHEN field_key = 'hierarchy_path' THEN hierarchy_path
          ELSE ''
        END FROM report_line_items WHERE report_line_item_uuid = p_entity_uuid),
        'ai_generated'
      )
      ON CONFLICT (report_line_item_uuid, source_field_name, language_code_target) 
      DO UPDATE SET 
        translated_text = EXCLUDED.translated_text,
        updated_at = now(),
        updated_by = auth.uid();
        
    ELSIF p_entity_type = 'report_structure' THEN
      INSERT INTO report_structures_translations (
        report_structure_uuid,
        source_field_name,
        language_code_target,
        language_code_original,
        translated_text,
        original_text,
        source
      ) VALUES (
        p_entity_uuid,
        field_key,
        target_lang::bpchar,
        p_source_language::bpchar,
        translated_text,
        (SELECT report_structure_name FROM report_structures WHERE report_structure_uuid = p_entity_uuid),
        'ai_generated'
      )
      ON CONFLICT (report_structure_uuid, source_field_name, language_code_target) 
      DO UPDATE SET 
        translated_text = EXCLUDED.translated_text,
        updated_at = now(),
        updated_by = auth.uid();
    END IF;
  END LOOP;
END;
$$;
-- Phase 2: Add improved RPC function and validation triggers
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
AS $function$
DECLARE
  translation jsonb;
  field_key text;
  translated_text text;
  target_lang text;
  original_text text;
  source_lang text;
  current_user_id uuid;
BEGIN
  -- Validate inputs
  IF p_entity_type IS NULL OR p_entity_uuid IS NULL OR p_translations IS NULL THEN
    RAISE EXCEPTION 'Entity type, UUID, and translations cannot be NULL';
  END IF;

  -- Get current user for audit fields
  current_user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000001'::uuid);
  source_lang := COALESCE(p_source_language, 'de')::bpchar;

  -- Loop through translations array
  FOR translation IN SELECT * FROM jsonb_array_elements(p_translations)
  LOOP
    field_key := translation->>'field_key';
    translated_text := translation->>'text_value';
    target_lang := (translation->>'lang_code')::bpchar;

    -- Skip if required fields are missing
    IF field_key IS NULL OR translated_text IS NULL OR target_lang IS NULL THEN
      RAISE WARNING 'Skipping incomplete translation: field_key=%, text_value=%, lang_code=%', field_key, translated_text, target_lang;
      CONTINUE;
    END IF;

    -- Get original text from the source entity
    original_text := NULL;
    IF p_entity_type = 'report_structure' THEN
      SELECT CASE 
        WHEN field_key IN ('report_structure_name', 'structure_name', 'name') THEN rs.report_structure_name
        WHEN field_key = 'description' THEN rs.description
        ELSE NULL
      END INTO original_text
      FROM report_structures rs
      WHERE rs.report_structure_uuid = p_entity_uuid;
      
    ELSIF p_entity_type = 'report_line_item' THEN
      SELECT CASE 
        WHEN field_key IN ('report_line_item_description', 'description') THEN rli.report_line_item_description
        WHEN field_key = 'level_1_line_item_description' THEN rli.level_1_line_item_description
        WHEN field_key = 'level_2_line_item_description' THEN rli.level_2_line_item_description
        WHEN field_key = 'level_3_line_item_description' THEN rli.level_3_line_item_description
        WHEN field_key = 'level_4_line_item_description' THEN rli.level_4_line_item_description
        WHEN field_key = 'level_5_line_item_description' THEN rli.level_5_line_item_description
        WHEN field_key = 'level_6_line_item_description' THEN rli.level_6_line_item_description
        WHEN field_key = 'level_7_line_item_description' THEN rli.level_7_line_item_description
        WHEN field_key = 'description_of_leaf' THEN rli.description_of_leaf
        ELSE NULL
      END INTO original_text
      FROM report_line_items rli
      WHERE rli.report_line_item_uuid = p_entity_uuid;
    END IF;

    -- Use translated text as fallback if no original found
    original_text := COALESCE(original_text, translated_text);

    -- Insert or update translation with proper field names
    IF p_entity_type = 'report_structure' THEN
      INSERT INTO report_structures_translations (
        report_structure_uuid,
        language_code_target,
        source_field_name,
        translated_text,
        language_code_original,
        original_text,
        source,
        created_by,
        updated_by
      ) VALUES (
        p_entity_uuid,
        target_lang,
        CASE 
          WHEN field_key IN ('structure_name', 'name') THEN 'report_structure_name'
          ELSE field_key
        END,
        translated_text,
        source_lang,
        original_text,
        'ai_generated',
        current_user_id,
        current_user_id
      )
      ON CONFLICT (report_structure_uuid, language_code_target, source_field_name)
      DO UPDATE SET
        translated_text = EXCLUDED.translated_text,
        language_code_original = EXCLUDED.language_code_original,
        original_text = EXCLUDED.original_text,
        updated_by = current_user_id,
        updated_at = now();

    ELSIF p_entity_type = 'report_line_item' THEN
      INSERT INTO report_line_items_translations (
        report_line_item_uuid,
        language_code_target,
        source_field_name,
        translated_text,
        language_code_original,
        original_text,
        source,
        created_by,
        updated_by
      ) VALUES (
        p_entity_uuid,
        target_lang,
        CASE 
          WHEN field_key = 'description' THEN 'report_line_item_description'
          ELSE field_key
        END,
        translated_text,
        source_lang,
        original_text,
        'ai_generated',
        current_user_id,
        current_user_id
      )
      ON CONFLICT (report_line_item_uuid, language_code_target, source_field_name)
      DO UPDATE SET
        translated_text = EXCLUDED.translated_text,
        language_code_original = EXCLUDED.language_code_original,
        original_text = EXCLUDED.original_text,
        updated_by = current_user_id,
        updated_at = now();
    END IF;
  END LOOP;
END;
$function$;

-- Create validation triggers to prevent future NULL insertions
CREATE OR REPLACE FUNCTION prevent_null_translation_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.language_code_original IS NULL THEN
    RAISE EXCEPTION 'language_code_original cannot be NULL';
  END IF;
  
  IF NEW.original_text IS NULL THEN
    RAISE EXCEPTION 'original_text cannot be NULL';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Apply validation triggers
DROP TRIGGER IF EXISTS prevent_null_fields_report_structures_translations ON report_structures_translations;
CREATE TRIGGER prevent_null_fields_report_structures_translations
  BEFORE INSERT OR UPDATE ON report_structures_translations
  FOR EACH ROW EXECUTE FUNCTION prevent_null_translation_fields();

DROP TRIGGER IF EXISTS prevent_null_fields_report_line_items_translations ON report_line_items_translations;
CREATE TRIGGER prevent_null_fields_report_line_items_translations
  BEFORE INSERT OR UPDATE ON report_line_items_translations
  FOR EACH ROW EXECUTE FUNCTION prevent_null_translation_fields();

-- Create monitoring function  
CREATE OR REPLACE FUNCTION check_translation_data_integrity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  struct_nulls integer;
  line_nulls integer;
BEGIN
  SELECT COUNT(*) INTO struct_nulls
  FROM report_structures_translations
  WHERE language_code_original IS NULL OR original_text IS NULL;

  SELECT COUNT(*) INTO line_nulls  
  FROM report_line_items_translations
  WHERE language_code_original IS NULL OR original_text IS NULL;

  result := jsonb_build_object(
    'timestamp', now(),
    'report_structures_null_count', struct_nulls,
    'report_line_items_null_count', line_nulls,
    'total_null_count', struct_nulls + line_nulls,
    'is_clean', (struct_nulls + line_nulls) = 0
  );

  RETURN result;
END;
$function$;
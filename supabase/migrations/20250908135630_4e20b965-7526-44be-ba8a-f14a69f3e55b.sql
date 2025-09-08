-- Fix the get_translation_with_fallback function
-- The issue is that it's not properly handling the fallback to original text
DROP FUNCTION IF EXISTS public.get_translation_with_fallback;

CREATE OR REPLACE FUNCTION public.get_translation_with_fallback(
  p_entity_type text,
  p_entity_uuid uuid,
  p_source_field_name text,
  p_language_code text DEFAULT 'de'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_translated_text text;
  v_original_text text;
  v_table_name text;
  v_uuid_field text;
  v_source_table text;
  v_source_field text;
BEGIN
  -- Determine the correct table and field names based on entity type
  IF p_entity_type = 'report_structure' THEN
    v_table_name := 'report_structures_translations';
    v_uuid_field := 'report_structure_uuid';
    v_source_table := 'report_structures';
    v_source_field := p_source_field_name;
  ELSIF p_entity_type = 'report_line_item' THEN
    v_table_name := 'report_line_items_translations';
    v_uuid_field := 'report_line_item_uuid';
    v_source_table := 'report_line_items';
    v_source_field := p_source_field_name;
  ELSE
    RETURN '[invalid_entity_type]';
  END IF;

  -- First get original text from source table (this will be our ultimate fallback)
  EXECUTE format('
    SELECT %I 
    FROM %I 
    WHERE %I = $1
    LIMIT 1
  ', v_source_field, v_source_table, 
      CASE WHEN p_entity_type = 'report_structure' THEN 'report_structure_uuid' 
           ELSE 'report_line_item_uuid' END)
  INTO v_original_text
  USING p_entity_uuid;

  -- Try to get the translated text for the requested language
  EXECUTE format('
    SELECT translated_text 
    FROM %I 
    WHERE %I = $1 
      AND language_code_target = $2 
      AND source_field_name = $3
      AND translated_text IS NOT NULL
      AND translated_text != ''''
    LIMIT 1
  ', v_table_name, v_uuid_field)
  INTO v_translated_text
  USING p_entity_uuid, p_language_code, p_source_field_name;

  -- If translation found, return it
  IF v_translated_text IS NOT NULL AND v_translated_text != '' THEN
    RETURN v_translated_text;
  END IF;

  -- Fallback 1: Try English if not already requested
  IF p_language_code != 'en' THEN
    EXECUTE format('
      SELECT translated_text 
      FROM %I 
      WHERE %I = $1 
        AND language_code_target = $2 
        AND source_field_name = $3
        AND translated_text IS NOT NULL
        AND translated_text != ''''
      LIMIT 1
    ', v_table_name, v_uuid_field)
    INTO v_translated_text
    USING p_entity_uuid, 'en', p_source_field_name;

    IF v_translated_text IS NOT NULL AND v_translated_text != '' THEN
      RETURN v_translated_text;
    END IF;
  END IF;

  -- Fallback 2: Try German if not already requested
  IF p_language_code != 'de' THEN
    EXECUTE format('
      SELECT translated_text 
      FROM %I 
      WHERE %I = $1 
        AND language_code_target = $2 
        AND source_field_name = $3
        AND translated_text IS NOT NULL
        AND translated_text != ''''
      LIMIT 1
    ', v_table_name, v_uuid_field)
    INTO v_translated_text
    USING p_entity_uuid, 'de', p_source_field_name;

    IF v_translated_text IS NOT NULL AND v_translated_text != '' THEN
      RETURN v_translated_text;
    END IF;
  END IF;

  -- Final fallback: return original text from source table
  IF v_original_text IS NOT NULL AND v_original_text != '' THEN
    RETURN v_original_text;
  END IF;

  -- Ultimate fallback: return a placeholder
  RETURN '[missing_translation:' || p_source_field_name || ']';
END;
$$;
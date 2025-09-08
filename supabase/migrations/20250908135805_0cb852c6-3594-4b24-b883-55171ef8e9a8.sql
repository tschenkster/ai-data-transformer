-- Fix the get_translation_with_fallback function - the issue is in the fallback logic
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
BEGIN
  -- Get original text from source table first
  IF p_entity_type = 'report_structure' THEN
    SELECT report_structure_name INTO v_original_text
    FROM report_structures 
    WHERE report_structure_uuid = p_entity_uuid;
  ELSIF p_entity_type = 'report_line_item' THEN
    EXECUTE format('SELECT %I FROM report_line_items WHERE report_line_item_uuid = $1', p_source_field_name)
    INTO v_original_text
    USING p_entity_uuid;
  ELSE
    RETURN '[invalid_entity_type]';
  END IF;

  -- Try to get translated text for the requested language
  IF p_entity_type = 'report_structure' THEN
    SELECT translated_text INTO v_translated_text
    FROM report_structures_translations
    WHERE report_structure_uuid = p_entity_uuid
      AND language_code_target = p_language_code
      AND source_field_name = p_source_field_name
      AND translated_text IS NOT NULL
      AND translated_text != '';
  ELSIF p_entity_type = 'report_line_item' THEN
    SELECT translated_text INTO v_translated_text
    FROM report_line_items_translations
    WHERE report_line_item_uuid = p_entity_uuid
      AND language_code_target = p_language_code
      AND source_field_name = p_source_field_name
      AND translated_text IS NOT NULL
      AND translated_text != '';
  END IF;

  -- If translation found, return it
  IF v_translated_text IS NOT NULL AND v_translated_text != '' THEN
    RETURN v_translated_text;
  END IF;

  -- Fallback 1: Try English if not already requested
  IF p_language_code != 'en' THEN
    IF p_entity_type = 'report_structure' THEN
      SELECT translated_text INTO v_translated_text
      FROM report_structures_translations
      WHERE report_structure_uuid = p_entity_uuid
        AND language_code_target = 'en'
        AND source_field_name = p_source_field_name
        AND translated_text IS NOT NULL
        AND translated_text != '';
    ELSIF p_entity_type = 'report_line_item' THEN
      SELECT translated_text INTO v_translated_text
      FROM report_line_items_translations
      WHERE report_line_item_uuid = p_entity_uuid
        AND language_code_target = 'en'
        AND source_field_name = p_source_field_name
        AND translated_text IS NOT NULL
        AND translated_text != '';
    END IF;

    IF v_translated_text IS NOT NULL AND v_translated_text != '' THEN
      RETURN v_translated_text;
    END IF;
  END IF;

  -- Fallback 2: Try German if not already requested
  IF p_language_code != 'de' THEN
    IF p_entity_type = 'report_structure' THEN
      SELECT translated_text INTO v_translated_text
      FROM report_structures_translations
      WHERE report_structure_uuid = p_entity_uuid
        AND language_code_target = 'de'
        AND source_field_name = p_source_field_name
        AND translated_text IS NOT NULL
        AND translated_text != '';
    ELSIF p_entity_type = 'report_line_item' THEN
      SELECT translated_text INTO v_translated_text
      FROM report_line_items_translations
      WHERE report_line_item_uuid = p_entity_uuid
        AND language_code_target = 'de'
        AND source_field_name = p_source_field_name
        AND translated_text IS NOT NULL
        AND translated_text != '';
    END IF;

    IF v_translated_text IS NOT NULL AND v_translated_text != '' THEN
      RETURN v_translated_text;
    END IF;
  END IF;

  -- Final fallback: return original text from source table
  RETURN COALESCE(v_original_text, '[missing_translation:' || p_source_field_name || ']');
END;
$$;
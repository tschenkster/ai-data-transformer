-- Fix function security and parameter naming
-- Drop existing function first, then recreate with proper parameters

DROP FUNCTION IF EXISTS public.get_translation_with_fallback(text, uuid, text, text);

-- Recreate function with correct parameter names and security settings
CREATE OR REPLACE FUNCTION public.get_translation_with_fallback(
  p_entity_type text, 
  p_entity_uuid uuid, 
  p_source_field_name text, 
  p_language_code text DEFAULT 'de'::text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_translated_text TEXT;
  v_default_language TEXT := 'de';
  v_source_language TEXT;
BEGIN
  -- Handle 'orig' language code - resolve to source language
  IF p_language_code = 'orig' THEN
    IF p_entity_type = 'report_structure' THEN
      SELECT rs.source_language_code INTO v_source_language
      FROM report_structures rs
      WHERE rs.report_structure_uuid = p_entity_uuid;
    ELSIF p_entity_type = 'report_line_item' THEN
      SELECT rli.source_language_code INTO v_source_language
      FROM report_line_items rli
      WHERE rli.report_line_item_uuid = p_entity_uuid;
    END IF;
    
    p_language_code := COALESCE(v_source_language, v_default_language);
  END IF;

  -- Try to get translation in requested language
  IF p_entity_type = 'report_structure' THEN
    SELECT rst.translated_text INTO v_translated_text
    FROM report_structures_translations rst
    WHERE rst.report_structure_uuid = p_entity_uuid
      AND rst.language_code_target = p_language_code
      AND rst.source_field_name = p_source_field_name;
  ELSIF p_entity_type = 'report_line_item' THEN
    SELECT rlit.translated_text INTO v_translated_text
    FROM report_line_items_translations rlit
    WHERE rlit.report_line_item_uuid = p_entity_uuid
      AND rlit.language_code_target = p_language_code
      AND rlit.source_field_name = p_source_field_name;
  ELSIF p_entity_type = 'ui' THEN
    SELECT uit.translated_text INTO v_translated_text
    FROM ui_translations uit
    WHERE uit.ui_key = p_entity_uuid::TEXT
      AND uit.language_code_target = p_language_code
      AND uit.source_field_name = p_source_field_name;
  END IF;

  -- Fallback to default language if not found and not already default
  IF v_translated_text IS NULL AND p_language_code != v_default_language THEN
    IF p_entity_type = 'report_structure' THEN
      SELECT rst.translated_text INTO v_translated_text
      FROM report_structures_translations rst
      WHERE rst.report_structure_uuid = p_entity_uuid
        AND rst.language_code_target = v_default_language
        AND rst.source_field_name = p_source_field_name;
    ELSIF p_entity_type = 'report_line_item' THEN
      SELECT rlit.translated_text INTO v_translated_text
      FROM report_line_items_translations rlit
      WHERE rlit.report_line_item_uuid = p_entity_uuid
        AND rlit.language_code_target = v_default_language
        AND rlit.source_field_name = p_source_field_name;
    ELSIF p_entity_type = 'ui' THEN
      SELECT uit.translated_text INTO v_translated_text
      FROM ui_translations uit
      Where uit.ui_key = p_entity_uuid::TEXT
        AND uit.language_code_target = v_default_language
        AND uit.source_field_name = p_source_field_name;
    END IF;
  END IF;

  -- Return translation or placeholder
  RETURN COALESCE(v_translated_text, '[missing:' || p_source_field_name || ']');
END;
$function$;
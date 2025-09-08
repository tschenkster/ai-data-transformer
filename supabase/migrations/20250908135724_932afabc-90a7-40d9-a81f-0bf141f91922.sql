-- Debug version of the function to see what's happening
CREATE OR REPLACE FUNCTION public.debug_translation_fallback(
  p_entity_type text,
  p_entity_uuid uuid,
  p_source_field_name text,
  p_language_code text DEFAULT 'de'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_translated_text text;
  v_original_text text;
  v_result jsonb;
BEGIN
  -- Get original text first
  SELECT report_line_item_description INTO v_original_text
  FROM report_line_items 
  WHERE report_line_item_uuid = p_entity_uuid;

  -- Try to get translated text for requested language
  SELECT translated_text INTO v_translated_text
  FROM report_line_items_translations
  WHERE report_line_item_uuid = p_entity_uuid
    AND language_code_target = p_language_code
    AND source_field_name = p_source_field_name
    AND translated_text IS NOT NULL
    AND translated_text != '';

  v_result := jsonb_build_object(
    'requested_language', p_language_code,
    'original_text', v_original_text,
    'found_translation', v_translated_text,
    'would_return', COALESCE(v_translated_text, v_original_text)
  );

  RETURN v_result;
END;
$$;
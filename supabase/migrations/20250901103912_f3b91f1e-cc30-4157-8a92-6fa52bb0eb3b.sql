-- Create database functions for Historic Translation Fixer

-- Function to assess translation data completeness
CREATE OR REPLACE FUNCTION public.assess_translation_data_completeness()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_ui_stats record;
  v_struct_stats record;
  v_line_stats record;
  v_result jsonb;
BEGIN
  -- Get stats for ui_translations
  SELECT 
    COUNT(*)::int as total,
    COUNT(*) FILTER (WHERE language_code_original IS NULL)::int as missing_lang,
    COUNT(*) FILTER (WHERE original_text IS NULL)::int as missing_text
  INTO v_ui_stats
  FROM ui_translations;
  
  -- Get stats for report_structures_translations  
  SELECT 
    COUNT(*)::int as total,
    COUNT(*) FILTER (WHERE language_code_original IS NULL)::int as missing_lang,
    COUNT(*) FILTER (WHERE original_text IS NULL)::int as missing_text
  INTO v_struct_stats
  FROM report_structures_translations;
  
  -- Get stats for report_line_items_translations
  SELECT 
    COUNT(*)::int as total,
    COUNT(*) FILTER (WHERE language_code_original IS NULL)::int as missing_lang,
    COUNT(*) FILTER (WHERE original_text IS NULL)::int as missing_text
  INTO v_line_stats
  FROM report_line_items_translations;
  
  -- Build result JSON
  v_result := jsonb_build_object(
    'tables', jsonb_build_object(
      'ui_translations', jsonb_build_object(
        'total_records', v_ui_stats.total,
        'missing_original_lang', v_ui_stats.missing_lang,
        'missing_original_text', v_ui_stats.missing_text,
        'completeness_percentage', 
        CASE WHEN v_ui_stats.total > 0 
          THEN ROUND(((v_ui_stats.total - GREATEST(v_ui_stats.missing_lang, v_ui_stats.missing_text))::decimal / v_ui_stats.total) * 100, 2)
          ELSE 100.0 
        END
      ),
      'report_structures_translations', jsonb_build_object(
        'total_records', v_struct_stats.total,
        'missing_original_lang', v_struct_stats.missing_lang,
        'missing_original_text', v_struct_stats.missing_text,
        'completeness_percentage', 
        CASE WHEN v_struct_stats.total > 0 
          THEN ROUND(((v_struct_stats.total - GREATEST(v_struct_stats.missing_lang, v_struct_stats.missing_text))::decimal / v_struct_stats.total) * 100, 2)
          ELSE 100.0 
        END
      ),
      'report_line_items_translations', jsonb_build_object(
        'total_records', v_line_stats.total,
        'missing_original_lang', v_line_stats.missing_lang,
        'missing_original_text', v_line_stats.missing_text,
        'completeness_percentage', 
        CASE WHEN v_line_stats.total > 0 
          THEN ROUND(((v_line_stats.total - GREATEST(v_line_stats.missing_lang, v_line_stats.missing_text))::decimal / v_line_stats.total) * 100, 2)
          ELSE 100.0 
        END
      )
    ),
    'summary', jsonb_build_object(
      'total_records', v_ui_stats.total + v_struct_stats.total + v_line_stats.total,
      'total_missing', GREATEST(v_ui_stats.missing_lang, v_ui_stats.missing_text) + 
                      GREATEST(v_struct_stats.missing_lang, v_struct_stats.missing_text) +
                      GREATEST(v_line_stats.missing_lang, v_line_stats.missing_text)
    )
  );
  
  RETURN v_result;
END;
$function$;

-- Function to migrate UI translations NULL values
CREATE OR REPLACE FUNCTION public.migrate_ui_translations_null_values()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_updated_count integer := 0;
  v_result jsonb;
BEGIN
  -- Update records where language_code_original is NULL
  -- For English translations, set original language to 'en'
  -- For German translations, set original language to 'de'
  UPDATE ui_translations 
  SET 
    language_code_original = CASE 
      WHEN language_code_target = 'en' THEN 'en'::char(2)
      ELSE 'de'::char(2) 
    END,
    original_text = CASE 
      WHEN original_text IS NULL THEN 
        CASE 
          WHEN language_code_target = 'en' THEN translated_text
          ELSE translated_text 
        END
      ELSE original_text
    END,
    updated_at = now(),
    updated_by = auth.uid()
  WHERE language_code_original IS NULL OR original_text IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  v_result := jsonb_build_object(
    'success', true,
    'updated_records', v_updated_count,
    'table', 'ui_translations',
    'timestamp', now()
  );
  
  RETURN v_result;
END;
$function$;

-- Function to migrate report structures translations NULL values
CREATE OR REPLACE FUNCTION public.migrate_report_structures_translations_null_values()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_updated_count integer := 0;
  v_result jsonb;
BEGIN
  -- Update records where language_code_original is NULL
  UPDATE report_structures_translations 
  SET 
    language_code_original = 'de'::char(2), -- Default to German as source
    original_text = CASE 
      WHEN original_text IS NULL THEN translated_text
      ELSE original_text
    END,
    updated_at = now(),
    updated_by = auth.uid()
  WHERE language_code_original IS NULL OR original_text IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  v_result := jsonb_build_object(
    'success', true,
    'updated_records', v_updated_count,
    'table', 'report_structures_translations',
    'timestamp', now()
  );
  
  RETURN v_result;
END;
$function$;

-- Function to migrate report line items translations NULL values
CREATE OR REPLACE FUNCTION public.migrate_report_line_items_translations_null_values()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_updated_count integer := 0;
  v_result jsonb;
BEGIN
  -- Update records where language_code_original is NULL
  UPDATE report_line_items_translations 
  SET 
    language_code_original = 'de'::char(2), -- Default to German as source
    original_text = CASE 
      WHEN original_text IS NULL THEN translated_text
      ELSE original_text
    END,
    updated_at = now(),
    updated_by = auth.uid()
  WHERE language_code_original IS NULL OR original_text IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  v_result := jsonb_build_object(
    'success', true,
    'updated_records', v_updated_count,
    'table', 'report_line_items_translations',
    'timestamp', now()
  );
  
  RETURN v_result;
END;
$function$;

-- Function to validate translation data integrity
CREATE OR REPLACE FUNCTION public.validate_translation_data_integrity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_ui_null_count integer;
  v_struct_null_count integer;
  v_line_null_count integer;
  v_invalid_lang_count integer;
  v_result jsonb;
BEGIN
  -- Count NULL values in ui_translations
  SELECT COUNT(*) INTO v_ui_null_count
  FROM ui_translations 
  WHERE language_code_original IS NULL OR original_text IS NULL;
  
  -- Count NULL values in report_structures_translations
  SELECT COUNT(*) INTO v_struct_null_count
  FROM report_structures_translations 
  WHERE language_code_original IS NULL OR original_text IS NULL;
  
  -- Count NULL values in report_line_items_translations
  SELECT COUNT(*) INTO v_line_null_count
  FROM report_line_items_translations 
  WHERE language_code_original IS NULL OR original_text IS NULL;
  
  -- Count invalid language codes (not 2 characters)
  SELECT COUNT(*) INTO v_invalid_lang_count
  FROM (
    SELECT language_code_original FROM ui_translations 
    WHERE language_code_original IS NOT NULL AND length(language_code_original) != 2
    UNION ALL
    SELECT language_code_original FROM report_structures_translations 
    WHERE language_code_original IS NOT NULL AND length(language_code_original) != 2
    UNION ALL
    SELECT language_code_original FROM report_line_items_translations 
    WHERE language_code_original IS NOT NULL AND length(language_code_original) != 2
  ) t;
  
  v_result := jsonb_build_object(
    'validation_results', jsonb_build_object(
      'no_null_original_lang', jsonb_build_object(
        'status', CASE WHEN v_ui_null_count + v_struct_null_count + v_line_null_count = 0 THEN 'pass' ELSE 'fail' END,
        'affected_records', v_ui_null_count + v_struct_null_count + v_line_null_count,
        'details', 'Found ' || (v_ui_null_count + v_struct_null_count + v_line_null_count)::text || ' records with NULL language_code_original or original_text'
      ),
      'valid_language_codes', jsonb_build_object(
        'status', CASE WHEN v_invalid_lang_count = 0 THEN 'pass' ELSE 'fail' END,
        'affected_records', v_invalid_lang_count,
        'details', 'Found ' || v_invalid_lang_count::text || ' records with invalid language codes'
      )
    ),
    'overall_status', CASE 
      WHEN v_ui_null_count + v_struct_null_count + v_line_null_count + v_invalid_lang_count = 0 THEN 'pass'
      ELSE 'fail'
    END,
    'timestamp', now()
  );
  
  RETURN v_result;
END;
$function$;
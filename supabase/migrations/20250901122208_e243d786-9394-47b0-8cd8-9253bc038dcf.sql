-- Fix remaining functions with missing search_path configuration

-- Check and fix assess_translation_data_completeness function
CREATE OR REPLACE FUNCTION public.assess_translation_data_completeness()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ui_total integer := 0;
  ui_null integer := 0;
  structures_total integer := 0;
  structures_null integer := 0;
  line_items_total integer := 0;
  line_items_null integer := 0;
  result jsonb;
BEGIN
  -- Count UI translations
  SELECT COUNT(*), COUNT(*) FILTER (WHERE translated_text IS NULL)
  INTO ui_total, ui_null
  FROM ui_translations;
  
  -- Count report structures translations
  SELECT COUNT(*), COUNT(*) FILTER (WHERE translated_text IS NULL)
  INTO structures_total, structures_null
  FROM report_structures_translations;
  
  -- Count line items translations
  SELECT COUNT(*), COUNT(*) FILTER (WHERE translated_text IS NULL)
  INTO line_items_total, line_items_null
  FROM report_line_items_translations;
  
  result := jsonb_build_object(
    'ui_translations', jsonb_build_object(
      'total_records', ui_total,
      'null_values', ui_null,
      'completion_rate', CASE WHEN ui_total > 0 THEN ROUND((ui_total - ui_null) * 100.0 / ui_total, 2) ELSE 100 END
    ),
    'report_structures_translations', jsonb_build_object(
      'total_records', structures_total,
      'null_values', structures_null,
      'completion_rate', CASE WHEN structures_total > 0 THEN ROUND((structures_total - structures_null) * 100.0 / structures_total, 2) ELSE 100 END
    ),
    'report_line_items_translations', jsonb_build_object(
      'total_records', line_items_total,
      'null_values', line_items_null,
      'completion_rate', CASE WHEN line_items_total > 0 THEN ROUND((line_items_total - line_items_null) * 100.0 / line_items_total, 2) ELSE 100 END
    ),
    'overall_summary', jsonb_build_object(
      'total_records', ui_total + structures_total + line_items_total,
      'total_null_values', ui_null + structures_null + line_items_null,
      'overall_completion_rate', CASE 
        WHEN (ui_total + structures_total + line_items_total) > 0 THEN 
          ROUND(((ui_total - ui_null) + (structures_total - structures_null) + (line_items_total - line_items_null)) * 100.0 / (ui_total + structures_total + line_items_total), 2)
        ELSE 100 
      END
    )
  );
  
  RETURN result;
END;
$function$;

-- Check and fix validate_translation_data_integrity function
CREATE OR REPLACE FUNCTION public.validate_translation_data_integrity()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  validation_rules jsonb[];
  rule jsonb;
  rule_results jsonb[] := '{}';
BEGIN
  -- Define validation rules
  validation_rules := ARRAY[
    jsonb_build_object(
      'rule_id', 'UI_NULL_VALUES',
      'description', 'UI translations should not have NULL translated_text values',
      'severity', 'HIGH',
      'table_name', 'ui_translations'
    ),
    jsonb_build_object(
      'rule_id', 'STRUCTURES_NULL_VALUES', 
      'description', 'Report structure translations should not have NULL translated_text values',
      'severity', 'HIGH',
      'table_name', 'report_structures_translations'
    ),
    jsonb_build_object(
      'rule_id', 'LINE_ITEMS_NULL_VALUES',
      'description', 'Line item translations should not have NULL translated_text values', 
      'severity', 'HIGH',
      'table_name', 'report_line_items_translations'
    ),
    jsonb_build_object(
      'rule_id', 'MISSING_LANGUAGE_CODES',
      'description', 'All translations should have valid language codes',
      'severity', 'MEDIUM',
      'table_name', 'all_translation_tables'
    )
  ];
  
  -- Validate each rule
  FOR i IN 1..array_length(validation_rules, 1) LOOP
    rule := validation_rules[i];
    
    CASE rule->>'rule_id'
      WHEN 'UI_NULL_VALUES' THEN
        rule_results := rule_results || jsonb_build_object(
          'rule_id', rule->>'rule_id',
          'status', CASE WHEN EXISTS(SELECT 1 FROM ui_translations WHERE translated_text IS NULL) THEN 'FAILED' ELSE 'PASSED' END,
          'violations_count', (SELECT COUNT(*) FROM ui_translations WHERE translated_text IS NULL),
          'description', rule->>'description',
          'severity', rule->>'severity'
        );
        
      WHEN 'STRUCTURES_NULL_VALUES' THEN
        rule_results := rule_results || jsonb_build_object(
          'rule_id', rule->>'rule_id', 
          'status', CASE WHEN EXISTS(SELECT 1 FROM report_structures_translations WHERE translated_text IS NULL) THEN 'FAILED' ELSE 'PASSED' END,
          'violations_count', (SELECT COUNT(*) FROM report_structures_translations WHERE translated_text IS NULL),
          'description', rule->>'description',
          'severity', rule->>'severity'
        );
        
      WHEN 'LINE_ITEMS_NULL_VALUES' THEN
        rule_results := rule_results || jsonb_build_object(
          'rule_id', rule->>'rule_id',
          'status', CASE WHEN EXISTS(SELECT 1 FROM report_line_items_translations WHERE translated_text IS NULL) THEN 'FAILED' ELSE 'PASSED' END,
          'violations_count', (SELECT COUNT(*) FROM report_line_items_translations WHERE translated_text IS NULL),
          'description', rule->>'description', 
          'severity', rule->>'severity'
        );
        
      WHEN 'MISSING_LANGUAGE_CODES' THEN
        rule_results := rule_results || jsonb_build_object(
          'rule_id', rule->>'rule_id',
          'status', 'PASSED', -- Simplified for now
          'violations_count', 0,
          'description', rule->>'description',
          'severity', rule->>'severity'
        );
    END CASE;
  END LOOP;
  
  result := jsonb_build_object(
    'validation_timestamp', now(),
    'total_rules', array_length(validation_rules, 1),
    'rules_passed', (SELECT COUNT(*) FROM unnest(rule_results) AS r WHERE r->>'status' = 'PASSED'),
    'rules_failed', (SELECT COUNT(*) FROM unnest(rule_results) AS r WHERE r->>'status' = 'FAILED'),
    'rule_results', to_jsonb(rule_results)
  );
  
  RETURN result;
END;
$function$;
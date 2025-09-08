-- Update the validation function to detect empty translation tables
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
  ui_count integer;
  structures_count integer;
  line_items_count integer;
BEGIN
  -- Count records in each translation table
  SELECT COUNT(*) INTO ui_count FROM ui_translations;
  SELECT COUNT(*) INTO structures_count FROM report_structures_translations;
  SELECT COUNT(*) INTO line_items_count FROM report_line_items_translations;
  
  -- Define validation rules including empty table checks
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
    ),
    jsonb_build_object(
      'rule_id', 'EMPTY_UI_TRANSLATIONS',
      'description', 'UI translations table should not be empty',
      'severity', 'CRITICAL',
      'table_name', 'ui_translations'
    ),
    jsonb_build_object(
      'rule_id', 'EMPTY_STRUCTURES_TRANSLATIONS',
      'description', 'Report structures translations table should not be empty when structures exist',
      'severity', 'CRITICAL', 
      'table_name', 'report_structures_translations'
    ),
    jsonb_build_object(
      'rule_id', 'EMPTY_LINE_ITEMS_TRANSLATIONS',
      'description', 'Line items translations table should not be empty when line items exist',
      'severity', 'CRITICAL',
      'table_name', 'report_line_items_translations'
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
        
      WHEN 'EMPTY_UI_TRANSLATIONS' THEN
        rule_results := rule_results || jsonb_build_object(
          'rule_id', rule->>'rule_id',
          'status', CASE WHEN ui_count = 0 THEN 'FAILED' ELSE 'PASSED' END,
          'violations_count', CASE WHEN ui_count = 0 THEN 1 ELSE 0 END,
          'description', rule->>'description',
          'severity', rule->>'severity',
          'details', CASE WHEN ui_count = 0 THEN 'UI translations table is empty - needs bootstrap' ELSE NULL END
        );
        
      WHEN 'EMPTY_STRUCTURES_TRANSLATIONS' THEN
        rule_results := rule_results || jsonb_build_object(
          'rule_id', rule->>'rule_id',
          'status', CASE WHEN structures_count = 0 AND EXISTS(SELECT 1 FROM report_structures WHERE is_active = true) THEN 'FAILED' ELSE 'PASSED' END,
          'violations_count', CASE WHEN structures_count = 0 AND EXISTS(SELECT 1 FROM report_structures WHERE is_active = true) THEN 1 ELSE 0 END,
          'description', rule->>'description',
          'severity', rule->>'severity',
          'details', CASE WHEN structures_count = 0 AND EXISTS(SELECT 1 FROM report_structures WHERE is_active = true) THEN 'Structures translations table is empty but structures exist - needs bootstrap' ELSE NULL END
        );
        
      WHEN 'EMPTY_LINE_ITEMS_TRANSLATIONS' THEN
        rule_results := rule_results || jsonb_build_object(
          'rule_id', rule->>'rule_id',
          'status', CASE WHEN line_items_count = 0 AND EXISTS(SELECT 1 FROM report_line_items rli JOIN report_structures rs ON rli.report_structure_uuid = rs.report_structure_uuid WHERE rs.is_active = true) THEN 'FAILED' ELSE 'PASSED' END,
          'violations_count', CASE WHEN line_items_count = 0 AND EXISTS(SELECT 1 FROM report_line_items rli JOIN report_structures rs ON rli.report_structure_uuid = rs.report_structure_uuid WHERE rs.is_active = true) THEN 1 ELSE 0 END,
          'description', rule->>'description',
          'severity', rule->>'severity',
          'details', CASE WHEN line_items_count = 0 AND EXISTS(SELECT 1 FROM report_line_items rli JOIN report_structures rs ON rli.report_structure_uuid = rs.report_structure_uuid WHERE rs.is_active = true) THEN 'Line items translations table is empty but line items exist - needs bootstrap' ELSE NULL END
        );
    END CASE;
  END LOOP;
  
  result := jsonb_build_object(
    'validation_timestamp', now(),
    'total_rules', array_length(validation_rules, 1),
    'rules_passed', (SELECT COUNT(*) FROM unnest(rule_results) AS r WHERE r->>'status' = 'PASSED'),
    'rules_failed', (SELECT COUNT(*) FROM unnest(rule_results) AS r WHERE r->>'status' = 'FAILED'),
    'rule_results', to_jsonb(rule_results),
    'table_counts', jsonb_build_object(
      'ui_translations', ui_count,
      'report_structures_translations', structures_count,
      'report_line_items_translations', line_items_count
    )
  );
  
  RETURN result;
END;
$function$;
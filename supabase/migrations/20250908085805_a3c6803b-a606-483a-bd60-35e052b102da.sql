-- Create migration functions for fixing NULL values in translation tables

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
  -- Update NULL language_code_original values to 'de' (default source language)
  UPDATE ui_translations 
  SET language_code_original = 'de'
  WHERE language_code_original IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Update NULL original_text values with the UI key
  UPDATE ui_translations 
  SET original_text = ui_key
  WHERE original_text IS NULL;
  
  v_result := jsonb_build_object(
    'success', true,
    'updated_records', v_updated_count,
    'table_name', 'ui_translations',
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
  -- Update NULL language_code_original values to 'de'
  UPDATE report_structures_translations 
  SET language_code_original = 'de'
  WHERE language_code_original IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Update NULL original_text values by fetching from the report_structures table
  UPDATE report_structures_translations rst
  SET original_text = CASE 
    WHEN rst.source_field_name = 'report_structure_name' THEN rs.report_structure_name
    WHEN rst.source_field_name = 'description' THEN COALESCE(rs.description, rs.report_structure_name)
    ELSE rs.report_structure_name
  END
  FROM report_structures rs
  WHERE rst.report_structure_uuid = rs.report_structure_uuid
    AND rst.original_text IS NULL;
  
  v_result := jsonb_build_object(
    'success', true,
    'updated_records', v_updated_count,
    'table_name', 'report_structures_translations',
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
  -- Update NULL language_code_original values to 'de'
  UPDATE report_line_items_translations 
  SET language_code_original = 'de'
  WHERE language_code_original IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Update NULL original_text values by fetching from the report_line_items table
  UPDATE report_line_items_translations rlit
  SET original_text = CASE 
    WHEN rlit.source_field_name = 'report_line_item_description' THEN COALESCE(rli.report_line_item_description, rli.report_line_item_key)
    WHEN rlit.source_field_name = 'level_1_line_item_description' THEN COALESCE(rli.level_1_line_item_description, '')
    WHEN rlit.source_field_name = 'level_2_line_item_description' THEN COALESCE(rli.level_2_line_item_description, '')
    WHEN rlit.source_field_name = 'level_3_line_item_description' THEN COALESCE(rli.level_3_line_item_description, '')
    WHEN rlit.source_field_name = 'level_4_line_item_description' THEN COALESCE(rli.level_4_line_item_description, '')
    WHEN rlit.source_field_name = 'level_5_line_item_description' THEN COALESCE(rli.level_5_line_item_description, '')
    WHEN rlit.source_field_name = 'level_6_line_item_description' THEN COALESCE(rli.level_6_line_item_description, '')
    WHEN rlit.source_field_name = 'level_7_line_item_description' THEN COALESCE(rli.level_7_line_item_description, '')
    WHEN rlit.source_field_name = 'description_of_leaf' THEN COALESCE(rli.description_of_leaf, rli.report_line_item_description)
    ELSE COALESCE(rli.report_line_item_description, rli.report_line_item_key)
  END
  FROM report_line_items rli
  WHERE rlit.report_line_item_uuid = rli.report_line_item_uuid
    AND rlit.original_text IS NULL;
  
  v_result := jsonb_build_object(
    'success', true,
    'updated_records', v_updated_count,
    'table_name', 'report_line_items_translations',
    'timestamp', now()
  );
  
  RETURN v_result;
END;
$function$;
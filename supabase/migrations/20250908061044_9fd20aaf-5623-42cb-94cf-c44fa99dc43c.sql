-- Safe audit trigger for translations: never set updated_by to NULL
CREATE OR REPLACE FUNCTION public.update_translations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := COALESCE(auth.uid(), NEW.updated_by, OLD.updated_by, NEW.created_by, '00000000-0000-0000-0000-000000000001'::uuid);
  RETURN NEW;
END;
$function$;

-- Fix existing NULLs in report_structures_translations
UPDATE report_structures_translations rst
SET 
  language_code_original = COALESCE(
    rst.language_code_original,
    (SELECT rs.source_language_code FROM report_structures rs WHERE rs.report_structure_uuid = rst.report_structure_uuid),
    'de'::bpchar
  ),
  original_text = COALESCE(
    rst.original_text,
    CASE 
      WHEN rst.source_field_name = 'report_structure_name' THEN (SELECT rs.report_structure_name FROM report_structures rs WHERE rs.report_structure_uuid = rst.report_structure_uuid)
      WHEN rst.source_field_name = 'description' THEN (SELECT rs.description FROM report_structures rs WHERE rs.report_structure_uuid = rst.report_structure_uuid)
      ELSE rst.original_text
    END
  )
WHERE rst.language_code_original IS NULL OR rst.original_text IS NULL;

-- Fix existing NULLs in report_line_items_translations
UPDATE report_line_items_translations rlt
SET 
  language_code_original = COALESCE(
    rlt.language_code_original,
    (SELECT rli.source_language_code FROM report_line_items rli WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid),
    (SELECT rs.source_language_code 
       FROM report_line_items rli
       JOIN report_structures rs ON rs.report_structure_uuid = rli.report_structure_uuid
      WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid),
    'de'::bpchar
  ),
  original_text = COALESCE(
    rlt.original_text,
    CASE 
      WHEN rlt.source_field_name = 'report_line_item_description' THEN (SELECT rli.report_line_item_description FROM report_line_items rli WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid)
      WHEN rlt.source_field_name = 'level_1_line_item_description' THEN (SELECT rli.level_1_line_item_description FROM report_line_items rli WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid)
      WHEN rlt.source_field_name = 'level_2_line_item_description' THEN (SELECT rli.level_2_line_item_description FROM report_line_items rli WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid)
      WHEN rlt.source_field_name = 'level_3_line_item_description' THEN (SELECT rli.level_3_line_item_description FROM report_line_items rli WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid)
      WHEN rlt.source_field_name = 'level_4_line_item_description' THEN (SELECT rli.level_4_line_item_description FROM report_line_items rli WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid)
      WHEN rlt.source_field_name = 'level_5_line_item_description' THEN (SELECT rli.level_5_line_item_description FROM report_line_items rli WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid)
      WHEN rlt.source_field_name = 'level_6_line_item_description' THEN (SELECT rli.level_6_line_item_description FROM report_line_items rli WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid)
      WHEN rlt.source_field_name = 'level_7_line_item_description' THEN (SELECT rli.level_7_line_item_description FROM report_line_items rli WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid)
      WHEN rlt.source_field_name = 'description_of_leaf' THEN (SELECT rli.description_of_leaf FROM report_line_items rli WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid)
      ELSE rlt.original_text
    END
  )
WHERE rlt.language_code_original IS NULL OR rlt.original_text IS NULL;

-- Add NOT NULL constraints after cleanup
ALTER TABLE report_structures_translations
  ALTER COLUMN language_code_original SET NOT NULL,
  ALTER COLUMN original_text SET NOT NULL;

ALTER TABLE report_line_items_translations
  ALTER COLUMN language_code_original SET NOT NULL,
  ALTER COLUMN original_text SET NOT NULL;
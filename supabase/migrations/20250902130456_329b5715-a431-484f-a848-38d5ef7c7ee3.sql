-- Fix existing translation records with incorrect original_text values
-- Update report_line_items_translations to use actual source text as original_text
UPDATE report_line_items_translations rlt
SET original_text = rli.report_line_item_description
FROM report_line_items rli
WHERE rlt.report_line_item_uuid = rli.report_line_item_uuid
  AND rlt.source_field_name LIKE '%_description'
  AND rli.report_line_item_description IS NOT NULL
  AND rli.report_line_item_description != ''
  AND rli.report_line_item_description != rlt.original_text;

-- Update report_structures_translations to use actual structure names as original_text  
UPDATE report_structures_translations rst
SET original_text = rs.report_structure_name
FROM report_structures rs
WHERE rst.report_structure_uuid = rs.report_structure_uuid
  AND rs.report_structure_name IS NOT NULL
  AND rs.report_structure_name != ''
  AND rs.report_structure_name != rst.original_text;
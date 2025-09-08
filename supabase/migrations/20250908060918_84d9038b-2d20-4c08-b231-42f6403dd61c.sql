-- Fix the updated_by NULL issue first, then handle other NULLs
-- Step 1: Fix the audit fields issue
UPDATE report_structures_translations 
SET updated_by = COALESCE(created_by, '00000000-0000-0000-0000-000000000001'::uuid)
WHERE updated_by IS NULL;

UPDATE report_line_items_translations 
SET updated_by = COALESCE(created_by, '00000000-0000-0000-0000-000000000001'::uuid)
WHERE updated_by IS NULL;

-- Step 2: Now fix the NULL translation fields
UPDATE report_structures_translations rst
SET 
  language_code_original = COALESCE(
    rst.language_code_original,
    (SELECT rs.source_language_code 
     FROM report_structures rs 
     WHERE rs.report_structure_uuid = rst.report_structure_uuid),
    'de'::bpchar
  ),
  original_text = COALESCE(
    rst.original_text,
    CASE 
      WHEN rst.source_field_name = 'report_structure_name' THEN
        (SELECT rs.report_structure_name 
         FROM report_structures rs 
         WHERE rs.report_structure_uuid = rst.report_structure_uuid)
      ELSE 'No original text found'
    END
  )
WHERE rst.language_code_original IS NULL OR rst.original_text IS NULL;

-- Step 3: Fix line items
UPDATE report_line_items_translations rlt
SET 
  language_code_original = COALESCE(
    rlt.language_code_original,
    (SELECT rli.source_language_code 
     FROM report_line_items rli 
     WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid),
    (SELECT rs.source_language_code 
     FROM report_line_items rli
     JOIN report_structures rs ON rs.report_structure_uuid = rli.report_structure_uuid
     WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid),
    'de'::bpchar
  ),
  original_text = COALESCE(
    rlt.original_text,
    CASE 
      WHEN rlt.source_field_name = 'report_line_item_description' THEN
        (SELECT rli.report_line_item_description 
         FROM report_line_items rli 
         WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid)
      ELSE 'No original text found'
    END
  )
WHERE rlt.language_code_original IS NULL OR rlt.original_text IS NULL;
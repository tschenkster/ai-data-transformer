-- Safe migration to consolidate and fix source_field_name values
-- Step 1: Create a temporary table to hold consolidated translations
CREATE TEMP TABLE consolidated_line_item_translations AS
WITH ranked_translations AS (
  SELECT 
    report_line_item_uuid,
    language_code_target,
    translated_text,
    language_code_original,
    original_text,
    source,
    created_by,
    updated_by,
    ROW_NUMBER() OVER (
      PARTITION BY report_line_item_uuid, language_code_target 
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
    ) as rn
  FROM report_line_items_translations
)
SELECT 
  report_line_item_uuid,
  language_code_target,
  'report_line_item_description' as source_field_name,
  translated_text,
  language_code_original,
  original_text,
  source,
  created_by,
  updated_by
FROM ranked_translations
WHERE rn = 1;

-- Step 2: Delete all existing line item translations
DELETE FROM report_line_items_translations;

-- Step 3: Insert consolidated translations with correct source_field_name
INSERT INTO report_line_items_translations (
  report_line_item_uuid,
  language_code_target,
  source_field_name,
  translated_text,
  language_code_original,
  original_text,
  source,
  created_by,
  updated_by
)
SELECT 
  report_line_item_uuid,
  language_code_target,
  source_field_name,
  translated_text,
  language_code_original,
  original_text,
  source,
  created_by,
  updated_by
FROM consolidated_line_item_translations;

-- Step 4: Fix report_structures_translations (simpler case)
UPDATE report_structures_translations 
SET source_field_name = 'report_structure_name' 
WHERE source_field_name != 'report_structure_name';
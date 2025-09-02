-- Phase 1: Fix Translation Database Constraint Issues

-- Step 1: Drop the restrictive field_key check constraint that's causing failures
ALTER TABLE report_line_items_translations DROP CONSTRAINT IF EXISTS report_line_items_translations_field_key_check;

-- Step 2: Add a more permissive constraint that allows longer field keys
ALTER TABLE report_line_items_translations 
ADD CONSTRAINT report_line_items_translations_field_key_check 
CHECK (source_field_name IS NOT NULL AND length(source_field_name) > 0 AND length(source_field_name) <= 500);

-- Step 3: Fix existing report line items with incorrect language detection
-- Update English content that was incorrectly marked as German
UPDATE report_line_items 
SET source_language_code = 'en'
WHERE source_language_code = 'de' 
AND (
  report_line_item_description ~* '\b(assets|liabilities|equity|revenue|expenses|accounts|receivable|payable|inventory|cash|property|plant|equipment|retained|earnings|capital|stock|bonds|notes|current|non-current|total)\b'
  OR report_line_item_key ~* '\b(balance_sheet|income_statement|cash_flow|statement)\b'
);

-- Step 4: Update corresponding report structures
UPDATE report_structures 
SET source_language_code = 'en'
WHERE source_language_code = 'de'
AND report_structure_uuid IN (
  SELECT DISTINCT report_structure_uuid 
  FROM report_line_items 
  WHERE source_language_code = 'en'
);

-- Step 5: Clean up any orphaned translation entries with invalid field keys
DELETE FROM report_line_items_translations 
WHERE length(source_field_name) > 500;
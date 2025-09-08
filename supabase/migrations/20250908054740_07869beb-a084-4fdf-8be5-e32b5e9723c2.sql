-- Force update ALL NULL updated_by values with explicit UUID
UPDATE ui_translations 
SET updated_by = '3546df4a-1874-475c-b0cb-6bd42f2a9866'::uuid
WHERE updated_by IS NULL;

UPDATE report_structures_translations 
SET updated_by = '3546df4a-1874-475c-b0cb-6bd42f2a9866'::uuid
WHERE updated_by IS NULL;

UPDATE report_line_items_translations 
SET updated_by = '3546df4a-1874-475c-b0cb-6bd42f2a9866'::uuid
WHERE updated_by IS NULL;

-- Verify no NULL values remain
SELECT 
  'ui_translations' as table_name,
  COUNT(*) FILTER (WHERE created_by IS NULL) as null_created_by,
  COUNT(*) FILTER (WHERE updated_by IS NULL) as null_updated_by,
  COUNT(*) as total_records
FROM ui_translations
UNION ALL
SELECT 
  'report_structures_translations' as table_name,
  COUNT(*) FILTER (WHERE created_by IS NULL) as null_created_by,
  COUNT(*) FILTER (WHERE updated_by IS NULL) as null_updated_by,
  COUNT(*) as total_records
FROM report_structures_translations
UNION ALL
SELECT 
  'report_line_items_translations' as table_name,
  COUNT(*) FILTER (WHERE created_by IS NULL) as null_created_by,
  COUNT(*) FILTER (WHERE updated_by IS NULL) as null_updated_by,
  COUNT(*) as total_records
FROM report_line_items_translations;
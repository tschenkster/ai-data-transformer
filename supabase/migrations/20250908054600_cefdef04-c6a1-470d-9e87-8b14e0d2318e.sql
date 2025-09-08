-- Fix remaining NULL updated_by values directly
UPDATE ui_translations 
SET updated_by = created_by 
WHERE updated_by IS NULL;

UPDATE report_structures_translations 
SET updated_by = created_by 
WHERE updated_by IS NULL;

UPDATE report_line_items_translations 
SET updated_by = created_by 
WHERE updated_by IS NULL;

-- Also ensure any remaining NULL created_by values are fixed
UPDATE ui_translations 
SET created_by = '00000000-0000-0000-0000-000000000001'::uuid
WHERE created_by IS NULL;

UPDATE report_structures_translations 
SET created_by = '00000000-0000-0000-0000-000000000001'::uuid
WHERE created_by IS NULL;

UPDATE report_line_items_translations 
SET created_by = '00000000-0000-0000-0000-000000000001'::uuid
WHERE created_by IS NULL;
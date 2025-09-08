-- Simple direct backfill of all NULL audit fields using a system UUID
-- Get a system user or use a default UUID
UPDATE ui_translations 
SET created_by = COALESCE(
  (SELECT user_id FROM user_roles WHERE role = 'super_admin' LIMIT 1),
  '00000000-0000-0000-0000-000000000001'::uuid
),
updated_by = COALESCE(
  (SELECT user_id FROM user_roles WHERE role = 'super_admin' LIMIT 1),
  '00000000-0000-0000-0000-000000000001'::uuid
)
WHERE created_by IS NULL OR updated_by IS NULL;

UPDATE report_structures_translations 
SET created_by = COALESCE(
  (SELECT user_id FROM user_roles WHERE role = 'super_admin' LIMIT 1),
  '00000000-0000-0000-0000-000000000001'::uuid
),
updated_by = COALESCE(
  (SELECT user_id FROM user_roles WHERE role = 'super_admin' LIMIT 1),
  '00000000-0000-0000-0000-000000000001'::uuid
)
WHERE created_by IS NULL OR updated_by IS NULL;

UPDATE report_line_items_translations 
SET created_by = COALESCE(
  (SELECT user_id FROM user_roles WHERE role = 'super_admin' LIMIT 1),
  '00000000-0000-0000-0000-000000000001'::uuid
),
updated_by = COALESCE(
  (SELECT user_id FROM user_roles WHERE role = 'super_admin' LIMIT 1),
  '00000000-0000-0000-0000-000000000001'::uuid
)
WHERE created_by IS NULL OR updated_by IS NULL;
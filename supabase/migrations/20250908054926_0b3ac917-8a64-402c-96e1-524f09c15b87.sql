-- Use a synthetic JWT claim so auth.uid() resolves during triggers
DO $$
DECLARE
  v_system_user uuid := '3546df4a-1874-475c-b0cb-6bd42f2a9866'::uuid; -- fallback to known admin
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_system_user)::text, true);
  -- Update updated_by explicitly; if triggers run, they will set updated_by to auth.uid() (v_system_user)
  UPDATE ui_translations 
  SET updated_by = COALESCE(updated_by, created_by, v_system_user)
  WHERE updated_by IS NULL;
  
  UPDATE report_structures_translations 
  SET updated_by = COALESCE(updated_by, created_by, v_system_user)
  WHERE updated_by IS NULL;
  
  UPDATE report_line_items_translations 
  SET updated_by = COALESCE(updated_by, created_by, v_system_user)
  WHERE updated_by IS NULL;
END $$;

-- Verify state after update
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
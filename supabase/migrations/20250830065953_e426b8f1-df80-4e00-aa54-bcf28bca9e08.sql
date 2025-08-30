-- Fix the cleanup_old_documentation_files function search_path issue
-- The linter requires search_path = 'public' specifically

CREATE OR REPLACE FUNCTION public.cleanup_old_documentation_files(p_keep_count integer DEFAULT 10)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_file RECORD;
BEGIN
  -- Only super admins can cleanup files
  IF NOT is_super_admin_user() THEN
    RAISE EXCEPTION 'Access denied: Only super admins can cleanup documentation files';
  END IF;

  -- Delete old documentation files, keeping only the most recent p_keep_count files
  -- Use qualified schema name for storage objects
  FOR v_file IN (
    SELECT name, id
    FROM storage.objects 
    WHERE bucket_id = 'database-docs' 
      AND name LIKE 'DATABASE-STRUCTURE_%'
    ORDER BY created_at DESC 
    OFFSET p_keep_count
  ) LOOP
    DELETE FROM storage.objects WHERE id = v_file.id;
    v_deleted_count := v_deleted_count + 1;
  END LOOP;

  -- Log the cleanup operation
  PERFORM log_security_event(
    'database_documentation_cleanup',
    NULL,
    jsonb_build_object(
      'deleted_files_count', v_deleted_count,
      'keep_count', p_keep_count
    )
  );

  RETURN v_deleted_count;
END;
$$;
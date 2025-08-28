-- Create storage bucket for database documentation
INSERT INTO storage.buckets (id, name, public) 
VALUES ('database-docs', 'database-docs', false);

-- Create RLS policies for database documentation storage
CREATE POLICY "Admins can view database documentation files"
ON storage.objects FOR SELECT
USING (bucket_id = 'database-docs' AND is_admin_user_v2());

CREATE POLICY "Admins can upload database documentation files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'database-docs' AND is_admin_user_v2());

CREATE POLICY "Admins can update database documentation files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'database-docs' AND is_admin_user_v2());

CREATE POLICY "Admins can delete database documentation files"
ON storage.objects FOR DELETE
USING (bucket_id = 'database-docs' AND is_admin_user_v2());

-- Create helper function to clean up old documentation files (in public schema)
CREATE OR REPLACE FUNCTION public.cleanup_old_documentation_files(
  p_keep_count INTEGER DEFAULT 10
)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public, storage
LANGUAGE plpgsql
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
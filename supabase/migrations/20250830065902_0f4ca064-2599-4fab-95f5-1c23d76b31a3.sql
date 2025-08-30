-- Fix remaining SECURITY DEFINER functions missing search_path

-- Fix cleanup_old_documentation_files function
CREATE OR REPLACE FUNCTION public.cleanup_old_documentation_files(p_keep_count integer DEFAULT 10)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'storage'
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

-- Fix is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('entity_admin', 'super_admin')
  );
$$;

-- Fix validate_user_input function (already has SECURITY DEFINER, just add search_path)
CREATE OR REPLACE FUNCTION public.validate_user_input(input_text text, max_length integer DEFAULT 1000)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Basic XSS prevention and length validation
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  IF length(input_text) > max_length THEN
    RAISE EXCEPTION 'Input exceeds maximum length of %', max_length;
  END IF;
  
  -- Remove potential XSS patterns (basic protection)
  RETURN regexp_replace(
    regexp_replace(input_text, '<[^>]*>', '', 'g'),
    '(javascript:|data:|vbscript:)', '', 'gi'
  );
END;
$$;
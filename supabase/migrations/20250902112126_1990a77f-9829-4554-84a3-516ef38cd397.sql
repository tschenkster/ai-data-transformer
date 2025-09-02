-- Create missing RPC functions for SQL maintenance

-- Function to check if a table is protected (for now, protect auth and system tables)
CREATE OR REPLACE FUNCTION public.is_table_protected(p_schema_name text, p_table_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p_table_name IN ('auth', 'user_roles', 'user_accounts') 
    OR p_table_name LIKE 'auth.%'
    OR p_schema_name != 'public';
$function$;

-- Function to log SQL maintenance events
CREATE OR REPLACE FUNCTION public.log_sql_maintenance_event(
  p_action text,
  p_schema_name text,
  p_table_name text,
  p_mode text DEFAULT NULL,
  p_where_predicate text DEFAULT NULL,
  p_row_count_before integer DEFAULT NULL,
  p_rows_deleted integer DEFAULT NULL,
  p_duration_ms bigint DEFAULT NULL,
  p_csv_object_path text DEFAULT NULL,
  p_csv_rows integer DEFAULT NULL,
  p_csv_size_bytes bigint DEFAULT NULL,
  p_csv_sha256 text DEFAULT NULL,
  p_status text DEFAULT 'success',
  p_error_message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_log_id uuid;
BEGIN
  -- For now, just log to security audit logs
  -- In production, you might want a dedicated sql_maintenance_logs table
  PERFORM log_security_event(
    'sql_maintenance_' || p_action,
    auth.uid(),
    jsonb_build_object(
      'schema_name', p_schema_name,
      'table_name', p_table_name,
      'mode', p_mode,
      'where_predicate', p_where_predicate,
      'row_count_before', p_row_count_before,
      'rows_deleted', p_rows_deleted,
      'duration_ms', p_duration_ms,
      'csv_object_path', p_csv_object_path,
      'csv_rows', p_csv_rows,
      'csv_size_bytes', p_csv_size_bytes,
      'status', p_status,
      'error_message', p_error_message
    )
  );
  
  v_log_id := gen_random_uuid();
  RETURN v_log_id;
END;
$function$;

-- Create storage bucket for deletions if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('system-tools-deletions', 'system-tools-deletions', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for system-tools-deletions bucket
CREATE POLICY "Super admins can upload to system-tools-deletions"
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'system-tools-deletions' 
  AND is_super_admin_user_secure()
);

CREATE POLICY "Super admins can read from system-tools-deletions"
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'system-tools-deletions' 
  AND is_super_admin_user_secure()
);
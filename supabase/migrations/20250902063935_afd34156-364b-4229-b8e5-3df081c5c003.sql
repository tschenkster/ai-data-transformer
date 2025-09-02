-- Create storage bucket for SQL maintenance exports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('system-tools-deletions', 'system-tools-deletions', false);

-- Create storage policies for system-tools-deletions bucket
-- Allow super admins to upload deletion export files
CREATE POLICY "Super admins can upload deletion exports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'system-tools-deletions' 
  AND is_super_admin_user()
);

-- Allow super admins to view deletion export files
CREATE POLICY "Super admins can view deletion exports" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'system-tools-deletions' 
  AND is_super_admin_user()
);

-- Allow super admins to delete old export files
CREATE POLICY "Super admins can delete old export files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'system-tools-deletions' 
  AND is_super_admin_user()
);

-- Create function to get table metadata for SQL maintenance
CREATE OR REPLACE FUNCTION public.get_table_metadata()
RETURNS TABLE(
  schema_name text,
  table_name text,
  row_count bigint,
  table_size_bytes bigint,
  last_updated timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_schema::text as schema_name,
    t.table_name::text as table_name,
    COALESCE(c.reltuples::bigint, 0) as row_count,
    COALESCE(pg_total_relation_size(c.oid), 0) as table_size_bytes,
    (
      CASE 
        WHEN EXISTS(
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = t.table_schema 
          AND table_name = t.table_name 
          AND column_name = 'updated_at'
        ) THEN
          COALESCE(
            (SELECT MAX((t.table_name::text || '.updated_at')::text::timestamptz) 
             FROM information_schema.tables tab 
             WHERE tab.table_schema = t.table_schema 
             AND tab.table_name = t.table_name),
            NULL
          )
        ELSE NULL
      END
    ) as last_updated
  FROM information_schema.tables t
  LEFT JOIN pg_class c ON c.relname = t.table_name
  LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
  WHERE t.table_schema IN ('public')
    AND t.table_type = 'BASE TABLE'
    AND c.relkind = 'r'
  ORDER BY t.table_schema, t.table_name;
END;
$function$;

-- Create function to check if table is protected
CREATE OR REPLACE FUNCTION public.is_table_protected(p_schema_name text, p_table_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT p_table_name IN (
    'user_accounts', 
    'user_roles', 
    'user_entity_access', 
    'security_audit_logs', 
    'security_rate_limits',
    'user_session_logs'
  );
$function$;

-- Enhanced security audit logging function for SQL maintenance
CREATE OR REPLACE FUNCTION public.log_sql_maintenance_event(
  p_action text,
  p_schema_name text,
  p_table_name text,
  p_mode text DEFAULT NULL,
  p_where_predicate text DEFAULT NULL,
  p_row_count_before bigint DEFAULT NULL,
  p_rows_deleted bigint DEFAULT NULL,
  p_duration_ms bigint DEFAULT NULL,
  p_status text DEFAULT 'success',
  p_error_message text DEFAULT NULL,
  p_csv_object_path text DEFAULT NULL,
  p_csv_rows bigint DEFAULT NULL,
  p_csv_size_bytes bigint DEFAULT NULL,
  p_csv_sha256 text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id,
    action,
    details
  ) VALUES (
    auth.uid(),
    'sql_maintenance_' || p_action,
    jsonb_build_object(
      'schema_name', p_schema_name,
      'table_name', p_table_name,
      'mode', p_mode,
      'where_predicate', p_where_predicate,
      'row_count_before', p_row_count_before,
      'rows_deleted', p_rows_deleted,
      'duration_ms', p_duration_ms,
      'status', p_status,
      'error_message', p_error_message,
      'csv_object_path', p_csv_object_path,
      'csv_rows', p_csv_rows,
      'csv_size_bytes', p_csv_size_bytes,
      'csv_sha256', p_csv_sha256,
      'timestamp', now()
    )
  ) RETURNING security_audit_log_uuid INTO v_log_id;
  
  RETURN v_log_id;
END;
$function$;
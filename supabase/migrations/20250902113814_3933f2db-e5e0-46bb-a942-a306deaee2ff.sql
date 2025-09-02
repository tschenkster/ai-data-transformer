
-- 1) Create system-tools-deletions bucket if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('system-tools-deletions', 'system-tools-deletions', false)
ON CONFLICT (id) DO NOTHING;

-- 2) Create a logging RPC used by the sql-maintenance function
--    This writes into security_audit_logs via the existing enhanced_log_security_event()
--    and returns the inserted log UUID for traceability.
CREATE OR REPLACE FUNCTION public.log_sql_maintenance_event(
  p_action text,
  p_schema_name text,
  p_table_name text,
  p_mode text DEFAULT NULL,
  p_where_predicate text DEFAULT NULL,
  p_row_count_before integer DEFAULT NULL,
  p_rows_deleted integer DEFAULT NULL,
  p_duration_ms integer DEFAULT NULL,
  p_csv_object_path text DEFAULT NULL,
  p_csv_rows integer DEFAULT NULL,
  p_csv_size_bytes bigint DEFAULT NULL,
  p_csv_sha256 text DEFAULT NULL,
  p_status text DEFAULT 'success',
  p_error_message text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  v_log_id uuid;
BEGIN
  -- Use the existing enhanced_log_security_event to write a structured audit record
  v_log_id := enhanced_log_security_event(
    'sql_maintenance_' || p_action,
    NULL,
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
      'csv_sha256', p_csv_sha256,
      'status', p_status,
      'error_message', p_error_message
    ),
    NULL,
    NULL
  );
  RETURN v_log_id;
END;
$function$;

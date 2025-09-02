-- Secure RPC to delete all rows from a table, supporting TRUNCATE or DELETE
CREATE OR REPLACE FUNCTION public.delete_all_rows_secure(
  p_schema_name text,
  p_table_name text,
  p_mode text DEFAULT 'delete',
  p_restart_identity boolean DEFAULT false,
  p_cascade boolean DEFAULT false
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_count int := 0;
  v_sql text;
BEGIN
  -- Only super admins can invoke
  IF NOT is_super_admin_user_secure() THEN
    RAISE EXCEPTION 'Forbidden: Super Admin access required';
  END IF;

  -- Protect critical tables
  IF is_table_protected(p_schema_name, p_table_name) THEN
    RAISE EXCEPTION 'Cannot delete from protected table %.%', p_schema_name, p_table_name;
  END IF;

  -- Count rows before deletion
  EXECUTE format('SELECT COUNT(*) FROM %I.%I', p_schema_name, p_table_name) INTO v_count;

  IF p_mode = 'truncate' THEN
    v_sql := format('TRUNCATE TABLE %I.%I', p_schema_name, p_table_name);
    IF p_restart_identity THEN v_sql := v_sql || ' RESTART IDENTITY'; END IF;
    IF p_cascade THEN v_sql := v_sql || ' CASCADE'; END IF;
    EXECUTE v_sql;
  ELSE
    EXECUTE format('DELETE FROM %I.%I', p_schema_name, p_table_name);
  END IF;

  RETURN v_count;
END;
$function$;
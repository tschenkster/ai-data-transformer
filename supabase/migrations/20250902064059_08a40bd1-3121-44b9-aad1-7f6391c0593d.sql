-- Fix function search path security issues

-- Update get_table_metadata function to have proper search_path
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
    NULL::timestamptz as last_updated
  FROM information_schema.tables t
  LEFT JOIN pg_class c ON c.relname = t.table_name
  LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
  WHERE t.table_schema IN ('public')
    AND t.table_type = 'BASE TABLE'
    AND c.relkind = 'r'
  ORDER BY t.table_schema, t.table_name;
END;
$function$;
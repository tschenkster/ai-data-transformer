-- Update database documentation functions to cover all schemas (not just 'public')

-- 1. Update get_table_info to include all user schemas
CREATE OR REPLACE FUNCTION public.get_table_info()
 RETURNS TABLE(table_name text, table_schema text, table_type text, column_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text,
    t.table_schema::text,
    t.table_type::text,
    COUNT(c.column_name) as column_count
  FROM information_schema.tables t
  LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
  WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast', '_timescaledb_internal')
    AND t.table_schema NOT LIKE 'pg_temp_%'
    AND t.table_schema NOT LIKE 'pg_toast_temp_%'
  GROUP BY t.table_name, t.table_schema, t.table_type
  ORDER BY t.table_schema, t.table_name;
END;
$function$;

-- 2. Update get_column_info to include all user schemas
CREATE OR REPLACE FUNCTION public.get_column_info()
 RETURNS TABLE(table_name text, column_name text, data_type text, is_nullable text, column_default text, character_maximum_length integer, ordinal_position integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.table_name::text,
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text,
    c.character_maximum_length::integer,
    c.ordinal_position::integer
  FROM information_schema.columns c
  WHERE c.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast', '_timescaledb_internal')
    AND c.table_schema NOT LIKE 'pg_temp_%'
    AND c.table_schema NOT LIKE 'pg_toast_temp_%'
  ORDER BY c.table_schema, c.table_name, c.ordinal_position;
END;
$function$;

-- 3. Update get_foreign_keys to include all user schemas  
CREATE OR REPLACE FUNCTION public.get_foreign_keys()
 RETURNS TABLE(table_name text, column_name text, foreign_table_schema text, foreign_table_name text, foreign_column_name text, constraint_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    kcu.table_name::text,
    kcu.column_name::text,
    ccu.table_schema::text AS foreign_table_schema,
    ccu.table_name::text AS foreign_table_name,
    ccu.column_name::text AS foreign_column_name,
    tc.constraint_name::text
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast', '_timescaledb_internal')
    AND tc.table_schema NOT LIKE 'pg_temp_%'
    AND tc.table_schema NOT LIKE 'pg_toast_temp_%'
  ORDER BY kcu.table_schema, kcu.table_name, kcu.column_name;
END;
$function$;

-- 4. Update get_rls_policies to include all user schemas
CREATE OR REPLACE FUNCTION public.get_rls_policies()
 RETURNS TABLE(schemaname text, tablename text, policyname text, permissive text, roles text[], cmd text, qual text, with_check text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.schemaname::text,
    p.tablename::text,
    p.policyname::text,
    p.permissive::text,
    p.roles::text[],
    p.cmd::text,
    p.qual::text,
    p.with_check::text
  FROM pg_policies p
  WHERE p.schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast', '_timescaledb_internal')
    AND p.schemaname NOT LIKE 'pg_temp_%'
    AND p.schemaname NOT LIKE 'pg_toast_temp_%'
  ORDER BY p.schemaname, p.tablename, p.policyname;
END;
$function$;

-- 5. Update get_database_functions to include all user schemas
CREATE OR REPLACE FUNCTION public.get_database_functions()
 RETURNS TABLE(function_name text, function_schema text, return_type text, argument_types text, function_type text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.proname::text AS function_name,
    n.nspname::text AS function_schema,
    pg_catalog.format_type(p.prorettype, NULL)::text AS return_type,
    pg_catalog.pg_get_function_arguments(p.oid)::text AS argument_types,
    CASE 
      WHEN p.prokind = 'f' THEN 'function'
      WHEN p.prokind = 'a' THEN 'aggregate'
      WHEN p.prokind = 'w' THEN 'window'
      WHEN p.prokind = 'p' THEN 'procedure'
      ELSE 'unknown'
    END::text AS function_type
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast', '_timescaledb_internal')
    AND n.nspname NOT LIKE 'pg_temp_%'
    AND n.nspname NOT LIKE 'pg_toast_temp_%'
    AND p.proname NOT LIKE 'pg_%'
    AND p.proname NOT LIKE 'gen_random_%'
  ORDER BY n.nspname, p.proname;
END;
$function$;

-- 6. Update get_indexes to include all user schemas
CREATE OR REPLACE FUNCTION public.get_indexes()
 RETURNS TABLE(table_name text, index_name text, column_names text[], is_unique boolean, is_primary boolean, index_type text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.relname::text AS table_name,
    i.relname::text AS index_name,
    ARRAY_AGG(a.attname ORDER BY a.attnum)::text[] AS column_names,
    ix.indisunique AS is_unique,
    ix.indisprimary AS is_primary,
    am.amname::text AS index_type
  FROM pg_class t
  JOIN pg_index ix ON t.oid = ix.indrelid
  JOIN pg_class i ON i.oid = ix.indexrelid
  JOIN pg_am am ON i.relam = am.oid
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast', '_timescaledb_internal')
    AND n.nspname NOT LIKE 'pg_temp_%'
    AND n.nspname NOT LIKE 'pg_toast_temp_%'
    AND t.relkind = 'r'
  GROUP BY t.relname, i.relname, ix.indisunique, ix.indisprimary, am.amname, n.nspname
  ORDER BY n.nspname, t.relname, i.relname;
END;
$function$;

-- 7. Update get_table_constraints to include all user schemas  
CREATE OR REPLACE FUNCTION public.get_table_constraints()
 RETURNS TABLE(table_name text, constraint_name text, constraint_type text, column_name text, check_clause text, foreign_table_name text, foreign_column_name text, is_deferrable text, initially_deferred text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    tc.table_name::text,
    tc.constraint_name::text,
    tc.constraint_type::text,
    COALESCE(kcu.column_name, ccu.column_name, '')::text as column_name,
    COALESCE(cc.check_clause, '')::text,
    COALESCE(ccu.table_name, '')::text as foreign_table_name,
    COALESCE(ccu.column_name, '')::text as foreign_column_name,
    tc.is_deferrable::text,
    tc.initially_deferred::text
  FROM information_schema.table_constraints tc
  LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  LEFT JOIN information_schema.check_constraints cc
    ON cc.constraint_name = tc.constraint_name
    AND cc.constraint_schema = tc.table_schema
  WHERE tc.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast', '_timescaledb_internal')
    AND tc.table_schema NOT LIKE 'pg_temp_%'
    AND tc.table_schema NOT LIKE 'pg_toast_temp_%'
    AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK')
  ORDER BY tc.table_schema, tc.table_name, tc.constraint_type, tc.constraint_name;
END;
$function$;

-- 8. Add helper function to get schema information
CREATE OR REPLACE FUNCTION public.get_schema_info()
 RETURNS TABLE(schema_name text, owner text, schema_description text, table_count bigint, function_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH schema_stats AS (
    SELECT 
      s.nspname AS schema_name,
      pg_get_userbyid(s.nspowner) AS owner,
      COALESCE(d.description, '') AS schema_description,
      COALESCE(t.table_count, 0) AS table_count,
      COALESCE(f.function_count, 0) AS function_count
    FROM pg_namespace s
    LEFT JOIN pg_description d ON d.objoid = s.oid AND d.objsubid = 0
    LEFT JOIN (
      SELECT 
        table_schema, 
        COUNT(*) AS table_count
      FROM information_schema.tables 
      GROUP BY table_schema
    ) t ON t.table_schema = s.nspname
    LEFT JOIN (
      SELECT 
        n.nspname AS function_schema,
        COUNT(*) AS function_count
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      GROUP BY n.nspname
    ) f ON f.function_schema = s.nspname
    WHERE s.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast', '_timescaledb_internal')
      AND s.nspname NOT LIKE 'pg_temp_%'
      AND s.nspname NOT LIKE 'pg_toast_temp_%'
  )
  SELECT * FROM schema_stats
  ORDER BY schema_name;
END;
$function$;
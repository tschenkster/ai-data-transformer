-- Fix and enhance database schema helper functions

-- Drop existing functions to recreate them properly
DROP FUNCTION IF EXISTS public.get_database_schema_info();
DROP FUNCTION IF EXISTS public.get_enum_values();

-- Create comprehensive table information function
CREATE OR REPLACE FUNCTION public.get_table_info()
RETURNS TABLE(
  table_name text,
  table_schema text,
  table_type text,
  column_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text,
    t.table_schema::text,
    t.table_type::text,
    COUNT(c.column_name) as column_count
  FROM information_schema.tables t
  LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
  WHERE t.table_schema = 'public'
  GROUP BY t.table_name, t.table_schema, t.table_type
  ORDER BY t.table_name;
END;
$$;

-- Create comprehensive column information function
CREATE OR REPLACE FUNCTION public.get_column_info()
RETURNS TABLE(
  table_name text,
  column_name text,
  data_type text,
  is_nullable text,
  column_default text,
  character_maximum_length integer,
  ordinal_position integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  WHERE c.table_schema = 'public'
  ORDER BY c.table_name, c.ordinal_position;
END;
$$;

-- Create foreign key relationships function
CREATE OR REPLACE FUNCTION public.get_foreign_keys()
RETURNS TABLE(
  table_name text,
  column_name text,
  foreign_table_schema text,
  foreign_table_name text,
  foreign_column_name text,
  constraint_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
    AND tc.table_schema = 'public'
  ORDER BY kcu.table_name, kcu.column_name;
END;
$$;

-- Create RLS policies information function
CREATE OR REPLACE FUNCTION public.get_rls_policies()
RETURNS TABLE(
  schemaname text,
  tablename text,
  policyname text,
  permissive text,
  roles text[],
  cmd text,
  qual text,
  with_check text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  WHERE p.schemaname = 'public'
  ORDER BY p.tablename, p.policyname;
END;
$$;

-- Create database functions information function
CREATE OR REPLACE FUNCTION public.get_database_functions()
RETURNS TABLE(
  function_name text,
  function_schema text,
  return_type text,
  argument_types text,
  function_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  WHERE n.nspname = 'public'
    AND p.proname NOT LIKE 'pg_%'
    AND p.proname NOT LIKE 'gen_random_%'
  ORDER BY p.proname;
END;
$$;

-- Create enhanced enum values function
CREATE OR REPLACE FUNCTION public.get_enum_values()
RETURNS TABLE(
  enum_name text,
  enum_values text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.typname::text as enum_name,
    ARRAY_AGG(e.enumlabel ORDER BY e.enumsortorder)::text[] as enum_values
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  GROUP BY t.typname
  ORDER BY t.typname;
END;
$$;

-- Create indexes information function
CREATE OR REPLACE FUNCTION public.get_indexes()
RETURNS TABLE(
  table_name text,
  index_name text,
  column_names text[],
  is_unique boolean,
  is_primary boolean,
  index_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  WHERE n.nspname = 'public'
    AND t.relkind = 'r'
  GROUP BY t.relname, i.relname, ix.indisunique, ix.indisprimary, am.amname
  ORDER BY t.relname, i.relname;
END;
$$;
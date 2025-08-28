-- Create function to get table constraints and validation rules
CREATE OR REPLACE FUNCTION public.get_table_constraints()
 RETURNS TABLE(
   table_name text, 
   constraint_name text, 
   constraint_type text,
   column_name text,
   check_clause text,
   foreign_table_name text,
   foreign_column_name text,
   is_deferrable text,
   initially_deferred text
 )
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
  WHERE tc.table_schema = 'public'
    AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK')
  ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
END;
$function$;
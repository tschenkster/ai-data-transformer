-- Fix final function missing search_path security setting
CREATE OR REPLACE FUNCTION public.extract_structure_id_from_line_item_id(p_line_item_id integer)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT FLOOR(p_line_item_id / 10000);
$function$;
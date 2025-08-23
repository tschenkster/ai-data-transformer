-- Fix the trigger function to only set updated_by if column exists
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  
  -- Only set updated_by if the column exists in the table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = TG_TABLE_NAME 
    AND column_name = 'updated_by' 
    AND table_schema = 'public'
  ) THEN
    NEW.updated_by = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$function$;
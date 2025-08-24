-- Fix concatenated line item IDs by handling identity column properly

-- Step 1: Remove identity constraint temporarily
ALTER TABLE report_line_items 
ALTER COLUMN report_line_item_id DROP IDENTITY;

-- Step 2: Update existing report_line_items with concatenated IDs
UPDATE report_line_items 
SET report_line_item_id = (report_structure_id * 10000) + (report_line_item_id % 10000)
WHERE report_line_item_id < 1000000; -- Only update non-concatenated IDs

-- Step 3: Update change logs to reference new concatenated IDs  
UPDATE report_structure_change_logs 
SET line_item_id = (structure_id * 10000) + (line_item_id % 10000)
WHERE line_item_id IS NOT NULL AND line_item_id < 1000000;

-- Step 4: Get the maximum current ID to set new identity start point
DO $$
DECLARE
    max_id INTEGER;
BEGIN
    SELECT MAX(report_line_item_id) INTO max_id FROM report_line_items;
    EXECUTE format('ALTER TABLE report_line_items ALTER COLUMN report_line_item_id ADD GENERATED ALWAYS AS IDENTITY (START WITH %s)', max_id + 1);
END $$;

-- Step 5: Create helper functions
CREATE OR REPLACE FUNCTION public.extract_structure_id_from_line_item_id(p_line_item_id integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT FLOOR(p_line_item_id / 10000);
$function$;

CREATE OR REPLACE FUNCTION public.get_next_concatenated_line_item_id(p_structure_id integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_max_local_id integer;
  v_base_id integer;
BEGIN
  -- Calculate the base ID for this structure
  v_base_id := p_structure_id * 10000;
  
  -- Find the highest local ID within this structure's range
  SELECT COALESCE(MAX(report_line_item_id % 10000), 0) INTO v_max_local_id
  FROM report_line_items 
  WHERE report_structure_id = p_structure_id;
  
  -- Return the next available concatenated ID
  RETURN v_base_id + v_max_local_id + 1;
END;
$function$;
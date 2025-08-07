-- Fix the search_path issues in the existing functions by setting proper search paths
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_single_active_structure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.report_structures 
    SET is_active = false 
    WHERE report_structure_id != NEW.report_structure_id 
    AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_node_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.report_line_items WHERE report_structure_id = NEW.report_structure_id) >= 300 THEN
    RAISE EXCEPTION 'Report structure cannot exceed 300 nodes. Current structure has reached the maximum limit.';
  END IF;
  RETURN NEW;
END;
$$;
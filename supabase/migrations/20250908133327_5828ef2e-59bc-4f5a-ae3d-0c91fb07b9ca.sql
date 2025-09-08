-- Remove the single active structure constraint trigger
DROP TRIGGER IF EXISTS ensure_single_active_structure ON report_structures;

-- Update the trigger function to allow multiple active structures
-- Since we're removing the constraint, we can drop the function too
DROP FUNCTION IF EXISTS public.ensure_single_active_structure();

-- Add a function to check if user can manage report structure status
CREATE OR REPLACE FUNCTION public.can_manage_report_structure_status()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT is_super_admin_user();
$$;
-- Fix security issues with user data exposure (corrected version)

-- 1. Update report_structures policy to require authentication
-- This prevents anonymous users from seeing any user information in report structures
DROP POLICY IF EXISTS "Users can view active report structures" ON public.report_structures;

CREATE POLICY "Authenticated users can view active report structures" 
ON public.report_structures 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- 2. Create a secure public view for report structures that doesn't expose user information
CREATE OR REPLACE VIEW public.public_report_structures AS
SELECT 
  report_structure_uuid,
  report_structure_name,
  version,
  created_at,
  updated_at,
  is_active
FROM public.report_structures
WHERE is_active = true;

-- 3. Allow public read access to the secure view
GRANT SELECT ON public.public_report_structures TO anon, authenticated;

-- 4. Update report_line_items policy to require authentication as well
DROP POLICY IF EXISTS "Users can view line items from active structures" ON public.report_line_items;

CREATE POLICY "Authenticated users can view line items from active structures" 
ON public.report_line_items 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1
  FROM public.report_structures
  WHERE report_structures.report_structure_uuid = report_line_items.report_structure_uuid 
  AND report_structures.is_active = true
));

-- 5. Ensure user_accounts table can never be accessed without proper authentication
-- Add an additional safety policy to explicitly deny anonymous access
CREATE POLICY "Deny anonymous access to user accounts" 
ON public.user_accounts 
FOR ALL 
TO anon
USING (false);

-- 6. Create a function for admins to safely view user summaries without exposing full details
CREATE OR REPLACE FUNCTION public.get_user_summary()
RETURNS TABLE(
  user_count bigint,
  active_users bigint,
  pending_users bigint,
  total_structures bigint
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*) as user_count,
    COUNT(*) FILTER (WHERE status = 'approved') as active_users,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_users,
    (SELECT COUNT(*) FROM report_structures) as total_structures
  FROM user_accounts
  WHERE is_admin_user_v2();
$$;

-- 7. Add RLS to the new view for extra security
ALTER VIEW public.public_report_structures SET (security_invoker = true);
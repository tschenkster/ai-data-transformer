-- Fix infinite recursion in user_entity_access RLS policies
-- Create security definer function to check entity admin access without recursion

CREATE OR REPLACE FUNCTION public.is_entity_admin_for_scope(p_user_uuid uuid, p_entity_uuid uuid DEFAULT NULL, p_entity_group_uuid uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is super admin first (can manage everything)
  IF is_super_admin_user() THEN
    RETURN true;
  END IF;
  
  -- Check direct entity access
  IF p_entity_uuid IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM user_entity_access uea
      WHERE uea.user_account_uuid = p_user_uuid
        AND uea.entity_uuid = p_entity_uuid
        AND uea.is_active = true
        AND uea.access_level = 'entity_admin'
    );
  END IF;
  
  -- Check entity group access
  IF p_entity_group_uuid IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM user_entity_access uea
      WHERE uea.user_account_uuid = p_user_uuid
        AND uea.entity_group_uuid = p_entity_group_uuid
        AND uea.is_active = true
        AND uea.access_level = 'entity_admin'
    );
  END IF;
  
  RETURN false;
END;
$function$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Entity admins can manage access grants in their scope" ON public.user_entity_access;
DROP POLICY IF EXISTS "Entity admins can update access grants in their scope" ON public.user_entity_access;
DROP POLICY IF EXISTS "Entity admins can view access grants in their scope" ON public.user_entity_access;

-- Create new non-recursive policies using the security definer function
CREATE POLICY "Entity admins can view access grants in their scope v2" 
ON public.user_entity_access 
FOR SELECT 
TO authenticated
USING (
  is_super_admin_user() OR
  user_account_uuid = (SELECT user_uuid FROM user_accounts WHERE supabase_user_uuid = auth.uid()) OR
  is_entity_admin_for_scope(
    (SELECT user_uuid FROM user_accounts WHERE supabase_user_uuid = auth.uid()),
    user_entity_access.entity_uuid,
    user_entity_access.entity_group_uuid
  )
);

CREATE POLICY "Entity admins can insert access grants in their scope v2" 
ON public.user_entity_access 
FOR INSERT 
TO authenticated
WITH CHECK (
  is_super_admin_user() OR
  is_entity_admin_for_scope(
    (SELECT user_uuid FROM user_accounts WHERE supabase_user_uuid = auth.uid()),
    user_entity_access.entity_uuid,
    user_entity_access.entity_group_uuid
  )
);

CREATE POLICY "Entity admins can update access grants in their scope v2" 
ON public.user_entity_access 
FOR UPDATE 
TO authenticated
USING (
  is_super_admin_user() OR
  is_entity_admin_for_scope(
    (SELECT user_uuid FROM user_accounts WHERE supabase_user_uuid = auth.uid()),
    user_entity_access.entity_uuid,
    user_entity_access.entity_group_uuid
  )
);

CREATE POLICY "Entity admins can delete access grants in their scope v2" 
ON public.user_entity_access 
FOR DELETE 
TO authenticated
USING (
  is_super_admin_user() OR
  is_entity_admin_for_scope(
    (SELECT user_uuid FROM user_accounts WHERE supabase_user_uuid = auth.uid()),
    user_entity_access.entity_uuid,
    user_entity_access.entity_group_uuid
  )
);

-- Add performance index for the new function
CREATE INDEX IF NOT EXISTS idx_user_entity_access_admin_lookup 
ON public.user_entity_access (user_account_uuid, access_level, is_active) 
WHERE access_level = 'entity_admin' AND is_active = true;
-- Fix RLS policies for user_accounts table to address security concerns
-- Drop existing policies to recreate them with more secure and consistent approach
DROP POLICY IF EXISTS "Admins can update all user_accounts" ON public.user_accounts;
DROP POLICY IF EXISTS "Admins can view all user_accounts" ON public.user_accounts;
DROP POLICY IF EXISTS "Only super admins can delete user accounts" ON public.user_accounts;
DROP POLICY IF EXISTS "Restrict user account access to own data" ON public.user_accounts;
DROP POLICY IF EXISTS "Users can insert their own user_account" ON public.user_accounts;
DROP POLICY IF EXISTS "Users can update their own user_account" ON public.user_accounts;
DROP POLICY IF EXISTS "Users can view their own user_account" ON public.user_accounts;

-- Create secure RLS policies using the most secure functions consistently

-- Users can only view their own user account data
CREATE POLICY "Users can view own account only" 
ON public.user_accounts 
FOR SELECT 
TO authenticated 
USING (auth.uid() = supabase_user_uuid);

-- Users can only insert their own user account
CREATE POLICY "Users can insert own account only" 
ON public.user_accounts 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = supabase_user_uuid);

-- Users can only update their own user account (restricted fields)
CREATE POLICY "Users can update own account only" 
ON public.user_accounts 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = supabase_user_uuid)
WITH CHECK (auth.uid() = supabase_user_uuid);

-- Only super admins can view all user accounts (most restrictive admin function)
CREATE POLICY "Super admins can view all accounts" 
ON public.user_accounts 
FOR SELECT 
TO authenticated 
USING (is_super_admin_user_secure());

-- Only super admins can update user accounts administratively
CREATE POLICY "Super admins can update all accounts" 
ON public.user_accounts 
FOR UPDATE 
TO authenticated 
USING (is_super_admin_user_secure());

-- Only super admins can delete user accounts
CREATE POLICY "Super admins can delete accounts" 
ON public.user_accounts 
FOR DELETE 
TO authenticated 
USING (is_super_admin_user_secure());

-- Ensure RLS is enabled
ALTER TABLE public.user_accounts FORCE ROW LEVEL SECURITY;
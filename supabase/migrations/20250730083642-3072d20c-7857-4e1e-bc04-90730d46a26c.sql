-- Rename profiles table to user_accounts
ALTER TABLE public.profiles RENAME TO user_accounts;

-- Drop existing policies on the old table name
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_accounts;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_accounts;
DROP POLICY IF EXISTS "System can insert profiles" ON public.user_accounts;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_accounts;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_accounts;

-- Create new RLS policies with updated names
CREATE POLICY "Admins can update all user_accounts" 
ON public.user_accounts 
FOR UPDATE 
USING (is_admin_user());

CREATE POLICY "Admins can view all user_accounts" 
ON public.user_accounts 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "System can insert user_accounts" 
ON public.user_accounts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own user_account" 
ON public.user_accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own user_account" 
ON public.user_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

-- Update the handle_new_user function to insert into user_accounts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_accounts (user_id, email, status, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    'pending',
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$function$;
-- Fix the search path issue for the is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Replace with your actual admin email
  RETURN (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@example.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';
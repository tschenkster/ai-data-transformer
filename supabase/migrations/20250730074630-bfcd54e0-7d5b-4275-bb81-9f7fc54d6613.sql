-- Update the is_admin_user function to use the correct admin email
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = auth.uid()) = 'thomas@cfo-team.de';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';
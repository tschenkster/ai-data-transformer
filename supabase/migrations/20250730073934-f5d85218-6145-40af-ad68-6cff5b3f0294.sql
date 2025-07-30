-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapping_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapping_decisions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Replace with your actual admin email
  RETURN (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@example.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Profiles table policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin_user());

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.is_admin_user());

CREATE POLICY "System can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- Account mappings policies
CREATE POLICY "Users can view their own mappings" 
ON public.account_mappings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mappings" 
ON public.account_mappings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mappings" 
ON public.account_mappings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mappings" 
ON public.account_mappings 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all mappings" 
ON public.account_mappings 
FOR ALL 
USING (public.is_admin_user());

-- Mapping sessions policies
CREATE POLICY "Users can view their own sessions" 
ON public.mapping_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" 
ON public.mapping_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.mapping_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" 
ON public.mapping_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" 
ON public.mapping_sessions 
FOR ALL 
USING (public.is_admin_user());

-- Mapping decisions policies
CREATE POLICY "Users can view their own decisions" 
ON public.mapping_decisions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own decisions" 
ON public.mapping_decisions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decisions" 
ON public.mapping_decisions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decisions" 
ON public.mapping_decisions 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all decisions" 
ON public.mapping_decisions 
FOR ALL 
USING (public.is_admin_user());
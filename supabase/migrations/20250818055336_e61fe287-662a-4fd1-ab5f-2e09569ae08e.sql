-- Fix Critical Security Issues

-- 1. Add missing DELETE policy for user_accounts table
CREATE POLICY "Only super admins can delete user accounts" 
ON public.user_accounts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  )
);

-- 2. Create user roles system
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'super_admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer functions to safely check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user_v2()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin_user()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  );
$$;

-- 4. Create policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.is_admin_user_v2());

CREATE POLICY "Super admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.is_super_admin_user());

-- 5. Add audit logging table
CREATE TABLE public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_user_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (public.is_admin_user_v2());

-- 6. Add function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    target_user_id,
    details
  ) VALUES (
    auth.uid(),
    p_action,
    p_target_user_id,
    p_details
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 7. Initialize super admin role for existing admin user
INSERT INTO public.user_roles (user_id, role, assigned_by)
SELECT 
  au.id,
  'super_admin'::app_role,
  au.id
FROM auth.users au
WHERE au.email = 'thomas@cfo-team.de'
ON CONFLICT (user_id, role) DO NOTHING;

-- 8. Add trigger to automatically assign 'user' role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 9. Update existing RLS policies to use new role system (keeping old function as fallback)
-- Update user_accounts policies
DROP POLICY IF EXISTS "Admins can view all user_accounts" ON public.user_accounts;
DROP POLICY IF EXISTS "Admins can update all user_accounts" ON public.user_accounts;

CREATE POLICY "Admins can view all user_accounts" 
ON public.user_accounts 
FOR SELECT 
USING (public.is_admin_user_v2() OR is_admin_user());

CREATE POLICY "Admins can update all user_accounts" 
ON public.user_accounts 
FOR UPDATE 
USING (public.is_admin_user_v2() OR is_admin_user());

-- Update report structures policies
DROP POLICY IF EXISTS "Admins can view all report structures" ON public.report_structures;
DROP POLICY IF EXISTS "Admins can insert report structures" ON public.report_structures;
DROP POLICY IF EXISTS "Admins can update report structures" ON public.report_structures;
DROP POLICY IF EXISTS "Admins can delete report structures" ON public.report_structures;

CREATE POLICY "Admins can view all report structures" 
ON public.report_structures 
FOR SELECT 
USING (public.is_admin_user_v2() OR is_admin_user());

CREATE POLICY "Admins can insert report structures" 
ON public.report_structures 
FOR INSERT 
WITH CHECK (public.is_admin_user_v2() OR is_admin_user());

CREATE POLICY "Admins can update report structures" 
ON public.report_structures 
FOR UPDATE 
USING (public.is_admin_user_v2() OR is_admin_user());

CREATE POLICY "Admins can delete report structures" 
ON public.report_structures 
FOR DELETE 
USING (public.is_admin_user_v2() OR is_admin_user());

-- Update report line items policies
DROP POLICY IF EXISTS "Admins can view all report line items" ON public.report_line_items;
DROP POLICY IF EXISTS "Admins can insert report line items" ON public.report_line_items;
DROP POLICY IF EXISTS "Admins can update report line items" ON public.report_line_items;
DROP POLICY IF EXISTS "Admins can delete report line items" ON public.report_line_items;

CREATE POLICY "Admins can view all report line items" 
ON public.report_line_items 
FOR SELECT 
USING (public.is_admin_user_v2() OR is_admin_user());

CREATE POLICY "Admins can insert report line items" 
ON public.report_line_items 
FOR INSERT 
WITH CHECK (public.is_admin_user_v2() OR is_admin_user());

CREATE POLICY "Admins can update report line items" 
ON public.report_line_items 
FOR UPDATE 
USING (public.is_admin_user_v2() OR is_admin_user());

CREATE POLICY "Admins can delete report line items" 
ON public.report_line_items 
FOR DELETE 
USING (public.is_admin_user_v2() OR is_admin_user());

-- Update change log policies
DROP POLICY IF EXISTS "Admins can view all change logs" ON public.report_structures_change_log;

CREATE POLICY "Admins can view all change logs" 
ON public.report_structures_change_log 
FOR ALL 
USING (public.is_admin_user_v2() OR is_admin_user());

-- Update other table policies similarly
UPDATE public.user_accounts 
SET status = 'approved', approved_at = now(), approved_by = (
  SELECT id FROM auth.users WHERE email = 'thomas@cfo-team.de'
)
WHERE supabase_user_uuid = (
  SELECT id FROM auth.users WHERE email = 'thomas@cfo-team.de'
) AND status = 'pending';
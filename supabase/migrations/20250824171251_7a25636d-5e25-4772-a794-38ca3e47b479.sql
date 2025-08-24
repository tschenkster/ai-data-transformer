-- Create new enum with correct roles
CREATE TYPE new_app_role AS ENUM ('super_admin', 'entity_admin', 'viewer');

-- Update functions to use the new enum type temporarily
-- First, let's update the has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role new_app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role::text = _role::text
  );
$function$;

-- Update invite_user_with_role function
CREATE OR REPLACE FUNCTION public.invite_user_with_role(p_email text, p_first_name text DEFAULT NULL::text, p_last_name text DEFAULT NULL::text, p_role new_app_role DEFAULT 'viewer'::new_app_role, p_invited_by_uuid uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM user_accounts WHERE email = p_email) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User with this email already exists'
    );
  END IF;
  
  -- Create user account record with pending status
  INSERT INTO user_accounts (
    email,
    first_name, 
    last_name,
    status,
    status_enum
  ) VALUES (
    p_email,
    p_first_name,
    p_last_name,
    'pending',
    'pending'
  );
  
  -- Log invitation event
  PERFORM log_security_event(
    'user_invited',
    NULL, -- No target user ID yet
    jsonb_build_object(
      'invited_email', p_email,
      'invited_role', p_role,
      'invited_by', p_invited_by_uuid
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'User invitation prepared successfully'
  );
END;
$function$;

-- Add a temporary column with the new enum type
ALTER TABLE user_roles ADD COLUMN new_role new_app_role;

-- Map existing roles to new roles
UPDATE user_roles 
SET new_role = CASE 
  WHEN role = 'super_admin' THEN 'super_admin'::new_app_role
  WHEN role = 'admin' THEN 'entity_admin'::new_app_role
  WHEN role = 'user' THEN 'viewer'::new_app_role
  ELSE 'viewer'::new_app_role
END;

-- Drop the old column and rename the new one
ALTER TABLE user_roles DROP COLUMN role;
ALTER TABLE user_roles RENAME COLUMN new_role TO role;

-- Drop the old enum and rename the new one
DROP TYPE app_role CASCADE;
ALTER TYPE new_app_role RENAME TO app_role;

-- Update the default value for new users
ALTER TABLE user_roles ALTER COLUMN role SET DEFAULT 'viewer'::app_role;

-- Recreate the functions with the proper enum name
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
$function$;

CREATE OR REPLACE FUNCTION public.invite_user_with_role(p_email text, p_first_name text DEFAULT NULL::text, p_last_name text DEFAULT NULL::text, p_role app_role DEFAULT 'viewer'::app_role, p_invited_by_uuid uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM user_accounts WHERE email = p_email) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User with this email already exists'
    );
  END IF;
  
  -- Create user account record with pending status
  INSERT INTO user_accounts (
    email,
    first_name, 
    last_name,
    status,
    status_enum
  ) VALUES (
    p_email,
    p_first_name,
    p_last_name,
    'pending',
    'pending'
  );
  
  -- Log invitation event
  PERFORM log_security_event(
    'user_invited',
    NULL, -- No target user ID yet
    jsonb_build_object(
      'invited_email', p_email,
      'invited_role', p_role,
      'invited_by', p_invited_by_uuid
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'User invitation prepared successfully'
  );
END;
$function$;

-- Update the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer'::app_role);
  RETURN NEW;
END;
$function$;
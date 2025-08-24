-- Update the app_role enum to match the intended role system
-- Note: PostgreSQL doesn't allow direct modification of enums with existing data
-- So we need to create a new enum and migrate the data

-- Create new enum with correct roles
CREATE TYPE new_app_role AS ENUM ('super_admin', 'entity_admin', 'viewer');

-- Add a temporary column with the new enum type
ALTER TABLE user_roles ADD COLUMN new_role new_app_role;

-- Map existing roles to new roles
UPDATE user_roles 
SET new_role = CASE 
  WHEN role = 'super_admin' THEN 'super_admin'::new_app_role
  WHEN role = 'admin' THEN 'entity_admin'::new_app_role
  WHEN role = 'user' THEN 'viewer'::new_app_role
  WHEN role = 'moderator' THEN 'entity_admin'::new_app_role
  ELSE 'viewer'::new_app_role
END;

-- Drop the old column and rename the new one
ALTER TABLE user_roles DROP COLUMN role;
ALTER TABLE user_roles RENAME COLUMN new_role TO role;

-- Drop the old enum and rename the new one
DROP TYPE app_role;
ALTER TYPE new_app_role RENAME TO app_role;

-- Update the default value for new users (they should be viewers by default)
ALTER TABLE user_roles ALTER COLUMN role SET DEFAULT 'viewer'::app_role;

-- Update any triggers or functions that reference the old role values
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
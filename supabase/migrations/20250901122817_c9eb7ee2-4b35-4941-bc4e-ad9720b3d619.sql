-- Fix enum data inconsistency: Update old "admin" role references to "super_admin"

-- First, let's check what roles exist in the enum
-- The app_role enum should contain: 'super_admin', 'entity_admin', 'viewer'

-- Update any references to 'admin' role to 'super_admin' in user_roles table
UPDATE public.user_roles 
SET role = 'super_admin'::app_role
WHERE role::text = 'admin';

-- Also check if there are any other invalid enum values and log them
DO $$
DECLARE
  invalid_count integer;
BEGIN
  -- Count any remaining invalid role values
  SELECT COUNT(*) INTO invalid_count
  FROM public.user_roles 
  WHERE role::text NOT IN ('super_admin', 'entity_admin', 'viewer');
  
  IF invalid_count > 0 THEN
    RAISE NOTICE 'Found % rows with invalid role values that need manual review', invalid_count;
    
    -- Log this as a security event
    PERFORM log_security_event(
      'invalid_role_data_found',
      auth.uid(),
      jsonb_build_object(
        'invalid_count', invalid_count,
        'fix_applied', true,
        'timestamp', now()
      )
    );
  END IF;
END $$;
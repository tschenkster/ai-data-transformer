-- Phase 1: Critical Database Security Fixes

-- 1. Fix Database Function Search Paths
CREATE OR REPLACE FUNCTION public.get_user_accessible_entities(p_user_uuid uuid)
 RETURNS TABLE(entity_uuid uuid, entity_name text, entity_code text, access_level text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Super admins can see all entities
  IF is_super_admin_user() THEN
    RETURN QUERY
    SELECT e.entity_uuid, e.entity_name, e.entity_code, 'super_admin'::text as access_level
    FROM entities e
    WHERE e.is_active = true
    ORDER BY e.entity_name;
  ELSE
    -- Regular users see only entities they have access to
    RETURN QUERY
    SELECT e.entity_uuid, e.entity_name, e.entity_code, uea.access_level::text
    FROM entities e
    JOIN user_entity_access uea ON e.entity_uuid = uea.entity_uuid
    WHERE uea.user_uuid = p_user_uuid
    AND uea.is_active = true
    AND e.is_active = true
    ORDER BY e.entity_name;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_entity_access(p_user_uuid uuid, p_entity_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Super admins have access to all entities
  IF is_super_admin_user() THEN
    RETURN true;
  END IF;
  
  -- Check if user has direct access to the entity
  RETURN EXISTS (
    SELECT 1 
    FROM user_entity_access uea
    WHERE uea.user_uuid = p_user_uuid
    AND uea.entity_uuid = p_entity_uuid
    AND uea.is_active = true
  );
END;
$function$;

-- 2. Restrict Public Data Access - Remove public policies and add authenticated policies

-- Drop existing public policies
DROP POLICY IF EXISTS "Anyone can view UI translations" ON public.ui_translations;
DROP POLICY IF EXISTS "Anyone can view enabled languages" ON public.system_languages;

-- Create new authenticated-only policies for ui_translations
CREATE POLICY "Authenticated users can view UI translations" 
ON public.ui_translations 
FOR SELECT 
TO authenticated
USING (true);

-- Create new authenticated-only policies for system_languages  
CREATE POLICY "Authenticated users can view enabled languages" 
ON public.system_languages 
FOR SELECT 
TO authenticated
USING (is_enabled = true);

-- 3. Add security monitoring trigger for function changes
CREATE OR REPLACE FUNCTION public.log_security_function_changes()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF obj.object_type = 'function' AND obj.schema_name = 'public' THEN
      PERFORM log_security_event(
        'security_function_modified',
        auth.uid(),
        jsonb_build_object(
          'function_name', obj.object_identity,
          'command_tag', obj.command_tag,
          'schema_name', obj.schema_name
        )
      );
    END IF;
  END LOOP;
END;
$function$;

-- Create the event trigger
DROP EVENT TRIGGER IF EXISTS security_function_changes;
CREATE EVENT TRIGGER security_function_changes
ON ddl_command_end
WHEN TAG IN ('CREATE FUNCTION', 'ALTER FUNCTION', 'DROP FUNCTION')
EXECUTE FUNCTION log_security_function_changes();
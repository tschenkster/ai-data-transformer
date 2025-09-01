-- Fix the remaining migration functions with missing search_path

CREATE OR REPLACE FUNCTION public.migrate_ui_translations_null_values()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  updated_count integer;
  result jsonb;
BEGIN
  -- Check if user has super admin privileges
  IF NOT is_super_admin_user_secure() THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;

  -- Update NULL translated_text values to original_text or a default value
  UPDATE ui_translations 
  SET 
    translated_text = COALESCE(original_text, '[Translation Missing]'),
    source = 'system_migration',
    updated_at = now(),
    updated_by = auth.uid()
  WHERE translated_text IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Log the migration action
  PERFORM log_security_event(
    'ui_translations_null_migration',
    auth.uid(),
    jsonb_build_object(
      'updated_records', updated_count,
      'timestamp', now()
    )
  );
  
  result := jsonb_build_object(
    'success', true,
    'updated_records', updated_count,
    'message', format('Successfully migrated %s UI translation records with NULL values', updated_count)
  );
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.migrate_report_structures_translations_null_values()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  updated_count integer;
  result jsonb;
BEGIN
  -- Check if user has super admin privileges
  IF NOT is_super_admin_user_secure() THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;

  -- Update NULL translated_text values to original_text or a default value
  UPDATE report_structures_translations 
  SET 
    translated_text = COALESCE(original_text, '[Translation Missing]'),
    source = 'system_migration',
    updated_at = now(),
    updated_by = auth.uid()
  WHERE translated_text IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Log the migration action
  PERFORM log_security_event(
    'report_structures_translations_null_migration',
    auth.uid(),
    jsonb_build_object(
      'updated_records', updated_count,
      'timestamp', now()
    )
  );
  
  result := jsonb_build_object(
    'success', true,
    'updated_records', updated_count,
    'message', format('Successfully migrated %s report structure translation records with NULL values', updated_count)
  );
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.migrate_report_line_items_translations_null_values()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  updated_count integer;
  result jsonb;
BEGIN
  -- Check if user has super admin privileges
  IF NOT is_super_admin_user_secure() THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;

  -- Update NULL translated_text values to original_text or a default value
  UPDATE report_line_items_translations 
  SET 
    translated_text = COALESCE(original_text, '[Translation Missing]'),
    source = 'system_migration',
    updated_at = now(),
    updated_by = auth.uid()
  WHERE translated_text IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Log the migration action
  PERFORM log_security_event(
    'report_line_items_translations_null_migration',
    auth.uid(),
    jsonb_build_object(
      'updated_records', updated_count,
      'timestamp', now()
    )
  );
  
  result := jsonb_build_object(
    'success', true,
    'updated_records', updated_count,
    'message', format('Successfully migrated %s line item translation records with NULL values', updated_count)
  );
  
  RETURN result;
END;
$function$;
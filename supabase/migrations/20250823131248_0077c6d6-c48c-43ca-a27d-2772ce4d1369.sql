-- Phase 4.1 Part 3: Update triggers and create enhanced functions with new relationships

-- Update the audit_user_account_changes trigger function to use new column names
CREATE OR REPLACE FUNCTION public.audit_user_account_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log status changes using new function and table name
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM log_security_event(
      'user_status_changed',
      NEW.supabase_user_uuid,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'user_email', NEW.email,
        'user_account_uuid', NEW.user_account_uuid
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Enhanced function to get user summary using new relationships
CREATE OR REPLACE FUNCTION public.get_enhanced_user_summary()
RETURNS TABLE(
  user_count bigint, 
  active_users bigint, 
  pending_users bigint, 
  total_structures bigint,
  total_line_items bigint,
  recent_logins bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as user_count,
    COUNT(*) FILTER (WHERE ua.status = 'approved')::bigint as active_users,
    COUNT(*) FILTER (WHERE ua.status = 'pending')::bigint as pending_users,
    (SELECT COUNT(*) FROM report_structures)::bigint as total_structures,
    (SELECT COUNT(*) FROM report_line_items)::bigint as total_line_items,
    COUNT(*) FILTER (WHERE ua.last_login_at > now() - interval '7 days')::bigint as recent_logins
  FROM user_accounts ua
  WHERE is_admin_user_v2();
END;
$function$;

-- Enhanced function to get user roles with account details
CREATE OR REPLACE FUNCTION public.get_user_with_roles(p_supabase_user_uuid uuid)
RETURNS TABLE(
  user_account_uuid uuid,
  email text,
  first_name text,
  last_name text,
  status text,
  roles text[],
  is_admin boolean,
  is_super_admin boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ua.user_account_uuid,
    ua.email,
    ua.first_name,
    ua.last_name,
    ua.status,
    COALESCE(ARRAY_AGG(ur.role ORDER BY ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}')::text[] as roles,
    EXISTS(SELECT 1 FROM user_roles ur2 WHERE ur2.user_account_uuid = ua.user_account_uuid AND ur2.role IN ('admin', 'super_admin')) as is_admin,
    EXISTS(SELECT 1 FROM user_roles ur3 WHERE ur3.user_account_uuid = ua.user_account_uuid AND ur3.role = 'super_admin') as is_super_admin
  FROM user_accounts ua
  LEFT JOIN user_roles ur ON ur.user_account_uuid = ua.user_account_uuid
  WHERE ua.supabase_user_uuid = p_supabase_user_uuid
  GROUP BY ua.user_account_uuid, ua.email, ua.first_name, ua.last_name, ua.status;
END;
$function$;

-- Function to get report structure with creator details using new relationships
CREATE OR REPLACE FUNCTION public.get_report_structure_with_creator(p_structure_uuid uuid)
RETURNS TABLE(
  report_structure_uuid uuid,
  report_structure_name text,
  version integer,
  is_active boolean,
  created_at timestamptz,
  creator_name text,
  creator_email text,
  line_item_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    rs.report_structure_uuid,
    rs.report_structure_name,
    rs.version,
    rs.is_active,
    rs.created_at,
    COALESCE(ua.first_name || ' ' || ua.last_name, ua.email) as creator_name,
    ua.email as creator_email,
    (SELECT COUNT(*) FROM report_line_items rli WHERE rli.report_structure_uuid = rs.report_structure_uuid)::bigint as line_item_count
  FROM report_structures rs
  LEFT JOIN user_accounts ua ON ua.supabase_user_uuid = rs.created_by_supabase_user_uuid
  WHERE rs.report_structure_uuid = p_structure_uuid;
END;
$function$;
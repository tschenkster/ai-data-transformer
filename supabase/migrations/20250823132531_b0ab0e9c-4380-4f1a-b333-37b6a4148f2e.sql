-- Phase 5.1 Part 4: Add constraints and helper functions for ENUMs

-- Make ENUM columns NOT NULL with proper defaults
ALTER TABLE public.user_accounts 
ALTER COLUMN status_enum SET NOT NULL,
ALTER COLUMN status_enum SET DEFAULT 'pending';

ALTER TABLE public.coa_translation_sessions 
ALTER COLUMN status_enum SET NOT NULL,
ALTER COLUMN status_enum SET DEFAULT 'pending';

ALTER TABLE public.report_structures 
ALTER COLUMN lifecycle_status SET NOT NULL;

-- Create additional helper functions for status queries
CREATE OR REPLACE FUNCTION public.get_users_by_status(p_status public.user_account_status)
RETURNS TABLE(
  user_account_uuid uuid,
  email text,
  first_name text,
  last_name text,
  status_enum public.user_account_status,
  created_at timestamptz,
  updated_at timestamptz
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
    ua.status_enum,
    ua.created_at,
    ua.updated_at
  FROM public.user_accounts ua
  WHERE ua.status_enum = p_status
  AND (is_admin_user_v2() OR auth.uid() = ua.supabase_user_uuid)
  ORDER BY ua.updated_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_translation_sessions_by_status(p_status public.translation_session_status)
RETURNS TABLE(
  coa_translation_session_uuid uuid,
  filename text,
  status_enum public.translation_session_status,
  total_accounts integer,
  processed_accounts integer,
  progress_percentage decimal,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ts.coa_translation_session_uuid,
    ts.filename,
    ts.status_enum,
    ts.total_accounts,
    ts.processed_accounts,
    ts.progress_percentage,
    ts.created_at,
    ts.updated_at
  FROM public.coa_translation_sessions ts
  WHERE ts.status_enum = p_status
  AND (is_admin_user_v2() OR auth.uid() = ts.user_id)
  ORDER BY ts.updated_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_report_structures_by_lifecycle_status(p_status public.report_structure_lifecycle_status)
RETURNS TABLE(
  report_structure_uuid uuid,
  report_structure_name text,
  lifecycle_status public.report_structure_lifecycle_status,
  version integer,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
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
    rs.lifecycle_status,
    rs.version,
    rs.is_active,
    rs.created_at,
    rs.updated_at
  FROM public.report_structures rs
  WHERE rs.lifecycle_status = p_status
  ORDER BY rs.updated_at DESC;
END;
$function$;

-- Create function to get all valid status transitions for a given status
CREATE OR REPLACE FUNCTION public.get_valid_user_account_status_transitions(p_current_status public.user_account_status)
RETURNS public.user_account_status[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  valid_statuses public.user_account_status[] := '{}';
  test_status public.user_account_status;
BEGIN
  -- Test all possible enum values to find valid transitions
  FOR test_status IN SELECT unnest(enum_range(NULL::public.user_account_status)) LOOP
    IF is_valid_user_account_status_transition(p_current_status, test_status) THEN
      valid_statuses := array_append(valid_statuses, test_status);
    END IF;
  END LOOP;
  
  RETURN valid_statuses;
END;
$function$;

-- Create indexes for efficient status-based queries
CREATE INDEX IF NOT EXISTS idx_user_accounts_status_enum 
ON public.user_accounts(status_enum);

CREATE INDEX IF NOT EXISTS idx_coa_translation_sessions_status_enum 
ON public.coa_translation_sessions(status_enum);

CREATE INDEX IF NOT EXISTS idx_report_structures_lifecycle_status 
ON public.report_structures(lifecycle_status);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_user_accounts_status_created 
ON public.user_accounts(status_enum, created_at);

CREATE INDEX IF NOT EXISTS idx_coa_translation_sessions_status_updated 
ON public.coa_translation_sessions(status_enum, updated_at);

CREATE INDEX IF NOT EXISTS idx_report_structures_lifecycle_active 
ON public.report_structures(lifecycle_status, is_active);
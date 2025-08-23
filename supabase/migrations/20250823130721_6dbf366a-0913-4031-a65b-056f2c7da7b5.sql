-- Phase 3.2: Standardize Foreign Key References

-- Step 1: Add new UUID columns that will reference user_accounts.user_account_uuid
ALTER TABLE public.report_structures 
ADD COLUMN IF NOT EXISTS archived_by_user_account_uuid UUID;

ALTER TABLE public.report_line_items 
ADD COLUMN IF NOT EXISTS created_by_user_account_uuid UUID,
ADD COLUMN IF NOT EXISTS updated_by_user_account_uuid UUID;

ALTER TABLE public.coa_translation_sessions 
ADD COLUMN IF NOT EXISTS user_account_uuid UUID;

ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS assigned_by_user_account_uuid UUID,
ADD COLUMN IF NOT EXISTS user_account_uuid UUID;

ALTER TABLE public.security_audit_logs 
ADD COLUMN IF NOT EXISTS user_account_uuid UUID,
ADD COLUMN IF NOT EXISTS target_user_account_uuid UUID;

-- Step 2: Populate new UUID columns with data from user_accounts table
UPDATE public.report_structures 
SET archived_by_user_account_uuid = ua.user_account_uuid
FROM public.user_accounts ua
WHERE report_structures.archived_by = ua.supabase_user_uuid
AND report_structures.archived_by_user_account_uuid IS NULL;

UPDATE public.report_line_items 
SET created_by_user_account_uuid = ua.user_account_uuid
FROM public.user_accounts ua
WHERE report_line_items.created_by = ua.supabase_user_uuid
AND report_line_items.created_by_user_account_uuid IS NULL;

UPDATE public.report_line_items 
SET updated_by_user_account_uuid = ua.user_account_uuid
FROM public.user_accounts ua
WHERE report_line_items.updated_by = ua.supabase_user_uuid
AND report_line_items.updated_by_user_account_uuid IS NULL;

UPDATE public.coa_translation_sessions 
SET user_account_uuid = ua.user_account_uuid
FROM public.user_accounts ua
WHERE coa_translation_sessions.user_id = ua.supabase_user_uuid
AND coa_translation_sessions.user_account_uuid IS NULL;

UPDATE public.user_roles 
SET assigned_by_user_account_uuid = ua.user_account_uuid
FROM public.user_accounts ua
WHERE user_roles.assigned_by = ua.supabase_user_uuid
AND user_roles.assigned_by_user_account_uuid IS NULL;

UPDATE public.user_roles 
SET user_account_uuid = ua.user_account_uuid
FROM public.user_accounts ua
WHERE user_roles.user_id = ua.supabase_user_uuid
AND user_roles.user_account_uuid IS NULL;

UPDATE public.security_audit_logs 
SET user_account_uuid = ua.user_account_uuid
FROM public.user_accounts ua
WHERE security_audit_logs.user_id = ua.supabase_user_uuid
AND security_audit_logs.user_account_uuid IS NULL;

UPDATE public.security_audit_logs 
SET target_user_account_uuid = ua.user_account_uuid
FROM public.user_accounts ua
WHERE security_audit_logs.target_user_id = ua.supabase_user_uuid
AND security_audit_logs.target_user_account_uuid IS NULL;
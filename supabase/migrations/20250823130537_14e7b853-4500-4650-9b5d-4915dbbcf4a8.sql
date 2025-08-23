-- Phase 3.1: Rename All Constraints to Standard Naming Patterns

-- Primary Key Constraints
ALTER TABLE public.coa_translation_sessions 
DROP CONSTRAINT IF EXISTS coa_translation_sessions_pkey CASCADE,
ADD CONSTRAINT pk_coa_translation_sessions PRIMARY KEY (coa_translation_session_uuid);

ALTER TABLE public.report_line_items 
DROP CONSTRAINT IF EXISTS report_line_items_pkey CASCADE,
ADD CONSTRAINT pk_report_line_items PRIMARY KEY (report_line_item_uuid);

ALTER TABLE public.report_structure_change_logs 
DROP CONSTRAINT IF EXISTS report_structures_change_log_pkey CASCADE,
ADD CONSTRAINT pk_report_structure_change_logs PRIMARY KEY (change_uuid);

ALTER TABLE public.report_structures 
DROP CONSTRAINT IF EXISTS report_structures_pkey CASCADE,
ADD CONSTRAINT pk_report_structures PRIMARY KEY (report_structure_uuid);

ALTER TABLE public.security_audit_logs 
DROP CONSTRAINT IF EXISTS security_audit_log_pkey CASCADE,
ADD CONSTRAINT pk_security_audit_logs PRIMARY KEY (security_audit_log_uuid);

ALTER TABLE public.user_accounts 
DROP CONSTRAINT IF EXISTS user_accounts_pkey CASCADE,
ADD CONSTRAINT pk_user_accounts PRIMARY KEY (user_account_uuid);

ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_pkey CASCADE,
ADD CONSTRAINT pk_user_roles PRIMARY KEY (user_role_uuid);

-- Unique Constraints
ALTER TABLE public.coa_translation_sessions 
DROP CONSTRAINT IF EXISTS coa_translation_sessions_session_id_key CASCADE,
ADD CONSTRAINT uq_coa_translation_sessions_session_id UNIQUE (session_id);

ALTER TABLE public.report_line_items 
DROP CONSTRAINT IF EXISTS report_line_items_report_line_item_id_key CASCADE,
ADD CONSTRAINT uq_report_line_items_id UNIQUE (report_line_item_id);

ALTER TABLE public.report_structure_change_logs 
DROP CONSTRAINT IF EXISTS report_structures_change_log_change_id_key CASCADE,
ADD CONSTRAINT uq_report_structure_change_logs_change_id UNIQUE (change_id);

ALTER TABLE public.report_structures 
DROP CONSTRAINT IF EXISTS report_structures_report_structure_id_key CASCADE,
ADD CONSTRAINT uq_report_structures_id UNIQUE (report_structure_id);

ALTER TABLE public.user_accounts 
DROP CONSTRAINT IF EXISTS user_accounts_supabase_user_uuid_key CASCADE,
ADD CONSTRAINT uq_user_accounts_supabase_user_uuid UNIQUE (supabase_user_uuid);

ALTER TABLE public.user_accounts 
DROP CONSTRAINT IF EXISTS user_accounts_user_account_id_key CASCADE,
ADD CONSTRAINT uq_user_accounts_id UNIQUE (user_account_id);

ALTER TABLE public.user_accounts 
DROP CONSTRAINT IF EXISTS user_accounts_email_key CASCADE,
ADD CONSTRAINT uq_user_accounts_email UNIQUE (email);

ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key CASCADE,
ADD CONSTRAINT uq_user_roles_user_id_role UNIQUE (user_id, role);

-- Check Constraints  
ALTER TABLE public.report_line_items 
DROP CONSTRAINT IF EXISTS report_line_items_sort_order_check CASCADE,
ADD CONSTRAINT chk_report_line_items_sort_order_non_negative CHECK (sort_order >= 0);

ALTER TABLE public.user_accounts 
DROP CONSTRAINT IF EXISTS user_accounts_status_check CASCADE,
ADD CONSTRAINT chk_user_accounts_status_valid CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.user_accounts 
DROP CONSTRAINT IF EXISTS user_accounts_failed_login_attempts_check CASCADE,
ADD CONSTRAINT chk_user_accounts_failed_login_attempts_non_negative CHECK (failed_login_attempts >= 0);

ALTER TABLE public.coa_translation_sessions 
DROP CONSTRAINT IF EXISTS coa_translation_sessions_status_check CASCADE,
ADD CONSTRAINT chk_coa_translation_sessions_status_valid CHECK (status IN ('processing', 'completed', 'failed', 'cancelled'));

ALTER TABLE public.coa_translation_sessions 
DROP CONSTRAINT IF EXISTS coa_translation_sessions_progress_check CASCADE,
ADD CONSTRAINT chk_coa_translation_sessions_progress_valid CHECK (progress_percentage >= 0.00 AND progress_percentage <= 100.00);
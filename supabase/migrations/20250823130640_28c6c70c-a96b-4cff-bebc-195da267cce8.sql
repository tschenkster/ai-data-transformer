-- Phase 3.1: Rename Constraints to Standard Naming Patterns (Proper Method)

-- Rename Primary Key Indexes (these are automatically named based on constraint names)
ALTER INDEX IF EXISTS report_structures_change_log_pkey RENAME TO pk_report_structure_change_logs;
ALTER INDEX IF EXISTS report_structures_pkey RENAME TO pk_report_structures; 
ALTER INDEX IF EXISTS report_line_items_pkey RENAME TO pk_report_line_items;
ALTER INDEX IF EXISTS user_accounts_compliant_pkey RENAME TO pk_user_accounts;
ALTER INDEX IF EXISTS coa_translation_sessions_pkey RENAME TO pk_coa_translation_sessions;
ALTER INDEX IF EXISTS user_roles_pkey RENAME TO pk_user_roles;
ALTER INDEX IF EXISTS security_audit_log_pkey RENAME TO pk_security_audit_logs;

-- Rename Unique Indexes  
ALTER INDEX IF EXISTS report_structures_change_log_change_id_key RENAME TO uq_report_structure_change_logs_change_id;
ALTER INDEX IF EXISTS report_structures_report_structure_id_key RENAME TO uq_report_structures_id;
ALTER INDEX IF EXISTS report_line_items_report_line_item_id_key RENAME TO uq_report_line_items_id;
ALTER INDEX IF EXISTS user_accounts_compliant_user_account_id_key RENAME TO uq_user_accounts_id;
ALTER INDEX IF EXISTS coa_translation_sessions_session_id_key RENAME TO uq_coa_translation_sessions_session_id;
ALTER INDEX IF EXISTS user_roles_user_id_role_key RENAME TO uq_user_roles_user_id_role;

-- Rename existing indexes to follow idx_ pattern
ALTER INDEX IF EXISTS idx_report_structures_active RENAME TO idx_report_structures_is_active;
ALTER INDEX IF EXISTS idx_report_structures_created_by RENAME TO idx_report_structures_created_by_user;
ALTER INDEX IF EXISTS unique_sort_order_per_structure RENAME TO uq_report_line_items_structure_sort_order;

-- Add missing unique constraint for user_accounts email if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_user_accounts_email'
    ) THEN
        ALTER TABLE public.user_accounts 
        ADD CONSTRAINT uq_user_accounts_email UNIQUE (email);
    END IF;
END $$;

-- Add missing unique constraint for user_accounts supabase_user_uuid if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_user_accounts_supabase_user_uuid'
    ) THEN
        ALTER TABLE public.user_accounts 
        ADD CONSTRAINT uq_user_accounts_supabase_user_uuid UNIQUE (supabase_user_uuid);
    END IF;
END $$;
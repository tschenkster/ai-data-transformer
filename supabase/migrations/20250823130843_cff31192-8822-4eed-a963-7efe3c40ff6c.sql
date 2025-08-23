-- Phase 3.2 Part 2: Add Foreign Key Constraints for New UUID Columns

-- Add foreign key constraints for new user_account_uuid columns
ALTER TABLE public.report_structures
ADD CONSTRAINT fk_report_structures_archived_by_user_account 
FOREIGN KEY (archived_by_user_account_uuid) 
REFERENCES public.user_accounts(user_account_uuid) ON DELETE SET NULL;

ALTER TABLE public.report_line_items
ADD CONSTRAINT fk_report_line_items_created_by_user_account 
FOREIGN KEY (created_by_user_account_uuid) 
REFERENCES public.user_accounts(user_account_uuid) ON DELETE SET NULL;

ALTER TABLE public.report_line_items
ADD CONSTRAINT fk_report_line_items_updated_by_user_account 
FOREIGN KEY (updated_by_user_account_uuid) 
REFERENCES public.user_accounts(user_account_uuid) ON DELETE SET NULL;

ALTER TABLE public.coa_translation_sessions
ADD CONSTRAINT fk_coa_translation_sessions_user_account 
FOREIGN KEY (user_account_uuid) 
REFERENCES public.user_accounts(user_account_uuid) ON DELETE CASCADE;

ALTER TABLE public.user_roles
ADD CONSTRAINT fk_user_roles_assigned_by_user_account 
FOREIGN KEY (assigned_by_user_account_uuid) 
REFERENCES public.user_accounts(user_account_uuid) ON DELETE SET NULL;

ALTER TABLE public.user_roles
ADD CONSTRAINT fk_user_roles_user_account 
FOREIGN KEY (user_account_uuid) 
REFERENCES public.user_accounts(user_account_uuid) ON DELETE CASCADE;

ALTER TABLE public.security_audit_logs
ADD CONSTRAINT fk_security_audit_logs_user_account 
FOREIGN KEY (user_account_uuid) 
REFERENCES public.user_accounts(user_account_uuid) ON DELETE SET NULL;

ALTER TABLE public.security_audit_logs
ADD CONSTRAINT fk_security_audit_logs_target_user_account 
FOREIGN KEY (target_user_account_uuid) 
REFERENCES public.user_accounts(user_account_uuid) ON DELETE SET NULL;

-- Create indexes for the new foreign key columns for performance
CREATE INDEX IF NOT EXISTS idx_report_structures_archived_by_user_account 
ON public.report_structures(archived_by_user_account_uuid);

CREATE INDEX IF NOT EXISTS idx_report_line_items_created_by_user_account 
ON public.report_line_items(created_by_user_account_uuid);

CREATE INDEX IF NOT EXISTS idx_report_line_items_updated_by_user_account 
ON public.report_line_items(updated_by_user_account_uuid);

CREATE INDEX IF NOT EXISTS idx_coa_translation_sessions_user_account 
ON public.coa_translation_sessions(user_account_uuid);

CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by_user_account 
ON public.user_roles(assigned_by_user_account_uuid);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_account 
ON public.user_roles(user_account_uuid);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_account 
ON public.security_audit_logs(user_account_uuid);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_target_user_account 
ON public.security_audit_logs(target_user_account_uuid);
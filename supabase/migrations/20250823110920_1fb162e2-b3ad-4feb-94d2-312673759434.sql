-- Phase 2: Add missing columns to improve schema structure

-- Add missing columns to user_accounts table
ALTER TABLE public.user_accounts 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en-US',
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add missing columns to report_structures table
ALTER TABLE public.report_structures
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id);

-- Add missing columns to report_line_items table
ALTER TABLE public.report_line_items
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add missing columns to coa_translation_sessions table  
ALTER TABLE public.coa_translation_sessions
ADD COLUMN IF NOT EXISTS error_details JSONB,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS progress_percentage DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS estimated_completion_at TIMESTAMP WITH TIME ZONE;

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for user_accounts
DROP TRIGGER IF EXISTS user_accounts_updated_at ON public.user_accounts;
CREATE TRIGGER user_accounts_updated_at
  BEFORE UPDATE ON public.user_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add triggers for report_structures  
DROP TRIGGER IF EXISTS report_structures_updated_at ON public.report_structures;
CREATE TRIGGER report_structures_updated_at
  BEFORE UPDATE ON public.report_structures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add triggers for report_line_items
DROP TRIGGER IF EXISTS report_line_items_updated_at ON public.report_line_items;
CREATE TRIGGER report_line_items_updated_at
  BEFORE UPDATE ON public.report_line_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add triggers for coa_translation_sessions
DROP TRIGGER IF EXISTS coa_translation_sessions_updated_at ON public.coa_translation_sessions;
CREATE TRIGGER coa_translation_sessions_updated_at
  BEFORE UPDATE ON public.coa_translation_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_accounts_last_login ON public.user_accounts(last_login_at);
CREATE INDEX IF NOT EXISTS idx_user_accounts_status_created ON public.user_accounts(status, created_at);
CREATE INDEX IF NOT EXISTS idx_report_structures_active_created ON public.report_structures(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_report_line_items_structure_parent ON public.report_line_items(report_structure_uuid, parent_report_line_item_uuid);
CREATE INDEX IF NOT EXISTS idx_report_line_items_sort_order ON public.report_line_items(report_structure_uuid, sort_order);
CREATE INDEX IF NOT EXISTS idx_coa_translation_sessions_status ON public.coa_translation_sessions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_action_created ON public.security_audit_logs(action, created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_created ON public.security_audit_logs(user_id, created_at);

-- Update existing records to set created_by where possible
UPDATE public.report_line_items 
SET created_by = rs.created_by_supabase_user_uuid
FROM public.report_structures rs
WHERE report_line_items.report_structure_uuid = rs.report_structure_uuid
AND report_line_items.created_by IS NULL;
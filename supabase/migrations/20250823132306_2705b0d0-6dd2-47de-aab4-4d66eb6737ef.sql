-- Phase 5.1: Status Column ENUMs - Convert text status fields to proper ENUMs

-- Create ENUM types for proper workflow state management
CREATE TYPE public.user_account_status AS ENUM (
  'pending',
  'approved', 
  'rejected',
  'suspended',
  'archived'
);

CREATE TYPE public.translation_session_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'paused'
);

CREATE TYPE public.report_structure_lifecycle_status AS ENUM (
  'draft',
  'active',
  'inactive', 
  'archived',
  'deprecated'
);

-- Add new ENUM columns alongside existing text columns
ALTER TABLE public.user_accounts 
ADD COLUMN IF NOT EXISTS status_enum public.user_account_status;

ALTER TABLE public.coa_translation_sessions 
ADD COLUMN IF NOT EXISTS status_enum public.translation_session_status;

ALTER TABLE public.report_structures 
ADD COLUMN IF NOT EXISTS lifecycle_status public.report_structure_lifecycle_status DEFAULT 'draft';

-- Migrate existing data to new ENUM columns
UPDATE public.user_accounts 
SET status_enum = CASE 
  WHEN status = 'pending' THEN 'pending'::public.user_account_status
  WHEN status = 'approved' THEN 'approved'::public.user_account_status
  WHEN status = 'rejected' THEN 'rejected'::public.user_account_status
  ELSE 'pending'::public.user_account_status
END
WHERE status_enum IS NULL;

UPDATE public.coa_translation_sessions 
SET status_enum = CASE 
  WHEN status = 'processing' THEN 'processing'::public.translation_session_status
  WHEN status = 'completed' THEN 'completed'::public.translation_session_status
  WHEN status = 'failed' THEN 'failed'::public.translation_session_status
  WHEN status = 'cancelled' THEN 'cancelled'::public.translation_session_status
  WHEN status = 'paused' THEN 'paused'::public.translation_session_status
  ELSE 'pending'::public.translation_session_status
END
WHERE status_enum IS NULL;

-- Set lifecycle status based on is_active flag for report structures
UPDATE public.report_structures 
SET lifecycle_status = CASE 
  WHEN is_active = true THEN 'active'::public.report_structure_lifecycle_status
  ELSE 'inactive'::public.report_structure_lifecycle_status
END
WHERE lifecycle_status IS NULL;
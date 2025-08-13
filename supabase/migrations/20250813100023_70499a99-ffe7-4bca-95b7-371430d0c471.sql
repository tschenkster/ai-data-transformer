-- Clean migration to make user_accounts table comply with ID strategy
-- First, drop all existing constraints to start clean
DO $$ 
DECLARE 
    rec RECORD;
BEGIN
    -- Drop all constraints except NOT NULL constraints
    FOR rec IN 
        SELECT conname, contype 
        FROM pg_constraint 
        WHERE conrelid = 'public.user_accounts'::regclass 
        AND contype IN ('p', 'u', 'f')
    LOOP
        EXECUTE 'ALTER TABLE public.user_accounts DROP CONSTRAINT ' || rec.conname || ' CASCADE';
    END LOOP;
END $$;

-- Create the new compliant table structure
CREATE TABLE public.user_accounts_temp (
  user_account_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
  user_account_id INTEGER NOT NULL DEFAULT nextval('user_accounts_user_account_id_seq'::regclass),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  PRIMARY KEY (user_account_uuid),
  UNIQUE (user_account_id)
);

-- Copy data from old table, using the existing 'id' as the new UUID
INSERT INTO public.user_accounts_temp (
  user_account_uuid, user_account_id, user_id, email, first_name, last_name, 
  status, created_at, approved_at, approved_by
)
SELECT 
  id, user_account_id, user_id, email, first_name, last_name,
  status, created_at, approved_at, approved_by
FROM public.user_accounts;

-- Drop old table and rename new one
DROP TABLE public.user_accounts;
ALTER TABLE public.user_accounts_temp RENAME TO user_accounts;

-- Enable RLS
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
CREATE POLICY "Users can insert their own user_account" 
ON public.user_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own user_account" 
ON public.user_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own user_account" 
ON public.user_accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user_accounts" 
ON public.user_accounts 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admins can update all user_accounts" 
ON public.user_accounts 
FOR UPDATE 
USING (is_admin_user());
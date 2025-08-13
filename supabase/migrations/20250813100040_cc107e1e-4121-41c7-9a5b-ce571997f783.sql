-- Clean migration to make user_accounts table comply with ID strategy
-- Handle sequence dependencies properly

-- Create the new compliant table structure first
CREATE TABLE public.user_accounts_new (
  user_account_uuid UUID NOT NULL,
  user_account_id INTEGER NOT NULL,
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
INSERT INTO public.user_accounts_new (
  user_account_uuid, user_account_id, user_id, email, first_name, last_name, 
  status, created_at, approved_at, approved_by
)
SELECT 
  id, user_account_id, user_id, email, first_name, last_name,
  status, created_at, approved_at, approved_by
FROM public.user_accounts;

-- Store the sequence current value
SELECT setval('user_accounts_user_account_id_seq', (SELECT MAX(user_account_id) FROM public.user_accounts_new));

-- Drop old table with CASCADE to handle dependencies
DROP TABLE public.user_accounts CASCADE;

-- Rename new table
ALTER TABLE public.user_accounts_new RENAME TO user_accounts;

-- Set up the sequence for the new table
ALTER TABLE public.user_accounts ALTER COLUMN user_account_id SET DEFAULT nextval('user_accounts_user_account_id_seq'::regclass);

-- Set proper default for UUID column
ALTER TABLE public.user_accounts ALTER COLUMN user_account_uuid SET DEFAULT gen_random_uuid();

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
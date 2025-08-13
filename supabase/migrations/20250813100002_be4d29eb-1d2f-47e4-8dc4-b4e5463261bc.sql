-- Make user_accounts table comply with ID strategy
-- First check existing constraints and drop them properly
DO $$ 
DECLARE 
    constraint_name text;
BEGIN
    -- Find and drop the primary key constraint
    SELECT conname INTO constraint_name 
    FROM pg_constraint 
    WHERE conrelid = 'public.user_accounts'::regclass 
    AND contype = 'p';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.user_accounts DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- Add new UUID column with proper name
ALTER TABLE public.user_accounts ADD COLUMN user_account_uuid UUID DEFAULT gen_random_uuid() NOT NULL;

-- Copy existing id values to new column
UPDATE public.user_accounts SET user_account_uuid = id;

-- Drop the old id column
ALTER TABLE public.user_accounts DROP COLUMN id;

-- Create new primary key on UUID
ALTER TABLE public.user_accounts ADD CONSTRAINT user_accounts_pkey PRIMARY KEY (user_account_uuid);

-- Add unique constraint on integer ID
ALTER TABLE public.user_accounts ADD CONSTRAINT user_accounts_user_account_id_unique UNIQUE (user_account_id);

-- Recreate the table with proper column ordering
CREATE TABLE public.user_accounts_new (
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

-- Copy data from old table to new table
INSERT INTO public.user_accounts_new (
  user_account_uuid, user_account_id, user_id, email, first_name, last_name, 
  status, created_at, approved_at, approved_by
)
SELECT 
  user_account_uuid, user_account_id, user_id, email, first_name, last_name,
  status, created_at, approved_at, approved_by
FROM public.user_accounts;

-- Drop old table and rename new one
DROP TABLE public.user_accounts;
ALTER TABLE public.user_accounts_new RENAME TO user_accounts;

-- Enable RLS on new table
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
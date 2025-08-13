-- Make user_accounts table comply with ID strategy
-- Step 1: Add new UUID column with proper name and ordering
ALTER TABLE public.user_accounts ADD COLUMN user_account_uuid UUID DEFAULT gen_random_uuid() NOT NULL;

-- Step 2: Copy existing id values to new column
UPDATE public.user_accounts SET user_account_uuid = id;

-- Step 3: Drop old primary key constraint
ALTER TABLE public.user_accounts DROP CONSTRAINT user_accounts_pkey;

-- Step 4: Drop the old id column
ALTER TABLE public.user_accounts DROP COLUMN id;

-- Step 5: Create new primary key on UUID
ALTER TABLE public.user_accounts ADD CONSTRAINT user_accounts_pkey PRIMARY KEY (user_account_uuid);

-- Step 6: Add unique constraint on integer ID
ALTER TABLE public.user_accounts ADD CONSTRAINT user_accounts_user_account_id_unique UNIQUE (user_account_id);

-- Step 7: Recreate the table with proper column ordering
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

-- Step 8: Copy data from old table to new table
INSERT INTO public.user_accounts_new (
  user_account_uuid, user_account_id, user_id, email, first_name, last_name, 
  status, created_at, approved_at, approved_by
)
SELECT 
  user_account_uuid, user_account_id, user_id, email, first_name, last_name,
  status, created_at, approved_at, approved_by
FROM public.user_accounts;

-- Step 9: Drop old table and rename new one
DROP TABLE public.user_accounts;
ALTER TABLE public.user_accounts_new RENAME TO user_accounts;

-- Step 10: Enable RLS on new table
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

-- Step 11: Recreate RLS policies with updated column references
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

-- Step 12: Update the trigger function to use new column name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_accounts (user_id, email, status, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    'pending',
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$function$;
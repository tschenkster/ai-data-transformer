-- Final migration to make user_accounts comply with ID strategy

-- Step 1: Create the properly ordered table
CREATE TABLE public.user_accounts_compliant (
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

-- Step 2: Copy all data, mapping old 'id' to new 'user_account_uuid'
INSERT INTO public.user_accounts_compliant (
  user_account_uuid, user_account_id, user_id, email, first_name, last_name, 
  status, created_at, approved_at, approved_by
)
SELECT 
  id, user_account_id, user_id, email, first_name, last_name,
  status, created_at, approved_at, approved_by
FROM public.user_accounts;

-- Step 3: Drop the old table (this will also drop the trigger)
DROP TABLE public.user_accounts CASCADE;

-- Step 4: Rename the new table
ALTER TABLE public.user_accounts_compliant RENAME TO user_accounts;

-- Step 5: Enable RLS
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

-- Step 6: Recreate all RLS policies
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

-- Step 7: Recreate the trigger (now that old one is dropped)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
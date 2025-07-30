-- Add unique constraint to account_mappings table for upsert operations
ALTER TABLE public.account_mappings 
ADD CONSTRAINT account_mappings_original_account_user_unique 
UNIQUE (original_account_name, user_id);
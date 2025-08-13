-- Check current schema and fix any discrepancies
-- Verify the columns were renamed correctly
DO $$
DECLARE
    has_old_column boolean;
    has_new_column boolean;
BEGIN
    -- Check if old column still exists in user_accounts
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_accounts' 
        AND column_name = 'user_id' 
        AND table_schema = 'public'
    ) INTO has_old_column;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_accounts' 
        AND column_name = 'supabase_user_uuid' 
        AND table_schema = 'public'
    ) INTO has_new_column;
    
    RAISE NOTICE 'user_accounts table - old column exists: %, new column exists: %', has_old_column, has_new_column;
    
    -- If old column still exists, rename it
    IF has_old_column AND NOT has_new_column THEN
        ALTER TABLE public.user_accounts RENAME COLUMN user_id TO supabase_user_uuid;
        RAISE NOTICE 'Renamed user_id to supabase_user_uuid in user_accounts';
    END IF;
END $$;
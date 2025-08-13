-- Simple column rename approach without table recreation
-- Just rename the column in report_structures if it hasn't been renamed yet

DO $$
DECLARE
    has_old_column boolean;
    has_new_column boolean;
BEGIN
    -- Check if old column still exists in report_structures
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'report_structures' 
        AND column_name = 'created_by_user_id' 
        AND table_schema = 'public'
    ) INTO has_old_column;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'report_structures' 
        AND column_name = 'created_by_supabase_user_uuid' 
        AND table_schema = 'public'
    ) INTO has_new_column;
    
    RAISE NOTICE 'report_structures table - old column exists: %, new column exists: %', has_old_column, has_new_column;
    
    -- If old column still exists, rename it
    IF has_old_column AND NOT has_new_column THEN
        ALTER TABLE public.report_structures RENAME COLUMN created_by_user_id TO created_by_supabase_user_uuid;
        RAISE NOTICE 'Renamed created_by_user_id to created_by_supabase_user_uuid in report_structures';
    END IF;
END $$;
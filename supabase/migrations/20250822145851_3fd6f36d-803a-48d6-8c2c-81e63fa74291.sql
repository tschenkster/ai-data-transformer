-- Remove Memory Maintenance Infrastructure
-- This migration removes all vector/embedding functionality that was part of Memory Maintenance

-- Drop the embedding column from account_mappings
ALTER TABLE public.account_mappings DROP COLUMN IF EXISTS embedding;

-- Drop the vector-related function
DROP FUNCTION IF EXISTS public.match_account_embeddings(vector, double precision, integer, uuid);

-- Drop vector extension (only if no other tables use it)
-- Check if any other tables use vector types before dropping
DO $$
BEGIN
    -- Only drop the extension if no other columns use vector types
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE data_type = 'USER-DEFINED' 
        AND udt_name = 'vector'
        AND table_schema = 'public'
    ) THEN
        DROP EXTENSION IF EXISTS vector;
    END IF;
END $$;
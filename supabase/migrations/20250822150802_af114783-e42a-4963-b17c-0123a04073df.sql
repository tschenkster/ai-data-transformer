-- Drop the three legacy CoA mapping tables and their policies
-- These tables are empty and no longer used in the current application

-- Drop account_mappings table
DROP TABLE IF EXISTS public.account_mappings CASCADE;

-- Drop mapping_decisions table
DROP TABLE IF EXISTS public.mapping_decisions CASCADE;

-- Drop mapping_sessions table
DROP TABLE IF EXISTS public.mapping_sessions CASCADE;

-- Note: Associated RLS policies, indexes, and sequences will be automatically dropped with CASCADE
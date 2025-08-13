-- Complete the column renaming for report_structures table
-- Fix the mismatch between edge function expectation and actual schema

-- First, check if the column needs to be renamed in report_structures
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

-- Now reorder columns in both tables to ensure proper structure
-- Start with user_accounts table - make supabase_user_uuid the second column
CREATE TABLE public.user_accounts_temp (
    user_account_id integer NOT NULL DEFAULT nextval('user_accounts_user_account_id_seq'::regclass),
    supabase_user_uuid uuid NOT NULL,
    user_account_uuid uuid NOT NULL DEFAULT gen_random_uuid(),
    email text NOT NULL,
    status text NOT NULL DEFAULT 'pending'::text,
    first_name text,
    last_name text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    approved_at timestamp with time zone,
    approved_by uuid
);

-- Copy data from original table
INSERT INTO public.user_accounts_temp (
    user_account_id,
    supabase_user_uuid,
    user_account_uuid,
    email,
    status,
    first_name,
    last_name,
    created_at,
    approved_at,
    approved_by
)
SELECT 
    user_account_id,
    supabase_user_uuid,
    user_account_uuid,
    email,
    status,
    first_name,
    last_name,
    created_at,
    approved_at,
    approved_by
FROM public.user_accounts;

-- Drop original table and rename temp
DROP TABLE public.user_accounts;
ALTER TABLE public.user_accounts_temp RENAME TO user_accounts;

-- Recreate constraints and indexes
ALTER TABLE public.user_accounts ADD CONSTRAINT user_accounts_pkey PRIMARY KEY (user_account_id);
ALTER TABLE public.user_accounts ADD CONSTRAINT user_accounts_user_account_uuid_key UNIQUE (user_account_uuid);
ALTER TABLE public.user_accounts ADD CONSTRAINT user_accounts_supabase_user_uuid_key UNIQUE (supabase_user_uuid);

-- Enable RLS
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for user_accounts
CREATE POLICY "Users can insert their own user_account" ON public.user_accounts
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = supabase_user_uuid);

CREATE POLICY "Users can view their own user_account" ON public.user_accounts
    FOR SELECT TO authenticated
    USING (auth.uid() = supabase_user_uuid);

CREATE POLICY "Users can update their own user_account" ON public.user_accounts
    FOR UPDATE TO authenticated
    USING (auth.uid() = supabase_user_uuid);

CREATE POLICY "Admins can view all user_accounts" ON public.user_accounts
    FOR SELECT TO authenticated
    USING (is_admin_user());

CREATE POLICY "Admins can update all user_accounts" ON public.user_accounts
    FOR UPDATE TO authenticated
    USING (is_admin_user());

-- Now reorder columns in report_structures table - make created_by_supabase_user_uuid the second column
CREATE TABLE public.report_structures_temp (
    report_structure_id integer NOT NULL DEFAULT nextval('report_structures_report_structure_id_seq'::regclass),
    created_by_supabase_user_uuid uuid NOT NULL,
    report_structure_uuid uuid NOT NULL DEFAULT gen_random_uuid(),
    report_structure_name text NOT NULL,
    is_active boolean NOT NULL DEFAULT false,
    version integer NOT NULL DEFAULT 1,
    created_by_user_name text NOT NULL,
    name_of_import_file text,
    imported_structure_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Copy data from original table
INSERT INTO public.report_structures_temp (
    report_structure_id,
    created_by_supabase_user_uuid,
    report_structure_uuid,
    report_structure_name,
    is_active,
    version,
    created_by_user_name,
    name_of_import_file,
    imported_structure_id,
    created_at,
    updated_at
)
SELECT 
    report_structure_id,
    created_by_supabase_user_uuid,
    report_structure_uuid,
    report_structure_name,
    is_active,
    version,
    created_by_user_name,
    name_of_import_file,
    imported_structure_id,
    created_at,
    updated_at
FROM public.report_structures;

-- Drop original table and rename temp
DROP TABLE public.report_structures;
ALTER TABLE public.report_structures_temp RENAME TO report_structures;

-- Recreate constraints and indexes
ALTER TABLE public.report_structures ADD CONSTRAINT report_structures_pkey PRIMARY KEY (report_structure_id);
ALTER TABLE public.report_structures ADD CONSTRAINT report_structures_report_structure_uuid_key UNIQUE (report_structure_uuid);

-- Enable RLS
ALTER TABLE public.report_structures ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for report_structures
CREATE POLICY "Admins can view all report structures" ON public.report_structures
    FOR SELECT TO authenticated
    USING (is_admin_user());

CREATE POLICY "Admins can insert report structures" ON public.report_structures
    FOR INSERT TO authenticated
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update report structures" ON public.report_structures
    FOR UPDATE TO authenticated
    USING (is_admin_user());

CREATE POLICY "Admins can delete report structures" ON public.report_structures
    FOR DELETE TO authenticated
    USING (is_admin_user());

CREATE POLICY "Users can view active report structures" ON public.report_structures
    FOR SELECT TO authenticated
    USING (is_active = true);

-- Recreate triggers
CREATE TRIGGER update_report_structures_updated_at
    BEFORE UPDATE ON public.report_structures
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER ensure_single_active_structure_trigger
    AFTER INSERT OR UPDATE ON public.report_structures
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_single_active_structure();

-- Update sequence ownership
ALTER SEQUENCE public.user_accounts_user_account_id_seq OWNED BY public.user_accounts.user_account_id;
ALTER SEQUENCE public.report_structures_report_structure_id_seq OWNED BY public.report_structures.report_structure_id;
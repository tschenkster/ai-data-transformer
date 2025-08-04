-- Phase 2 (Final): Handle RLS policies and complete schema restructuring

-- Step 1: Temporarily disable RLS and drop policies that depend on the old columns
ALTER TABLE public.report_structures DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_line_items DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid dependency issues
DROP POLICY IF EXISTS "Admins can view all report structures" ON public.report_structures;
DROP POLICY IF EXISTS "Admins can insert report structures" ON public.report_structures;
DROP POLICY IF EXISTS "Admins can update report structures" ON public.report_structures;
DROP POLICY IF EXISTS "Admins can delete report structures" ON public.report_structures;
DROP POLICY IF EXISTS "Users can view active report structures" ON public.report_structures;

DROP POLICY IF EXISTS "Admins can view all report line items" ON public.report_line_items;
DROP POLICY IF EXISTS "Admins can insert report line items" ON public.report_line_items;
DROP POLICY IF EXISTS "Admins can update report line items" ON public.report_line_items;
DROP POLICY IF EXISTS "Admins can delete report line items" ON public.report_line_items;
DROP POLICY IF EXISTS "Users can view line items from active structures" ON public.report_line_items;

-- Step 2: Drop existing constraints
DO $$ 
BEGIN
    -- Drop any existing foreign keys first
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'report_line_items_report_structure_id_fkey') THEN
        ALTER TABLE public.report_line_items DROP CONSTRAINT report_line_items_report_structure_id_fkey;
    END IF;
    
    -- Drop primary keys
    ALTER TABLE public.report_structures DROP CONSTRAINT IF EXISTS report_structures_pkey CASCADE;
    ALTER TABLE public.report_line_items DROP CONSTRAINT IF EXISTS report_line_items_pkey CASCADE;
END $$;

-- Step 3: Now safely drop and rename columns
-- For report_structures: drop old UUID PK column
ALTER TABLE public.report_structures DROP COLUMN report_structure_id CASCADE;

-- For report_line_items: clean up old columns
ALTER TABLE public.report_line_items DROP COLUMN report_line_item_id CASCADE;
ALTER TABLE public.report_line_items DROP COLUMN report_structure_id CASCADE;
ALTER TABLE public.report_line_items RENAME COLUMN report_structure_id_int TO report_structure_id;

-- Step 4: Establish new primary keys and constraints
ALTER TABLE public.report_structures ADD CONSTRAINT report_structures_pkey PRIMARY KEY (id);
ALTER TABLE public.report_line_items ADD CONSTRAINT report_line_items_pkey PRIMARY KEY (id);

-- Add foreign key constraint
ALTER TABLE public.report_line_items 
ADD CONSTRAINT report_line_items_report_structure_id_fkey 
FOREIGN KEY (report_structure_id) REFERENCES public.report_structures(id) ON DELETE CASCADE;
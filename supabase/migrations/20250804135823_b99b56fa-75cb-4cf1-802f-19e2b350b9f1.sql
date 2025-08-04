-- Phase 2 (Corrected): Complete the column restructuring based on current state
-- Current state: both tables have id (integer) and original UUID columns plus new UUID columns

-- Step 1: Drop existing primary key constraints safely
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

-- Step 2: Clean up and rename columns properly
-- For report_structures: we have report_structure_id (UUID) and report_structure_uuid (UUID) and id (int)
-- We want: id (int, PK) and report_structure_uuid (UUID for public use)
ALTER TABLE public.report_structures DROP COLUMN report_structure_id; -- remove old UUID PK
-- report_structure_uuid already exists and has the correct data

-- For report_line_items: we have report_line_item_id (UUID), report_line_item_uuid (UUID), report_structure_id (UUID), report_structure_id_int (int), id (int)
-- We want: id (int, PK), report_line_item_uuid (UUID), report_structure_id (int, FK)
ALTER TABLE public.report_line_items DROP COLUMN report_line_item_id; -- remove old UUID PK
ALTER TABLE public.report_line_items DROP COLUMN report_structure_id; -- remove old UUID FK
ALTER TABLE public.report_line_items RENAME COLUMN report_structure_id_int TO report_structure_id; -- make int the FK

-- Step 3: Add new primary keys and foreign key constraints
ALTER TABLE public.report_structures ADD CONSTRAINT report_structures_pkey PRIMARY KEY (id);
ALTER TABLE public.report_line_items ADD CONSTRAINT report_line_items_pkey PRIMARY KEY (id);

-- Add proper foreign key constraint
ALTER TABLE public.report_line_items 
ADD CONSTRAINT report_line_items_report_structure_id_fkey 
FOREIGN KEY (report_structure_id) REFERENCES public.report_structures(id) ON DELETE CASCADE;

-- Step 4: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_line_items_report_structure_id ON public.report_line_items(report_structure_id);
CREATE INDEX IF NOT EXISTS idx_report_structures_uuid ON public.report_structures(report_structure_uuid);
CREATE INDEX IF NOT EXISTS idx_report_line_items_uuid ON public.report_line_items(report_line_item_uuid);
-- Phase 2: Schema restructuring - Rename columns and establish proper constraints
-- Step 1: Drop existing constraints and primary keys before restructuring

-- Drop existing primary key constraints
ALTER TABLE public.report_structures DROP CONSTRAINT report_structures_pkey;
ALTER TABLE public.report_line_items DROP CONSTRAINT report_line_items_pkey;

-- Step 2: Rename columns to match specification
-- For report_structures: rename UUID column to original name for backwards compatibility
ALTER TABLE public.report_structures RENAME COLUMN report_structure_id TO report_structure_id_old;
ALTER TABLE public.report_structures RENAME COLUMN report_structure_uuid TO report_structure_id;

-- For report_line_items: rename UUID column and establish integer FK
ALTER TABLE public.report_line_items RENAME COLUMN report_line_item_id TO report_line_item_id_old;
ALTER TABLE public.report_line_items RENAME COLUMN report_line_item_uuid TO report_line_item_id;
ALTER TABLE public.report_line_items RENAME COLUMN report_structure_id TO report_structure_uuid_old;
ALTER TABLE public.report_line_items RENAME COLUMN report_structure_id_int TO report_structure_id;

-- Step 3: Establish new primary keys with integer IDs
ALTER TABLE public.report_structures ADD CONSTRAINT report_structures_pkey PRIMARY KEY (id);
ALTER TABLE public.report_line_items ADD CONSTRAINT report_line_items_pkey PRIMARY KEY (id);

-- Step 4: Add foreign key constraint for proper relational integrity
ALTER TABLE public.report_line_items 
ADD CONSTRAINT report_line_items_report_structure_id_fkey 
FOREIGN KEY (report_structure_id) REFERENCES public.report_structures(id) ON DELETE CASCADE;

-- Step 5: Add indexes for performance
CREATE INDEX idx_report_line_items_report_structure_id ON public.report_line_items(report_structure_id);
CREATE INDEX idx_report_structures_uuid ON public.report_structures(report_structure_id);
CREATE INDEX idx_report_line_items_uuid ON public.report_line_items(report_line_item_id);

-- Step 6: Clean up old UUID columns that are no longer needed
ALTER TABLE public.report_structures DROP COLUMN report_structure_id_old;
ALTER TABLE public.report_line_items DROP COLUMN report_line_item_id_old;
ALTER TABLE public.report_line_items DROP COLUMN report_structure_uuid_old;
-- Check and drop existing primary keys explicitly
-- First, check what primary key constraints exist
SELECT constraint_name, table_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name IN ('report_line_items', 'report_structures') 
  AND constraint_type = 'PRIMARY KEY';

-- Drop existing primary key on report_line_items if it exists
ALTER TABLE public.report_line_items DROP CONSTRAINT IF EXISTS "report_line_items_pkey";

-- Add UUID primary key to report_line_items
ALTER TABLE public.report_line_items ADD CONSTRAINT report_line_items_pkey PRIMARY KEY (report_line_item_uuid);

-- Add unique constraint on integer ID
ALTER TABLE public.report_line_items ADD CONSTRAINT report_line_items_id_unique UNIQUE (report_line_item_id);

-- Drop existing primary key on report_structures if it exists  
ALTER TABLE public.report_structures DROP CONSTRAINT IF EXISTS "report_structures_pkey";

-- Add UUID primary key to report_structures
ALTER TABLE public.report_structures ADD CONSTRAINT report_structures_pkey PRIMARY KEY (report_structure_uuid);

-- Add unique constraint on integer ID
ALTER TABLE public.report_structures ADD CONSTRAINT report_structures_id_unique UNIQUE (report_structure_id);
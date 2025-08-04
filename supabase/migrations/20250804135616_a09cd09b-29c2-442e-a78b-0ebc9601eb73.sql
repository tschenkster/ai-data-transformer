-- Phase 1: Add new integer ID columns and UUID columns for public references
-- Step 1: Add new columns to report_structures table

-- Add new integer ID column (will become primary key)
ALTER TABLE public.report_structures ADD COLUMN id SERIAL;

-- Add new UUID column for public references (copy existing UUIDs)
ALTER TABLE public.report_structures ADD COLUMN report_structure_uuid UUID;

-- Populate the new UUID column with existing UUID values
UPDATE public.report_structures SET report_structure_uuid = report_structure_id;

-- Make the new UUID column NOT NULL and UNIQUE
ALTER TABLE public.report_structures ALTER COLUMN report_structure_uuid SET NOT NULL;
ALTER TABLE public.report_structures ADD CONSTRAINT report_structures_uuid_unique UNIQUE (report_structure_uuid);

-- Step 2: Add new columns to report_line_items table

-- Add new integer ID column (will become primary key)
ALTER TABLE public.report_line_items ADD COLUMN id SERIAL;

-- Add new UUID column for public references (copy existing UUIDs)
ALTER TABLE public.report_line_items ADD COLUMN report_line_item_uuid UUID;

-- Populate the new UUID column with existing UUID values
UPDATE public.report_line_items SET report_line_item_uuid = report_line_item_id;

-- Make the new UUID column NOT NULL and UNIQUE
ALTER TABLE public.report_line_items ALTER COLUMN report_line_item_uuid SET NOT NULL;
ALTER TABLE public.report_line_items ADD CONSTRAINT report_line_items_uuid_unique UNIQUE (report_line_item_uuid);

-- Step 3: Add integer foreign key reference in report_line_items
ALTER TABLE public.report_line_items ADD COLUMN report_structure_id_int INTEGER;

-- Populate the integer foreign key by joining on UUIDs
UPDATE public.report_line_items 
SET report_structure_id_int = rs.id
FROM public.report_structures rs
WHERE report_line_items.report_structure_id = rs.report_structure_id;

-- Make the integer foreign key NOT NULL
ALTER TABLE public.report_line_items ALTER COLUMN report_structure_id_int SET NOT NULL;
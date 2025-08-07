-- Phase 1: Update report_line_items table to use UUID primary key
-- Step 1: Drop existing primary key constraint
ALTER TABLE public.report_line_items DROP CONSTRAINT IF EXISTS report_line_items_pkey;

-- Step 2: Add primary key constraint on UUID column
ALTER TABLE public.report_line_items ADD CONSTRAINT report_line_items_pkey PRIMARY KEY (report_line_item_uuid);

-- Step 3: Add unique constraint on the integer ID for referential integrity
ALTER TABLE public.report_line_items ADD CONSTRAINT report_line_items_id_unique UNIQUE (report_line_item_id);

-- Phase 2: Update report_structures table to use UUID primary key
-- Step 1: Drop existing primary key constraint
ALTER TABLE public.report_structures DROP CONSTRAINT IF EXISTS report_structures_pkey;

-- Step 2: Add primary key constraint on UUID column
ALTER TABLE public.report_structures ADD CONSTRAINT report_structures_pkey PRIMARY KEY (report_structure_uuid);

-- Step 3: Add unique constraint on the integer ID for referential integrity
ALTER TABLE public.report_structures ADD CONSTRAINT report_structures_id_unique UNIQUE (report_structure_id);

-- Phase 3: Update foreign key references
-- Step 1: Drop existing foreign key constraints (if any exist)
-- Note: Based on the schema, there don't appear to be explicit foreign key constraints, but we'll handle logical relationships

-- Step 2: Update account_mappings to reference UUID instead of integer
-- First, add the new UUID column
ALTER TABLE public.account_mappings ADD COLUMN IF NOT EXISTS report_line_item_uuid uuid;

-- Update existing records to use the UUID from report_line_items
UPDATE public.account_mappings 
SET report_line_item_uuid = rli.report_line_item_uuid
FROM public.report_line_items rli
WHERE account_mappings.report_line_item_id = rli.report_line_item_id;

-- Drop the old integer column
ALTER TABLE public.account_mappings DROP COLUMN IF EXISTS report_line_item_id;

-- Step 3: Update report_line_items to reference report_structure_uuid instead of report_structure_id
-- Add the new UUID column
ALTER TABLE public.report_line_items ADD COLUMN IF NOT EXISTS report_structure_uuid uuid;

-- Update existing records to use the UUID from report_structures
UPDATE public.report_line_items 
SET report_structure_uuid = rs.report_structure_uuid
FROM public.report_structures rs
WHERE report_line_items.report_structure_id = rs.report_structure_id;

-- Make the new column NOT NULL
ALTER TABLE public.report_line_items ALTER COLUMN report_structure_uuid SET NOT NULL;

-- Drop the old integer column
ALTER TABLE public.report_line_items DROP COLUMN report_structure_id;

-- Step 4: Update change log table to use proper UUID references
-- The change log already has UUID columns, but we need to ensure consistency
-- Update any records that might be using integer references in the previous_state/new_state JSON

-- Update indexes and triggers to work with new primary keys
-- Recreate any indexes that were using the old primary keys
CREATE INDEX IF NOT EXISTS idx_report_line_items_structure_uuid ON public.report_line_items(report_structure_uuid);
CREATE INDEX IF NOT EXISTS idx_account_mappings_line_item_uuid ON public.account_mappings(report_line_item_uuid);
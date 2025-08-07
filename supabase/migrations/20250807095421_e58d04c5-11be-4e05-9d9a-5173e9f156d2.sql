-- Step 1: Drop any existing foreign key constraints that might be blocking changes
ALTER TABLE public.report_line_items DROP CONSTRAINT IF EXISTS fk_parent_report_line_item_uuid;

-- Step 2: Update account_mappings - rename the existing UUID column to the correct name
-- Since account_mappings.report_line_item_id is already UUID, just rename it
ALTER TABLE public.account_mappings RENAME COLUMN report_line_item_id TO report_line_item_uuid;

-- Step 3: Add report_structure_uuid column to report_line_items and populate it
ALTER TABLE public.report_line_items ADD COLUMN IF NOT EXISTS report_structure_uuid uuid;

-- Update report_line_items to reference report_structure_uuid
UPDATE public.report_line_items 
SET report_structure_uuid = rs.report_structure_uuid
FROM public.report_structures rs
WHERE report_line_items.report_structure_id = rs.report_structure_id;

-- Make the column NOT NULL
ALTER TABLE public.report_line_items ALTER COLUMN report_structure_uuid SET NOT NULL;

-- Drop the old integer reference column
ALTER TABLE public.report_line_items DROP COLUMN report_structure_id;

-- Step 4: Drop current primary keys using dynamic SQL
DO $$ 
DECLARE 
    pk_name TEXT;
BEGIN
    -- Get and drop primary key for report_line_items
    SELECT constraint_name INTO pk_name
    FROM information_schema.table_constraints 
    WHERE table_name = 'report_line_items' 
    AND constraint_type = 'PRIMARY KEY';
    
    IF pk_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.report_line_items DROP CONSTRAINT ' || quote_ident(pk_name);
    END IF;
END $$;

DO $$ 
DECLARE 
    pk_name TEXT;
BEGIN
    -- Get and drop primary key for report_structures
    SELECT constraint_name INTO pk_name
    FROM information_schema.table_constraints 
    WHERE table_name = 'report_structures' 
    AND constraint_type = 'PRIMARY KEY';
    
    IF pk_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.report_structures DROP CONSTRAINT ' || quote_ident(pk_name);
    END IF;
END $$;

-- Step 5: Add new UUID primary keys
ALTER TABLE public.report_line_items ADD CONSTRAINT report_line_items_pkey PRIMARY KEY (report_line_item_uuid);
ALTER TABLE public.report_structures ADD CONSTRAINT report_structures_pkey PRIMARY KEY (report_structure_uuid);

-- Step 6: Add unique constraints on integer IDs for backwards compatibility
ALTER TABLE public.report_line_items ADD CONSTRAINT report_line_items_id_unique UNIQUE (report_line_item_id);
ALTER TABLE public.report_structures ADD CONSTRAINT report_structures_id_unique UNIQUE (report_structure_id);

-- Step 7: Recreate the self-referencing foreign key using UUIDs
ALTER TABLE public.report_line_items ADD CONSTRAINT fk_parent_report_line_item_uuid 
FOREIGN KEY (parent_report_line_item_uuid) REFERENCES public.report_line_items(report_line_item_uuid);

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_line_items_structure_uuid ON public.report_line_items(report_structure_uuid);
CREATE INDEX IF NOT EXISTS idx_account_mappings_line_item_uuid ON public.account_mappings(report_line_item_uuid);
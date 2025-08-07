-- Step 1: Create temporary columns for the new structure
ALTER TABLE public.report_line_items ADD COLUMN temp_uuid uuid DEFAULT gen_random_uuid();
ALTER TABLE public.report_structures ADD COLUMN temp_uuid uuid DEFAULT gen_random_uuid();

-- Step 2: Copy UUIDs from existing UUID columns to temp columns
UPDATE public.report_line_items SET temp_uuid = report_line_item_uuid;
UPDATE public.report_structures SET temp_uuid = report_structure_uuid;

-- Step 3: Drop existing UUID columns 
ALTER TABLE public.report_line_items DROP COLUMN report_line_item_uuid;
ALTER TABLE public.report_structures DROP COLUMN report_structure_uuid;

-- Step 4: Rename temp columns to the correct UUID column names
ALTER TABLE public.report_line_items RENAME COLUMN temp_uuid TO report_line_item_uuid;
ALTER TABLE public.report_structures RENAME COLUMN temp_uuid TO report_structure_uuid;

-- Step 5: Make the UUID columns NOT NULL
ALTER TABLE public.report_line_items ALTER COLUMN report_line_item_uuid SET NOT NULL;
ALTER TABLE public.report_structures ALTER COLUMN report_structure_uuid SET NOT NULL;

-- Step 6: Drop the current primary keys and add new UUID primary keys
-- For report_line_items
DO $$ 
BEGIN
    -- Drop any existing primary key
    EXECUTE (
        SELECT 'ALTER TABLE public.report_line_items DROP CONSTRAINT ' || quote_ident(constraint_name)
        FROM information_schema.table_constraints 
        WHERE table_name = 'report_line_items' 
        AND constraint_type = 'PRIMARY KEY'
        LIMIT 1
    );
EXCEPTION WHEN OTHERS THEN
    -- Ignore if no primary key exists
    NULL;
END $$;

-- Add new UUID primary key
ALTER TABLE public.report_line_items ADD CONSTRAINT report_line_items_pkey PRIMARY KEY (report_line_item_uuid);

-- For report_structures
DO $$ 
BEGIN
    -- Drop any existing primary key
    EXECUTE (
        SELECT 'ALTER TABLE public.report_structures DROP CONSTRAINT ' || quote_ident(constraint_name)
        FROM information_schema.table_constraints 
        WHERE table_name = 'report_structures' 
        AND constraint_type = 'PRIMARY KEY'
        LIMIT 1
    );
EXCEPTION WHEN OTHERS THEN
    -- Ignore if no primary key exists
    NULL;
END $$;

-- Add new UUID primary key
ALTER TABLE public.report_structures ADD CONSTRAINT report_structures_pkey PRIMARY KEY (report_structure_uuid);

-- Step 7: Add unique constraints on integer IDs
ALTER TABLE public.report_line_items ADD CONSTRAINT report_line_items_id_unique UNIQUE (report_line_item_id);
ALTER TABLE public.report_structures ADD CONSTRAINT report_structures_id_unique UNIQUE (report_structure_id);
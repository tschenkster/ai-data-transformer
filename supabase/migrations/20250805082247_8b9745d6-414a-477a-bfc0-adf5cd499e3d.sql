-- Add missing columns to report_structures table
ALTER TABLE public.report_structures 
ADD COLUMN name_of_import_file text,
ADD COLUMN imported_structure_id text;

-- Add unique constraints for UUID fields
ALTER TABLE public.report_structures 
ADD CONSTRAINT unique_report_structure_uuid UNIQUE (report_structure_uuid);

ALTER TABLE public.report_line_items 
ADD CONSTRAINT unique_report_line_item_uuid UNIQUE (report_line_item_uuid);

-- Update existing records with default values for new columns
UPDATE public.report_structures 
SET name_of_import_file = 'Unknown File', 
    imported_structure_id = 'Legacy Import' 
WHERE name_of_import_file IS NULL OR imported_structure_id IS NULL;
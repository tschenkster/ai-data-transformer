-- Phase 3: Recreate RLS policies with updated column references and add missing columns

-- Step 1: Add missing columns to match specification order
-- Add missing report_structure_id integer column to report_structures (this should be the internal integer ID)
ALTER TABLE public.report_structures ADD COLUMN report_structure_id INTEGER;
UPDATE public.report_structures SET report_structure_id = id;
ALTER TABLE public.report_structures ALTER COLUMN report_structure_id SET NOT NULL;

-- Add missing report_line_item_id integer column to report_line_items  
ALTER TABLE public.report_line_items ADD COLUMN report_line_item_id INTEGER;
UPDATE public.report_line_items SET report_line_item_id = id;
ALTER TABLE public.report_line_items ALTER COLUMN report_line_item_id SET NOT NULL;

-- Add missing report_line_item_description column to report_line_items (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'report_line_items' 
                   AND column_name = 'report_line_item_description') THEN
        ALTER TABLE public.report_line_items ADD COLUMN report_line_item_description TEXT;
    END IF;
END $$;

-- Step 2: Re-enable RLS on both tables
ALTER TABLE public.report_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_line_items ENABLE ROW LEVEL SECURITY;

-- Step 3: Recreate RLS policies for report_structures
CREATE POLICY "Admins can view all report structures" 
ON public.report_structures 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admins can insert report structures" 
ON public.report_structures 
FOR INSERT 
WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update report structures" 
ON public.report_structures 
FOR UPDATE 
USING (is_admin_user());

CREATE POLICY "Admins can delete report structures" 
ON public.report_structures 
FOR DELETE 
USING (is_admin_user());

CREATE POLICY "Users can view active report structures" 
ON public.report_structures 
FOR SELECT 
USING (is_active = true);

-- Step 4: Recreate RLS policies for report_line_items  
CREATE POLICY "Admins can view all report line items" 
ON public.report_line_items 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admins can insert report line items" 
ON public.report_line_items 
FOR INSERT 
WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update report line items" 
ON public.report_line_items 
FOR UPDATE 
USING (is_admin_user());

CREATE POLICY "Admins can delete report line items" 
ON public.report_line_items 
FOR DELETE 
USING (is_admin_user());

CREATE POLICY "Users can view line items from active structures" 
ON public.report_line_items 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.report_structures 
    WHERE report_structures.id = report_line_items.report_structure_id 
    AND report_structures.is_active = true
));

-- Step 5: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_report_line_items_report_structure_id ON public.report_line_items(report_structure_id);
CREATE INDEX IF NOT EXISTS idx_report_structures_uuid ON public.report_structures(report_structure_uuid);
CREATE INDEX IF NOT EXISTS idx_report_line_items_uuid ON public.report_line_items(report_line_item_uuid);
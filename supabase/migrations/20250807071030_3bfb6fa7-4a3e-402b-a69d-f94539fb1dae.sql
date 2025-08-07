-- Add parent_report_line_item_uuid column for UUID-based parent-child relationships
ALTER TABLE public.report_line_items 
ADD COLUMN parent_report_line_item_uuid UUID;

-- Populate parent_report_line_item_uuid based on existing parent_report_line_item_key relationships
UPDATE public.report_line_items 
SET parent_report_line_item_uuid = (
  SELECT parent.report_line_item_uuid 
  FROM public.report_line_items parent 
  WHERE parent.report_line_item_key = report_line_items.parent_report_line_item_key
  AND parent.report_structure_id = report_line_items.report_structure_id
)
WHERE parent_report_line_item_key IS NOT NULL;

-- Add foreign key constraint for data integrity
ALTER TABLE public.report_line_items 
ADD CONSTRAINT fk_parent_report_line_item_uuid 
FOREIGN KEY (parent_report_line_item_uuid) 
REFERENCES public.report_line_items(report_line_item_uuid);

-- Add index for performance
CREATE INDEX idx_report_line_items_parent_uuid 
ON public.report_line_items(parent_report_line_item_uuid);

-- Add index for UUID lookups
CREATE INDEX idx_report_line_items_uuid 
ON public.report_line_items(report_line_item_uuid);
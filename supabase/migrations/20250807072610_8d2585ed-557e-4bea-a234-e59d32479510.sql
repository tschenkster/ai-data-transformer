-- Fix the parent_report_line_item_uuid relationships
UPDATE public.report_line_items 
SET parent_report_line_item_uuid = (
  SELECT parent_item.report_line_item_uuid 
  FROM public.report_line_items parent_item 
  WHERE parent_item.report_line_item_key = report_line_items.parent_report_line_item_key
  AND parent_item.report_structure_id = report_line_items.report_structure_id
)
WHERE parent_report_line_item_key IS NOT NULL 
AND parent_report_line_item_key != ''
AND parent_report_line_item_uuid IS NULL;
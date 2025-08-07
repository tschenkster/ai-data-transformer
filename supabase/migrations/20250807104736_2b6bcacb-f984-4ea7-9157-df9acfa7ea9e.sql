-- Fix the report_line_item_id column to use the existing sequence as default
-- This will allow auto-generation of integer IDs for new line items
ALTER TABLE public.report_line_items 
ALTER COLUMN report_line_item_id SET DEFAULT nextval('report_line_items_new_report_line_item_id_seq1');
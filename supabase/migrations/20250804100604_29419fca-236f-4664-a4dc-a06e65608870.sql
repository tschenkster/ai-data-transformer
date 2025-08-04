-- Add missing report_line_item_description column to report_line_items table
ALTER TABLE public.report_line_items 
ADD COLUMN IF NOT EXISTS report_line_item_description text;
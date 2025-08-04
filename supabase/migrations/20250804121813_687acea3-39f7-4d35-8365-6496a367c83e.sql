-- Add report_line_item_id column to account_mappings table
ALTER TABLE public.account_mappings 
ADD COLUMN report_line_item_id UUID REFERENCES public.report_line_items(report_line_item_id);

-- Create index for better performance
CREATE INDEX idx_account_mappings_report_line_item_id 
ON public.account_mappings(report_line_item_id);
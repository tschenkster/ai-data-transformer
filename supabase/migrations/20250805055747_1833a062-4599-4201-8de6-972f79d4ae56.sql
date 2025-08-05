-- Update sequence values to match migrated data
SELECT setval('report_structures_report_structure_id_seq', COALESCE((SELECT MAX(report_structure_id) FROM report_structures), 1));
SELECT setval('report_line_items_report_line_item_id_seq', COALESCE((SELECT MAX(report_line_item_id) FROM report_line_items), 1));

-- Recreate RLS policies for report_structures
ALTER TABLE public.report_structures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all report structures" ON public.report_structures
FOR SELECT USING (is_admin_user());

CREATE POLICY "Admins can insert report structures" ON public.report_structures
FOR INSERT WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update report structures" ON public.report_structures
FOR UPDATE USING (is_admin_user());

CREATE POLICY "Admins can delete report structures" ON public.report_structures
FOR DELETE USING (is_admin_user());

CREATE POLICY "Users can view active report structures" ON public.report_structures
FOR SELECT USING (is_active = true);

-- Recreate RLS policies for report_line_items
ALTER TABLE public.report_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all report line items" ON public.report_line_items
FOR SELECT USING (is_admin_user());

CREATE POLICY "Admins can insert report line items" ON public.report_line_items
FOR INSERT WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update report line items" ON public.report_line_items
FOR UPDATE USING (is_admin_user());

CREATE POLICY "Admins can delete report line items" ON public.report_line_items
FOR DELETE USING (is_admin_user());

CREATE POLICY "Users can view line items from active structures" ON public.report_line_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM report_structures 
    WHERE report_structures.report_structure_id = report_line_items.report_structure_id 
    AND report_structures.is_active = true
  )
);

-- Recreate triggers
CREATE TRIGGER update_report_structures_updated_at
BEFORE UPDATE ON public.report_structures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER ensure_single_active_structure_trigger
AFTER INSERT OR UPDATE ON public.report_structures
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_active_structure();

CREATE TRIGGER enforce_node_limit_trigger
BEFORE INSERT ON public.report_line_items
FOR EACH ROW
EXECUTE FUNCTION public.enforce_node_limit();

-- Create indexes for performance
CREATE INDEX idx_report_line_items_structure_id ON public.report_line_items(report_structure_id);
CREATE INDEX idx_report_line_items_key ON public.report_line_items(report_line_item_key);
CREATE INDEX idx_report_line_items_parent_key ON public.report_line_items(parent_report_line_item_key);
CREATE INDEX idx_report_structures_active ON public.report_structures(is_active);
CREATE INDEX idx_report_structures_uuid ON public.report_structures(report_structure_uuid);
CREATE INDEX idx_report_line_items_uuid ON public.report_line_items(report_line_item_uuid);
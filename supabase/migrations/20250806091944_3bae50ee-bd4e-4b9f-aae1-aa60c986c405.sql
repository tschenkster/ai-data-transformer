-- First, let's create the new tables with the correct column order
-- We'll migrate data from existing tables and then replace them

-- Create new report_structures table with correct column order
CREATE TABLE public.report_structures_new (
  report_structure_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_structure_uuid uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  report_structure_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by_user_id uuid NOT NULL,
  created_by_user_name text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  name_of_import_file text,
  imported_structure_id text
);

-- Create new report_line_items table with correct column order
CREATE TABLE public.report_line_items_new (
  report_line_item_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_line_item_uuid uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  report_line_item_description text,
  report_structure_id integer NOT NULL,
  report_structure_name text NOT NULL,
  report_line_item_key text NOT NULL,
  parent_report_line_item_key text,
  is_parent_key_existing boolean DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  hierarchy_path text,
  level_1_line_item_description text,
  level_2_line_item_description text,
  level_3_line_item_description text,
  level_4_line_item_description text,
  level_5_line_item_description text,
  level_6_line_item_description text,
  level_7_line_item_description text,
  line_item_type text,
  description_of_leaf text,
  is_leaf boolean DEFAULT false,
  is_calculated boolean DEFAULT false,
  display boolean DEFAULT true,
  data_source text,
  comment text
);

-- Copy data from old tables to new tables
INSERT INTO public.report_structures_new (
  report_structure_id, report_structure_uuid, report_structure_name, is_active,
  created_at, updated_at, created_by_user_id, created_by_user_name, version,
  name_of_import_file, imported_structure_id
)
SELECT 
  report_structure_id, report_structure_uuid, report_structure_name, is_active,
  created_at, updated_at, created_by_user_id, created_by_user_name, version,
  name_of_import_file, imported_structure_id
FROM public.report_structures;

INSERT INTO public.report_line_items_new (
  report_line_item_id, report_line_item_uuid, report_line_item_description,
  report_structure_id, report_structure_name, report_line_item_key,
  parent_report_line_item_key, is_parent_key_existing, sort_order,
  hierarchy_path, level_1_line_item_description, level_2_line_item_description,
  level_3_line_item_description, level_4_line_item_description, level_5_line_item_description,
  level_6_line_item_description, level_7_line_item_description, line_item_type,
  description_of_leaf, is_leaf, is_calculated, display, data_source, comment
)
SELECT 
  report_line_item_id, report_line_item_uuid, report_line_item_description,
  report_structure_id, report_structure_name, report_line_item_key,
  parent_report_line_item_key, is_parent_key_existing, sort_order,
  hierarchy_path, level_1_line_item_description, level_2_line_item_description,
  level_3_line_item_description, level_4_line_item_description, level_5_line_item_description,
  level_6_line_item_description, level_7_line_item_description, line_item_type,
  description_of_leaf, is_leaf, is_calculated, display, data_source, comment
FROM public.report_line_items;

-- Update sequence values to continue from current max values
SELECT setval('report_structures_new_report_structure_id_seq', 
              COALESCE((SELECT MAX(report_structure_id) FROM public.report_structures_new), 1));
SELECT setval('report_line_items_new_report_line_item_id_seq', 
              COALESCE((SELECT MAX(report_line_item_id) FROM public.report_line_items_new), 1));

-- Drop old tables and rename new ones
DROP TABLE public.report_line_items CASCADE;
DROP TABLE public.report_structures CASCADE;

ALTER TABLE public.report_structures_new RENAME TO report_structures;
ALTER TABLE public.report_line_items_new RENAME TO report_line_items;

-- Rename sequences
ALTER SEQUENCE report_structures_new_report_structure_id_seq RENAME TO report_structures_report_structure_id_seq;
ALTER SEQUENCE report_line_items_new_report_line_item_id_seq RENAME TO report_line_items_report_line_item_id_seq;

-- Enable RLS on new tables
ALTER TABLE public.report_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_line_items ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for report_structures
CREATE POLICY "Admins can view all report structures" ON public.report_structures FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can insert report structures" ON public.report_structures FOR INSERT WITH CHECK (is_admin_user());
CREATE POLICY "Admins can update report structures" ON public.report_structures FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete report structures" ON public.report_structures FOR DELETE USING (is_admin_user());
CREATE POLICY "Users can view active report structures" ON public.report_structures FOR SELECT USING (is_active = true);

-- Recreate RLS policies for report_line_items
CREATE POLICY "Admins can view all report line items" ON public.report_line_items FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can insert report line items" ON public.report_line_items FOR INSERT WITH CHECK (is_admin_user());
CREATE POLICY "Admins can update report line items" ON public.report_line_items FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete report line items" ON public.report_line_items FOR DELETE USING (is_admin_user());
CREATE POLICY "Users can view line items from active structures" ON public.report_line_items FOR SELECT 
USING (EXISTS (SELECT 1 FROM report_structures WHERE report_structures.report_structure_id = report_line_items.report_structure_id AND report_structures.is_active = true));

-- Recreate triggers
CREATE TRIGGER update_report_structures_updated_at BEFORE UPDATE ON public.report_structures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_single_active_structure AFTER INSERT OR UPDATE ON public.report_structures FOR EACH ROW EXECUTE FUNCTION public.ensure_single_active_structure();
CREATE TRIGGER enforce_node_limit BEFORE INSERT ON public.report_line_items FOR EACH ROW EXECUTE FUNCTION public.enforce_node_limit();
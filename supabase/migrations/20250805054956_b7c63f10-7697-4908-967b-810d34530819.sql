-- Backup existing data before restructuring
CREATE TEMP TABLE temp_report_structures AS 
SELECT * FROM report_structures;

CREATE TEMP TABLE temp_report_line_items AS 
SELECT * FROM report_line_items;

-- Drop existing tables (this will also drop associated policies and triggers)
DROP TABLE IF EXISTS report_line_items CASCADE;
DROP TABLE IF EXISTS report_structures CASCADE;

-- Recreate report_structures table with correct column order and ID strategy
CREATE TABLE public.report_structures (
  report_structure_id SERIAL PRIMARY KEY,
  report_structure_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  report_structure_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL,
  created_by_user_name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

-- Recreate report_line_items table with correct column order and ID strategy
CREATE TABLE public.report_line_items (
  report_line_item_id SERIAL PRIMARY KEY,
  report_line_item_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  report_line_item_description TEXT,
  report_structure_id INTEGER NOT NULL REFERENCES public.report_structures(report_structure_id) ON DELETE CASCADE,
  report_structure_name TEXT NOT NULL,
  report_line_item_key TEXT NOT NULL,
  parent_report_line_item_key TEXT,
  is_parent_key_existing BOOLEAN DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  hierarchy_path TEXT,
  level_1_line_item_description TEXT,
  level_2_line_item_description TEXT,
  level_3_line_item_description TEXT,
  level_4_line_item_description TEXT,
  level_5_line_item_description TEXT,
  level_6_line_item_description TEXT,
  level_7_line_item_description TEXT,
  line_item_type TEXT,
  description_of_leaf TEXT,
  is_leaf BOOLEAN DEFAULT false,
  is_calculated BOOLEAN DEFAULT false,
  display BOOLEAN DEFAULT true,
  data_source TEXT,
  comment TEXT
);

-- Migrate data from temp tables to new structure
INSERT INTO public.report_structures (
  report_structure_id,
  report_structure_uuid,
  report_structure_name,
  is_active,
  created_at,
  updated_at,
  created_by_user_id,
  created_by_user_name,
  version
)
SELECT 
  COALESCE(report_structure_id, id) as report_structure_id,
  report_structure_uuid,
  report_structure_name,
  is_active,
  created_at,
  updated_at,
  created_by_user_id,
  created_by_user_name,
  version
FROM temp_report_structures;

INSERT INTO public.report_line_items (
  report_line_item_id,
  report_line_item_uuid,
  report_line_item_description,
  report_structure_id,
  report_structure_name,
  report_line_item_key,
  parent_report_line_item_key,
  is_parent_key_existing,
  sort_order,
  hierarchy_path,
  level_1_line_item_description,
  level_2_line_item_description,
  level_3_line_item_description,
  level_4_line_item_description,
  level_5_line_item_description,
  level_6_line_item_description,
  level_7_line_item_description,
  line_item_type,
  description_of_leaf,
  is_leaf,
  is_calculated,
  display,
  data_source,
  comment::text
)
SELECT 
  COALESCE(report_line_item_id, id) as report_line_item_id,
  report_line_item_uuid,
  report_line_item_description,
  report_structure_id,
  report_structure_name,
  report_line_item_key,
  parent_report_line_item_key,
  is_parent_key_existing,
  sort_order,
  hierarchy_path,
  level_1_line_item_description,
  level_2_line_item_description,
  level_3_line_item_description,
  level_4_line_item_description,
  level_5_line_item_description,
  level_6_line_item_description,
  level_7_line_item_description,
  line_item_type,
  description_of_leaf,
  is_leaf,
  is_calculated,
  display,
  data_source,
  comment::text
FROM temp_report_line_items;

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
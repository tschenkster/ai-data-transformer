-- Phase 1: Create backup tables and copy existing data
CREATE TABLE report_structures_backup AS SELECT * FROM report_structures;
CREATE TABLE report_line_items_backup AS SELECT * FROM report_line_items;

-- Phase 2: Drop existing tables (this will cascade to drop constraints and policies)
DROP TABLE IF EXISTS report_line_items CASCADE;
DROP TABLE IF EXISTS report_structures CASCADE;

-- Phase 3: Recreate sequences
CREATE SEQUENCE IF NOT EXISTS report_structures_report_structure_id_seq;
CREATE SEQUENCE IF NOT EXISTS report_line_items_report_line_item_id_seq;

-- Phase 4: Recreate report_structures with correct column order
CREATE TABLE public.report_structures (
  report_structure_id integer NOT NULL DEFAULT nextval('report_structures_report_structure_id_seq'::regclass),
  report_structure_uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  report_structure_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by_user_id uuid NOT NULL,
  created_by_user_name text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  PRIMARY KEY (report_structure_id)
);

-- Phase 5: Recreate report_line_items with correct column order
CREATE TABLE public.report_line_items (
  report_line_item_id integer NOT NULL DEFAULT nextval('report_line_items_report_line_item_id_seq'::regclass),
  report_line_item_uuid uuid NOT NULL DEFAULT gen_random_uuid(),
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
  comment text,
  PRIMARY KEY (report_line_item_id)
);

-- Phase 6: Restore data from backup tables
INSERT INTO report_structures (
  report_structure_id, report_structure_uuid, report_structure_name, is_active, 
  created_at, updated_at, created_by_user_id, created_by_user_name, version
)
SELECT 
  report_structure_id, report_structure_uuid, report_structure_name, is_active,
  created_at, updated_at, created_by_user_id, created_by_user_name, version
FROM report_structures_backup;

INSERT INTO report_line_items (
  report_line_item_id, report_line_item_uuid, report_line_item_description, report_structure_id,
  report_structure_name, report_line_item_key, parent_report_line_item_key, is_parent_key_existing,
  sort_order, hierarchy_path, level_1_line_item_description, level_2_line_item_description,
  level_3_line_item_description, level_4_line_item_description, level_5_line_item_description,
  level_6_line_item_description, level_7_line_item_description, line_item_type, description_of_leaf,
  is_leaf, is_calculated, display, data_source, comment
)
SELECT 
  report_line_item_id, report_line_item_uuid, report_line_item_description, report_structure_id,
  report_structure_name, report_line_item_key, parent_report_line_item_key, is_parent_key_existing,
  sort_order, hierarchy_path, level_1_line_item_description, level_2_line_item_description,
  level_3_line_item_description, level_4_line_item_description, level_5_line_item_description,
  level_6_line_item_description, level_7_line_item_description, line_item_type, description_of_leaf,
  is_leaf, is_calculated, display, data_source, comment
FROM report_line_items_backup;

-- Phase 7: Recreate constraints and indexes
CREATE UNIQUE INDEX idx_report_structures_uuid ON report_structures(report_structure_uuid);
CREATE UNIQUE INDEX idx_report_line_items_uuid ON report_line_items(report_line_item_uuid);
CREATE INDEX idx_report_line_items_structure_id ON report_line_items(report_structure_id);
CREATE INDEX idx_report_line_items_parent_key ON report_line_items(parent_report_line_item_key);

-- Phase 8: Enable RLS
ALTER TABLE public.report_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_line_items ENABLE ROW LEVEL SECURITY;

-- Phase 9: Recreate RLS policies for report_structures
CREATE POLICY "Admins can view all report structures" ON public.report_structures FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can insert report structures" ON public.report_structures FOR INSERT WITH CHECK (is_admin_user());
CREATE POLICY "Admins can update report structures" ON public.report_structures FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete report structures" ON public.report_structures FOR DELETE USING (is_admin_user());
CREATE POLICY "Users can view active report structures" ON public.report_structures FOR SELECT USING (is_active = true);

-- Phase 10: Recreate RLS policies for report_line_items
CREATE POLICY "Admins can view all report line items" ON public.report_line_items FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can insert report line items" ON public.report_line_items FOR INSERT WITH CHECK (is_admin_user());
CREATE POLICY "Admins can update report line items" ON public.report_line_items FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete report line items" ON public.report_line_items FOR DELETE USING (is_admin_user());
CREATE POLICY "Users can view line items from active structures" ON public.report_line_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM report_structures 
    WHERE report_structures.report_structure_id = report_line_items.report_structure_id 
    AND report_structures.is_active = true
  )
);

-- Phase 11: Recreate triggers
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

-- Phase 12: Update sequence values to current max
SELECT setval('report_structures_report_structure_id_seq', COALESCE((SELECT MAX(report_structure_id) FROM report_structures), 1));
SELECT setval('report_line_items_report_line_item_id_seq', COALESCE((SELECT MAX(report_line_item_id) FROM report_line_items), 1));

-- Phase 13: Clean up backup tables
DROP TABLE report_structures_backup;
DROP TABLE report_line_items_backup;
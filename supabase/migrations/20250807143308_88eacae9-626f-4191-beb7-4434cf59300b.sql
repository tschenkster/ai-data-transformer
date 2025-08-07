-- Step 1: Restructure report_structures table with proper column order and constraints

-- Drop existing table and recreate with proper structure
DROP TABLE IF EXISTS public.report_line_items CASCADE;
DROP TABLE IF EXISTS public.report_structures CASCADE;

-- Create report_structures with proper column order (UUID first, then integer ID)
CREATE TABLE public.report_structures (
  report_structure_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
  report_structure_id INTEGER GENERATED ALWAYS AS IDENTITY (START WITH 100) NOT NULL,
  report_structure_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL,
  created_by_user_name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  name_of_import_file TEXT,
  imported_structure_id TEXT,
  
  -- Primary key on UUID (business identifier)
  PRIMARY KEY (report_structure_uuid),
  
  -- Unique constraint on integer ID
  UNIQUE (report_structure_id)
);

-- Create report_line_items with proper column order and foreign key
CREATE TABLE public.report_line_items (
  report_line_item_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
  report_line_item_id INTEGER GENERATED ALWAYS AS IDENTITY (START WITH 1000) NOT NULL,
  report_line_item_description TEXT,
  report_structure_id INTEGER NOT NULL,
  report_structure_uuid UUID NOT NULL,
  report_structure_name TEXT NOT NULL,
  report_line_item_key TEXT NOT NULL,
  parent_report_line_item_key TEXT,
  parent_report_line_item_uuid UUID,
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
  comment TEXT,
  
  -- Primary key on UUID (business identifier)
  PRIMARY KEY (report_line_item_uuid),
  
  -- Unique constraint on integer ID
  UNIQUE (report_line_item_id),
  
  -- Foreign key to report_structures using integer ID for performance
  FOREIGN KEY (report_structure_id) REFERENCES public.report_structures (report_structure_id) ON DELETE CASCADE,
  
  -- Additional foreign key using UUID for business logic consistency
  FOREIGN KEY (report_structure_uuid) REFERENCES public.report_structures (report_structure_uuid) ON DELETE CASCADE
);

-- Enable RLS on both tables
ALTER TABLE public.report_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_line_items ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for report_structures
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
      SELECT 1 FROM public.report_structures 
      WHERE report_structures.report_structure_uuid = report_line_items.report_structure_uuid 
      AND report_structures.is_active = true
    )
  );

-- Recreate triggers
CREATE TRIGGER update_report_structures_updated_at
  BEFORE UPDATE ON public.report_structures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER ensure_single_active_structure
  AFTER INSERT OR UPDATE ON public.report_structures
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_active_structure();

CREATE TRIGGER enforce_node_limit
  BEFORE INSERT ON public.report_line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_node_limit();

-- Create indexes for performance
CREATE INDEX idx_report_structures_active ON public.report_structures (is_active);
CREATE INDEX idx_report_structures_created_by ON public.report_structures (created_by_user_id);
CREATE INDEX idx_report_line_items_structure_id ON public.report_line_items (report_structure_id);
CREATE INDEX idx_report_line_items_structure_uuid ON public.report_line_items (report_structure_uuid);
CREATE INDEX idx_report_line_items_parent_uuid ON public.report_line_items (parent_report_line_item_uuid);
CREATE INDEX idx_report_line_items_key ON public.report_line_items (report_line_item_key);
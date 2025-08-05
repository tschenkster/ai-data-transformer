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
  CAST(comment AS TEXT)
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
  CAST(comment AS TEXT)
FROM temp_report_line_items;
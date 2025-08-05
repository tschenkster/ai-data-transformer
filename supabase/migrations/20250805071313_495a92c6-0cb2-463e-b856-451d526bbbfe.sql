-- Phase 1: Database Schema Restructuring (Fixed)
-- This migration will restructure both tables to match the updated specifications

-- Step 1: Backup existing data and drop dependent objects
CREATE TABLE report_structures_backup AS SELECT * FROM report_structures;
CREATE TABLE report_line_items_backup AS SELECT * FROM report_line_items;

-- Step 2: Drop existing foreign key constraints and triggers
DROP TRIGGER IF EXISTS update_report_structures_updated_at ON report_structures;
DROP TRIGGER IF EXISTS ensure_single_active_structure_trigger ON report_structures;
DROP TRIGGER IF EXISTS enforce_node_limit_trigger ON report_line_items;

-- Step 3: Restructure report_structures table
DROP TABLE IF EXISTS report_structures CASCADE;

CREATE TABLE report_structures (
    report_structure_id SERIAL PRIMARY KEY,
    report_structure_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    report_structure_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by_user_id UUID NOT NULL,
    created_by_user_name TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1
);

-- Step 4: Restructure report_line_items table
DROP TABLE IF EXISTS report_line_items CASCADE;

CREATE TABLE report_line_items (
    report_line_item_id SERIAL PRIMARY KEY,
    report_line_item_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    report_line_item_description TEXT,
    report_structure_id INTEGER NOT NULL,
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

-- Step 5: Add foreign key constraint
ALTER TABLE report_line_items 
ADD CONSTRAINT fk_report_line_items_structure 
FOREIGN KEY (report_structure_id) REFERENCES report_structures(report_structure_id) ON DELETE CASCADE;

-- Step 6: Migrate data from backup tables
INSERT INTO report_structures (
    report_structure_id, report_structure_uuid, report_structure_name, is_active,
    created_at, updated_at, created_by_user_id, created_by_user_name, version
)
SELECT 
    id, report_structure_uuid, report_structure_name, is_active,
    created_at, updated_at, created_by_user_id, created_by_user_name, version
FROM report_structures_backup;

INSERT INTO report_line_items (
    report_line_item_id, report_line_item_uuid, report_line_item_description,
    report_structure_id, report_structure_name, report_line_item_key,
    parent_report_line_item_key, is_parent_key_existing, sort_order,
    hierarchy_path, level_1_line_item_description, level_2_line_item_description,
    level_3_line_item_description, level_4_line_item_description, level_5_line_item_description,
    level_6_line_item_description, level_7_line_item_description, line_item_type,
    description_of_leaf, is_leaf, is_calculated, display, data_source, comment
)
SELECT 
    id, report_line_item_uuid, report_line_item_description,
    report_structure_id, report_structure_name, report_line_item_key,
    parent_report_line_item_key, is_parent_key_existing, sort_order,
    hierarchy_path, level_1_line_item_description, level_2_line_item_description,
    level_3_line_item_description, level_4_line_item_description, level_5_line_item_description,
    level_6_line_item_description, level_7_line_item_description, line_item_type,
    description_of_leaf, is_leaf, is_calculated, display, data_source, comment::text
FROM report_line_items_backup;

-- Step 7: Update sequences to continue from current max values
SELECT setval('report_structures_report_structure_id_seq', COALESCE((SELECT MAX(report_structure_id) FROM report_structures), 1));
SELECT setval('report_line_items_report_line_item_id_seq', COALESCE((SELECT MAX(report_line_item_id) FROM report_line_items), 1));

-- Step 8: Recreate triggers and functions
CREATE TRIGGER update_report_structures_updated_at
    BEFORE UPDATE ON report_structures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER ensure_single_active_structure_trigger
    BEFORE UPDATE ON report_structures
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_active_structure();

CREATE TRIGGER enforce_node_limit_trigger
    BEFORE INSERT ON report_line_items
    FOR EACH ROW
    EXECUTE FUNCTION enforce_node_limit();

-- Step 9: Enable RLS on both tables
ALTER TABLE report_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_line_items ENABLE ROW LEVEL SECURITY;

-- Step 10: Recreate RLS policies for report_structures
CREATE POLICY "Admins can view all report structures" ON report_structures
    FOR SELECT USING (is_admin_user());

CREATE POLICY "Admins can insert report structures" ON report_structures
    FOR INSERT WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update report structures" ON report_structures
    FOR UPDATE USING (is_admin_user());

CREATE POLICY "Admins can delete report structures" ON report_structures
    FOR DELETE USING (is_admin_user());

CREATE POLICY "Users can view active report structures" ON report_structures
    FOR SELECT USING (is_active = true);

-- Step 11: Recreate RLS policies for report_line_items
CREATE POLICY "Admins can view all report line items" ON report_line_items
    FOR SELECT USING (is_admin_user());

CREATE POLICY "Admins can insert report line items" ON report_line_items
    FOR INSERT WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update report line items" ON report_line_items
    FOR UPDATE USING (is_admin_user());

CREATE POLICY "Admins can delete report line items" ON report_line_items
    FOR DELETE USING (is_admin_user());

CREATE POLICY "Users can view line items from active structures" ON report_line_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM report_structures 
            WHERE report_structures.report_structure_id = report_line_items.report_structure_id 
            AND report_structures.is_active = true
        )
    );

-- Step 12: Clean up backup tables
DROP TABLE report_structures_backup;
DROP TABLE report_line_items_backup;
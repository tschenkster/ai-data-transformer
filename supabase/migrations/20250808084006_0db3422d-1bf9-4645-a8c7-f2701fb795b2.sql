-- Normalize sort_order to global sequential ordering for all report structures
-- This migration fixes the sort_order to be globally sequential within each structure
-- instead of parent-level ordering

-- Create function to normalize sort_order within a structure
CREATE OR REPLACE FUNCTION normalize_structure_sort_order(p_structure_uuid UUID)
RETURNS void AS $$
DECLARE
    item_record RECORD;
    current_order INTEGER := 0;
BEGIN
    -- Use a recursive CTE to traverse the tree in the correct order
    -- This ensures proper hierarchical ordering (pre-order traversal)
    FOR item_record IN
        WITH RECURSIVE tree AS (
            -- Base case: root items (no parent)
            SELECT 
                report_line_item_uuid,
                report_line_item_key,
                parent_report_line_item_uuid,
                sort_order as original_sort_order,
                0 as depth,
                ARRAY[sort_order] as path
            FROM report_line_items 
            WHERE report_structure_uuid = p_structure_uuid 
                AND (parent_report_line_item_uuid IS NULL 
                     OR parent_report_line_item_uuid NOT IN (
                         SELECT report_line_item_uuid 
                         FROM report_line_items 
                         WHERE report_structure_uuid = p_structure_uuid
                     ))
            
            UNION ALL
            
            -- Recursive case: child items
            SELECT 
                rli.report_line_item_uuid,
                rli.report_line_item_key,
                rli.parent_report_line_item_uuid,
                rli.sort_order as original_sort_order,
                t.depth + 1,
                t.path || rli.sort_order
            FROM report_line_items rli
            INNER JOIN tree t ON rli.parent_report_line_item_uuid = t.report_line_item_uuid
            WHERE rli.report_structure_uuid = p_structure_uuid
        )
        SELECT * FROM tree 
        ORDER BY path
    LOOP
        -- Update sort_order to be globally sequential
        UPDATE report_line_items 
        SET sort_order = current_order 
        WHERE report_line_item_uuid = item_record.report_line_item_uuid;
        
        current_order := current_order + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Apply normalization to all existing structures
DO $$
DECLARE
    structure_record RECORD;
BEGIN
    FOR structure_record IN 
        SELECT DISTINCT report_structure_uuid 
        FROM report_line_items
    LOOP
        PERFORM normalize_structure_sort_order(structure_record.report_structure_uuid);
    END LOOP;
END;
$$;

-- Add unique constraint to prevent sort_order conflicts within structures
-- First, ensure no duplicates exist after normalization
ALTER TABLE report_line_items 
ADD CONSTRAINT unique_sort_order_per_structure 
UNIQUE (report_structure_uuid, sort_order);

-- Add index for performance
CREATE INDEX idx_report_line_items_structure_sort 
ON report_line_items (report_structure_uuid, sort_order);

-- Drop the normalization function as it's no longer needed
DROP FUNCTION normalize_structure_sort_order(UUID);
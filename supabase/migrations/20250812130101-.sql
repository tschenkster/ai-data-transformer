-- Fix the reorder_line_item_with_hierarchy function to properly handle sort_order and hierarchy_path
CREATE OR REPLACE FUNCTION public.reorder_line_item_with_hierarchy(p_structure_uuid uuid, p_moved_item_uuid uuid, p_new_parent_uuid uuid DEFAULT NULL::uuid, p_target_position integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_moved_item RECORD;
  v_new_parent RECORD;
  v_old_parent_uuid uuid;
  v_result jsonb;
  v_affected_count integer := 0;
  v_hierarchy_updates jsonb[] := '{}';
  v_item_record RECORD;
  v_new_hierarchy_path text;
  v_new_level integer;
  v_child_record RECORD;
  v_sibling_count integer;
BEGIN
  -- Serialize concurrent reorders per structure
  PERFORM pg_advisory_xact_lock(hashtext(p_structure_uuid::text));

  -- Get the moved item details
  SELECT * INTO v_moved_item
  FROM report_line_items 
  WHERE report_line_item_uuid = p_moved_item_uuid 
    AND report_structure_uuid = p_structure_uuid;
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Item not found',
      'moved_item_uuid', p_moved_item_uuid
    );
  END IF;

  -- Store old parent for cleanup
  v_old_parent_uuid := v_moved_item.parent_report_line_item_uuid;

  -- Get new parent details if specified
  IF p_new_parent_uuid IS NOT NULL THEN
    SELECT * INTO v_new_parent
    FROM report_line_items 
    WHERE report_line_item_uuid = p_new_parent_uuid 
      AND report_structure_uuid = p_structure_uuid;
      
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Target parent not found',
        'target_parent_uuid', p_new_parent_uuid
      );
    END IF;
    
    -- Calculate new hierarchy path and level (fix spacing issues)
    IF v_new_parent.hierarchy_path IS NULL OR v_new_parent.hierarchy_path = '' THEN
      v_new_hierarchy_path := v_new_parent.report_line_item_key;
    ELSE
      v_new_hierarchy_path := v_new_parent.hierarchy_path || '/' || v_new_parent.report_line_item_key;
    END IF;
    v_new_level := array_length(string_to_array(v_new_hierarchy_path, '/'), 1) + 1;
  ELSE
    -- Moving to root level
    v_new_hierarchy_path := '';
    v_new_level := 1;
  END IF;

  -- Prevent moving an item into its own descendants
  IF p_new_parent_uuid IS NOT NULL AND (
    v_new_parent.hierarchy_path LIKE v_moved_item.hierarchy_path || '/%' OR
    v_new_parent.report_line_item_uuid = p_moved_item_uuid
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot move item into its own descendants'
    );
  END IF;

  -- Phase 1: Offset all items in structure to avoid conflicts
  UPDATE report_line_items 
  SET sort_order = sort_order + 100000
  WHERE report_structure_uuid = p_structure_uuid;

  -- Phase 2: Update the moved item's parent relationships
  UPDATE report_line_items
  SET 
    parent_report_line_item_uuid = p_new_parent_uuid,
    parent_report_line_item_key = CASE 
      WHEN p_new_parent_uuid IS NOT NULL THEN v_new_parent.report_line_item_key 
      ELSE NULL 
    END,
    hierarchy_path = v_new_hierarchy_path,
    is_parent_key_existing = (p_new_parent_uuid IS NOT NULL)
  WHERE report_line_item_uuid = p_moved_item_uuid;

  GET DIAGNOSTICS v_affected_count = ROW_COUNT;

  -- Phase 3: Update level descriptions for moved item
  UPDATE report_line_items
  SET 
    level_1_line_item_description = CASE WHEN v_new_level >= 1 THEN 
      (SELECT report_line_item_description FROM report_line_items r WHERE r.report_line_item_key = split_part(v_new_hierarchy_path || CASE WHEN v_new_hierarchy_path = '' THEN '' ELSE '/' END || report_line_item_key, '/', 1) AND r.report_structure_uuid = p_structure_uuid LIMIT 1)
      ELSE NULL END,
    level_2_line_item_description = CASE WHEN v_new_level >= 2 THEN 
      (SELECT report_line_item_description FROM report_line_items r WHERE r.report_line_item_key = split_part(v_new_hierarchy_path || CASE WHEN v_new_hierarchy_path = '' THEN '' ELSE '/' END || report_line_item_key, '/', 2) AND r.report_structure_uuid = p_structure_uuid LIMIT 1)
      ELSE NULL END,
    level_3_line_item_description = CASE WHEN v_new_level >= 3 THEN 
      (SELECT report_line_item_description FROM report_line_items r WHERE r.report_line_item_key = split_part(v_new_hierarchy_path || CASE WHEN v_new_hierarchy_path = '' THEN '' ELSE '/' END || report_line_item_key, '/', 3) AND r.report_structure_uuid = p_structure_uuid LIMIT 1)
      ELSE NULL END,
    level_4_line_item_description = CASE WHEN v_new_level >= 4 THEN 
      (SELECT report_line_item_description FROM report_line_items r WHERE r.report_line_item_key = split_part(v_new_hierarchy_path || CASE WHEN v_new_hierarchy_path = '' THEN '' ELSE '/' END || report_line_item_key, '/', 4) AND r.report_structure_uuid = p_structure_uuid LIMIT 1)
      ELSE NULL END,
    level_5_line_item_description = CASE WHEN v_new_level >= 5 THEN 
      (SELECT report_line_item_description FROM report_line_items r WHERE r.report_line_item_key = split_part(v_new_hierarchy_path || CASE WHEN v_new_hierarchy_path = '' THEN '' ELSE '/' END || report_line_item_key, '/', 5) AND r.report_structure_uuid = p_structure_uuid LIMIT 1)
      ELSE NULL END,
    level_6_line_item_description = CASE WHEN v_new_level >= 6 THEN 
      (SELECT report_line_item_description FROM report_line_items r WHERE r.report_line_item_key = split_part(v_new_hierarchy_path || CASE WHEN v_new_hierarchy_path = '' THEN '' ELSE '/' END || report_line_item_key, '/', 6) AND r.report_structure_uuid = p_structure_uuid LIMIT 1)
      ELSE NULL END,
    level_7_line_item_description = CASE WHEN v_new_level >= 7 THEN 
      (SELECT report_line_item_description FROM report_line_items r WHERE r.report_line_item_key = split_part(v_new_hierarchy_path || CASE WHEN v_new_hierarchy_path = '' THEN '' ELSE '/' END || report_line_item_key, '/', 7) AND r.report_structure_uuid = p_structure_uuid LIMIT 1)
      ELSE NULL END
  WHERE report_line_item_uuid = p_moved_item_uuid;

  -- Phase 4: Recursively update all descendants with fixed hierarchy path construction
  FOR v_child_record IN 
    SELECT * FROM report_line_items 
    WHERE report_structure_uuid = p_structure_uuid 
      AND hierarchy_path LIKE v_moved_item.hierarchy_path || '/' || v_moved_item.report_line_item_key || '%'
  LOOP
    -- Calculate new hierarchy path for descendant (fix spacing)
    IF v_new_hierarchy_path = '' THEN
      v_new_hierarchy_path := v_moved_item.report_line_item_key || 
        substring(v_child_record.hierarchy_path from length(v_moved_item.hierarchy_path || '/' || v_moved_item.report_line_item_key) + 1);
    ELSE
      v_new_hierarchy_path := v_new_hierarchy_path || '/' || v_moved_item.report_line_item_key || 
        substring(v_child_record.hierarchy_path from length(v_moved_item.hierarchy_path || '/' || v_moved_item.report_line_item_key) + 1);
    END IF;
    
    -- Update descendant
    UPDATE report_line_items
    SET 
      hierarchy_path = v_new_hierarchy_path,
      level_1_line_item_description = CASE WHEN array_length(string_to_array(v_new_hierarchy_path, '/'), 1) >= 1 THEN 
        (SELECT report_line_item_description FROM report_line_items r WHERE r.report_line_item_key = split_part(v_new_hierarchy_path || '/' || report_line_item_key, '/', 1) AND r.report_structure_uuid = p_structure_uuid LIMIT 1)
        ELSE NULL END,
      level_2_line_item_description = CASE WHEN array_length(string_to_array(v_new_hierarchy_path, '/'), 1) >= 2 THEN 
        (SELECT report_line_item_description FROM report_line_items r WHERE r.report_line_item_key = split_part(v_new_hierarchy_path || '/' || report_line_item_key, '/', 2) AND r.report_structure_uuid = p_structure_uuid LIMIT 1)
        ELSE NULL END,
      level_3_line_item_description = CASE WHEN array_length(string_to_array(v_new_hierarchy_path, '/'), 1) >= 3 THEN 
        (SELECT report_line_item_description FROM report_line_items r WHERE r.report_line_item_key = split_part(v_new_hierarchy_path || '/' || report_line_item_key, '/', 3) AND r.report_structure_uuid = p_structure_uuid LIMIT 1)
        ELSE NULL END,
      level_4_line_item_description = CASE WHEN array_length(string_to_array(v_new_hierarchy_path, '/'), 1) >= 4 THEN 
        (SELECT report_line_item_description FROM report_line_items r WHERE r.report_line_item_key = split_part(v_new_hierarchy_path || '/' || report_line_item_key, '/', 4) AND r.report_structure_uuid = p_structure_uuid LIMIT 1)
        ELSE NULL END,
      level_5_line_item_description = CASE WHEN array_length(string_to_array(v_new_hierarchy_path, '/'), 1) >= 5 THEN 
        (SELECT report_line_item_description FROM report_line_items r WHERE r.report_line_item_key = split_part(v_new_hierarchy_path || '/' || report_line_item_key, '/', 5) AND r.report_structure_uuid = p_structure_uuid LIMIT 1)
        ELSE NULL END,
      level_6_line_item_description = CASE WHEN array_length(string_to_array(v_new_hierarchy_path, '/'), 1) >= 6 THEN 
        (SELECT report_line_item_description FROM report_line_items r WHERE r.report_line_item_key = split_part(v_new_hierarchy_path || '/' || report_line_item_key, '/', 6) AND r.report_structure_uuid = p_structure_uuid LIMIT 1)
        ELSE NULL END,
      level_7_line_item_description = CASE WHEN array_length(string_to_array(v_new_hierarchy_path, '/'), 1) >= 7 THEN 
        (SELECT report_line_item_description FROM report_line_items r WHERE r.report_line_item_key = split_part(v_new_hierarchy_path || '/' || report_line_item_key, '/', 7) AND r.report_structure_uuid = p_structure_uuid LIMIT 1)
        ELSE NULL END
    WHERE report_line_item_uuid = v_child_record.report_line_item_uuid;
    
    v_affected_count := v_affected_count + 1;
  END LOOP;

  -- Phase 5: Update is_leaf flags
  -- Update old parent if it has no children left
  IF v_old_parent_uuid IS NOT NULL THEN
    UPDATE report_line_items
    SET is_leaf = NOT EXISTS (
      SELECT 1 FROM report_line_items 
      WHERE parent_report_line_item_uuid = v_old_parent_uuid 
        AND report_structure_uuid = p_structure_uuid
    )
    WHERE report_line_item_uuid = v_old_parent_uuid;
  END IF;

  -- Update new parent (no longer leaf if it gains children)
  IF p_new_parent_uuid IS NOT NULL THEN
    UPDATE report_line_items
    SET is_leaf = false
    WHERE report_line_item_uuid = p_new_parent_uuid;
  END IF;

  -- Update moved item's leaf status
  UPDATE report_line_items
  SET is_leaf = NOT EXISTS (
    SELECT 1 FROM report_line_items 
    WHERE parent_report_line_item_uuid = p_moved_item_uuid 
      AND report_structure_uuid = p_structure_uuid
  )
  WHERE report_line_item_uuid = p_moved_item_uuid;

  -- Phase 6: Reassign sequential sort orders using hierarchical depth-first traversal
  WITH RECURSIVE hierarchy_ordered AS (
    -- Start with root items (no parent), ordered by their original sort_order
    SELECT 
      report_line_item_id,
      report_line_item_uuid,
      parent_report_line_item_uuid,
      report_line_item_key,
      hierarchy_path,
      0 as depth,
      ARRAY[sort_order] as path_array,
      sort_order as original_sort_order
    FROM report_line_items 
    WHERE report_structure_uuid = p_structure_uuid 
      AND parent_report_line_item_uuid IS NULL
    
    UNION ALL
    
    -- Recursively add children, maintaining hierarchical order
    SELECT 
      r.report_line_item_id,
      r.report_line_item_uuid,
      r.parent_report_line_item_uuid,
      r.report_line_item_key,
      r.hierarchy_path,
      h.depth + 1,
      h.path_array || r.sort_order,
      r.sort_order as original_sort_order
    FROM report_line_items r
    INNER JOIN hierarchy_ordered h ON r.parent_report_line_item_uuid = h.report_line_item_uuid
    WHERE r.report_structure_uuid = p_structure_uuid
  ),
  ordered_items AS (
    SELECT 
      report_line_item_id,
      ROW_NUMBER() OVER (ORDER BY path_array) - 1 as new_order
    FROM hierarchy_ordered
  )
  UPDATE report_line_items r
  SET sort_order = oi.new_order
  FROM ordered_items oi
  WHERE r.report_line_item_id = oi.report_line_item_id;

  v_result := jsonb_build_object(
    'success', true,
    'affected_count', v_affected_count,
    'moved_item_uuid', p_moved_item_uuid,
    'new_parent_uuid', p_new_parent_uuid,
    'old_parent_uuid', v_old_parent_uuid,
    'message', format('Successfully moved item and updated %s related items', v_affected_count)
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'affected_count', v_affected_count,
      'message', 'Hierarchical move operation failed'
    );
    RETURN v_result;
END;
$function$
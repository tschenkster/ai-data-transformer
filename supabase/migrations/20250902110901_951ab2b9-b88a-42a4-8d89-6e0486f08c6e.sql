-- Create function to compute hierarchy fields for all line items in a structure
CREATE OR REPLACE FUNCTION public.compute_hierarchy_fields_for_structure(p_structure_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_affected_count integer := 0;
  v_result jsonb;
BEGIN
  -- Step 1: Set is_parent_key_existing for items that have a parent
  UPDATE report_line_items
  SET is_parent_key_existing = (parent_report_line_item_key IS NOT NULL)
  WHERE report_structure_uuid = p_structure_uuid;

  -- Step 2: Compute hierarchy paths and level descriptions using recursive CTE
  WITH RECURSIVE hierarchy_paths AS (
    -- Base case: items without parent (root level)
    SELECT 
      report_line_item_uuid,
      report_line_item_description,
      parent_report_line_item_uuid,
      ARRAY[report_line_item_description] as path_segments,
      1 as depth
    FROM report_line_items 
    WHERE report_structure_uuid = p_structure_uuid 
      AND parent_report_line_item_uuid IS NULL
    
    UNION ALL
    
    -- Recursive case: build paths by joining parent paths
    SELECT 
      r.report_line_item_uuid,
      r.report_line_item_description,
      r.parent_report_line_item_uuid,
      hp.path_segments || r.report_line_item_description,
      hp.depth + 1
    FROM report_line_items r
    JOIN hierarchy_paths hp ON r.parent_report_line_item_uuid = hp.report_line_item_uuid
    WHERE r.report_structure_uuid = p_structure_uuid
  ),
  -- Pad path segments to 7 levels and compute all hierarchy fields
  padded_paths AS (
    SELECT 
      report_line_item_uuid,
      CASE 
        WHEN array_length(path_segments, 1) >= 7 THEN path_segments[1:7]
        ELSE path_segments || array_fill(''::text, ARRAY[7 - array_length(path_segments, 1)])
      END as padded_segments,
      array_to_string(path_segments, ' > ') as hierarchy_path
    FROM hierarchy_paths
  )
  UPDATE report_line_items r
  SET 
    hierarchy_path = pp.hierarchy_path,
    level_1_line_item_description = COALESCE(pp.padded_segments[1], ''),
    level_2_line_item_description = COALESCE(pp.padded_segments[2], ''),
    level_3_line_item_description = COALESCE(pp.padded_segments[3], ''),
    level_4_line_item_description = COALESCE(pp.padded_segments[4], ''),
    level_5_line_item_description = COALESCE(pp.padded_segments[5], ''),
    level_6_line_item_description = COALESCE(pp.padded_segments[6], ''),
    level_7_line_item_description = COALESCE(pp.padded_segments[7], '')
  FROM padded_paths pp
  WHERE r.report_line_item_uuid = pp.report_line_item_uuid
    AND r.report_structure_uuid = p_structure_uuid;

  -- Step 3: Set is_leaf flag (true if item has no children)
  UPDATE report_line_items r
  SET is_leaf = NOT EXISTS (
    SELECT 1 FROM report_line_items c 
    WHERE c.parent_report_line_item_uuid = r.report_line_item_uuid 
      AND c.report_structure_uuid = p_structure_uuid
  )
  WHERE r.report_structure_uuid = p_structure_uuid;

  -- Step 4: Set line_item_type based on is_leaf
  UPDATE report_line_items
  SET line_item_type = CASE 
    WHEN is_leaf THEN 'leaf'
    ELSE 'subtotal'
  END
  WHERE report_structure_uuid = p_structure_uuid;

  -- Step 5: Set description_of_leaf
  UPDATE report_line_items
  SET description_of_leaf = CASE 
    WHEN is_leaf THEN report_line_item_description
    ELSE 'n/a'
  END
  WHERE report_structure_uuid = p_structure_uuid;

  GET DIAGNOSTICS v_affected_count = ROW_COUNT;
  
  v_result := jsonb_build_object(
    'success', true,
    'affected_count', v_affected_count,
    'message', format('Successfully computed hierarchy fields for %s line items', v_affected_count)
  );
  
  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to compute hierarchy fields'
    );
END;
$function$;
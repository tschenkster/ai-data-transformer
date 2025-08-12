-- Implement deterministic hierarchy_path (8 segments, 7 " > " separators) using descriptions
-- Recompute for moved item and all descendants after reparenting
-- Maintain leaf status and stable depth-first sort_order

CREATE OR REPLACE FUNCTION public.reorder_line_item_with_hierarchy(
  p_structure_uuid uuid,
  p_moved_item_uuid uuid,
  p_new_parent_uuid uuid DEFAULT NULL::uuid,
  p_target_position integer DEFAULT 0
)
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

    -- Prevent moving an item into its own descendants using UUID-based subtree check
    IF EXISTS (
      WITH RECURSIVE sub AS (
        SELECT report_line_item_uuid
        FROM report_line_items
        WHERE report_line_item_uuid = p_moved_item_uuid
          AND report_structure_uuid = p_structure_uuid
        UNION ALL
        SELECT c.report_line_item_uuid
        FROM report_line_items c
        JOIN sub s ON c.parent_report_line_item_uuid = s.report_line_item_uuid
        WHERE c.report_structure_uuid = p_structure_uuid
      )
      SELECT 1 FROM sub WHERE report_line_item_uuid = p_new_parent_uuid
    ) OR p_new_parent_uuid = p_moved_item_uuid THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Cannot move item into its own descendants'
      );
    END IF;
  END IF;

  -- Phase 1: Offset all items in structure to avoid conflicts during resorting
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
    is_parent_key_existing = (p_new_parent_uuid IS NOT NULL)
  WHERE report_line_item_uuid = p_moved_item_uuid
    AND report_structure_uuid = p_structure_uuid;

  GET DIAGNOSTICS v_affected_count = ROW_COUNT;

  -- Phase 3: Recompute hierarchy_path and level_n_line_item_description for moved item and all descendants
  -- Rule: hierarchy_path = 8 segments (always), joined by ' > ', using descriptions; empty strings for missing levels
  WITH RECURSIVE ancestor_chain AS (
    SELECT r.report_line_item_uuid, r.parent_report_line_item_uuid, r.report_line_item_description, 1 AS depth
    FROM report_line_items r
    WHERE r.report_structure_uuid = p_structure_uuid
      AND r.report_line_item_uuid = p_new_parent_uuid
    UNION ALL
    SELECT r2.report_line_item_uuid, r2.parent_report_line_item_uuid, r2.report_line_item_description, ac.depth + 1
    FROM report_line_items r2
    JOIN ancestor_chain ac ON r2.report_line_item_uuid = ac.parent_report_line_item_uuid
    WHERE r2.report_structure_uuid = p_structure_uuid
  ),
  anc AS (
    SELECT array_agg(report_line_item_description ORDER BY depth DESC) AS arr
    FROM ancestor_chain
  ),
  subtree AS (
    -- Start at the moved item (after parent update)
    SELECT r.report_line_item_uuid,
           r.parent_report_line_item_uuid,
           r.report_line_item_description,
           COALESCE((SELECT arr FROM anc), '{}'::text[]) AS prefix
    FROM report_line_items r
    WHERE r.report_structure_uuid = p_structure_uuid
      AND r.report_line_item_uuid = p_moved_item_uuid

    UNION ALL

    -- Recursively traverse descendants, accumulating ancestor descriptions
    SELECT c.report_line_item_uuid,
           c.parent_report_line_item_uuid,
           c.report_line_item_description,
           s.prefix || ARRAY[s.report_line_item_description]
    FROM report_line_items c
    JOIN subtree s ON c.parent_report_line_item_uuid = s.report_line_item_uuid
    WHERE c.report_structure_uuid = p_structure_uuid
  ),
  prepared AS (
    SELECT 
      report_line_item_uuid,
      (prefix || ARRAY[report_line_item_description])::text[] AS base_segments
    FROM subtree
  ),
  padded AS (
    SELECT
      report_line_item_uuid,
      CASE 
        WHEN array_length(base_segments,1) IS NULL THEN array_fill(''::text, ARRAY[8])
        WHEN array_length(base_segments,1) >= 8 THEN base_segments[1:8]
        ELSE base_segments || CASE 
          WHEN 8 - array_length(base_segments,1) > 0 THEN array_fill(''::text, ARRAY[8 - array_length(base_segments,1)])
          ELSE '{}'::text[]
        END
      END AS segs
    FROM prepared
  )
  UPDATE report_line_items r
  SET 
    hierarchy_path = (
      SELECT string_agg(seg, ' > ')
      FROM unnest(p.segs) AS t(seg)
    ),
    level_1_line_item_description = COALESCE(p.segs[1], ''),
    level_2_line_item_description = COALESCE(p.segs[2], ''),
    level_3_line_item_description = COALESCE(p.segs[3], ''),
    level_4_line_item_description = COALESCE(p.segs[4], ''),
    level_5_line_item_description = COALESCE(p.segs[5], ''),
    level_6_line_item_description = COALESCE(p.segs[6], ''),
    level_7_line_item_description = COALESCE(p.segs[7], '')
  FROM padded p
  WHERE r.report_line_item_uuid = p.report_line_item_uuid
    AND r.report_structure_uuid = p_structure_uuid;

  -- Phase 4: Update is_leaf flags for old and new parents and moved item
  IF v_old_parent_uuid IS NOT NULL THEN
    UPDATE report_line_items
    SET is_leaf = NOT EXISTS (
      SELECT 1 FROM report_line_items 
      WHERE parent_report_line_item_uuid = v_old_parent_uuid 
        AND report_structure_uuid = p_structure_uuid
    )
    WHERE report_line_item_uuid = v_old_parent_uuid
      AND report_structure_uuid = p_structure_uuid;
  END IF;

  IF p_new_parent_uuid IS NOT NULL THEN
    UPDATE report_line_items
    SET is_leaf = false
    WHERE report_line_item_uuid = p_new_parent_uuid
      AND report_structure_uuid = p_structure_uuid;
  END IF;

  -- Moved item leaf status depends on whether it has children
  UPDATE report_line_items
  SET is_leaf = NOT EXISTS (
    SELECT 1 FROM report_line_items 
    WHERE parent_report_line_item_uuid = p_moved_item_uuid 
      AND report_structure_uuid = p_structure_uuid
  )
  WHERE report_line_item_uuid = p_moved_item_uuid
    AND report_structure_uuid = p_structure_uuid;

  -- Phase 5: Reassign sequential sort orders using hierarchical depth-first traversal
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
  WHERE r.report_line_item_id = oi.report_line_item_id
    AND r.report_structure_uuid = p_structure_uuid;

  v_result := jsonb_build_object(
    'success', true,
    'affected_count', v_affected_count,
    'moved_item_uuid', p_moved_item_uuid,
    'new_parent_uuid', p_new_parent_uuid,
    'old_parent_uuid', v_old_parent_uuid,
    'message', 'Successfully moved item, recomputed hierarchy_path (fixed 7 separators), and reassigned sort order'
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
$function$;
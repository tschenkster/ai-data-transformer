-- Extend and harden hierarchical reorder function to handle reorder, reparent, and rename atomically
-- It preserves existing behavior (global sequential sort_order after hierarchical traversal)

CREATE OR REPLACE FUNCTION public.reorder_line_item_with_hierarchy(
  p_structure_uuid uuid,
  p_moved_item_uuid uuid,
  p_new_parent_uuid uuid DEFAULT NULL,
  p_target_position integer DEFAULT NULL, -- sibling index (0-based). NULL means keep current relative position
  p_drop_position text DEFAULT NULL,      -- 'before' | 'after' | 'inside' (optional, currently not required by frontend)
  p_target_sibling_uuid uuid DEFAULT NULL,
  p_new_description text DEFAULT NULL,
  p_regenerate_keys boolean DEFAULT false,
  p_is_calculated_override boolean DEFAULT NULL,
  p_line_item_type_override text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_moved_item RECORD;
  v_new_parent RECORD;
  v_old_parent_uuid uuid;
  v_same_parent boolean := false;
  v_result jsonb;
  v_affected_count integer := 0;
  v_structure_id int;
  v_action text := 'move';
BEGIN
  -- Serialize concurrent operations per structure
  PERFORM pg_advisory_xact_lock(hashtext(p_structure_uuid::text));

  -- Load moved item
  SELECT * INTO v_moved_item
  FROM report_line_items 
  WHERE report_line_item_uuid = p_moved_item_uuid 
    AND report_structure_uuid = p_structure_uuid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found', 'moved_item_uuid', p_moved_item_uuid);
  END IF;

  v_structure_id := v_moved_item.report_structure_id;
  v_old_parent_uuid := v_moved_item.parent_report_line_item_uuid;

  -- Resolve new parent if provided
  IF p_new_parent_uuid IS NOT NULL THEN
    SELECT * INTO v_new_parent
    FROM report_line_items
    WHERE report_line_item_uuid = p_new_parent_uuid
      AND report_structure_uuid = p_structure_uuid;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Target parent not found', 'target_parent_uuid', p_new_parent_uuid);
    END IF;

    -- Prevent cycles
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
      RETURN jsonb_build_object('success', false, 'error', 'Cannot move item into its own descendants');
    END IF;
  END IF;

  v_same_parent := COALESCE(v_old_parent_uuid, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(p_new_parent_uuid, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Apply optional rename first
  IF p_new_description IS NOT NULL AND p_new_description <> v_moved_item.report_line_item_description THEN
    UPDATE report_line_items
    SET report_line_item_description = p_new_description
    WHERE report_line_item_uuid = p_moved_item_uuid
      AND report_structure_uuid = p_structure_uuid;
    v_action := CASE WHEN v_action = 'move' THEN 'move+rename' ELSE 'rename' END;
  END IF;

  -- Apply parent change when different
  IF NOT v_same_parent THEN
    UPDATE report_line_items
    SET 
      parent_report_line_item_uuid = p_new_parent_uuid,
      parent_report_line_item_key = CASE 
        WHEN p_new_parent_uuid IS NOT NULL THEN (SELECT report_line_item_key FROM report_line_items WHERE report_line_item_uuid = p_new_parent_uuid)
        ELSE NULL END,
      is_parent_key_existing = (p_new_parent_uuid IS NOT NULL)
    WHERE report_line_item_uuid = p_moved_item_uuid
      AND report_structure_uuid = p_structure_uuid;
  END IF;

  -- Resequence siblings in source and target parents if needed
  -- Note: We keep resequencing local sibling sets now; later we'll recompute global order
  IF NOT v_same_parent THEN
    -- Resequence old parent's children (excluding moved)
    IF v_old_parent_uuid IS NULL THEN
      WITH sib AS (
        SELECT r.report_line_item_id, row_number() OVER (ORDER BY sort_order) - 1 AS rn
        FROM report_line_items r
        WHERE r.report_structure_uuid = p_structure_uuid
          AND r.parent_report_line_item_uuid IS NULL
          AND r.report_line_item_uuid <> p_moved_item_uuid
      )
      UPDATE report_line_items r
      SET sort_order = s.rn
      FROM sib s
      WHERE r.report_line_item_id = s.report_line_item_id;
    ELSE
      WITH sib AS (
        SELECT r.report_line_item_id, row_number() OVER (ORDER BY sort_order) - 1 AS rn
        FROM report_line_items r
        WHERE r.report_structure_uuid = p_structure_uuid
          AND r.parent_report_line_item_uuid = v_old_parent_uuid
          AND r.report_line_item_uuid <> p_moved_item_uuid
      )
      UPDATE report_line_items r
      SET sort_order = s.rn
      FROM sib s
      WHERE r.report_line_item_id = s.report_line_item_id;
    END IF;
  END IF;

  -- Resequence target parent's children to insert moved at desired position when provided
  IF p_target_position IS NOT NULL THEN
    IF p_new_parent_uuid IS NULL THEN
      -- root level
      WITH reseq AS (
        SELECT r.report_line_item_id, r.report_line_item_uuid, row_number() OVER (ORDER BY sort_order) - 1 AS rn
        FROM report_line_items r
        WHERE r.report_structure_uuid = p_structure_uuid
          AND r.parent_report_line_item_uuid IS NULL
          AND r.report_line_item_uuid <> p_moved_item_uuid
      ), bumped AS (
        SELECT report_line_item_id, CASE WHEN rn >= p_target_position THEN rn + 1 ELSE rn END AS new_rn
        FROM reseq
      )
      UPDATE report_line_items r
      SET sort_order = b.new_rn
      FROM bumped b
      WHERE r.report_line_item_id = b.report_line_item_id;

      UPDATE report_line_items
      SET sort_order = p_target_position
      WHERE report_line_item_uuid = p_moved_item_uuid
        AND report_structure_uuid = p_structure_uuid;
    ELSE
      -- non-root level
      WITH reseq AS (
        SELECT r.report_line_item_id, r.report_line_item_uuid, row_number() OVER (ORDER BY sort_order) - 1 AS rn
        FROM report_line_items r
        WHERE r.report_structure_uuid = p_structure_uuid
          AND r.parent_report_line_item_uuid = p_new_parent_uuid
          AND r.report_line_item_uuid <> p_moved_item_uuid
      ), bumped AS (
        SELECT report_line_item_id, CASE WHEN rn >= p_target_position THEN rn + 1 ELSE rn END AS new_rn
        FROM reseq
      )
      UPDATE report_line_items r
      SET sort_order = b.new_rn
      FROM bumped b
      WHERE r.report_line_item_id = b.report_line_item_id;

      UPDATE report_line_items
      SET sort_order = p_target_position
      WHERE report_line_item_uuid = p_moved_item_uuid
        AND report_structure_uuid = p_structure_uuid;
    END IF;
  END IF;

  -- Phase 1: Offset all items in this structure to avoid conflicts during global resorting
  UPDATE report_line_items 
  SET sort_order = sort_order + 100000
  WHERE report_structure_uuid = p_structure_uuid;

  -- Phase 2: Recompute hierarchy_path and level_n_ descriptions for moved item and its descendants
  WITH RECURSIVE ancestor_chain AS (
    SELECT r.report_line_item_uuid, r.parent_report_line_item_uuid, r.report_line_item_description, 1 AS depth
    FROM report_line_items r
    WHERE r.report_structure_uuid = p_structure_uuid
      AND r.report_line_item_uuid = (SELECT report_line_item_uuid FROM report_line_items WHERE report_line_item_uuid = p_moved_item_uuid)
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
    SELECT r.report_line_item_uuid,
           r.parent_report_line_item_uuid,
           r.report_line_item_description,
           COALESCE((SELECT arr FROM anc), '{}'::text[]) AS prefix
    FROM report_line_items r
    WHERE r.report_structure_uuid = p_structure_uuid
      AND r.report_line_item_uuid = p_moved_item_uuid

    UNION ALL

    SELECT c.report_line_item_uuid,
           c.parent_report_line_item_uuid,
           c.report_line_item_description,
           s.prefix || ARRAY[s.report_line_item_description]
    FROM report_line_items c
    JOIN subtree s ON c.parent_report_line_item_uuid = s.report_line_item_uuid
    WHERE c.report_structure_uuid = p_structure_uuid
  ),
  prepared AS (
    SELECT report_line_item_uuid,
           (prefix || ARRAY[report_line_item_description])::text[] AS base_segments
    FROM subtree
  ),
  padded AS (
    SELECT report_line_item_uuid,
      CASE 
        WHEN array_length(base_segments,1) IS NULL THEN array_fill(''::text, ARRAY[8])
        WHEN array_length(base_segments,1) >= 8 THEN base_segments[1:8]
        ELSE base_segments || CASE 
          WHEN 8 - array_length(base_segments,1) > 0 THEN array_fill(''::text, ARRAY[8 - array_length(base_segments,1)])
          ELSE '{}'::text[] END
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

  -- Optional key regeneration for moved subtree
  IF p_regenerate_keys THEN
    -- Build slug from description segments per node
    WITH RECURSIVE tree AS (
      SELECT r.report_line_item_uuid,
             r.parent_report_line_item_uuid,
             r.hierarchy_path
      FROM report_line_items r
      WHERE r.report_structure_uuid = p_structure_uuid
        AND r.report_line_item_uuid = p_moved_item_uuid
      UNION ALL
      SELECT c.report_line_item_uuid,
             c.parent_report_line_item_uuid,
             c.hierarchy_path
      FROM report_line_items c
      JOIN tree t ON c.parent_report_line_item_uuid = t.report_line_item_uuid
      WHERE c.report_structure_uuid = p_structure_uuid
    ),
    keys AS (
      SELECT 
        report_line_item_uuid,
        lower(regexp_replace(coalesce(hierarchy_path,''), '[^a-zA-Z0-9]+', '_', 'g')) AS base_key
      FROM tree
    )
    UPDATE report_line_items r
    SET report_line_item_key = 
      (
        WITH gen AS (
          SELECT k.base_key AS candidate
          FROM keys k
          WHERE k.report_line_item_uuid = r.report_line_item_uuid
        ),
        uniq AS (
          SELECT CASE 
            WHEN NOT EXISTS (
              SELECT 1 FROM report_line_items r2
              WHERE r2.report_structure_uuid = p_structure_uuid
                AND r2.report_line_item_key = (SELECT candidate FROM gen)
                AND r2.report_line_item_uuid <> r.report_line_item_uuid
            ) THEN (SELECT candidate FROM gen)
            ELSE NULL END AS unique_key
        )
        SELECT COALESCE(
          (SELECT unique_key FROM uniq),
          (
            SELECT candidate || '_' || i::text
            FROM gen,
            generate_series(1, 1000) AS g(i)
            WHERE NOT EXISTS (
              SELECT 1 FROM report_line_items r3
              WHERE r3.report_structure_uuid = p_structure_uuid
                AND r3.report_line_item_key = (SELECT candidate FROM gen) || '_' || i::text
            )
            LIMIT 1
          )
        )
      )
    WHERE r.report_structure_uuid = p_structure_uuid
      AND r.report_line_item_uuid IN (
        WITH RECURSIVE t AS (
          SELECT report_line_item_uuid
          FROM report_line_items 
          WHERE report_line_item_uuid = p_moved_item_uuid AND report_structure_uuid = p_structure_uuid
          UNION ALL
          SELECT c.report_line_item_uuid
          FROM report_line_items c
          JOIN t ON c.parent_report_line_item_uuid = t.report_line_item_uuid
          WHERE c.report_structure_uuid = p_structure_uuid
        ) SELECT report_line_item_uuid FROM t
      );

    -- Cascade parent_report_line_item_key from parents to children across subtree
    WITH RECURSIVE t AS (
      SELECT r.report_line_item_uuid, r.parent_report_line_item_uuid
      FROM report_line_items r
      WHERE r.report_structure_uuid = p_structure_uuid
        AND r.report_line_item_uuid = p_moved_item_uuid
      UNION ALL
      SELECT c.report_line_item_uuid, c.parent_report_line_item_uuid
      FROM report_line_items c
      JOIN t ON c.parent_report_line_item_uuid = t.report_line_item_uuid
      WHERE c.report_structure_uuid = p_structure_uuid
    )
    UPDATE report_line_items c
    SET parent_report_line_item_key = p.report_line_item_key,
        is_parent_key_existing = (c.parent_report_line_item_uuid IS NOT NULL)
    FROM report_line_items p
    WHERE c.parent_report_line_item_uuid = p.report_line_item_uuid
      AND c.report_structure_uuid = p_structure_uuid
      AND c.report_line_item_uuid IN (SELECT report_line_item_uuid FROM t);
  END IF;

  -- Update leaf flags for old/new parents and moved item
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

  UPDATE report_line_items
  SET is_leaf = NOT EXISTS (
    SELECT 1 FROM report_line_items 
    WHERE parent_report_line_item_uuid = p_moved_item_uuid 
      AND report_structure_uuid = p_structure_uuid
  )
  WHERE report_line_item_uuid = p_moved_item_uuid
    AND report_structure_uuid = p_structure_uuid;

  -- Enforce line_item_type and is_calculated according to children
  -- Determine child counts
  WITH counts AS (
    SELECT 
      r.report_line_item_uuid,
      (SELECT COUNT(1) FROM report_line_items c WHERE c.parent_report_line_item_uuid = r.report_line_item_uuid AND c.report_structure_uuid = p_structure_uuid) AS child_count
    FROM report_line_items r
    WHERE r.report_structure_uuid = p_structure_uuid
      AND r.report_line_item_uuid IN (
        SELECT x FROM (VALUES (p_moved_item_uuid), (v_old_parent_uuid), (p_new_parent_uuid)) AS v(x)
      )
  )
  UPDATE report_line_items r
  SET 
    line_item_type = COALESCE(
      CASE 
        WHEN c.child_count IS NULL THEN r.line_item_type
        WHEN c.child_count > 0 THEN 'header'
        ELSE 'leaf' 
      END,
      r.line_item_type
    ),
    is_calculated = CASE 
      WHEN p_is_calculated_override IS NOT NULL THEN p_is_calculated_override
      WHEN (CASE WHEN c.child_count > 0 THEN 'header' ELSE 'leaf' END) <> 'leaf' THEN false
      ELSE r.is_calculated
    END
  FROM counts c
  WHERE r.report_line_item_uuid = c.report_line_item_uuid
    AND r.report_structure_uuid = p_structure_uuid;

  -- Apply explicit type override if provided, but enforce child constraints
  IF p_line_item_type_override IS NOT NULL THEN
    UPDATE report_line_items r
    SET line_item_type = CASE 
      WHEN EXISTS (SELECT 1 FROM report_line_items c WHERE c.parent_report_line_item_uuid = r.report_line_item_uuid AND c.report_structure_uuid = p_structure_uuid) 
        THEN CASE WHEN p_line_item_type_override = 'leaf' THEN 'header' ELSE p_line_item_type_override END
      ELSE p_line_item_type_override
    END
    WHERE r.report_line_item_uuid = p_moved_item_uuid
      AND r.report_structure_uuid = p_structure_uuid;
  END IF;

  -- Phase 3: Reassign global sequential sort orders using hierarchical depth-first traversal
  WITH RECURSIVE hierarchy_ordered AS (
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

  -- Build result
  GET DIAGNOSTICS v_affected_count = ROW_COUNT;

  v_result := jsonb_build_object(
    'success', true,
    'affected_count', v_affected_count,
    'moved_item_uuid', p_moved_item_uuid,
    'new_parent_uuid', p_new_parent_uuid,
    'old_parent_uuid', v_old_parent_uuid,
    'message', 'Move/rename completed; hierarchy_path (8 segments) refreshed; global sort_order resequenced'
  );

  -- Audit log (best-effort)
  PERFORM public.log_structure_change(
    p_structure_uuid => p_structure_uuid,
    p_structure_id => v_structure_id,
    p_line_item_uuid => p_moved_item_uuid,
    p_line_item_id => v_moved_item.report_line_item_id,
    p_action_type => CASE WHEN v_action LIKE '%move%' AND p_new_description IS NOT NULL THEN 'move'::change_action_type ELSE 'rename'::change_action_type END,
    p_line_item_key => COALESCE((SELECT report_line_item_key FROM report_line_items WHERE report_line_item_uuid = p_moved_item_uuid), v_moved_item.report_line_item_key),
    p_line_item_description => COALESCE(p_new_description, v_moved_item.report_line_item_description),
    p_previous_state => jsonb_build_object(
      'parent_report_line_item_uuid', v_old_parent_uuid,
      'hierarchy_path', v_moved_item.hierarchy_path,
      'sort_order', v_moved_item.sort_order,
      'report_line_item_key', v_moved_item.report_line_item_key
    ),
    p_new_state => (
      SELECT to_jsonb(r) - 'report_structure_id' - 'report_structure_uuid' - 'report_structure_name'
      FROM report_line_items r
      WHERE r.report_line_item_uuid = p_moved_item_uuid
    )
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Hierarchical operation failed'
  );
END;
$$;
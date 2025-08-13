-- Fix hierarchy_path duplication when moving items upward by building ancestor chain from new parent (not the moved node)
-- Function: public.reorder_line_item_with_hierarchy (10-arg variant)

CREATE OR REPLACE FUNCTION public.reorder_line_item_with_hierarchy(
  p_structure_uuid uuid,
  p_moved_item_uuid uuid,
  p_new_parent_uuid uuid DEFAULT NULL::uuid,
  p_target_position integer DEFAULT NULL::integer,
  p_drop_position text DEFAULT NULL::text,
  p_target_sibling_uuid uuid DEFAULT NULL::uuid,
  p_new_description text DEFAULT NULL::text,
  p_regenerate_keys boolean DEFAULT false,
  p_is_calculated_override boolean DEFAULT NULL::boolean,
  p_line_item_type_override text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_moved_item RECORD;
  v_old_parent_uuid uuid;
  v_same_parent boolean := false;
  v_result jsonb;
  v_affected_count integer := 0;
  v_structure_id int;
BEGIN
  -- Serialize concurrent reorders per structure
  PERFORM pg_advisory_xact_lock(hashtext(p_structure_uuid::text));

  SELECT * INTO v_moved_item
  FROM report_line_items 
  WHERE report_line_item_uuid = p_moved_item_uuid 
    AND report_structure_uuid = p_structure_uuid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found');
  END IF;

  v_structure_id := v_moved_item.report_structure_id;
  v_old_parent_uuid := v_moved_item.parent_report_line_item_uuid;
  v_same_parent := COALESCE(v_old_parent_uuid, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(p_new_parent_uuid, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Rename (if any)
  IF p_new_description IS NOT NULL AND p_new_description <> v_moved_item.report_line_item_description THEN
    UPDATE report_line_items
    SET report_line_item_description = p_new_description
    WHERE report_line_item_uuid = p_moved_item_uuid
      AND report_structure_uuid = p_structure_uuid;
  END IF;

  -- Reparent if needed
  IF NOT v_same_parent THEN
    UPDATE report_line_items
    SET 
      parent_report_line_item_uuid = p_new_parent_uuid,
      parent_report_line_item_key = CASE WHEN p_new_parent_uuid IS NOT NULL 
        THEN (SELECT report_line_item_key FROM report_line_items WHERE report_line_item_uuid = p_new_parent_uuid)
        ELSE NULL END,
      is_parent_key_existing = (p_new_parent_uuid IS NOT NULL)
    WHERE report_line_item_uuid = p_moved_item_uuid
      AND report_structure_uuid = p_structure_uuid;
  END IF;

  -- PHASE A: Global offset first to avoid unique constraint collisions
  UPDATE report_line_items 
  SET sort_order = sort_order + 100000
  WHERE report_structure_uuid = p_structure_uuid;

  -- PHASE B: Deterministic sibling resequencing in a single UPDATE (temporary range)
  IF p_target_position IS NOT NULL THEN
    WITH sib_excl AS (
      SELECT r.report_line_item_id, r.report_line_item_uuid,
             row_number() OVER (ORDER BY r.sort_order, r.report_line_item_id) - 1 AS rn
      FROM report_line_items r
      WHERE r.report_structure_uuid = p_structure_uuid
        AND ((p_new_parent_uuid IS NULL AND r.parent_report_line_item_uuid IS NULL)
             OR r.parent_report_line_item_uuid = p_new_parent_uuid)
        AND r.report_line_item_uuid <> p_moved_item_uuid
    ), stats AS (
      SELECT COUNT(*)::int AS cnt FROM sib_excl
    ), params AS (
      SELECT GREATEST(0, LEAST(COALESCE(p_target_position, s.cnt), s.cnt)) AS tpos FROM stats s
    ), final_positions AS (
      -- existing siblings with bumped positions after target
      SELECT se.report_line_item_id, se.report_line_item_uuid,
             CASE WHEN se.rn >= (SELECT tpos FROM params) THEN se.rn + 1 ELSE se.rn END AS new_rn
      FROM sib_excl se
      UNION ALL
      -- moved item at target
      SELECT v_moved_item.report_line_item_id, v_moved_item.report_line_item_uuid, (SELECT tpos FROM params) AS new_rn
    )
    UPDATE report_line_items r
    SET sort_order = 10000 + fp.new_rn
    FROM final_positions fp
    WHERE r.report_line_item_id = fp.report_line_item_id
      AND r.report_structure_uuid = p_structure_uuid;
  END IF;

  -- PHASE C: Recompute hierarchy_path and levels for moved subtree
  -- Build ancestor chain from the NEW PARENT (not the moved item) to avoid duplicating the moved node in the path
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
  ), anc AS (
    SELECT array_agg(report_line_item_description ORDER BY depth DESC) AS arr
    FROM ancestor_chain
  ), subtree AS (
    -- Start at the moved item (after parent update) and traverse descendants
    SELECT r.report_line_item_uuid, r.parent_report_line_item_uuid, r.report_line_item_description,
           COALESCE((SELECT arr FROM anc), '{}'::text[]) AS prefix
    FROM report_line_items r
    WHERE r.report_structure_uuid = p_structure_uuid AND r.report_line_item_uuid = p_moved_item_uuid
    UNION ALL
    SELECT c.report_line_item_uuid, c.parent_report_line_item_uuid, c.report_line_item_description,
           s.prefix || ARRAY[s.report_line_item_description]
    FROM report_line_items c
    JOIN subtree s ON c.parent_report_line_item_uuid = s.report_line_item_uuid
    WHERE c.report_structure_uuid = p_structure_uuid
  ), prepared AS (
    SELECT report_line_item_uuid,
           (prefix || ARRAY[report_line_item_description])::text[] AS base_segments
    FROM subtree
  ), padded AS (
    SELECT report_line_item_uuid,
      CASE 
        WHEN array_length(base_segments,1) IS NULL THEN array_fill(''::text, ARRAY[8])
        WHEN array_length(base_segments,1) >= 8 THEN base_segments[1:8]
        ELSE base_segments || CASE WHEN 8 - array_length(base_segments,1) > 0 THEN array_fill(''::text, ARRAY[8 - array_length(base_segments,1)]) ELSE '{}'::text[] END
      END AS segs
    FROM prepared
  )
  UPDATE report_line_items r
  SET hierarchy_path = (SELECT string_agg(seg, ' > ') FROM unnest(p.segs) AS t(seg)),
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

  -- PHASE D: Enforce leaf/type and final global resequencing
  IF v_old_parent_uuid IS NOT NULL THEN
    UPDATE report_line_items
    SET is_leaf = NOT EXISTS (
      SELECT 1 FROM report_line_items WHERE parent_report_line_item_uuid = v_old_parent_uuid AND report_structure_uuid = p_structure_uuid
    )
    WHERE report_line_item_uuid = v_old_parent_uuid AND report_structure_uuid = p_structure_uuid;
  END IF;
  IF p_new_parent_uuid IS NOT NULL THEN
    UPDATE report_line_items SET is_leaf = false
    WHERE report_line_item_uuid = p_new_parent_uuid AND report_structure_uuid = p_structure_uuid;
  END IF;
  UPDATE report_line_items r
  SET is_leaf = NOT EXISTS (
    SELECT 1 FROM report_line_items c WHERE c.parent_report_line_item_uuid = r.report_line_item_uuid AND c.report_structure_uuid = p_structure_uuid
  )
  WHERE r.report_line_item_uuid = p_moved_item_uuid AND r.report_structure_uuid = p_structure_uuid;

  -- Final global resequencing (depth-first)
  WITH RECURSIVE hierarchy_ordered AS (
    SELECT report_line_item_id, report_line_item_uuid, parent_report_line_item_uuid, report_line_item_key, hierarchy_path,
           0 as depth, ARRAY[sort_order] as path_array, sort_order as original_sort_order
    FROM report_line_items 
    WHERE report_structure_uuid = p_structure_uuid AND parent_report_line_item_uuid IS NULL
    UNION ALL
    SELECT r.report_line_item_id, r.report_line_item_uuid, r.parent_report_line_item_uuid, r.report_line_item_key, r.hierarchy_path,
           h.depth + 1, h.path_array || r.sort_order, r.sort_order
    FROM report_line_items r
    JOIN hierarchy_ordered h ON r.parent_report_line_item_uuid = h.report_line_item_uuid
    WHERE r.report_structure_uuid = p_structure_uuid
  ), ordered_items AS (
    SELECT report_line_item_id, ROW_NUMBER() OVER (ORDER BY path_array) - 1 as new_order
    FROM hierarchy_ordered
  )
  UPDATE report_line_items r
  SET sort_order = oi.new_order
  FROM ordered_items oi
  WHERE r.report_line_item_id = oi.report_line_item_id AND r.report_structure_uuid = p_structure_uuid;

  GET DIAGNOSTICS v_affected_count = ROW_COUNT;
  v_result := jsonb_build_object('success', true, 'affected_count', v_affected_count);
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;
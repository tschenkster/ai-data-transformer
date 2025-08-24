-- Create RPC function to convert line item IDs to concatenated format
CREATE OR REPLACE FUNCTION public.convert_line_items_to_concatenated_format(p_structure_id integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_expected_start integer;
  v_max_current_id integer;
  v_items_updated integer := 0;
  v_result jsonb;
BEGIN
  -- Calculate expected concatenated ID start for this structure
  v_expected_start := p_structure_id * 10000;
  
  -- Get the highest current ID for this structure
  SELECT MAX(report_line_item_id) INTO v_max_current_id
  FROM report_line_items 
  WHERE report_structure_id = p_structure_id;
  
  -- Only convert if IDs are not already in concatenated format
  IF v_max_current_id < v_expected_start THEN
    -- Temporarily drop identity constraint
    ALTER TABLE report_line_items ALTER COLUMN report_line_item_id DROP IDENTITY;
    
    -- Update IDs to concatenated format using a single UPDATE with window function
    WITH ordered_items AS (
      SELECT 
        report_line_item_id,
        ROW_NUMBER() OVER (ORDER BY sort_order, report_line_item_id) as rn
      FROM report_line_items 
      WHERE report_structure_id = p_structure_id
    )
    UPDATE report_line_items r
    SET report_line_item_id = v_expected_start + oi.rn
    FROM ordered_items oi
    WHERE r.report_line_item_id = oi.report_line_item_id;
    
    GET DIAGNOSTICS v_items_updated = ROW_COUNT;
    
    -- Update change logs to reference new concatenated IDs
    UPDATE report_structure_change_logs 
    SET line_item_id = (p_structure_id * 10000) + ((line_item_id % 10000) + 1)
    WHERE structure_id = p_structure_id 
      AND line_item_id IS NOT NULL 
      AND line_item_id < v_expected_start;
    
    -- Restore identity constraint with new start value
    DECLARE
      v_new_max integer;
    BEGIN
      SELECT MAX(report_line_item_id) INTO v_new_max FROM report_line_items;
      EXECUTE format('ALTER TABLE report_line_items ALTER COLUMN report_line_item_id ADD GENERATED ALWAYS AS IDENTITY (START WITH %s)', v_new_max + 1);
    END;
    
    v_result := jsonb_build_object(
      'success', true,
      'items_updated', v_items_updated,
      'new_id_range', format('%s - %s', v_expected_start + 1, v_expected_start + v_items_updated),
      'message', format('Successfully converted %s line items to concatenated format', v_items_updated)
    );
  ELSE
    v_result := jsonb_build_object(
      'success', true,
      'items_updated', 0,
      'message', format('Line item IDs already in concatenated format (max ID %s >= expected start %s)', v_max_current_id, v_expected_start)
    );
  END IF;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Ensure identity is restored even on error
    BEGIN
      DECLARE
        v_recovery_max integer;
      BEGIN
        SELECT MAX(report_line_item_id) INTO v_recovery_max FROM report_line_items;
        EXECUTE format('ALTER TABLE report_line_items ALTER COLUMN report_line_item_id ADD GENERATED ALWAYS AS IDENTITY (START WITH %s)', v_recovery_max + 1);
      EXCEPTION
        WHEN OTHERS THEN NULL; -- Ignore if already exists
      END;
    END;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to convert line item IDs to concatenated format'
    );
END;
$function$;
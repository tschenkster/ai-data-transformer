-- Fix insert function to use correct column name and JSON key for aggregation_scope
DROP FUNCTION IF EXISTS public.insert_trial_balance_data(jsonb);

CREATE OR REPLACE FUNCTION public.insert_trial_balance_data(p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_uuid uuid;
  row_data jsonb;
  inserted_count integer := 0;
  result jsonb;
BEGIN
  -- Get current user UUID
  current_user_uuid := auth.uid();
  
  IF current_user_uuid IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Loop through each row in the provided data
  FOR row_data IN SELECT * FROM jsonb_array_elements(p_data)
  LOOP
    -- Insert each row into the trial_balance_uploads table
    INSERT INTO data.trial_balance_uploads (
      entity_uuid,
      account_number,
      account_description,
      account_type,
      amount_periodicity,
      amount_type,
      aggregation_scope,
      period_key_yyyymm,
      period_start_date,
      period_end_date,
      as_of_date,
      amount,
      currency_code,
      source_system,
      source_file_name,
      source_row_number,
      source_hash
    ) VALUES (
      (row_data->>'entity_uuid')::uuid,
      row_data->>'account_number',
      NULLIF(row_data->>'account_description',''),
      row_data->>'account_type',
      row_data->>'amount_periodicity',
      row_data->>'amount_type',
      row_data->>'aggregation_scope',
      (row_data->>'period_key_yyyymm')::integer,
      (row_data->>'period_start_date')::date,
      (row_data->>'period_end_date')::date,
      (row_data->>'as_of_date')::date,
      (row_data->>'amount')::numeric,
      row_data->>'currency_code',
      row_data->>'source_system',
      row_data->>'source_file_name',
      (row_data->>'source_row_number')::integer,
      row_data->>'source_hash'
    );
    
    inserted_count := inserted_count + 1;
  END LOOP;
  
  result := jsonb_build_object(
    'success', true,
    'inserted_count', inserted_count,
    'message', format('Successfully inserted %s records', inserted_count)
  );
  
  RETURN result;
END;
$function$;
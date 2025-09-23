-- Update the database functions to use the correctly named plural table
-- Drop any incorrect functions first
DROP FUNCTION IF EXISTS public.insert_trial_balance_data(jsonb);
DROP FUNCTION IF EXISTS public.get_trial_balance_data(uuid);
DROP FUNCTION IF EXISTS public.delete_trial_balance_record(uuid);

-- Create the corrected functions that reference trial_balances_uploaded
CREATE OR REPLACE FUNCTION public.insert_trial_balance_data(p_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'data'
AS $$
DECLARE
  v_inserted_count INTEGER := 0;
  v_row JSONB;
  v_result JSONB;
BEGIN
  -- Insert each row from the JSONB array
  FOR v_row IN SELECT * FROM jsonb_array_elements(p_data)
  LOOP
    INSERT INTO data.trial_balances_uploaded (
      entity_uuid,
      account_number,
      account_description,
      account_type,
      amount_periodicity,
      amount_type,
      amount_aggregation_scope,
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
      (v_row->>'entity_uuid')::UUID,
      v_row->>'account_number',
      v_row->>'account_description',
      (v_row->>'account_type')::account_type,
      (v_row->>'amount_periodicity')::periodicity,
      (v_row->>'amount_type')::amount_type,
      (v_row->>'amount_aggregation_scope')::aggregation_scope,
      (v_row->>'period_key_yyyymm')::INTEGER,
      (v_row->>'period_start_date')::DATE,
      (v_row->>'period_end_date')::DATE,
      (v_row->>'as_of_date')::DATE,
      (v_row->>'amount')::DECIMAL,
      (v_row->>'currency_code')::char(3),
      v_row->>'source_system',
      v_row->>'source_file_name',
      (v_row->>'source_row_number')::INTEGER,
      v_row->>'source_hash'
    );
    
    v_inserted_count := v_inserted_count + 1;
  END LOOP;
  
  v_result := jsonb_build_object(
    'success', true,
    'inserted_count', v_inserted_count,
    'message', format('Successfully inserted %s trial balance records', v_inserted_count)
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to insert trial balance data'
    );
END;
$$;

-- Update get_trial_balance_data to use plural table name  
CREATE OR REPLACE FUNCTION public.get_trial_balance_data(p_entity_uuid UUID DEFAULT NULL)
RETURNS TABLE(
  trial_balance_uploaded_uuid UUID,
  entity_uuid UUID,
  account_number TEXT,
  account_description TEXT,
  account_type TEXT,
  amount_periodicity TEXT,
  amount_type TEXT,
  amount_aggregation_scope TEXT,
  period_key_yyyymm INTEGER,
  period_start_date DATE,
  period_end_date DATE,
  as_of_date DATE,
  amount DECIMAL,
  currency_code TEXT,
  source_system TEXT,
  source_file_name TEXT,
  source_row_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'data'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tbu.trial_balance_uploaded_uuid,
    tbu.entity_uuid,
    tbu.account_number,
    tbu.account_description,
    tbu.account_type::TEXT,
    tbu.amount_periodicity::TEXT,
    tbu.amount_type::TEXT,
    tbu.amount_aggregation_scope::TEXT,
    tbu.period_key_yyyymm,
    tbu.period_start_date,
    tbu.period_end_date,
    tbu.as_of_date,
    tbu.amount,
    tbu.currency_code::TEXT,
    tbu.source_system,
    tbu.source_file_name,
    tbu.source_row_number,
    tbu.created_at
  FROM data.trial_balances_uploaded tbu
  WHERE (p_entity_uuid IS NULL OR tbu.entity_uuid = p_entity_uuid)
  ORDER BY tbu.account_number, tbu.created_at DESC;
END;
$$;

-- Update delete function to use plural table name
CREATE OR REPLACE FUNCTION public.delete_trial_balance_record(p_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'data'
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM data.trial_balances_uploaded 
  WHERE trial_balance_uploaded_uuid = p_uuid;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  IF v_deleted_count > 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Trial balance record deleted successfully'
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Trial balance record not found'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to delete trial balance record'
    );
END;
$$;
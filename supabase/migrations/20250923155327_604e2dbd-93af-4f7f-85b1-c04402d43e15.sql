-- Drop existing functions before recreating with correct schema
DROP FUNCTION IF EXISTS public.get_trial_balance_data(uuid);
DROP FUNCTION IF EXISTS public.delete_trial_balance_record(uuid);

-- Recreate functions with correct PRD-compliant schema
CREATE OR REPLACE FUNCTION public.get_trial_balance_data(p_entity_uuid UUID DEFAULT NULL)
RETURNS TABLE(
  trial_balance_uploaded_uuid UUID,
  entity_uuid UUID,
  account_number TEXT,
  account_description TEXT,
  account_type TEXT,
  amount_periodicity TEXT,
  amount_type TEXT,
  amount_time_basis TEXT,
  aggregation_scope TEXT,
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
    tbu.amount_time_basis::TEXT,
    tbu.aggregation_scope::TEXT,
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
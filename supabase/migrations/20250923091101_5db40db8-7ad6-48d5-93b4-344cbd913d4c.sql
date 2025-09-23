-- Create functions to interact with trial_balances_uploaded table
CREATE OR REPLACE FUNCTION get_trial_balance_data(p_entity_uuid uuid DEFAULT NULL)
RETURNS TABLE (
  trial_balance_uploaded_uuid uuid,
  entity_uuid uuid,
  account_number text,
  account_description text,
  account_type account_type,
  amount_periodicity time_grain,
  amount_type amount_type,
  amount_aggregation_scope aggregation_scope,
  period_key_yyyymm integer,
  period_start_date date,
  period_end_date date,
  as_of_date date,
  amount numeric,
  currency_code char,
  source_system text,
  source_file_name text,
  source_row_number integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'data'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tb.trial_balance_uploaded_uuid,
    tb.entity_uuid,
    tb.account_number,
    tb.account_description,
    tb.account_type,
    tb.amount_periodicity,
    tb.amount_type,
    tb.amount_aggregation_scope,
    tb.period_key_yyyymm,
    tb.period_start_date,
    tb.period_end_date,
    tb.as_of_date,
    tb.amount,
    tb.currency_code,
    tb.source_system,
    tb.source_file_name,
    tb.source_row_number,
    tb.created_at
  FROM data.trial_balances_uploaded tb
  WHERE (p_entity_uuid IS NULL OR tb.entity_uuid = p_entity_uuid)
    AND (
      -- Check if user has access to this entity
      EXISTS (
        SELECT 1 FROM user_entity_access uea
        WHERE uea.entity_uuid = tb.entity_uuid
        AND uea.user_uuid = (
          SELECT user_uuid FROM user_accounts 
          WHERE supabase_user_uuid = auth.uid()
        )
        AND uea.is_active = true
      )
      OR is_super_admin_user()
    )
  ORDER BY tb.created_at DESC;
END;
$$;

-- Function to delete trial balance records
CREATE OR REPLACE FUNCTION delete_trial_balance_record(p_record_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'data'
AS $$
BEGIN
  -- Check if user has permission to delete this record
  IF NOT EXISTS (
    SELECT 1 FROM data.trial_balances_uploaded tb
    WHERE tb.trial_balance_uploaded_uuid = p_record_uuid
    AND (
      EXISTS (
        SELECT 1 FROM user_entity_access uea
        WHERE uea.entity_uuid = tb.entity_uuid
        AND uea.user_uuid = (
          SELECT user_uuid FROM user_accounts 
          WHERE supabase_user_uuid = auth.uid()
        )
        AND uea.is_active = true
      )
      OR is_super_admin_user()
    )
  ) THEN
    RAISE EXCEPTION 'Permission denied or record not found';
  END IF;

  -- Delete the record
  DELETE FROM data.trial_balances_uploaded
  WHERE trial_balance_uploaded_uuid = p_record_uuid;
END;
$$;

-- Function to insert trial balance data (for the edge function)
CREATE OR REPLACE FUNCTION insert_trial_balance_data(p_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'data'
AS $$
DECLARE
  record_data jsonb;
BEGIN
  -- Loop through the data array and insert each record
  FOR record_data IN SELECT * FROM jsonb_array_elements(p_data)
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
      (record_data->>'entity_uuid')::uuid,
      record_data->>'account_number',
      record_data->>'account_description',
      (record_data->>'account_type')::account_type,
      (record_data->>'amount_periodicity')::time_grain,
      (record_data->>'amount_type')::amount_type,
      (record_data->>'amount_aggregation_scope')::aggregation_scope,
      (record_data->>'period_key_yyyymm')::integer,
      (record_data->>'period_start_date')::date,
      (record_data->>'period_end_date')::date,
      (record_data->>'as_of_date')::date,
      (record_data->>'amount')::numeric,
      (record_data->>'currency_code')::char(3),
      record_data->>'source_system',
      record_data->>'source_file_name',
      (record_data->>'source_row_number')::integer,
      record_data->>'source_hash'
    );
  END LOOP;
END;
$$;
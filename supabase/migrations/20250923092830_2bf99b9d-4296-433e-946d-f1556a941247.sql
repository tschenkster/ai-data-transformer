-- Create trial_balance_uploaded table in data schema
CREATE TABLE IF NOT EXISTS data.trial_balance_uploaded (
  trial_balance_uploaded_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_uuid UUID NOT NULL,
  account_number TEXT NOT NULL,
  account_description TEXT,
  account_type TEXT NOT NULL CHECK (account_type IN ('pl', 'bs', 'subledger', 'statistical')),
  amount_periodicity TEXT NOT NULL CHECK (amount_periodicity IN ('monthly', 'quarterly', 'annual')),
  amount_type TEXT NOT NULL CHECK (amount_type IN ('opening', 'movement', 'ending', 'total', 'debit_total', 'credit_total')),
  amount_aggregation_scope TEXT NOT NULL CHECK (amount_aggregation_scope IN ('period', 'ytd', 'qtd', 'mtd', 'ltm', 'ltd')),
  period_key_yyyymm INTEGER NOT NULL,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  as_of_date DATE NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  currency_code TEXT NOT NULL,
  source_system TEXT NOT NULL,
  source_file_name TEXT NOT NULL,
  source_row_number INTEGER NOT NULL,
  source_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trial_balance_uploaded_entity_uuid ON data.trial_balance_uploaded(entity_uuid);
CREATE INDEX IF NOT EXISTS idx_trial_balance_uploaded_period_key ON data.trial_balance_uploaded(period_key_yyyymm);
CREATE INDEX IF NOT EXISTS idx_trial_balance_uploaded_account_number ON data.trial_balance_uploaded(account_number);

-- Enable RLS
ALTER TABLE data.trial_balance_uploaded ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view trial balance data for entities they have access to"
ON data.trial_balance_uploaded FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_entity_access uea
    WHERE uea.user_uuid = (
      SELECT user_uuid FROM user_accounts WHERE supabase_user_uuid = auth.uid()
    )
    AND uea.entity_uuid = trial_balance_uploaded.entity_uuid
    AND uea.is_active = true
  )
  OR is_super_admin_user()
);

CREATE POLICY "Admins can insert trial balance data"
ON data.trial_balance_uploaded FOR INSERT
WITH CHECK (is_admin_user_v2());

CREATE POLICY "Admins can update trial balance data"
ON data.trial_balance_uploaded FOR UPDATE
USING (is_admin_user_v2());

CREATE POLICY "Admins can delete trial balance data"
ON data.trial_balance_uploaded FOR DELETE
USING (is_admin_user_v2());

-- Create function to insert trial balance data
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
    INSERT INTO data.trial_balance_uploaded (
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
      v_row->>'account_type',
      v_row->>'amount_periodicity',
      v_row->>'amount_type',
      v_row->>'amount_aggregation_scope',
      (v_row->>'period_key_yyyymm')::INTEGER,
      (v_row->>'period_start_date')::DATE,
      (v_row->>'period_end_date')::DATE,
      (v_row->>'as_of_date')::DATE,
      (v_row->>'amount')::DECIMAL,
      v_row->>'currency_code',
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

-- Create function to get trial balance data
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
    tbu.account_type,
    tbu.amount_periodicity,
    tbu.amount_type,
    tbu.amount_aggregation_scope,
    tbu.period_key_yyyymm,
    tbu.period_start_date,
    tbu.period_end_date,
    tbu.as_of_date,
    tbu.amount,
    tbu.currency_code,
    tbu.source_system,
    tbu.source_file_name,
    tbu.source_row_number,
    tbu.created_at
  FROM data.trial_balance_uploaded tbu
  WHERE (p_entity_uuid IS NULL OR tbu.entity_uuid = p_entity_uuid)
  ORDER BY tbu.account_number, tbu.created_at DESC;
END;
$$;

-- Create function to delete trial balance data
CREATE OR REPLACE FUNCTION public.delete_trial_balance_record(p_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'data'
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM data.trial_balance_uploaded 
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
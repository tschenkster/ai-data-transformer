-- Phase 1: Database Schema Alignment for Trial Balance Import PRD Compliance

-- Create missing enums that match PRD specification exactly
CREATE TYPE IF NOT EXISTS amount_periodicity AS ENUM ('monthly', 'quarterly', 'annual');

-- Update aggregation_scope to include custom_period as per PRD
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'aggregation_scope') THEN
    CREATE TYPE aggregation_scope AS ENUM ('period', 'ytd', 'qtd', 'mtd', 'ltm', 'ltd', 'custom_period');
  ELSE
    -- Add custom_period if it doesn't exist
    BEGIN
      ALTER TYPE aggregation_scope ADD VALUE IF NOT EXISTS 'custom_period';
    EXCEPTION WHEN duplicate_object THEN
      -- Value already exists, continue
    END;
  END IF;
END $$;

-- Create amount_time_basis enum (replaces measurement_basis per PRD)
CREATE TYPE IF NOT EXISTS amount_time_basis AS ENUM ('point-in-time', 'time-span');

-- Create the data schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS data;

-- Drop the existing table to recreate with correct PRD schema
DROP TABLE IF EXISTS data.trial_balances_uploaded CASCADE;

-- Create the correct trial_balances_uploaded table per PRD specification
CREATE TABLE data.trial_balances_uploaded (
  trial_balance_uploaded_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_uuid uuid NOT NULL,
  account_number text NOT NULL,
  account_description text,
  account_type account_type NOT NULL,
  amount_periodicity amount_periodicity NOT NULL,
  amount_type amount_type NOT NULL,
  amount_time_basis amount_time_basis GENERATED ALWAYS AS (
    CASE 
      WHEN amount_type IN ('opening', 'ending') THEN 'point-in-time'::amount_time_basis
      ELSE 'time-span'::amount_time_basis 
    END
  ) STORED,
  aggregation_scope aggregation_scope NOT NULL DEFAULT 'period',
  period_key_yyyymm integer NOT NULL,
  period_start_date date NOT NULL,
  period_end_date date NOT NULL,
  as_of_date date NOT NULL,
  amount numeric(20,4) NOT NULL,
  currency_code char(3) NOT NULL,
  source_system text NOT NULL,
  source_file_name text NOT NULL,
  source_row_number integer NOT NULL,
  source_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- PRD-specified uniqueness constraint
  CONSTRAINT uq_trial_balances_uploaded UNIQUE (
    entity_uuid, 
    account_number, 
    period_key_yyyymm, 
    amount_periodicity, 
    amount_type, 
    aggregation_scope, 
    currency_code
  )
);

-- Add RLS policies for the table
ALTER TABLE data.trial_balances_uploaded ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all trial balance data
CREATE POLICY "Super admins can manage all trial balances"
ON data.trial_balances_uploaded
FOR ALL
USING (is_super_admin_user());

-- Users can view trial balances for entities they have access to
CREATE POLICY "Users can view accessible entity trial balances"
ON data.trial_balances_uploaded
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_entity_access uea
    WHERE uea.user_uuid = (
      SELECT user_uuid FROM user_accounts 
      WHERE supabase_user_uuid = auth.uid()
    )
    AND uea.entity_uuid = trial_balances_uploaded.entity_uuid
    AND uea.is_active = true
  )
);

-- Users can insert trial balances for entities they have access to
CREATE POLICY "Users can insert trial balances for accessible entities"
ON data.trial_balances_uploaded
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_entity_access uea
    WHERE uea.user_uuid = (
      SELECT user_uuid FROM user_accounts 
      WHERE supabase_user_uuid = auth.uid()
    )
    AND uea.entity_uuid = trial_balances_uploaded.entity_uuid
    AND uea.is_active = true
  )
);

-- Users can delete trial balances for entities they have access to
CREATE POLICY "Users can delete trial balances for accessible entities"
ON data.trial_balances_uploaded
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_entity_access uea
    WHERE uea.user_uuid = (
      SELECT user_uuid FROM user_accounts 
      WHERE supabase_user_uuid = auth.uid()
    )
    AND uea.entity_uuid = trial_balances_uploaded.entity_uuid
    AND uea.is_active = true
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_trial_balances_uploaded_updated_at
  BEFORE UPDATE ON data.trial_balances_uploaded
  FOR EACH ROW
  EXECUTE FUNCTION update_trial_balance_updated_at();

-- Create corrected database functions using PRD-compliant schema
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
      (v_row->>'entity_uuid')::UUID,
      v_row->>'account_number',
      v_row->>'account_description',
      (v_row->>'account_type')::account_type,
      (v_row->>'amount_periodicity')::amount_periodicity,
      (v_row->>'amount_type')::amount_type,
      COALESCE((v_row->>'aggregation_scope')::aggregation_scope, 'period'::aggregation_scope),
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

-- Update get_trial_balance_data to use correct schema
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

-- Update delete function
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
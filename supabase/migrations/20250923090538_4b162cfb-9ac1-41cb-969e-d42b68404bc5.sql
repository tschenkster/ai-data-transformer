-- Create the data schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS data;

-- Create enums for trial balance data model
CREATE TYPE account_type AS ENUM ('pl','bs','subledger','statistical');
CREATE TYPE time_grain AS ENUM ('monthly','quarterly','annual');
CREATE TYPE amount_type AS ENUM ('opening','movement','ending','total','debit_total','credit_total');
CREATE TYPE measurement_basis AS ENUM ('instant','movement');
CREATE TYPE aggregation_scope AS ENUM ('period','ytd','qtd','mtd','ltm','ltd');

-- Create trial_balances_uploaded table
CREATE TABLE data.trial_balances_uploaded (
  trial_balance_uploaded_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_uuid uuid NOT NULL,
  account_number text NOT NULL,
  account_description text,
  account_type account_type NOT NULL,
  amount_periodicity time_grain NOT NULL,
  amount_type amount_type NOT NULL,
  amount_time_span measurement_basis GENERATED ALWAYS AS (
    CASE WHEN amount_type IN ('opening','ending') THEN 'instant'::measurement_basis
         ELSE 'movement'::measurement_basis END
  ) STORED,
  amount_aggregation_scope aggregation_scope NOT NULL DEFAULT 'period',
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
  
  -- Natural uniqueness constraint
  CONSTRAINT uq_trial_balances_uploaded UNIQUE (
    entity_uuid, 
    account_number, 
    period_key_yyyymm, 
    amount_periodicity, 
    amount_type, 
    amount_aggregation_scope, 
    currency_code
  )
);

-- Create storage bucket for trial balance uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-uploads-trial-balances', 'user-uploads-trial-balances', false);

-- RLS policies for trial_balances_uploaded table
ALTER TABLE data.trial_balances_uploaded ENABLE ROW LEVEL SECURITY;

-- Users can view trial balances for entities they have access to
CREATE POLICY "Users can view trial balances for accessible entities" 
ON data.trial_balances_uploaded 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_entity_access uea
    WHERE uea.entity_uuid = trial_balances_uploaded.entity_uuid
    AND uea.user_uuid = (
      SELECT user_uuid FROM user_accounts 
      WHERE supabase_user_uuid = auth.uid()
    )
    AND uea.is_active = true
  )
  OR is_super_admin_user()
);

-- Users can insert trial balances for entities they have access to
CREATE POLICY "Users can insert trial balances for accessible entities" 
ON data.trial_balances_uploaded 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_entity_access uea
    WHERE uea.entity_uuid = trial_balances_uploaded.entity_uuid
    AND uea.user_uuid = (
      SELECT user_uuid FROM user_accounts 
      WHERE supabase_user_uuid = auth.uid()
    )
    AND uea.is_active = true
  )
  OR is_super_admin_user()
);

-- Admins can manage all trial balance data
CREATE POLICY "Admins can manage all trial balances" 
ON data.trial_balances_uploaded 
FOR ALL 
USING (is_super_admin_user());

-- Storage policies for trial balance uploads
CREATE POLICY "Users can upload trial balance files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'user-uploads-trial-balances' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their trial balance files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'user-uploads-trial-balances' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create indexes for performance
CREATE INDEX idx_trial_balances_entity_uuid ON data.trial_balances_uploaded(entity_uuid);
CREATE INDEX idx_trial_balances_period_key ON data.trial_balances_uploaded(period_key_yyyymm);
CREATE INDEX idx_trial_balances_account_number ON data.trial_balances_uploaded(account_number);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_trial_balance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trial_balance_updated_at_trigger
  BEFORE UPDATE ON data.trial_balances_uploaded
  FOR EACH ROW
  EXECUTE FUNCTION update_trial_balance_updated_at();
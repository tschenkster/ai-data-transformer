-- Fix naming conventions and make UUID primary key for raw data tables

-- First, drop existing tables to recreate with correct structure
DROP TABLE IF EXISTS data.raw_data_upload_file_rows CASCADE;
DROP TABLE IF EXISTS data.raw_data_upload_file CASCADE;

-- Recreate raw_data_upload_file table with UUID as primary key
CREATE TABLE data.raw_data_upload_file (
  raw_data_upload_file_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- File identification
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_hash TEXT, -- For duplicate detection
  content_type TEXT,
  
  -- Processing metadata
  upload_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (upload_status IN ('uploaded', 'parsing', 'parsed', 'error')),
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  
  -- Entity context
  entity_uuid UUID,
  user_uuid UUID,
  
  -- JSON columns for structured data
  raw_data JSONB, -- Exact parsed structure from file
  parsing_metadata JSONB, -- Headers, row counts, sheet info, etc.
  gpt5_analysis JSONB, -- Pre-processing insights and recommendations
  
  -- Error handling
  error_details JSONB,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Recreate raw_data_upload_file_rows table with UUID as primary key
CREATE TABLE data.raw_data_upload_file_rows (
  raw_data_upload_file_row_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to parent file (UUID foreign key)
  raw_data_upload_file_uuid UUID NOT NULL REFERENCES data.raw_data_upload_file(raw_data_upload_file_uuid) ON DELETE CASCADE,
  
  -- Row identification
  sheet_name TEXT, -- For Excel files with multiple sheets
  row_number INTEGER NOT NULL, -- Original row number in file
  is_header_row BOOLEAN DEFAULT FALSE,
  
  -- Human-readable columns (TEXT for maximum flexibility)
  col_01 TEXT, col_02 TEXT, col_03 TEXT, col_04 TEXT, col_05 TEXT,
  col_06 TEXT, col_07 TEXT, col_08 TEXT, col_09 TEXT, col_10 TEXT,
  col_11 TEXT, col_12 TEXT, col_13 TEXT, col_14 TEXT, col_15 TEXT,
  col_16 TEXT, col_17 TEXT, col_18 TEXT, col_19 TEXT, col_20 TEXT,
  col_21 TEXT, col_22 TEXT, col_23 TEXT, col_24 TEXT, col_25 TEXT,
  col_26 TEXT, col_27 TEXT, col_28 TEXT, col_29 TEXT, col_30 TEXT,
  col_31 TEXT, col_32 TEXT, col_33 TEXT, col_34 TEXT, col_35 TEXT,
  col_36 TEXT, col_37 TEXT, col_38 TEXT, col_39 TEXT, col_40 TEXT,
  col_41 TEXT, col_42 TEXT, col_43 TEXT, col_44 TEXT, col_45 TEXT,
  col_46 TEXT, col_47 TEXT, col_48 TEXT, col_49 TEXT, col_50 TEXT,
  
  -- Processing tracking
  normalization_status TEXT DEFAULT 'pending' CHECK (normalization_status IN ('pending', 'processing', 'success', 'failed', 'skipped')),
  normalization_error TEXT,
  normalized_trial_balance_uuid UUID, -- Link to successfully normalized record
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_raw_data_upload_file_entity_uuid ON data.raw_data_upload_file(entity_uuid);
CREATE INDEX idx_raw_data_upload_file_user_uuid ON data.raw_data_upload_file(user_uuid);
CREATE INDEX idx_raw_data_upload_file_status ON data.raw_data_upload_file(upload_status);
CREATE INDEX idx_raw_data_upload_file_filename ON data.raw_data_upload_file(filename);
CREATE INDEX idx_raw_data_upload_file_created_at ON data.raw_data_upload_file(created_at);

CREATE INDEX idx_raw_data_upload_file_rows_parent ON data.raw_data_upload_file_rows(raw_data_upload_file_uuid);
CREATE INDEX idx_raw_data_upload_file_rows_status ON data.raw_data_upload_file_rows(normalization_status);
CREATE INDEX idx_raw_data_upload_file_rows_sheet_row ON data.raw_data_upload_file_rows(sheet_name, row_number);

-- Create trigger for updated_at
CREATE TRIGGER trigger_raw_data_upload_file_updated_at
  BEFORE UPDATE ON data.raw_data_upload_file
  FOR EACH ROW
  EXECUTE FUNCTION data.update_raw_data_upload_file_updated_at();

CREATE TRIGGER trigger_raw_data_upload_file_rows_updated_at
  BEFORE UPDATE ON data.raw_data_upload_file_rows
  FOR EACH ROW
  EXECUTE FUNCTION data.update_raw_data_upload_file_updated_at();

-- Create RLS policies
ALTER TABLE data.raw_data_upload_file ENABLE ROW LEVEL SECURITY;
ALTER TABLE data.raw_data_upload_file_rows ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can manage all raw data upload files" 
ON data.raw_data_upload_file FOR ALL 
TO authenticated
USING (is_admin_user());

CREATE POLICY "Admins can manage all raw data upload file rows" 
ON data.raw_data_upload_file_rows FOR ALL 
TO authenticated
USING (is_admin_user());

-- User policies for files
CREATE POLICY "Users can view their own raw data upload files" 
ON data.raw_data_upload_file FOR SELECT 
TO authenticated
USING (
  created_by = auth.uid() OR 
  user_uuid = (SELECT user_uuid FROM user_accounts WHERE supabase_user_uuid = auth.uid())
);

CREATE POLICY "Users can insert their own raw data upload files" 
ON data.raw_data_upload_file FOR INSERT 
TO authenticated
WITH CHECK (
  created_by = auth.uid() OR 
  user_uuid = (SELECT user_uuid FROM user_accounts WHERE supabase_user_uuid = auth.uid())
);

CREATE POLICY "Users can update their own raw data upload files" 
ON data.raw_data_upload_file FOR UPDATE 
TO authenticated
USING (
  created_by = auth.uid() OR 
  user_uuid = (SELECT user_uuid FROM user_accounts WHERE supabase_user_uuid = auth.uid())
);

-- User policies for rows (inherit from parent file)
CREATE POLICY "Users can view rows from their raw data upload files" 
ON data.raw_data_upload_file_rows FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM data.raw_data_upload_file f 
  WHERE f.raw_data_upload_file_uuid = raw_data_upload_file_rows.raw_data_upload_file_uuid 
  AND (
    f.created_by = auth.uid() OR 
    f.user_uuid = (SELECT user_uuid FROM user_accounts WHERE supabase_user_uuid = auth.uid())
  )
));

CREATE POLICY "Users can insert rows for their raw data upload files" 
ON data.raw_data_upload_file_rows FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM data.raw_data_upload_file f 
  WHERE f.raw_data_upload_file_uuid = raw_data_upload_file_rows.raw_data_upload_file_uuid 
  AND (
    f.created_by = auth.uid() OR 
    f.user_uuid = (SELECT user_uuid FROM user_accounts WHERE supabase_user_uuid = auth.uid())
  )
));

CREATE POLICY "Users can update rows from their raw data upload files" 
ON data.raw_data_upload_file_rows FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM data.raw_data_upload_file f 
  WHERE f.raw_data_upload_file_uuid = raw_data_upload_file_rows.raw_data_upload_file_uuid 
  AND (
    f.created_by = auth.uid() OR 
    f.user_uuid = (SELECT user_uuid FROM user_accounts WHERE supabase_user_uuid = auth.uid())
  )
));

-- Update helper function to work with UUID primary keys
CREATE OR REPLACE FUNCTION data.insert_raw_file_data(
  p_filename TEXT,
  p_file_size BIGINT,
  p_entity_uuid UUID,
  p_user_uuid UUID,
  p_raw_data JSONB,
  p_parsing_metadata JSONB DEFAULT NULL,
  p_gpt5_analysis JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_file_uuid UUID;
  v_user_id UUID;
BEGIN
  -- Get user_id from supabase auth
  SELECT auth.uid() INTO v_user_id;
  
  -- Insert file record with UUID as primary key
  INSERT INTO data.raw_data_upload_file (
    filename,
    file_size,
    entity_uuid,
    user_uuid,
    raw_data,
    parsing_metadata,
    gpt5_analysis,
    upload_status,
    processing_started_at,
    created_by,
    updated_by
  ) VALUES (
    p_filename,
    p_file_size,
    p_entity_uuid,
    p_user_uuid,
    p_raw_data,
    p_parsing_metadata,
    p_gpt5_analysis,
    'parsing',
    now(),
    v_user_id,
    v_user_id
  ) RETURNING raw_data_upload_file_uuid INTO v_file_uuid;
  
  RETURN v_file_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'data', 'public', 'auth';
-- Fix search path security issue in the function
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
  
  -- Insert file record
  INSERT INTO data.raw_data_upload_file (
    filename,
    file_size,
    entity_uuid,
    user_uuid,
    user_id,
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
    v_user_id,
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

-- Also fix the trigger function
CREATE OR REPLACE FUNCTION data.update_raw_data_upload_file_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'data', 'public';
-- Add missing columns to trial_balance_uploads table
ALTER TABLE data.trial_balance_uploads 
ADD COLUMN IF NOT EXISTS uploaded_by_user_uuid UUID REFERENCES public.user_accounts(user_uuid),
ADD COLUMN IF NOT EXISTS uploaded_by_user_name TEXT;

-- Update insert_trial_balance_data function to include new columns
DROP FUNCTION IF EXISTS public.insert_trial_balance_data(jsonb);

CREATE OR REPLACE FUNCTION public.insert_trial_balance_data(p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_uuid uuid;
  current_user_name text;
  row_data jsonb;
  inserted_count integer := 0;
  result jsonb;
BEGIN
  -- Get current user UUID and name
  current_user_uuid := auth.uid();
  
  IF current_user_uuid IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get user name from user_accounts table
  SELECT COALESCE(first_name || ' ' || last_name, email) INTO current_user_name
  FROM public.user_accounts ua
  WHERE ua.supabase_user_uuid = current_user_uuid;
  
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
      amount_time_basis,
      period_key_yyyymm,
      period_start_date,
      period_end_date,
      as_of_date,
      amount,
      currency_code,
      source_system,
      source_file_name,
      source_row_number,
      source_hash,
      uploaded_by_user_uuid,
      uploaded_by_user_name
    ) VALUES (
      (row_data->>'entity_uuid')::uuid,
      row_data->>'account_number',
      NULLIF(row_data->>'account_description',''),
      row_data->>'account_type',
      row_data->>'amount_periodicity',
      row_data->>'amount_type',
      row_data->>'aggregation_scope',
      COALESCE(row_data->>'amount_time_basis', 'period'),
      (row_data->>'period_key_yyyymm')::integer,
      (row_data->>'period_start_date')::date,
      (row_data->>'period_end_date')::date,
      (row_data->>'as_of_date')::date,
      (row_data->>'amount')::numeric,
      row_data->>'currency_code',
      row_data->>'source_system',
      row_data->>'source_file_name',
      (row_data->>'source_row_number')::integer,
      row_data->>'source_hash',
      current_user_uuid,
      current_user_name
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

-- Rewrite get_trial_balance_data function to query actual columns
DROP FUNCTION IF EXISTS public.get_trial_balance_data(uuid);

CREATE OR REPLACE FUNCTION public.get_trial_balance_data(p_entity_uuid uuid DEFAULT NULL)
 RETURNS TABLE (
    trial_balance_upload_uuid uuid,
    trial_balance_upload_id integer,
    entity_uuid uuid,
    account_number text,
    account_description text,
    account_type text,
    amount_periodicity text,
    amount_type text,
    aggregation_scope text,
    amount_time_basis text,
    period_key_yyyymm integer,
    period_start_date text,
    period_end_date text,
    as_of_date text,
    amount numeric,
    currency_code text,
    source_system text,
    source_file_name text,
    source_row_number integer,
    created_at text,
    uploaded_by_user_uuid uuid,
    uploaded_by_user_name text
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    tbu.trial_balance_upload_uuid,
    tbu.trial_balance_upload_id,
    tbu.entity_uuid,
    tbu.account_number,
    tbu.account_description,
    tbu.account_type,
    tbu.amount_periodicity,
    tbu.amount_type,
    tbu.aggregation_scope,
    COALESCE(tbu.amount_time_basis, 'period') as amount_time_basis,
    tbu.period_key_yyyymm,
    tbu.period_start_date::text,
    tbu.period_end_date::text,
    tbu.as_of_date::text,
    tbu.amount,
    tbu.currency_code,
    tbu.source_system,
    tbu.source_file_name,
    tbu.source_row_number,
    tbu.created_at::text,
    tbu.uploaded_by_user_uuid,
    tbu.uploaded_by_user_name
  FROM data.trial_balance_uploads tbu
  WHERE (p_entity_uuid IS NULL OR tbu.entity_uuid = p_entity_uuid)
  ORDER BY tbu.created_at DESC, tbu.source_row_number ASC;
END;
$function$;
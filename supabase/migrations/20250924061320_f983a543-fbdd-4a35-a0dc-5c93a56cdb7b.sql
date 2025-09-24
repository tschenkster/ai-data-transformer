-- Drop existing functions before recreating with new return types
DROP FUNCTION IF EXISTS public.get_trial_balance_data(uuid);
DROP FUNCTION IF EXISTS public.delete_trial_balance_record(uuid);
DROP FUNCTION IF EXISTS public.save_trial_balance_data(jsonb);

-- Recreate get_trial_balance_data function with new table name
CREATE OR REPLACE FUNCTION public.get_trial_balance_data(p_entity_uuid uuid DEFAULT NULL::uuid)
 RETURNS TABLE(trial_balance_upload_uuid uuid, trial_balance_upload_id integer, entity_uuid uuid, account_number text, account_description text, account_type text, amount_periodicity text, amount_type text, amount_aggregation_scope text, period_key_yyyymm integer, period_start_date date, period_end_date date, as_of_date date, amount numeric, currency_code text, source_system text, source_file_name text, source_row_number integer, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_uuid uuid;
BEGIN
  -- Get current user UUID
  current_user_uuid := auth.uid();
  
  IF current_user_uuid IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if user is admin
  IF is_admin_user() THEN
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
    FROM data.trial_balance_uploads tbu
    WHERE (p_entity_uuid IS NULL OR tbu.entity_uuid = p_entity_uuid)
    ORDER BY tbu.created_at DESC;
  ELSE
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
    FROM data.trial_balance_uploads tbu
    INNER JOIN user_entity_access uea ON uea.entity_uuid = tbu.entity_uuid
    INNER JOIN user_accounts ua ON ua.user_uuid = uea.user_uuid
    WHERE ua.supabase_user_uuid = current_user_uuid
      AND uea.is_active = true
      AND (p_entity_uuid IS NULL OR tbu.entity_uuid = p_entity_uuid)
    ORDER BY tbu.created_at DESC;
  END IF;
END;
$function$;

-- Recreate delete_trial_balance_record function
CREATE OR REPLACE FUNCTION public.delete_trial_balance_record(p_uuid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_uuid uuid;
  deleted_count integer;
  result jsonb;
BEGIN
  -- Get current user UUID
  current_user_uuid := auth.uid();
  
  IF current_user_uuid IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Delete the record (RLS will handle access control)
  DELETE FROM data.trial_balance_uploads 
  WHERE trial_balance_upload_uuid = p_uuid;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    result := jsonb_build_object(
      'success', true,
      'message', 'Record deleted successfully'
    );
  ELSE
    result := jsonb_build_object(
      'success', false,
      'message', 'Record not found or access denied'
    );
  END IF;
  
  RETURN result;
END;
$function$;

-- Recreate save_trial_balance_data function
CREATE OR REPLACE FUNCTION public.save_trial_balance_data(p_trial_balance_data jsonb)
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
  FOR row_data IN SELECT * FROM jsonb_array_elements(p_trial_balance_data)
  LOOP
    -- Insert each row into the trial_balance_uploads table
    INSERT INTO data.trial_balance_uploads (
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
      source_row_number
    ) VALUES (
      (row_data->>'entity_uuid')::uuid,
      row_data->>'account_number',
      row_data->>'account_description',
      row_data->>'account_type',
      row_data->>'amount_periodicity',
      row_data->>'amount_type',
      row_data->>'amount_aggregation_scope',
      (row_data->>'period_key_yyyymm')::integer,
      (row_data->>'period_start_date')::date,
      (row_data->>'period_end_date')::date,
      (row_data->>'as_of_date')::date,
      (row_data->>'amount')::numeric,
      row_data->>'currency_code',
      row_data->>'source_system',
      row_data->>'source_file_name',
      (row_data->>'source_row_number')::integer
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
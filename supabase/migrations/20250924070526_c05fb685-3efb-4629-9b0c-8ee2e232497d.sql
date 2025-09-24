-- Drop and recreate the function with correct column name
DROP FUNCTION IF EXISTS public.get_trial_balance_data(uuid);

CREATE OR REPLACE FUNCTION public.get_trial_balance_data(p_entity_uuid uuid)
RETURNS TABLE(
    trial_balance_upload_uuid uuid,
    filename text,
    uploaded_at timestamp with time zone,
    processed_at timestamp with time zone,
    row_count integer,
    status text,
    aggregation_scope text,
    entity_uuid uuid,
    entity_name text,
    uploaded_by_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        tbu.trial_balance_upload_uuid,
        tbu.filename,
        tbu.uploaded_at,
        tbu.processed_at,
        tbu.row_count,
        tbu.status,
        tbu.aggregation_scope,  -- Fixed: was amount_aggregation_scope
        tbu.entity_uuid,
        e.entity_name,
        COALESCE(ua.first_name || ' ' || ua.last_name, ua.email, 'Unknown') as uploaded_by_name
    FROM data.trial_balance_uploads tbu
    LEFT JOIN entities e ON e.entity_uuid = tbu.entity_uuid
    LEFT JOIN user_accounts ua ON ua.supabase_user_uuid = tbu.uploaded_by_user_uuid
    WHERE tbu.entity_uuid = p_entity_uuid
    ORDER BY tbu.uploaded_at DESC;
END;
$function$;
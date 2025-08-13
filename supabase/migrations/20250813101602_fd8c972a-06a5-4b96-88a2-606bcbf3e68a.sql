-- Drop and recreate the function with updated return type
DROP FUNCTION IF EXISTS public.match_account_embeddings(vector, double precision, integer, uuid);

CREATE OR REPLACE FUNCTION public.match_account_embeddings(query_embedding vector, match_threshold double precision, match_count integer, filter_supabase_user_uuid uuid DEFAULT NULL::uuid)
RETURNS TABLE(id uuid, original_account_name text, mapped_account_name text, confidence_score numeric, reasoning text, similarity double precision, validated boolean, created_at timestamp with time zone, supabase_user_uuid uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    am.id,
    am.original_account_name,
    am.mapped_account_name,
    am.confidence_score,
    am.reasoning,
    1 - (am.embedding <=> query_embedding) AS similarity,
    am.validated,
    am.created_at,
    am.supabase_user_uuid
  FROM account_mappings am
  WHERE 
    am.embedding IS NOT NULL
    AND (filter_supabase_user_uuid IS NULL OR am.supabase_user_uuid = filter_supabase_user_uuid)
    AND 1 - (am.embedding <=> query_embedding) > match_threshold
  ORDER BY am.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;
-- Fix the function search path issue by setting it explicitly
CREATE OR REPLACE FUNCTION match_account_embeddings (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  original_account_name text,
  mapped_account_name text,
  confidence_score numeric,
  reasoning text,
  similarity float,
  validated boolean,
  created_at timestamptz,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
    am.user_id
  FROM account_mappings am
  WHERE 
    am.embedding IS NOT NULL
    AND (filter_user_id IS NULL OR am.user_id = filter_user_id)
    AND 1 - (am.embedding <=> query_embedding) > match_threshold
  ORDER BY am.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
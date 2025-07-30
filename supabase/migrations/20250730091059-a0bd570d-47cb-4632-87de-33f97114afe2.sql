-- Create the match_account_embeddings function for similarity search
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

-- Create an index on the embedding column for faster similarity search
CREATE INDEX IF NOT EXISTS idx_account_mappings_embedding 
ON account_mappings USING ivfflat (embedding vector_cosine_ops);
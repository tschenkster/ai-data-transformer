-- Rename user_id to supabase_user_uuid in all tables
ALTER TABLE public.user_accounts RENAME COLUMN user_id TO supabase_user_uuid;
ALTER TABLE public.account_mappings RENAME COLUMN user_id TO supabase_user_uuid;
ALTER TABLE public.mapping_decisions RENAME COLUMN user_id TO supabase_user_uuid;
ALTER TABLE public.mapping_sessions RENAME COLUMN user_id TO supabase_user_uuid;
ALTER TABLE public.report_structures RENAME COLUMN created_by_user_id TO created_by_supabase_user_uuid;

-- Update RLS policies for account_mappings
DROP POLICY IF EXISTS "Users can view their own mappings" ON public.account_mappings;
DROP POLICY IF EXISTS "Users can insert their own mappings" ON public.account_mappings;
DROP POLICY IF EXISTS "Users can update their own mappings" ON public.account_mappings;
DROP POLICY IF EXISTS "Users can delete their own mappings" ON public.account_mappings;

CREATE POLICY "Users can view their own mappings" ON public.account_mappings
FOR SELECT USING (auth.uid() = supabase_user_uuid);

CREATE POLICY "Users can insert their own mappings" ON public.account_mappings
FOR INSERT WITH CHECK (auth.uid() = supabase_user_uuid);

CREATE POLICY "Users can update their own mappings" ON public.account_mappings
FOR UPDATE USING (auth.uid() = supabase_user_uuid);

CREATE POLICY "Users can delete their own mappings" ON public.account_mappings
FOR DELETE USING (auth.uid() = supabase_user_uuid);

-- Update RLS policies for mapping_decisions
DROP POLICY IF EXISTS "Users can view their own decisions" ON public.mapping_decisions;
DROP POLICY IF EXISTS "Users can insert their own decisions" ON public.mapping_decisions;
DROP POLICY IF EXISTS "Users can update their own decisions" ON public.mapping_decisions;
DROP POLICY IF EXISTS "Users can delete their own decisions" ON public.mapping_decisions;

CREATE POLICY "Users can view their own decisions" ON public.mapping_decisions
FOR SELECT USING (auth.uid() = supabase_user_uuid);

CREATE POLICY "Users can insert their own decisions" ON public.mapping_decisions
FOR INSERT WITH CHECK (auth.uid() = supabase_user_uuid);

CREATE POLICY "Users can update their own decisions" ON public.mapping_decisions
FOR UPDATE USING (auth.uid() = supabase_user_uuid);

CREATE POLICY "Users can delete their own decisions" ON public.mapping_decisions
FOR DELETE USING (auth.uid() = supabase_user_uuid);

-- Update RLS policies for mapping_sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.mapping_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.mapping_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.mapping_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.mapping_sessions;

CREATE POLICY "Users can view their own sessions" ON public.mapping_sessions
FOR SELECT USING (auth.uid() = supabase_user_uuid);

CREATE POLICY "Users can insert their own sessions" ON public.mapping_sessions
FOR INSERT WITH CHECK (auth.uid() = supabase_user_uuid);

CREATE POLICY "Users can update their own sessions" ON public.mapping_sessions
FOR UPDATE USING (auth.uid() = supabase_user_uuid);

CREATE POLICY "Users can delete their own sessions" ON public.mapping_sessions
FOR DELETE USING (auth.uid() = supabase_user_uuid);

-- Update RLS policies for user_accounts
DROP POLICY IF EXISTS "Users can insert their own user_account" ON public.user_accounts;
DROP POLICY IF EXISTS "Users can view their own user_account" ON public.user_accounts;
DROP POLICY IF EXISTS "Users can update their own user_account" ON public.user_accounts;

CREATE POLICY "Users can insert their own user_account" ON public.user_accounts
FOR INSERT WITH CHECK (auth.uid() = supabase_user_uuid);

CREATE POLICY "Users can view their own user_account" ON public.user_accounts
FOR SELECT USING (auth.uid() = supabase_user_uuid);

CREATE POLICY "Users can update their own user_account" ON public.user_accounts
FOR UPDATE USING (auth.uid() = supabase_user_uuid);

-- Update database functions
CREATE OR REPLACE FUNCTION public.get_current_user_details()
RETURNS TABLE(user_uuid uuid, user_first_name text, user_last_name text, user_email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_uuid,
    COALESCE(ua.first_name, '')::text as user_first_name,
    COALESCE(ua.last_name, '')::text as user_last_name,
    COALESCE(au.email, '')::text as user_email
  FROM auth.users au
  LEFT JOIN public.user_accounts ua ON ua.supabase_user_uuid = au.id
  WHERE au.id = auth.uid();
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_accounts (supabase_user_uuid, email, status, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    'pending',
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$function$;

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
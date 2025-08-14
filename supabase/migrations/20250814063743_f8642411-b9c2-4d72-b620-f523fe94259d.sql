-- Create translation sessions table for CoA Translator
CREATE TABLE IF NOT EXISTS public.coa_translation_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  filename TEXT NOT NULL,
  total_accounts INTEGER NOT NULL,
  processed_accounts INTEGER DEFAULT 0,
  source_language TEXT,
  target_language TEXT NOT NULL,
  session_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coa_translation_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own translation sessions"
ON public.coa_translation_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own translation sessions"
ON public.coa_translation_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own translation sessions"
ON public.coa_translation_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own translation sessions"
ON public.coa_translation_sessions
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all translation sessions"
ON public.coa_translation_sessions
FOR ALL
USING (is_admin_user());

-- Create indexes for performance
CREATE INDEX idx_coa_translation_sessions_user_id ON public.coa_translation_sessions(user_id);
CREATE INDEX idx_coa_translation_sessions_status ON public.coa_translation_sessions(status);
CREATE INDEX idx_coa_translation_sessions_created_at ON public.coa_translation_sessions(created_at);

-- Add trigger for updated_at
CREATE TRIGGER update_coa_translation_sessions_updated_at
BEFORE UPDATE ON public.coa_translation_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
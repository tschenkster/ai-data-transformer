-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id)
);

-- Create index for better query performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_status ON public.profiles(status);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, status)
  VALUES (NEW.id, NEW.email, 'pending');
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create account_mappings table for historical mappings
CREATE TABLE public.account_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_account_name TEXT NOT NULL,
  mapped_account_name TEXT NOT NULL,
  confidence_score DECIMAL(3,2),
  reasoning TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validated BOOLEAN DEFAULT false,
  validated_at TIMESTAMP WITH TIME ZONE,
  validated_by UUID REFERENCES auth.users(id)
);

-- Create mapping_sessions table for processing session tracking
CREATE TABLE public.mapping_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  total_accounts INTEGER NOT NULL,
  processed_accounts INTEGER DEFAULT 0,
  approved_accounts INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'review', 'completed', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create mapping_decisions table for individual mapping decisions
CREATE TABLE public.mapping_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.mapping_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_account_name TEXT NOT NULL,
  suggested_mapping TEXT NOT NULL,
  final_mapping TEXT,
  confidence_score DECIMAL(3,2),
  reasoning TEXT,
  similar_accounts JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_account_mappings_user_id ON public.account_mappings(user_id);
CREATE INDEX idx_account_mappings_embedding ON public.account_mappings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_mapping_sessions_user_id ON public.mapping_sessions(user_id);
CREATE INDEX idx_mapping_decisions_session_id ON public.mapping_decisions(session_id);
CREATE INDEX idx_mapping_decisions_user_id ON public.mapping_decisions(user_id);
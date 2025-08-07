-- Create enum for action types
CREATE TYPE public.change_action_type AS ENUM ('create', 'delete', 'rename', 'move');

-- Create the report_structures_change_log table
CREATE TABLE public.report_structures_change_log (
  change_uuid UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  change_id SERIAL NOT NULL UNIQUE,
  user_uuid UUID NOT NULL,
  user_first_name TEXT,
  user_last_name TEXT,  
  user_email TEXT,
  structure_uuid UUID NOT NULL,
  structure_id INTEGER NOT NULL,
  line_item_uuid UUID,
  line_item_id INTEGER,
  action_type change_action_type NOT NULL,
  line_item_key TEXT NOT NULL,
  line_item_description TEXT,
  previous_state JSONB,
  new_state JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_undone BOOLEAN NOT NULL DEFAULT false,
  undone_at TIMESTAMP WITH TIME ZONE,
  undone_by_uuid UUID
);

-- Enable Row Level Security
ALTER TABLE public.report_structures_change_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view change logs for accessible structures" 
ON public.report_structures_change_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.report_structures rs 
    WHERE rs.report_structure_uuid = structure_uuid 
    AND (rs.is_active = true OR is_admin_user())
  )
);

CREATE POLICY "Users can insert their own change logs" 
ON public.report_structures_change_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_uuid);

CREATE POLICY "Users can update their own change logs for undo" 
ON public.report_structures_change_log 
FOR UPDATE 
USING (auth.uid() = user_uuid OR is_admin_user());

CREATE POLICY "Admins can view all change logs" 
ON public.report_structures_change_log 
FOR ALL 
USING (is_admin_user());

-- Create function to get current user details
CREATE OR REPLACE FUNCTION public.get_current_user_details()
RETURNS TABLE(user_uuid UUID, user_first_name TEXT, user_last_name TEXT, user_email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_uuid,
    COALESCE(ua.first_name, '') as user_first_name,
    COALESCE(ua.last_name, '') as user_last_name,
    COALESCE(au.email, '') as user_email
  FROM auth.users au
  LEFT JOIN public.user_accounts ua ON ua.user_id = au.id
  WHERE au.id = auth.uid();
END;
$$;

-- Create function to log structure changes
CREATE OR REPLACE FUNCTION public.log_structure_change(
  p_structure_uuid UUID,
  p_structure_id INTEGER,
  p_line_item_uuid UUID,
  p_line_item_id INTEGER,
  p_action_type change_action_type,
  p_line_item_key TEXT,
  p_line_item_description TEXT,
  p_previous_state JSONB DEFAULT NULL,
  p_new_state JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_change_uuid UUID;
  v_user_details RECORD;
BEGIN
  -- Get current user details
  SELECT * INTO v_user_details FROM public.get_current_user_details();
  
  -- Insert the change log entry
  INSERT INTO public.report_structures_change_log (
    user_uuid,
    user_first_name,
    user_last_name,
    user_email,
    structure_uuid,
    structure_id,
    line_item_uuid,
    line_item_id,
    action_type,
    line_item_key,
    line_item_description,
    previous_state,
    new_state
  ) VALUES (
    v_user_details.user_uuid,
    v_user_details.user_first_name,
    v_user_details.user_last_name,
    v_user_details.user_email,
    p_structure_uuid,
    p_structure_id,
    p_line_item_uuid,
    p_line_item_id,
    p_action_type,
    p_line_item_key,
    p_line_item_description,
    p_previous_state,
    p_new_state
  ) RETURNING change_uuid INTO v_change_uuid;
  
  RETURN v_change_uuid;
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_change_log_structure_uuid ON public.report_structures_change_log(structure_uuid);
CREATE INDEX idx_change_log_user_uuid ON public.report_structures_change_log(user_uuid);
CREATE INDEX idx_change_log_timestamp ON public.report_structures_change_log(timestamp DESC);
CREATE INDEX idx_change_log_is_undone ON public.report_structures_change_log(is_undone) WHERE is_undone = false;
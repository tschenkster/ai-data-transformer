-- Check if bucket exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'user-uploads-trial-balances') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
    VALUES (
      'user-uploads-trial-balances', 
      'user-uploads-trial-balances', 
      false,
      20971520, -- 20MB limit
      ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv', 'application/pdf']
    );
  END IF;
END $$;

-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Users can upload their own trial balance files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own trial balance files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own trial balance files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all trial balance files" ON storage.objects;

-- Create RLS policies for trial balance uploads bucket
CREATE POLICY "Users can upload their own trial balance files"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'user-uploads-trial-balances' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own trial balance files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-uploads-trial-balances' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own trial balance files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-uploads-trial-balances' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can manage all trial balance files
CREATE POLICY "Admins can manage all trial balance files"
ON storage.objects FOR ALL
USING (
  bucket_id = 'user-uploads-trial-balances'
  AND is_admin_user()
);

-- Create audit logging for file operations
CREATE OR REPLACE FUNCTION public.log_trial_balance_upload(
  p_file_name text,
  p_file_size integer,
  p_entity_uuid uuid,
  p_processing_result jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_uuid uuid;
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id,
    action,
    entity_uuid,
    details
  ) VALUES (
    auth.uid(),
    'trial_balance_upload',
    p_entity_uuid,
    jsonb_build_object(
      'file_name', p_file_name,
      'file_size', p_file_size,
      'processing_result', p_processing_result,
      'timestamp', now()
    )
  ) RETURNING security_audit_log_uuid INTO v_log_uuid;
  
  RETURN v_log_uuid;
END;
$$;
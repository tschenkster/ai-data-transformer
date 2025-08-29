-- Create storage bucket for codebase documentation
INSERT INTO storage.buckets (id, name, public) VALUES ('codebase-docs', 'codebase-docs', false);

-- Storage policies for codebase documentation bucket
CREATE POLICY "Super admins can upload codebase docs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'codebase-docs' AND is_super_admin_user());

CREATE POLICY "Super admins can view codebase docs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'codebase-docs' AND is_super_admin_user());

CREATE POLICY "Super admins can delete old codebase docs" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'codebase-docs' AND is_super_admin_user());
-- Create storage bucket for report structure uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads-report-structures',
  'user-uploads-report-structures', 
  false,
  10485760, -- 10MB limit
  ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheettml.sheet']
);

-- Create RLS policies for the bucket
CREATE POLICY "Admins can view all report structure files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'user-uploads-report-structures' AND is_admin_user());

CREATE POLICY "Admins can upload report structure files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'user-uploads-report-structures' AND is_admin_user());

CREATE POLICY "Admins can update report structure files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'user-uploads-report-structures' AND is_admin_user());

CREATE POLICY "Admins can delete report structure files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'user-uploads-report-structures' AND is_admin_user());

-- Add uploaded_file_path column to report_structures table
ALTER TABLE public.report_structures 
ADD COLUMN uploaded_file_path text;

-- Add comment for the new column
COMMENT ON COLUMN public.report_structures.uploaded_file_path IS 'Path to the uploaded file in Supabase Storage bucket user-uploads-report-structures';
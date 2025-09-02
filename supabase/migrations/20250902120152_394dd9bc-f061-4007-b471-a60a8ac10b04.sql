-- Fix the MIME type for Excel files in the storage bucket
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'text/csv', 
  'application/vnd.ms-excel', 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]
WHERE id = 'user-uploads-report-structures';

-- Verify the update
SELECT id, name, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'user-uploads-report-structures';
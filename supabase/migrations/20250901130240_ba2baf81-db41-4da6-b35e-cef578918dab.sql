-- Expand allowed values for translation source during system migrations
-- Reason: Step 5 failed due to CHECK constraint rejecting 'system_migration'
-- Safe change: broaden CHECK to include 'system_migration'

-- Drop existing CHECK constraint
ALTER TABLE public.report_line_items_translations
DROP CONSTRAINT IF EXISTS report_line_items_translations_source_check;

-- Recreate with expanded allowed values
ALTER TABLE public.report_line_items_translations
ADD CONSTRAINT report_line_items_translations_source_check
CHECK (
  source = ANY (ARRAY[
    'manual'::text,
    'ai'::text,
    'import'::text,
    'system_migration'::text
  ])
);

-- Optional sanity: ensure table remains valid
-- (No data changes needed; existing values 'ai' and 'import' already comply)

-- Add preferred_content_language column to user_accounts table
-- This will store the user's preferred language for report content (separate from UI language)

ALTER TABLE public.user_accounts 
ADD COLUMN preferred_content_language character(2) DEFAULT 'de';

-- Add comment to clarify purpose
COMMENT ON COLUMN public.user_accounts.preferred_content_language IS 'User preferred language for report structures, line items, and data content (separate from UI language)';

-- Update any existing users to have German as default content language
UPDATE public.user_accounts 
SET preferred_content_language = 'de' 
WHERE preferred_content_language IS NULL;
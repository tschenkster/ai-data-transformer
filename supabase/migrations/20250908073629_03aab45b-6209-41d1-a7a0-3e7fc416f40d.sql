-- Drop audit_events view to fix security definer issue
-- This view is not being used in the application and poses a security risk
DROP VIEW IF EXISTS public.audit_events;
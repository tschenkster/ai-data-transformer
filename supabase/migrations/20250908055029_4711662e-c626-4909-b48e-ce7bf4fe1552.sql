-- Robust audit trigger function with safe fallbacks
CREATE OR REPLACE FUNCTION public.set_audit_fields_safe()
RETURNS TRIGGER AS $$
DECLARE
  v_req_sub uuid := NULL;
BEGIN
  -- Try to read sub from request claims (works for migrations/SQL too)
  BEGIN
    v_req_sub := (current_setting('request.jwt.claims', true)::json ->> 'sub')::uuid;
  EXCEPTION WHEN others THEN
    v_req_sub := NULL;
  END;

  IF TG_OP = 'INSERT' THEN
    NEW.created_at := COALESCE(NEW.created_at, now());
    NEW.created_by := COALESCE(NEW.created_by, auth.uid(), v_req_sub, NEW.updated_by, '00000000-0000-0000-0000-000000000001'::uuid);
    NEW.updated_at := now();
    NEW.updated_by := COALESCE(auth.uid(), v_req_sub, NEW.created_by, '00000000-0000-0000-0000-000000000001'::uuid);
  ELSE
    NEW.created_at := COALESCE(OLD.created_at, NEW.created_at, now());
    NEW.created_by := COALESCE(OLD.created_by, NEW.created_by, auth.uid(), v_req_sub, NEW.updated_by, '00000000-0000-0000-0000-000000000001'::uuid);
    NEW.updated_at := now();
    NEW.updated_by := COALESCE(auth.uid(), v_req_sub, NEW.updated_by, OLD.updated_by, NEW.created_by, OLD.created_by, '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create/replace triggers on translation tables
DROP TRIGGER IF EXISTS set_ui_translations_audit_fields ON public.ui_translations;
CREATE TRIGGER set_ui_translations_audit_fields
  BEFORE INSERT OR UPDATE ON public.ui_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields_safe();

DROP TRIGGER IF EXISTS set_report_structures_translations_audit_fields ON public.report_structures_translations;
CREATE TRIGGER set_report_structures_translations_audit_fields
  BEFORE INSERT OR UPDATE ON public.report_structures_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields_safe();

DROP TRIGGER IF EXISTS set_report_line_items_translations_audit_fields ON public.report_line_items_translations;
CREATE TRIGGER set_report_line_items_translations_audit_fields
  BEFORE INSERT OR UPDATE ON public.report_line_items_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields_safe();

-- Enforce NOT NULL on audit columns
ALTER TABLE public.ui_translations 
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE public.report_structures_translations 
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE public.report_line_items_translations 
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN updated_by SET NOT NULL;
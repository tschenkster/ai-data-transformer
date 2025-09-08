-- Create comprehensive audit trigger function
CREATE OR REPLACE FUNCTION public.set_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT: Set all audit fields
  IF TG_OP = 'INSERT' THEN
    NEW.created_by = auth.uid();
    NEW.created_at = now();
    NEW.updated_by = auth.uid();
    NEW.updated_at = now();
  -- On UPDATE: Only update the updated fields, preserve created fields
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_by = auth.uid();
    NEW.updated_at = now();
    -- Preserve original created fields
    NEW.created_by = OLD.created_by;
    NEW.created_at = OLD.created_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add NOT NULL constraints now that data is backfilled
ALTER TABLE ui_translations 
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE report_structures_translations 
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE report_line_items_translations 
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN updated_by SET NOT NULL;

-- Replace existing triggers with comprehensive audit triggers
-- UI Translations
DROP TRIGGER IF EXISTS update_ui_translations_updated_at ON ui_translations;
CREATE TRIGGER set_ui_translations_audit_fields
  BEFORE INSERT OR UPDATE ON ui_translations
  FOR EACH ROW EXECUTE FUNCTION set_audit_fields();

-- Report Structures Translations  
DROP TRIGGER IF EXISTS update_report_structures_translations_updated_at ON report_structures_translations;
CREATE TRIGGER set_report_structures_translations_audit_fields
  BEFORE INSERT OR UPDATE ON report_structures_translations
  FOR EACH ROW EXECUTE FUNCTION set_audit_fields();

-- Report Line Items Translations
DROP TRIGGER IF EXISTS update_report_line_items_translations_updated_at ON report_line_items_translations;
CREATE TRIGGER set_report_line_items_translations_audit_fields
  BEFORE INSERT OR UPDATE ON report_line_items_translations
  FOR EACH ROW EXECUTE FUNCTION set_audit_fields();

-- Add audit trail validation constraints
ALTER TABLE ui_translations 
  ADD CONSTRAINT ui_translations_audit_check 
  CHECK (created_at <= updated_at);

ALTER TABLE report_structures_translations 
  ADD CONSTRAINT report_structures_translations_audit_check 
  CHECK (created_at <= updated_at);

ALTER TABLE report_line_items_translations 
  ADD CONSTRAINT report_line_items_translations_audit_check 
  CHECK (created_at <= updated_at);
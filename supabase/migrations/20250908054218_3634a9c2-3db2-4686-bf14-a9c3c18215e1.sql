-- Phase 1: Create comprehensive audit trigger function
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

-- Phase 2: Drop existing update-only triggers and create comprehensive ones

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

-- Phase 3: Backfill historical data with system user
-- Get the first super admin user or create a system identifier
DO $$
DECLARE
  system_user_id uuid;
  admin_user_id uuid;
BEGIN
  -- Try to find a super admin user
  SELECT ur.user_id INTO admin_user_id
  FROM user_roles ur
  WHERE ur.role = 'super_admin'
  LIMIT 1;
  
  -- Use admin user if found, otherwise use a well-known system UUID
  system_user_id := COALESCE(admin_user_id, '00000000-0000-0000-0000-000000000001'::uuid);
  
  -- Backfill UI translations
  UPDATE ui_translations 
  SET created_by = system_user_id,
      updated_by = system_user_id
  WHERE created_by IS NULL OR updated_by IS NULL;
  
  -- Backfill report structures translations
  UPDATE report_structures_translations 
  SET created_by = system_user_id,
      updated_by = system_user_id
  WHERE created_by IS NULL OR updated_by IS NULL;
  
  -- Backfill report line items translations
  UPDATE report_line_items_translations 
  SET created_by = system_user_id,
      updated_by = system_user_id
  WHERE created_by IS NULL OR updated_by IS NULL;
  
  RAISE NOTICE 'Backfilled audit fields with system user: %', system_user_id;
END $$;

-- Phase 4: Add validation constraints to prevent future NULL values
-- Add NOT NULL constraints after backfill
ALTER TABLE ui_translations 
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE report_structures_translations 
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE report_line_items_translations 
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN updated_by SET NOT NULL;

-- Add check constraints to ensure proper audit trail
ALTER TABLE ui_translations 
  ADD CONSTRAINT ui_translations_audit_check 
  CHECK (created_at <= updated_at);

ALTER TABLE report_structures_translations 
  ADD CONSTRAINT report_structures_translations_audit_check 
  CHECK (created_at <= updated_at);

ALTER TABLE report_line_items_translations 
  ADD CONSTRAINT report_line_items_translations_audit_check 
  CHECK (created_at <= updated_at);
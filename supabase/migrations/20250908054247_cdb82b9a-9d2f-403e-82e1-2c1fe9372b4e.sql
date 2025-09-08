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

-- Phase 2: Backfill historical data FIRST before adding constraints
DO $$
DECLARE
  system_user_id uuid;
  admin_user_id uuid;
  backfill_count integer;
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
  GET DIAGNOSTICS backfill_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % UI translation records', backfill_count;
  
  -- Backfill report structures translations
  UPDATE report_structures_translations 
  SET created_by = system_user_id,
      updated_by = system_user_id
  WHERE created_by IS NULL OR updated_by IS NULL;
  GET DIAGNOSTICS backfill_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % report structure translation records', backfill_count;
  
  -- Backfill report line items translations
  UPDATE report_line_items_translations 
  SET created_by = system_user_id,
      updated_by = system_user_id
  WHERE created_by IS NULL OR updated_by IS NULL;
  GET DIAGNOSTICS backfill_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % report line item translation records', backfill_count;
  
  RAISE NOTICE 'Completed backfill with system user: %', system_user_id;
END $$;

-- Phase 3: Now add NOT NULL constraints after data is backfilled
ALTER TABLE ui_translations 
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE report_structures_translations 
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE report_line_items_translations 
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN updated_by SET NOT NULL;

-- Phase 4: Drop existing update-only triggers and create comprehensive ones
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

-- Phase 5: Add audit trail validation constraints
ALTER TABLE ui_translations 
  ADD CONSTRAINT ui_translations_audit_check 
  CHECK (created_at <= updated_at);

ALTER TABLE report_structures_translations 
  ADD CONSTRAINT report_structures_translations_audit_check 
  CHECK (created_at <= updated_at);

ALTER TABLE report_line_items_translations 
  ADD CONSTRAINT report_line_items_translations_audit_check 
  CHECK (created_at <= updated_at);
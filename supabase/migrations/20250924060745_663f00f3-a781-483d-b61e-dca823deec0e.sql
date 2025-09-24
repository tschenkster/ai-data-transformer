-- Rename table from trial_balances_uploaded to trial_balance_uploads
ALTER TABLE data.trial_balances_uploaded RENAME TO trial_balance_uploads;

-- Rename field from trial_balance_uploaded_uuid to trial_balance_upload_uuid
ALTER TABLE data.trial_balance_uploads RENAME COLUMN trial_balance_uploaded_uuid TO trial_balance_upload_uuid;

-- Add new trial_balance_upload_id field starting at 10000
ALTER TABLE data.trial_balance_uploads ADD COLUMN trial_balance_upload_id integer GENERATED ALWAYS AS IDENTITY (START WITH 10000);

-- Update the unique constraint name to match new table name
ALTER TABLE data.trial_balance_uploads RENAME CONSTRAINT uq_trial_balances_uploaded TO uq_trial_balance_uploads;

-- Update trigger name to match new table name
ALTER TRIGGER update_trial_balances_uploaded_updated_at ON data.trial_balance_uploads RENAME TO update_trial_balance_uploads_updated_at;
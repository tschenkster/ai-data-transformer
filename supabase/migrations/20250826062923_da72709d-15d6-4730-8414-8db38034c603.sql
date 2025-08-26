-- Step 1: Just rename the columns in user_entity_access table
-- This is the core fix for the field name inconsistency

ALTER TABLE user_entity_access RENAME COLUMN user_account_uuid TO user_uuid;
ALTER TABLE user_entity_access RENAME COLUMN user_account_id TO user_id;
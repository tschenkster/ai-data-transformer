-- First, let's handle entity_groups table
-- Temporarily drop identity constraint for entity_group_id
ALTER TABLE entity_groups ALTER COLUMN entity_group_id DROP IDENTITY IF EXISTS;

-- Update existing entity group record to use new ID (if exists)
UPDATE entity_groups SET entity_group_id = 10 WHERE entity_group_id = 1;
UPDATE entities SET entity_group_id = 10 WHERE entity_group_id = 1;

-- Restore identity constraint starting from 11
ALTER TABLE entity_groups ALTER COLUMN entity_group_id ADD GENERATED ALWAYS AS IDENTITY (START WITH 11);

-- Now handle entities table
-- Temporarily drop identity constraint for entity_id
ALTER TABLE entities ALTER COLUMN entity_id DROP IDENTITY IF EXISTS;

-- Update existing entity records with new IDs (if they exist)
UPDATE entities SET entity_id = 1000 WHERE entity_id = 1;
UPDATE entities SET entity_id = 1001 WHERE entity_id = 2;

-- Restore identity constraint starting from 1002
ALTER TABLE entities ALTER COLUMN entity_id ADD GENERATED ALWAYS AS IDENTITY (START WITH 1002);
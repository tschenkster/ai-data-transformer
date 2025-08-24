-- Update entity_group_id sequence to start at 10
ALTER SEQUENCE entity_groups_entity_group_id_seq RESTART WITH 10;

-- Update entity_id sequence to start at 1000  
ALTER SEQUENCE entities_entity_id_seq RESTART WITH 1000;

-- Update existing entity group record to use new ID (if exists)
UPDATE entity_groups SET entity_group_id = 10 WHERE entity_group_id = 1;
UPDATE entities SET entity_group_id = 10 WHERE entity_group_id = 1;

-- Update existing entity records with new IDs (if they exist)
UPDATE entities SET entity_id = 1000 WHERE entity_id = 1;
UPDATE entities SET entity_id = 1001 WHERE entity_id = 2;
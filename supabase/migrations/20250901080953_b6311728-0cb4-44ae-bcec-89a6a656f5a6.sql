-- Phase 1: Schema Corrections for Multilingual Support (Corrected)
-- Check and rename only columns that need renaming

-- Drop existing constraints first
ALTER TABLE report_structures_translations 
DROP CONSTRAINT IF EXISTS report_structures_translations_report_structure_uuid_langua_key;

ALTER TABLE report_line_items_translations 
DROP CONSTRAINT IF EXISTS report_line_items_translations_report_line_item_uuid_language_key;

ALTER TABLE ui_translations 
DROP CONSTRAINT IF EXISTS ui_translations_ui_key_language_code_target_field_key_key;

-- Only rename if field_key exists (not source_field_name)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'report_structures_translations' 
               AND column_name = 'field_key') THEN
        ALTER TABLE report_structures_translations RENAME COLUMN field_key TO source_field_name;
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'report_line_items_translations' 
               AND column_name = 'field_key') THEN
        ALTER TABLE report_line_items_translations RENAME COLUMN field_key TO source_field_name;
    END IF;
END $$;

-- Add proper unique constraints as specified in PRD
ALTER TABLE report_structures_translations 
ADD CONSTRAINT report_structures_translations_unique 
UNIQUE (report_structure_uuid, language_code_target, source_field_name);

ALTER TABLE report_line_items_translations 
ADD CONSTRAINT report_line_items_translations_unique 
UNIQUE (report_line_item_uuid, language_code_target, source_field_name);

ALTER TABLE ui_translations 
ADD CONSTRAINT ui_translations_unique 
UNIQUE (ui_key, language_code_target, source_field_name);

-- Performance Indexes as specified in PRD
CREATE INDEX IF NOT EXISTS idx_report_structures_translations_lookup 
ON report_structures_translations (report_structure_uuid, language_code_target);

CREATE INDEX IF NOT EXISTS idx_report_line_items_translations_lookup 
ON report_line_items_translations (report_line_item_uuid, language_code_target);

CREATE INDEX IF NOT EXISTS idx_ui_translations_lookup 
ON ui_translations (ui_key, language_code_target);

-- Add missing source language columns to base tables
ALTER TABLE report_structures 
ADD COLUMN IF NOT EXISTS source_language_code CHAR(2) REFERENCES system_languages(language_code);

ALTER TABLE report_line_items 
ADD COLUMN IF NOT EXISTS source_language_code CHAR(2) REFERENCES system_languages(language_code);

-- Set default source language to 'de' for existing records
UPDATE report_structures 
SET source_language_code = 'de' 
WHERE source_language_code IS NULL;

UPDATE report_line_items 
SET source_language_code = 'de' 
WHERE source_language_code IS NULL;
-- Phase 1: Schema Corrections for Multilingual Support
-- Step 1.1: Column Renaming (field_key -> source_field_name)

-- Drop existing constraints first
ALTER TABLE report_structures_translations 
DROP CONSTRAINT IF EXISTS report_structures_translations_report_structure_uuid_langua_key;

ALTER TABLE report_line_items_translations 
DROP CONSTRAINT IF EXISTS report_line_items_translations_report_line_item_uuid_language_key;

ALTER TABLE ui_translations 
DROP CONSTRAINT IF EXISTS ui_translations_ui_key_language_code_target_field_key_key;

-- Rename columns to match PRD specification
ALTER TABLE report_structures_translations 
RENAME COLUMN field_key TO source_field_name;

ALTER TABLE report_line_items_translations 
RENAME COLUMN field_key TO source_field_name;

ALTER TABLE ui_translations 
RENAME COLUMN source_field_name TO source_field_name; -- Already correct, but ensuring consistency

-- Step 1.2: Add proper unique constraints as specified in PRD
ALTER TABLE report_structures_translations 
ADD CONSTRAINT report_structures_translations_unique 
UNIQUE (report_structure_uuid, language_code_target, source_field_name);

ALTER TABLE report_line_items_translations 
ADD CONSTRAINT report_line_items_translations_unique 
UNIQUE (report_line_item_uuid, language_code_target, source_field_name);

ALTER TABLE ui_translations 
ADD CONSTRAINT ui_translations_unique 
UNIQUE (ui_key, language_code_target, source_field_name);

-- Step 1.3: Performance Indexes as specified in PRD
CREATE INDEX IF NOT EXISTS idx_report_structures_translations_lookup 
ON report_structures_translations (report_structure_uuid, language_code_target);

CREATE INDEX IF NOT EXISTS idx_report_line_items_translations_lookup 
ON report_line_items_translations (report_line_item_uuid, language_code_target);

CREATE INDEX IF NOT EXISTS idx_ui_translations_lookup 
ON ui_translations (ui_key, language_code_target);

-- Step 1.4: Add missing columns to base tables for source language tracking
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

-- Step 1.5: Update the get_translation_with_fallback function to use new column name
CREATE OR REPLACE FUNCTION public.get_translation_with_fallback(
  p_entity_type text, 
  p_entity_uuid uuid, 
  p_source_field_name text, 
  p_language_code text DEFAULT 'de'::text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_translated_text TEXT;
  v_default_language TEXT := 'de';
  v_source_language TEXT;
BEGIN
  -- Handle 'orig' language code - resolve to source language
  IF p_language_code = 'orig' THEN
    IF p_entity_type = 'report_structure' THEN
      SELECT rs.source_language_code INTO v_source_language
      FROM report_structures rs
      WHERE rs.report_structure_uuid = p_entity_uuid;
    ELSIF p_entity_type = 'report_line_item' THEN
      SELECT rli.source_language_code INTO v_source_language
      FROM report_line_items rli
      WHERE rli.report_line_item_uuid = p_entity_uuid;
    END IF;
    
    p_language_code := COALESCE(v_source_language, v_default_language);
  END IF;

  -- Try to get translation in requested language
  IF p_entity_type = 'report_structure' THEN
    SELECT rst.translated_text INTO v_translated_text
    FROM report_structures_translations rst
    WHERE rst.report_structure_uuid = p_entity_uuid
      AND rst.language_code_target = p_language_code
      AND rst.source_field_name = p_source_field_name;
  ELSIF p_entity_type = 'report_line_item' THEN
    SELECT rlit.translated_text INTO v_translated_text
    FROM report_line_items_translations rlit
    WHERE rlit.report_line_item_uuid = p_entity_uuid
      AND rlit.language_code_target = p_language_code
      AND rlit.source_field_name = p_source_field_name;
  ELSIF p_entity_type = 'ui' THEN
    SELECT uit.translated_text INTO v_translated_text
    FROM ui_translations uit
    WHERE uit.ui_key = p_entity_uuid::TEXT
      AND uit.language_code_target = p_language_code
      AND uit.source_field_name = p_source_field_name;
  END IF;

  -- Fallback to default language if not found and not already default
  IF v_translated_text IS NULL AND p_language_code != v_default_language THEN
    IF p_entity_type = 'report_structure' THEN
      SELECT rst.translated_text INTO v_translated_text
      FROM report_structures_translations rst
      WHERE rst.report_structure_uuid = p_entity_uuid
        AND rst.language_code_target = v_default_language
        AND rst.source_field_name = p_source_field_name;
    ELSIF p_entity_type = 'report_line_item' THEN
      SELECT rlit.translated_text INTO v_translated_text
      FROM report_line_items_translations rlit
      WHERE rlit.report_line_item_uuid = p_entity_uuid
        AND rlit.language_code_target = v_default_language
        AND rlit.source_field_name = p_source_field_name;
    ELSIF p_entity_type = 'ui' THEN
      SELECT uit.translated_text INTO v_translated_text
      FROM ui_translations uit
      WHERE uit.ui_key = p_entity_uuid::TEXT
        AND uit.language_code_target = v_default_language
        AND uit.source_field_name = p_source_field_name;
    END IF;
  END IF;

  -- Return translation or placeholder
  RETURN COALESCE(v_translated_text, '[missing:' || p_source_field_name || ']');
END;
$function$;
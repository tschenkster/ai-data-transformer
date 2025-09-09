-- Fix translation system configuration and update Hero translations (UPSERT approach)

-- Step 1: Fix system language defaults (German should be default)
UPDATE system_languages SET is_default = false;
UPDATE system_languages SET is_default = true WHERE language_code = 'de';

-- Step 2: Update Hero translation keys with correct content using UPSERT
-- HERO_UPLOAD_TITLE
INSERT INTO ui_translations (ui_key, language_code_original, language_code_target, original_text, translated_text, source, created_by, updated_by, source_field_name) VALUES
('HERO_UPLOAD_TITLE', 'en', 'de', 'Convert useless DATEV reports', 'Wandeln Sie nutzlose DATEV-Berichte um', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'text')
ON CONFLICT (ui_key, language_code_target, source_field_name) 
DO UPDATE SET 
  original_text = EXCLUDED.original_text,
  translated_text = EXCLUDED.translated_text,
  updated_by = EXCLUDED.updated_by,
  updated_at = now();

INSERT INTO ui_translations (ui_key, language_code_original, language_code_target, original_text, translated_text, source, created_by, updated_by, source_field_name) VALUES
('HERO_UPLOAD_TITLE', 'en', 'en', 'Convert useless DATEV reports', 'Convert useless DATEV reports', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'text')
ON CONFLICT (ui_key, language_code_target, source_field_name) 
DO UPDATE SET 
  original_text = EXCLUDED.original_text,
  translated_text = EXCLUDED.translated_text,
  updated_by = EXCLUDED.updated_by,
  updated_at = now();

-- HERO_UPLOAD_SUBTITLE
INSERT INTO ui_translations (ui_key, language_code_original, language_code_target, original_text, translated_text, source, created_by, updated_by, source_field_name) VALUES
('HERO_UPLOAD_SUBTITLE', 'en', 'de', '...into clean data & proper reports.', '...in saubere Daten und ordentliche Berichte.', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'text')
ON CONFLICT (ui_key, language_code_target, source_field_name) 
DO UPDATE SET 
  original_text = EXCLUDED.original_text,
  translated_text = EXCLUDED.translated_text,
  updated_by = EXCLUDED.updated_by,
  updated_at = now();

INSERT INTO ui_translations (ui_key, language_code_original, language_code_target, original_text, translated_text, source, created_by, updated_by, source_field_name) VALUES
('HERO_UPLOAD_SUBTITLE', 'en', 'en', '...into clean data & proper reports.', '...into clean data & proper reports.', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'text')
ON CONFLICT (ui_key, language_code_target, source_field_name) 
DO UPDATE SET 
  original_text = EXCLUDED.original_text,
  translated_text = EXCLUDED.translated_text,
  updated_by = EXCLUDED.updated_by,
  updated_at = now();
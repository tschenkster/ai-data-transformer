-- Fix translation system configuration and add missing Hero translations

-- Step 1: Fix system language defaults (German should be default)
UPDATE system_languages SET is_default = true WHERE language_code = 'de';
UPDATE system_languages SET is_default = false WHERE language_code = 'en';

-- Step 2: Fix Hero translation keys with correct content
-- Delete existing incorrect translations
DELETE FROM ui_translations WHERE ui_key IN ('HERO_UPLOAD_TITLE', 'HERO_UPLOAD_SUBTITLE');

-- Insert correct Hero translations
INSERT INTO ui_translations (ui_key, language_code_original, language_code_target, original_text, translated_text, source, created_by, updated_by) VALUES
-- HERO_UPLOAD_TITLE (English -> German)
('HERO_UPLOAD_TITLE', 'en', 'de', 'Convert useless DATEV reports', 'Wandeln Sie nutzlose DATEV-Berichte um', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
-- HERO_UPLOAD_TITLE (English -> English, for consistency)
('HERO_UPLOAD_TITLE', 'en', 'en', 'Convert useless DATEV reports', 'Convert useless DATEV reports', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

-- HERO_UPLOAD_SUBTITLE (English -> German)
('HERO_UPLOAD_SUBTITLE', 'en', 'de', '...into clean data & proper reports.', '...in saubere Daten und ordentliche Berichte.', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
-- HERO_UPLOAD_SUBTITLE (English -> English)
('HERO_UPLOAD_SUBTITLE', 'en', 'en', '...into clean data & proper reports.', '...into clean data & proper reports.', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

-- BTN_UPLOAD_FILE (English -> German)
('BTN_UPLOAD_FILE', 'en', 'de', 'Upload your DATEV file', 'Laden Sie Ihre DATEV-Datei hoch', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
-- BTN_UPLOAD_FILE (English -> English)
('BTN_UPLOAD_FILE', 'en', 'en', 'Upload your DATEV file', 'Upload your DATEV file', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

-- Additional Hero translations for consistency
('ARIA_UPLOAD_LABEL', 'en', 'de', 'Upload your DATEV file - simulation mode', 'Laden Sie Ihre DATEV-Datei hoch - Simulationsmodus', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('ARIA_UPLOAD_LABEL', 'en', 'en', 'Upload your DATEV file - simulation mode', 'Upload your DATEV file - simulation mode', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

('MSG_DROP_FILE', 'en', 'de', 'Drop your file here to simulate upload', 'Datei hier ablegen um Upload zu simulieren', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('MSG_DROP_FILE', 'en', 'en', 'Drop your file here to simulate upload', 'Drop your file here to simulate upload', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

('MSG_COMING_SOON', 'en', 'de', 'Coming soon: upload will be available once the app is live.', 'Bald verfügbar: Upload wird verfügbar sein, sobald die App live ist.', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('MSG_COMING_SOON', 'en', 'en', 'Coming soon: upload will be available once the app is live.', 'Coming soon: upload will be available once the app is live.', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');
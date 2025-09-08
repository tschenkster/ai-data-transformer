-- Add missing MENU_REPORT_STRUCTURE_MANAGER translation key for German and English
-- Let the trigger handle audit fields automatically
INSERT INTO ui_translations (
  ui_key,
  language_code_target,
  translated_text,
  original_text,
  source
)
SELECT 
  'MENU_REPORT_STRUCTURE_MANAGER',
  'de',
  'Berichtsstruktur-Manager',
  'Report Structure Manager',
  'system'
WHERE NOT EXISTS (
  SELECT 1 FROM ui_translations 
  WHERE ui_key = 'MENU_REPORT_STRUCTURE_MANAGER' 
    AND language_code_target = 'de'
);

INSERT INTO ui_translations (
  ui_key,
  language_code_target,
  translated_text,
  original_text,
  source
)
SELECT 
  'MENU_REPORT_STRUCTURE_MANAGER',
  'en',
  'Report Structure Manager',
  'Report Structure Manager',
  'system'
WHERE NOT EXISTS (
  SELECT 1 FROM ui_translations 
  WHERE ui_key = 'MENU_REPORT_STRUCTURE_MANAGER' 
    AND language_code_target = 'en'
);
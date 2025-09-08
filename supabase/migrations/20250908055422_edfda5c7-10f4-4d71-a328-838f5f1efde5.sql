-- Add missing MENU_REPORT_STRUCTURE_MANAGER translation key for German and English
-- Using INSERT WHERE NOT EXISTS to avoid conflicts
INSERT INTO ui_translations (
  ui_key,
  language_code_target,
  translated_text,
  original_text,
  source,
  created_by,
  updated_by
)
SELECT 
  'MENU_REPORT_STRUCTURE_MANAGER',
  'de',
  'Berichtsstruktur-Manager',
  'Report Structure Manager',
  'system',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid
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
  source,
  created_by,
  updated_by
)
SELECT 
  'MENU_REPORT_STRUCTURE_MANAGER',
  'en',
  'Report Structure Manager',
  'Report Structure Manager',
  'system',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid
WHERE NOT EXISTS (
  SELECT 1 FROM ui_translations 
  WHERE ui_key = 'MENU_REPORT_STRUCTURE_MANAGER' 
    AND language_code_target = 'en'
);
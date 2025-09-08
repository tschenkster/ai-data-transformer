-- Seed missing UI translations for Report Structure Manager using an existing auth user for audit fields
WITH u AS (
  SELECT id AS uid FROM auth.users ORDER BY created_at LIMIT 1
)
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
  u.uid,
  u.uid
FROM u
WHERE NOT EXISTS (
  SELECT 1 FROM ui_translations 
  WHERE ui_key = 'MENU_REPORT_STRUCTURE_MANAGER' 
    AND language_code_target = 'de'
);

WITH u AS (
  SELECT id AS uid FROM auth.users ORDER BY created_at LIMIT 1
)
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
  u.uid,
  u.uid
FROM u
WHERE NOT EXISTS (
  SELECT 1 FROM ui_translations 
  WHERE ui_key = 'MENU_REPORT_STRUCTURE_MANAGER' 
    AND language_code_target = 'en'
);
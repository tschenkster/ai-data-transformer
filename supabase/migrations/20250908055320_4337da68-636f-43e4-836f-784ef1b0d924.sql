-- Add missing MENU_REPORT_STRUCTURE_MANAGER translation key for German and English
INSERT INTO ui_translations (
  ui_key,
  language_code_target,
  translated_text,
  original_text,
  source,
  created_by,
  updated_by
) VALUES 
  ('MENU_REPORT_STRUCTURE_MANAGER', 'de', 'Berichtsstruktur-Manager', 'Report Structure Manager', 'system', '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
  ('MENU_REPORT_STRUCTURE_MANAGER', 'en', 'Report Structure Manager', 'Report Structure Manager', 'system', '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (ui_key, language_code_target) 
DO UPDATE SET 
  translated_text = EXCLUDED.translated_text,
  original_text = EXCLUDED.original_text,
  source = EXCLUDED.source,
  updated_by = EXCLUDED.updated_by,
  updated_at = now();
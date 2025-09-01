-- Add missing UI translation keys that are used in the sidebar but not yet in database
-- German translations
INSERT INTO ui_translations (
  ui_key,
  language_code_target,
  source_field_name,
  translated_text,
  original_text,
  source,
  language_code_original
) VALUES 
  -- Additional Menu Items (German)
  ('MENU_USER_PROFILE_MANAGEMENT', 'de', 'text', 'Benutzerprofilverwaltung', 'User Profile Management', 'manual', 'en'),
  ('MENU_ROLES_PERMISSIONS', 'de', 'text', 'Rollen & Berechtigungen', 'Roles & Permissions', 'manual', 'en'),
  ('MENU_ENTITY_MANAGEMENT', 'de', 'text', 'Entitätsverwaltung', 'Entity Management', 'manual', 'en'),
  ('MENU_ACTIVITY_LOG', 'de', 'text', 'Aktivitätsprotokoll', 'Activity Log', 'manual', 'en'),
  ('MENU_SYSTEM_TOOLS', 'de', 'text', 'Systemwerkzeuge', 'System Tools', 'manual', 'en'),
  ('MENU_DATA_IMPORT_TRANSFORMATION', 'de', 'text', 'Datenimport & Transformation', 'Data Import & Transformation', 'manual', 'en'),
  ('MENU_COA_MAPPER', 'de', 'text', 'Kontenplan-Mapper', 'CoA Mapper', 'manual', 'en'),
  ('MENU_TRIAL_BALANCE_IMPORT', 'de', 'text', 'Saldenbilanz-Import', 'Trial Balance Import', 'manual', 'en'),
  ('MENU_JOURNAL_IMPORT', 'de', 'text', 'Journal-Import', 'Journal Import', 'manual', 'en'),
  ('MENU_MEMORY_MAINTENANCE', 'de', 'text', 'Speicherwartung', 'Memory Maintenance', 'manual', 'en'),
  ('MENU_REPORTS', 'de', 'text', 'Daten-Downloads & Berichte', 'Data Downloads & Reports', 'manual', 'en'),
  ('MENU_SQL_TABLES', 'de', 'text', 'SQL-Tabellen', 'SQL Tables', 'manual', 'en'),
  ('MENU_START', 'de', 'text', 'Start', 'Start', 'manual', 'en'),
  ('MENU_ACCOUNT', 'de', 'text', 'Konto', 'Account', 'manual', 'en'),
  ('WELCOME_DASHBOARD', 'de', 'text', 'Willkommen-Dashboard', 'Welcome dashboard', 'manual', 'en')

ON CONFLICT (ui_key, language_code_target, source_field_name) 
DO UPDATE SET 
  translated_text = EXCLUDED.translated_text,
  updated_at = now();

-- English translations (originals)
INSERT INTO ui_translations (
  ui_key,
  language_code_target,
  source_field_name,
  translated_text,
  original_text,
  source,
  language_code_original
) VALUES 
  -- Additional Menu Items (English)
  ('MENU_USER_PROFILE_MANAGEMENT', 'en', 'text', 'User Profile Management', 'User Profile Management', 'manual', 'en'),
  ('MENU_ROLES_PERMISSIONS', 'en', 'text', 'Roles & Permissions', 'Roles & Permissions', 'manual', 'en'),
  ('MENU_ENTITY_MANAGEMENT', 'en', 'text', 'Entity Management', 'Entity Management', 'manual', 'en'),
  ('MENU_ACTIVITY_LOG', 'en', 'text', 'Activity Log', 'Activity Log', 'manual', 'en'),
  ('MENU_SYSTEM_TOOLS', 'en', 'text', 'System Tools', 'System Tools', 'manual', 'en'),
  ('MENU_DATA_IMPORT_TRANSFORMATION', 'en', 'text', 'Data Import & Transformation', 'Data Import & Transformation', 'manual', 'en'),
  ('MENU_COA_MAPPER', 'en', 'text', 'CoA Mapper', 'CoA Mapper', 'manual', 'en'),
  ('MENU_TRIAL_BALANCE_IMPORT', 'en', 'text', 'Trial Balance Import', 'Trial Balance Import', 'manual', 'en'),
  ('MENU_JOURNAL_IMPORT', 'en', 'text', 'Journal Import', 'Journal Import', 'manual', 'en'),
  ('MENU_MEMORY_MAINTENANCE', 'en', 'text', 'Memory Maintenance', 'Memory Maintenance', 'manual', 'en'),
  ('MENU_REPORTS', 'en', 'text', 'Data Downloads & Reports', 'Data Downloads & Reports', 'manual', 'en'),
  ('MENU_SQL_TABLES', 'en', 'text', 'SQL Tables', 'SQL Tables', 'manual', 'en'),
  ('MENU_START', 'en', 'text', 'Start', 'Start', 'manual', 'en'),
  ('MENU_ACCOUNT', 'en', 'text', 'Account', 'Account', 'manual', 'en'),
  ('WELCOME_DASHBOARD', 'en', 'text', 'Welcome dashboard', 'Welcome dashboard', 'manual', 'en')

ON CONFLICT (ui_key, language_code_target, source_field_name) 
DO UPDATE SET 
  translated_text = EXCLUDED.translated_text,
  updated_at = now();
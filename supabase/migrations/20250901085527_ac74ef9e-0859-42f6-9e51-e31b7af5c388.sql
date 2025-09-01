-- Seed missing UI translations for German and English
-- This fixes the bug where sidebar menu items display in English despite German language setting

-- Insert German translations for menu items
INSERT INTO ui_translations (
  ui_key,
  language_code_target,
  translated_text,
  original_text,
  source,
  language_code_original
) VALUES 
  ('MENU_DASHBOARD', 'de', 'Dashboard', 'Dashboard', 'system', 'en'),
  ('MENU_REPORT_STRUCTURES', 'de', 'Berichtsstrukturen', 'Report Structures', 'system', 'en'),
  ('MENU_COA_TRANSLATOR', 'de', 'Kontenplan-Übersetzer', 'CoA Translator', 'system', 'en'),
  ('MENU_FINANCIAL_REPORTS', 'de', 'Finanzberichte', 'Financial Reports', 'system', 'en'),
  ('MENU_SYSTEM_ADMINISTRATION', 'de', 'Systemverwaltung', 'System Administration', 'system', 'en'),
  ('MENU_USER_MANAGEMENT', 'de', 'Benutzerverwaltung', 'User Management', 'system', 'en'),
  ('MENU_LOGOUT', 'de', 'Abmelden', 'Logout', 'system', 'en'),
  ('MENU_ADMIN', 'de', 'Administration', 'Admin', 'system', 'en'),
  ('MENU_CONVERT', 'de', 'Konvertieren', 'Convert', 'system', 'en'),
  ('MENU_ACCOUNT_PROFILE', 'de', 'Kontoprofil', 'Account Profile', 'system', 'en'),
  ('MENU_PRICING', 'de', 'Preise', 'Pricing', 'system', 'en'),
  
  -- Additional common UI keys
  ('BTN_SAVE', 'de', 'Speichern', 'Save', 'system', 'en'),
  ('BTN_CANCEL', 'de', 'Abbrechen', 'Cancel', 'system', 'en'),
  ('BTN_DELETE', 'de', 'Löschen', 'Delete', 'system', 'en'),
  ('BTN_EDIT', 'de', 'Bearbeiten', 'Edit', 'system', 'en'),
  ('BTN_CREATE', 'de', 'Erstellen', 'Create', 'system', 'en'),
  ('LABEL_LANGUAGE', 'de', 'Sprache', 'Language', 'system', 'en'),
  ('LABEL_STATUS', 'de', 'Status', 'Status', 'system', 'en'),
  ('LABEL_CREATED', 'de', 'Erstellt', 'Created', 'system', 'en'),
  ('LABEL_UPDATED', 'de', 'Aktualisiert', 'Updated', 'system', 'en'),
  ('LANGUAGE_CHANGED', 'de', 'Sprache geändert', 'Language Changed', 'system', 'en')

ON CONFLICT (ui_key, language_code_target) 
DO UPDATE SET 
  translated_text = EXCLUDED.translated_text,
  updated_at = now();

-- Insert English translations (originals)
INSERT INTO ui_translations (
  ui_key,
  language_code_target,
  translated_text,
  original_text,
  source,
  language_code_original
) VALUES 
  ('MENU_DASHBOARD', 'en', 'Dashboard', 'Dashboard', 'system', 'en'),
  ('MENU_REPORT_STRUCTURES', 'en', 'Report Structures', 'Report Structures', 'system', 'en'),
  ('MENU_COA_TRANSLATOR', 'en', 'CoA Translator', 'CoA Translator', 'system', 'en'),
  ('MENU_FINANCIAL_REPORTS', 'en', 'Financial Reports', 'Financial Reports', 'system', 'en'),
  ('MENU_SYSTEM_ADMINISTRATION', 'en', 'System Administration', 'System Administration', 'system', 'en'),
  ('MENU_USER_MANAGEMENT', 'en', 'User Management', 'User Management', 'system', 'en'),
  ('MENU_LOGOUT', 'en', 'Logout', 'Logout', 'system', 'en'),
  ('MENU_ADMIN', 'en', 'Admin', 'Admin', 'system', 'en'),
  ('MENU_CONVERT', 'en', 'Convert', 'Convert', 'system', 'en'),
  ('MENU_ACCOUNT_PROFILE', 'en', 'Account Profile', 'Account Profile', 'system', 'en'),
  ('MENU_PRICING', 'en', 'Pricing', 'Pricing', 'system', 'en'),
  
  -- Additional common UI keys
  ('BTN_SAVE', 'en', 'Save', 'Save', 'system', 'en'),
  ('BTN_CANCEL', 'en', 'Cancel', 'Cancel', 'system', 'en'),
  ('BTN_DELETE', 'en', 'Delete', 'Delete', 'system', 'en'),
  ('BTN_EDIT', 'en', 'Edit', 'Edit', 'system', 'en'),
  ('BTN_CREATE', 'en', 'Create', 'Create', 'system', 'en'),
  ('LABEL_LANGUAGE', 'en', 'Language', 'Language', 'system', 'en'),
  ('LABEL_STATUS', 'en', 'Status', 'Status', 'system', 'en'),
  ('LABEL_CREATED', 'en', 'Created', 'Created', 'system', 'en'),
  ('LABEL_UPDATED', 'en', 'Updated', 'Updated', 'system', 'en'),
  ('LANGUAGE_CHANGED', 'en', 'Language Changed', 'Language Changed', 'system', 'en')

ON CONFLICT (ui_key, language_code_target) 
DO UPDATE SET 
  translated_text = EXCLUDED.translated_text,
  updated_at = now();
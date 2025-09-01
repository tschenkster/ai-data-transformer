-- Seed missing UI translations for German and English
-- This fixes the bug where sidebar menu items display in English despite German language setting

-- Insert German translations for menu items
INSERT INTO ui_translations (
  ui_key,
  language_code_target,
  source_field_name,
  translated_text,
  original_text,
  source,
  language_code_original
) VALUES 
  ('MENU_DASHBOARD', 'de', 'text', 'Dashboard', 'Dashboard', 'manual', 'en'),
  ('MENU_REPORT_STRUCTURES', 'de', 'text', 'Berichtsstrukturen', 'Report Structures', 'manual', 'en'),
  ('MENU_COA_TRANSLATOR', 'de', 'text', 'Kontenplan-Übersetzer', 'CoA Translator', 'manual', 'en'),
  ('MENU_FINANCIAL_REPORTS', 'de', 'text', 'Finanzberichte', 'Financial Reports', 'manual', 'en'),
  ('MENU_SYSTEM_ADMINISTRATION', 'de', 'text', 'Systemverwaltung', 'System Administration', 'manual', 'en'),
  ('MENU_USER_MANAGEMENT', 'de', 'text', 'Benutzerverwaltung', 'User Management', 'manual', 'en'),
  ('MENU_LOGOUT', 'de', 'text', 'Abmelden', 'Logout', 'manual', 'en'),
  ('MENU_ADMIN', 'de', 'text', 'Administration', 'Admin', 'manual', 'en'),
  ('MENU_CONVERT', 'de', 'text', 'Konvertieren', 'Convert', 'manual', 'en'),
  ('MENU_ACCOUNT_PROFILE', 'de', 'text', 'Kontoprofil', 'Account Profile', 'manual', 'en'),
  ('MENU_PRICING', 'de', 'text', 'Preise', 'Pricing', 'manual', 'en'),
  
  -- Additional common UI keys
  ('BTN_SAVE', 'de', 'text', 'Speichern', 'Save', 'manual', 'en'),
  ('BTN_CANCEL', 'de', 'text', 'Abbrechen', 'Cancel', 'manual', 'en'),
  ('BTN_DELETE', 'de', 'text', 'Löschen', 'Delete', 'manual', 'en'),
  ('BTN_EDIT', 'de', 'text', 'Bearbeiten', 'Edit', 'manual', 'en'),
  ('BTN_CREATE', 'de', 'text', 'Erstellen', 'Create', 'manual', 'en'),
  ('LABEL_LANGUAGE', 'de', 'text', 'Sprache', 'Language', 'manual', 'en'),
  ('LABEL_STATUS', 'de', 'text', 'Status', 'Status', 'manual', 'en'),
  ('LABEL_CREATED', 'de', 'text', 'Erstellt', 'Created', 'manual', 'en'),
  ('LABEL_UPDATED', 'de', 'text', 'Aktualisiert', 'Updated', 'manual', 'en'),
  ('LANGUAGE_CHANGED', 'de', 'text', 'Sprache geändert', 'Language Changed', 'manual', 'en')

ON CONFLICT (ui_key, language_code_target, source_field_name) 
DO UPDATE SET 
  translated_text = EXCLUDED.translated_text,
  updated_at = now();

-- Insert English translations (originals)
INSERT INTO ui_translations (
  ui_key,
  language_code_target,
  source_field_name,
  translated_text,
  original_text,
  source,
  language_code_original
) VALUES 
  ('MENU_DASHBOARD', 'en', 'text', 'Dashboard', 'Dashboard', 'manual', 'en'),
  ('MENU_REPORT_STRUCTURES', 'en', 'text', 'Report Structures', 'Report Structures', 'manual', 'en'),
  ('MENU_COA_TRANSLATOR', 'en', 'text', 'CoA Translator', 'CoA Translator', 'manual', 'en'),
  ('MENU_FINANCIAL_REPORTS', 'en', 'text', 'Financial Reports', 'Financial Reports', 'manual', 'en'),
  ('MENU_SYSTEM_ADMINISTRATION', 'en', 'text', 'System Administration', 'System Administration', 'manual', 'en'),
  ('MENU_USER_MANAGEMENT', 'en', 'text', 'User Management', 'User Management', 'manual', 'en'),
  ('MENU_LOGOUT', 'en', 'text', 'Logout', 'Logout', 'manual', 'en'),
  ('MENU_ADMIN', 'en', 'text', 'Admin', 'Admin', 'manual', 'en'),
  ('MENU_CONVERT', 'en', 'text', 'Convert', 'Convert', 'manual', 'en'),
  ('MENU_ACCOUNT_PROFILE', 'en', 'text', 'Account Profile', 'Account Profile', 'manual', 'en'),
  ('MENU_PRICING', 'en', 'text', 'Pricing', 'Pricing', 'manual', 'en'),
  
  -- Additional common UI keys
  ('BTN_SAVE', 'en', 'text', 'Save', 'Save', 'manual', 'en'),
  ('BTN_CANCEL', 'en', 'text', 'Cancel', 'Cancel', 'manual', 'en'),
  ('BTN_DELETE', 'en', 'text', 'Delete', 'Delete', 'manual', 'en'),
  ('BTN_EDIT', 'en', 'text', 'Edit', 'Edit', 'manual', 'en'),
  ('BTN_CREATE', 'en', 'text', 'Create', 'Create', 'manual', 'en'),
  ('LABEL_LANGUAGE', 'en', 'text', 'Language', 'Language', 'manual', 'en'),
  ('LABEL_STATUS', 'en', 'text', 'Status', 'Status', 'manual', 'en'),
  ('LABEL_CREATED', 'en', 'text', 'Created', 'Created', 'manual', 'en'),
  ('LABEL_UPDATED', 'en', 'text', 'Updated', 'Updated', 'manual', 'en'),
  ('LANGUAGE_CHANGED', 'en', 'text', 'Language Changed', 'Language Changed', 'manual', 'en')

ON CONFLICT (ui_key, language_code_target, source_field_name) 
DO UPDATE SET 
  translated_text = EXCLUDED.translated_text,
  updated_at = now();
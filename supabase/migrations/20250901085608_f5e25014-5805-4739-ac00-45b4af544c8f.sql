-- Add unique constraint for UI translations to prevent duplicates
ALTER TABLE ui_translations 
ADD CONSTRAINT ui_translations_unique_key_lang_field 
UNIQUE (ui_key, language_code_target, source_field_name);

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
  ('MENU_DASHBOARD', 'de', 'text', 'Dashboard', 'Dashboard', 'system', 'en'),
  ('MENU_REPORT_STRUCTURES', 'de', 'text', 'Berichtsstrukturen', 'Report Structures', 'system', 'en'),
  ('MENU_COA_TRANSLATOR', 'de', 'text', 'Kontenplan-Übersetzer', 'CoA Translator', 'system', 'en'),
  ('MENU_FINANCIAL_REPORTS', 'de', 'text', 'Finanzberichte', 'Financial Reports', 'system', 'en'),
  ('MENU_SYSTEM_ADMINISTRATION', 'de', 'text', 'Systemverwaltung', 'System Administration', 'system', 'en'),
  ('MENU_USER_MANAGEMENT', 'de', 'text', 'Benutzerverwaltung', 'User Management', 'system', 'en'),
  ('MENU_LOGOUT', 'de', 'text', 'Abmelden', 'Logout', 'system', 'en'),
  ('MENU_ADMIN', 'de', 'text', 'Administration', 'Admin', 'system', 'en'),
  ('MENU_CONVERT', 'de', 'text', 'Konvertieren', 'Convert', 'system', 'en'),
  ('MENU_ACCOUNT_PROFILE', 'de', 'text', 'Kontoprofil', 'Account Profile', 'system', 'en'),
  ('MENU_PRICING', 'de', 'text', 'Preise', 'Pricing', 'system', 'en'),
  
  -- Additional common UI keys
  ('BTN_SAVE', 'de', 'text', 'Speichern', 'Save', 'system', 'en'),
  ('BTN_CANCEL', 'de', 'text', 'Abbrechen', 'Cancel', 'system', 'en'),
  ('BTN_DELETE', 'de', 'text', 'Löschen', 'Delete', 'system', 'en'),
  ('BTN_EDIT', 'de', 'text', 'Bearbeiten', 'Edit', 'system', 'en'),
  ('BTN_CREATE', 'de', 'text', 'Erstellen', 'Create', 'system', 'en'),
  ('LABEL_LANGUAGE', 'de', 'text', 'Sprache', 'Language', 'system', 'en'),
  ('LABEL_STATUS', 'de', 'text', 'Status', 'Status', 'system', 'en'),
  ('LABEL_CREATED', 'de', 'text', 'Erstellt', 'Created', 'system', 'en'),
  ('LABEL_UPDATED', 'de', 'text', 'Aktualisiert', 'Updated', 'system', 'en'),
  ('LANGUAGE_CHANGED', 'de', 'text', 'Sprache geändert', 'Language Changed', 'system', 'en')

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
  ('MENU_DASHBOARD', 'en', 'text', 'Dashboard', 'Dashboard', 'system', 'en'),
  ('MENU_REPORT_STRUCTURES', 'en', 'text', 'Report Structures', 'Report Structures', 'system', 'en'),
  ('MENU_COA_TRANSLATOR', 'en', 'text', 'CoA Translator', 'CoA Translator', 'system', 'en'),
  ('MENU_FINANCIAL_REPORTS', 'en', 'text', 'Financial Reports', 'Financial Reports', 'system', 'en'),
  ('MENU_SYSTEM_ADMINISTRATION', 'en', 'text', 'System Administration', 'System Administration', 'system', 'en'),
  ('MENU_USER_MANAGEMENT', 'en', 'text', 'User Management', 'User Management', 'system', 'en'),
  ('MENU_LOGOUT', 'en', 'text', 'Logout', 'Logout', 'system', 'en'),
  ('MENU_ADMIN', 'en', 'text', 'Admin', 'Admin', 'system', 'en'),
  ('MENU_CONVERT', 'en', 'text', 'Convert', 'Convert', 'system', 'en'),
  ('MENU_ACCOUNT_PROFILE', 'en', 'text', 'Account Profile', 'Account Profile', 'system', 'en'),
  ('MENU_PRICING', 'en', 'text', 'Pricing', 'Pricing', 'system', 'en'),
  
  -- Additional common UI keys
  ('BTN_SAVE', 'en', 'text', 'Save', 'Save', 'system', 'en'),
  ('BTN_CANCEL', 'en', 'text', 'Cancel', 'Cancel', 'system', 'en'),
  ('BTN_DELETE', 'en', 'text', 'Delete', 'Delete', 'system', 'en'),
  ('BTN_EDIT', 'en', 'text', 'Edit', 'Edit', 'system', 'en'),
  ('BTN_CREATE', 'en', 'text', 'Create', 'Create', 'system', 'en'),
  ('LABEL_LANGUAGE', 'en', 'text', 'Language', 'Language', 'system', 'en'),
  ('LABEL_STATUS', 'en', 'text', 'Status', 'Status', 'system', 'en'),
  ('LABEL_CREATED', 'en', 'text', 'Created', 'Created', 'system', 'en'),
  ('LABEL_UPDATED', 'en', 'text', 'Updated', 'Updated', 'system', 'en'),
  ('LANGUAGE_CHANGED', 'en', 'text', 'Language Changed', 'Language Changed', 'system', 'en')

ON CONFLICT (ui_key, language_code_target, source_field_name) 
DO UPDATE SET 
  translated_text = EXCLUDED.translated_text,
  updated_at = now();
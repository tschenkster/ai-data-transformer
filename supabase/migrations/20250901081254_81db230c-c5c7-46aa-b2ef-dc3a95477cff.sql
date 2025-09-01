-- Phase 2: Data Population - UI Translations for core app elements
-- Populate ui_translations table with essential UI elements

INSERT INTO ui_translations (ui_key, language_code_target, source_field_name, translated_text, source) VALUES
-- Navigation elements
('NAV_HOME', 'de', 'text', 'Startseite', 'manual'),
('NAV_HOME', 'en', 'text', 'Home', 'manual'),
('NAV_DASHBOARD', 'de', 'text', 'Dashboard', 'manual'),
('NAV_DASHBOARD', 'en', 'text', 'Dashboard', 'manual'),
('NAV_REPORTS', 'de', 'text', 'Berichte', 'manual'),
('NAV_REPORTS', 'en', 'text', 'Reports', 'manual'),
('NAV_STRUCTURES', 'de', 'text', 'Strukturen', 'manual'),
('NAV_STRUCTURES', 'en', 'text', 'Structures', 'manual'),
('NAV_ADMIN', 'de', 'text', 'Administration', 'manual'),
('NAV_ADMIN', 'en', 'text', 'Administration', 'manual'),

-- Button labels
('BTN_SAVE', 'de', 'text', 'Speichern', 'manual'),
('BTN_SAVE', 'en', 'text', 'Save', 'manual'),
('BTN_CANCEL', 'de', 'text', 'Abbrechen', 'manual'),
('BTN_CANCEL', 'en', 'text', 'Cancel', 'manual'),
('BTN_DELETE', 'de', 'text', 'Löschen', 'manual'),
('BTN_DELETE', 'en', 'text', 'Delete', 'manual'),
('BTN_EDIT', 'de', 'text', 'Bearbeiten', 'manual'),
('BTN_EDIT', 'en', 'text', 'Edit', 'manual'),
('BTN_CREATE', 'de', 'text', 'Erstellen', 'manual'),
('BTN_CREATE', 'en', 'text', 'Create', 'manual'),

-- Common labels
('LABEL_LANGUAGE', 'de', 'text', 'Sprache', 'manual'),
('LABEL_LANGUAGE', 'en', 'text', 'Language', 'manual'),
('LABEL_STATUS', 'de', 'text', 'Status', 'manual'),
('LABEL_STATUS', 'en', 'text', 'Status', 'manual'),
('LABEL_CREATED', 'de', 'text', 'Erstellt', 'manual'),
('LABEL_CREATED', 'en', 'text', 'Created', 'manual'),
('LABEL_UPDATED', 'de', 'text', 'Aktualisiert', 'manual'),
('LABEL_UPDATED', 'en', 'text', 'Updated', 'manual')

ON CONFLICT (ui_key, language_code_target, source_field_name) 
DO UPDATE SET 
  translated_text = EXCLUDED.translated_text,
  updated_at = now();
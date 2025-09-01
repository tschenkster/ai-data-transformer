-- Add missing UI translation keys for sidebar navigation and account section (handle duplicates)
INSERT INTO public.ui_translations (ui_key, language_code_target, translated_text, original_text, source_field_name, source) VALUES
-- Navigation group labels and menu items (skip duplicates)
('MENU_SYSTEM_ADMINISTRATION', 'de', 'Systemadministration', 'System Administration', 'text', 'manual'),
('MENU_SYSTEM_ADMINISTRATION', 'en', 'System Administration', 'System Administration', 'text', 'manual'),
('MENU_DATA_IMPORT_TRANSFORMATION', 'de', 'Datenimport & Transformation', 'Data Import & Transformation', 'text', 'manual'),
('MENU_DATA_IMPORT_TRANSFORMATION', 'en', 'Data Import & Transformation', 'Data Import & Transformation', 'text', 'manual'),
('MENU_REPORTS', 'de', 'Daten-Downloads & Berichte', 'Data Downloads & Reports', 'text', 'manual'),
('MENU_REPORTS', 'en', 'Data Downloads & Reports', 'Data Downloads & Reports', 'text', 'manual'),
('MENU_USER_PROFILE_MANAGEMENT', 'de', 'Benutzerprofilmanagement', 'User Profile Management', 'text', 'manual'),
('MENU_USER_PROFILE_MANAGEMENT', 'en', 'User Profile Management', 'User Profile Management', 'text', 'manual'),
('MENU_REPORT_CONFIGURATION', 'de', 'Berichtskonfiguration', 'Report Configuration', 'text', 'manual'),
('MENU_REPORT_CONFIGURATION', 'en', 'Report Configuration', 'Report Configuration', 'text', 'manual'),
('MENU_MEMORY_MAINTENANCE', 'de', 'Speicher-Wartung', 'Memory Maintenance', 'text', 'manual'),
('MENU_MEMORY_MAINTENANCE', 'en', 'Memory Maintenance', 'Memory Maintenance', 'text', 'manual'),
('MENU_SQL_TABLES', 'de', 'SQL-Tabellen', 'SQL Tables', 'text', 'manual'),
('MENU_SQL_TABLES', 'en', 'SQL Tables', 'SQL Tables', 'text', 'manual'),
('MENU_START', 'de', 'Start', 'Start', 'text', 'manual'),
('MENU_START', 'en', 'Start', 'Start', 'text', 'manual'),
('MENU_ACCOUNT', 'de', 'Konto', 'Account', 'text', 'manual'),
('MENU_ACCOUNT', 'en', 'Account', 'Account', 'text', 'manual'),
('WELCOME_DASHBOARD', 'de', 'Willkommen Dashboard', 'Welcome dashboard', 'text', 'manual'),
('WELCOME_DASHBOARD', 'en', 'Welcome dashboard', 'Welcome dashboard', 'text', 'manual')
ON CONFLICT (ui_key, language_code_target, source_field_name) DO NOTHING;
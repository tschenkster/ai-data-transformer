-- Add comprehensive UI translation keys for sidebar navigation
INSERT INTO public.ui_translations (ui_key, language_code_target, translated_text, original_text, source_field_name, source) VALUES
-- Main navigation sections
('MENU_SYSTEM_ADMINISTRATION', 'de', 'Systemverwaltung', 'System Administration', 'text', 'manual'),
('MENU_SYSTEM_ADMINISTRATION', 'en', 'System Administration', 'System Administration', 'text', 'manual'),

-- System administration items
('MENU_USER_PROFILE_MANAGEMENT', 'de', 'Benutzerprofilverwaltung', 'User Profile Management', 'text', 'manual'),
('MENU_USER_PROFILE_MANAGEMENT', 'en', 'User Profile Management', 'User Profile Management', 'text', 'manual'),
('MENU_ROLES_PERMISSIONS', 'de', 'Rollen & Berechtigungen', 'Roles & Permissions', 'text', 'manual'),
('MENU_ROLES_PERMISSIONS', 'en', 'Roles & Permissions', 'Roles & Permissions', 'text', 'manual'),
('MENU_ENTITY_MANAGEMENT', 'de', 'Entitätenverwaltung', 'Entity Management', 'text', 'manual'),
('MENU_ENTITY_MANAGEMENT', 'en', 'Entity Management', 'Entity Management', 'text', 'manual'),
('MENU_ACTIVITY_LOG', 'de', 'Aktivitätsprotokoll', 'Activity Log', 'text', 'manual'),
('MENU_ACTIVITY_LOG', 'en', 'Activity Log', 'Activity Log', 'text', 'manual'),
('MENU_SYSTEM_TOOLS', 'de', 'System-Tools', 'System Tools', 'text', 'manual'),
('MENU_SYSTEM_TOOLS', 'en', 'System Tools', 'System Tools', 'text', 'manual'),

-- Data import section
('MENU_DATA_IMPORT_TRANSFORMATION', 'de', 'Datenimport & Transformation', 'Data Import & Transformation', 'text', 'manual'),
('MENU_DATA_IMPORT_TRANSFORMATION', 'en', 'Data Import & Transformation', 'Data Import & Transformation', 'text', 'manual'),
('MENU_COA_TRANSLATOR', 'de', 'KonK-Übersetzer', 'CoA Translator', 'text', 'manual'),
('MENU_COA_TRANSLATOR', 'en', 'CoA Translator', 'CoA Translator', 'text', 'manual'),
('MENU_COA_MAPPER', 'de', 'KonK-Mapper', 'CoA Mapper', 'text', 'manual'),
('MENU_COA_MAPPER', 'en', 'CoA Mapper', 'CoA Mapper', 'text', 'manual'),
('MENU_TRIAL_BALANCE_IMPORT', 'de', 'Rohbilanz-Import', 'Trial Balance Import', 'text', 'manual'),
('MENU_TRIAL_BALANCE_IMPORT', 'en', 'Trial Balance Import', 'Trial Balance Import', 'text', 'manual'),
('MENU_JOURNAL_IMPORT', 'de', 'Journal-Import', 'Journal Import', 'text', 'manual'),
('MENU_JOURNAL_IMPORT', 'en', 'Journal Import', 'Journal Import', 'text', 'manual'),

-- Reports section
('MENU_REPORTS', 'de', 'Berichte', 'Reports', 'text', 'manual'),
('MENU_REPORTS', 'en', 'Reports', 'Reports', 'text', 'manual'),
('MENU_REPORT_STRUCTURES', 'de', 'Berichtsstrukturen', 'Report Structures', 'text', 'manual'),
('MENU_REPORT_STRUCTURES', 'en', 'Report Structures', 'Report Structures', 'text', 'manual'),
('MENU_FINANCIAL_REPORTS', 'de', 'Finanzberichte', 'Financial Reports', 'text', 'manual'),
('MENU_FINANCIAL_REPORTS', 'en', 'Financial Reports', 'Financial Reports', 'text', 'manual'),

-- Other menu items
('MENU_MEMORY_MAINTENANCE', 'de', 'Speicher-Wartung', 'Memory Maintenance', 'text', 'manual'),
('MENU_MEMORY_MAINTENANCE', 'en', 'Memory Maintenance', 'Memory Maintenance', 'text', 'manual'),
('MENU_SQL_TABLES', 'de', 'SQL-Tabellen', 'SQL Tables', 'text', 'manual'),
('MENU_SQL_TABLES', 'en', 'SQL Tables', 'SQL Tables', 'text', 'manual'),
('MENU_START', 'de', 'Start', 'Start', 'text', 'manual'),
('MENU_START', 'en', 'Start', 'Start', 'text', 'manual'),

-- Account section
('MENU_ACCOUNT', 'de', 'Konto', 'Account', 'text', 'manual'),
('MENU_ACCOUNT', 'en', 'Account', 'Account', 'text', 'manual'),
('MENU_LOGOUT', 'de', 'Abmelden', 'Logout', 'text', 'manual'),
('MENU_LOGOUT', 'en', 'Logout', 'Logout', 'text', 'manual'),

-- Common terms
('WELCOME_DASHBOARD', 'de', 'Willkommen Dashboard', 'Welcome dashboard', 'text', 'manual'),
('WELCOME_DASHBOARD', 'en', 'Welcome dashboard', 'Welcome dashboard', 'text', 'manual');
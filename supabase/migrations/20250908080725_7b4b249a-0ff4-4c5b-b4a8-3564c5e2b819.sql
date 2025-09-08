-- Comprehensive UI translation keys for multilingual functionality
-- Phase 1: Core UI Elements (Fixed version)

-- Insert comprehensive UI translation keys with proper user reference handling
INSERT INTO ui_translations (ui_key, language_code_original, language_code_target, source_field_name, original_text, translated_text, source, created_by, updated_by) VALUES

-- Navigation & Menu Items
('MENU_SYSTEM_ADMINISTRATION', 'de', 'de', 'text', 'Systemverwaltung', 'Systemverwaltung', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_SYSTEM_ADMINISTRATION', 'de', 'en', 'text', 'Systemverwaltung', 'System Administration', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_DASHBOARD', 'de', 'de', 'text', 'Dashboard', 'Dashboard', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_DASHBOARD', 'de', 'en', 'text', 'Dashboard', 'Dashboard', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_USER_PROFILE_MANAGEMENT', 'de', 'de', 'text', 'Benutzerprofilverwaltung', 'Benutzerprofilverwaltung', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_USER_PROFILE_MANAGEMENT', 'de', 'en', 'text', 'Benutzerprofilverwaltung', 'User Profile Management', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_ROLES_PERMISSIONS', 'de', 'de', 'text', 'Rollen & Berechtigungen', 'Rollen & Berechtigungen', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_ROLES_PERMISSIONS', 'de', 'en', 'text', 'Rollen & Berechtigungen', 'Roles & Permissions', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_ENTITY_MANAGEMENT', 'de', 'de', 'text', 'Entitätenverwaltung', 'Entitätenverwaltung', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_ENTITY_MANAGEMENT', 'de', 'en', 'text', 'Entitätenverwaltung', 'Entity Management', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_ACTIVITY_LOG', 'de', 'de', 'text', 'Aktivitätsprotokoll', 'Aktivitätsprotokoll', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_ACTIVITY_LOG', 'de', 'en', 'text', 'Aktivitätsprotokoll', 'Activity Log', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_SYSTEM_TOOLS', 'de', 'de', 'text', 'System-Tools', 'System-Tools', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_SYSTEM_TOOLS', 'de', 'en', 'text', 'System-Tools', 'System Tools', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_DATA_IMPORT_TRANSFORMATION', 'de', 'de', 'text', 'Datenimport & -transformation', 'Datenimport & -transformation', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_DATA_IMPORT_TRANSFORMATION', 'de', 'en', 'text', 'Datenimport & -transformation', 'Data Import & Transformation', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_COA_TRANSLATOR', 'de', 'de', 'text', 'KontenplanÜbersetzer', 'KontenplanÜbersetzer', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_COA_TRANSLATOR', 'de', 'en', 'text', 'KontenplanÜbersetzer', 'CoA Translator', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_COA_MAPPER', 'de', 'de', 'text', 'Kontenplan-Mapper', 'Kontenplan-Mapper', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_COA_MAPPER', 'de', 'en', 'text', 'Kontenplan-Mapper', 'CoA Mapper', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_TRIAL_BALANCE_IMPORT', 'de', 'de', 'text', 'Saldenvortrag-Import', 'Saldenvortrag-Import', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_TRIAL_BALANCE_IMPORT', 'de', 'en', 'text', 'Saldenvortrag-Import', 'Trial Balance Import', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_JOURNAL_IMPORT', 'de', 'de', 'text', 'Journal-Import', 'Journal-Import', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_JOURNAL_IMPORT', 'de', 'en', 'text', 'Journal-Import', 'Journal Import', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_REPORT_STRUCTURE_MANAGER', 'de', 'de', 'text', 'Berichtsstruktur-Manager', 'Berichtsstruktur-Manager', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_REPORT_STRUCTURE_MANAGER', 'de', 'en', 'text', 'Berichtsstruktur-Manager', 'Report Structure Manager', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_MEMORY_MAINTENANCE', 'de', 'de', 'text', 'Speicherwartung', 'Speicherwartung', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_MEMORY_MAINTENANCE', 'de', 'en', 'text', 'Speicherwartung', 'Memory Maintenance', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_REPORTS', 'de', 'de', 'text', 'Datenexporte & Berichte', 'Datenexporte & Berichte', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_REPORTS', 'de', 'en', 'text', 'Datenexporte & Berichte', 'Data Downloads & Reports', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_FINANCIAL_REPORTS', 'de', 'de', 'text', 'Finanzberichte', 'Finanzberichte', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_FINANCIAL_REPORTS', 'de', 'en', 'text', 'Finanzberichte', 'Financial Reports', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_SQL_TABLES', 'de', 'de', 'text', 'SQL-Tabellen', 'SQL-Tabellen', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_SQL_TABLES', 'de', 'en', 'text', 'SQL-Tabellen', 'SQL Tables', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_START', 'de', 'de', 'text', 'Start', 'Start', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_START', 'de', 'en', 'text', 'Start', 'Start', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_ACCOUNT', 'de', 'de', 'text', 'Konto', 'Konto', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_ACCOUNT', 'de', 'en', 'text', 'Konto', 'Account', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_LOGOUT', 'de', 'de', 'text', 'Abmelden', 'Abmelden', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MENU_LOGOUT', 'de', 'en', 'text', 'Abmelden', 'Logout', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),

-- Button Labels
('BTN_REFRESH', 'de', 'de', 'text', 'Aktualisieren', 'Aktualisieren', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_REFRESH', 'de', 'en', 'text', 'Aktualisieren', 'Refresh', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_REFRESHING', 'de', 'de', 'text', 'Wird aktualisiert...', 'Wird aktualisiert...', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_REFRESHING', 'de', 'en', 'text', 'Wird aktualisiert...', 'Refreshing...', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_REFRESH_STATUS', 'de', 'de', 'text', 'Status aktualisieren', 'Status aktualisieren', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_REFRESH_STATUS', 'de', 'en', 'text', 'Status aktualisieren', 'Refresh Status', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_SENDING', 'de', 'de', 'text', 'Wird gesendet...', 'Wird gesendet...', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_SENDING', 'de', 'en', 'text', 'Wird gesendet...', 'Sending...', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_SEND_RESET_LINK', 'de', 'de', 'text', 'Reset-Link senden', 'Reset-Link senden', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_SEND_RESET_LINK', 'de', 'en', 'text', 'Reset-Link senden', 'Send Reset Link', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_UPDATING_PASSWORD', 'de', 'de', 'text', 'Passwort wird aktualisiert...', 'Passwort wird aktualisiert...', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_UPDATING_PASSWORD', 'de', 'en', 'text', 'Passwort wird aktualisiert...', 'Updating Password...', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_UPDATE_PASSWORD', 'de', 'de', 'text', 'Passwort aktualisieren', 'Passwort aktualisieren', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_UPDATE_PASSWORD', 'de', 'en', 'text', 'Passwort aktualisieren', 'Update Password', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_APPLY_FILTERS', 'de', 'de', 'text', 'Filter anwenden', 'Filter anwenden', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_APPLY_FILTERS', 'de', 'en', 'text', 'Filter anwenden', 'Apply Filters', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_SAVE', 'de', 'de', 'text', 'Speichern', 'Speichern', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_SAVE', 'de', 'en', 'text', 'Speichern', 'Save', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_CANCEL', 'de', 'de', 'text', 'Abbrechen', 'Abbrechen', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_CANCEL', 'de', 'en', 'text', 'Abbrechen', 'Cancel', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_DELETE', 'de', 'de', 'text', 'Löschen', 'Löschen', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_DELETE', 'de', 'en', 'text', 'Löschen', 'Delete', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_EDIT', 'de', 'de', 'text', 'Bearbeiten', 'Bearbeiten', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_EDIT', 'de', 'en', 'text', 'Bearbeiten', 'Edit', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_CREATE', 'de', 'de', 'text', 'Erstellen', 'Erstellen', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_CREATE', 'de', 'en', 'text', 'Erstellen', 'Create', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_CLOSE', 'de', 'de', 'text', 'Schließen', 'Schließen', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_CLOSE', 'de', 'en', 'text', 'Schließen', 'Close', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),

-- Table Headers
('TABLE_TIME', 'de', 'de', 'text', 'Zeit', 'Zeit', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('TABLE_TIME', 'de', 'en', 'text', 'Zeit', 'Time', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('TABLE_ACTION_TYPE', 'de', 'de', 'text', 'Aktionstyp', 'Aktionstyp', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('TABLE_ACTION_TYPE', 'de', 'en', 'text', 'Aktionstyp', 'Action Type', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('TABLE_LINE_ITEM', 'de', 'de', 'text', 'Posten', 'Posten', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('TABLE_LINE_ITEM', 'de', 'en', 'text', 'Posten', 'Line Item', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('TABLE_UNDO', 'de', 'de', 'text', 'Rückgängig', 'Rückgängig', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('TABLE_UNDO', 'de', 'en', 'text', 'Rückgängig', 'Undo', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('TABLE_ID', 'de', 'de', 'text', 'ID', 'ID', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('TABLE_ID', 'de', 'en', 'text', 'ID', 'ID', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('TABLE_NAME', 'de', 'de', 'text', 'Name', 'Name', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('TABLE_NAME', 'de', 'en', 'text', 'Name', 'Name', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('TABLE_VERSION', 'de', 'de', 'text', 'Version', 'Version', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('TABLE_VERSION', 'de', 'en', 'text', 'Version', 'Version', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('TABLE_STATUS', 'de', 'de', 'text', 'Status', 'Status', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('TABLE_STATUS', 'de', 'en', 'text', 'Status', 'Status', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('TABLE_ACTIONS', 'de', 'de', 'text', 'Aktionen', 'Aktionen', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('TABLE_ACTIONS', 'de', 'en', 'text', 'Aktionen', 'Actions', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),

-- Headings
('HEADING_REPORT_STRUCTURES', 'de', 'de', 'text', 'Berichtsstrukturen', 'Berichtsstrukturen', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HEADING_REPORT_STRUCTURES', 'de', 'en', 'text', 'Berichtsstrukturen', 'Report Structures', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),

-- Descriptions  
('DESC_MANAGE_REPORT_STRUCTURES', 'de', 'de', 'text', 'Verwalten Sie Ihre Berichtsstrukturen und generieren Sie fehlende Übersetzungen', 'Verwalten Sie Ihre Berichtsstrukturen und generieren Sie fehlende Übersetzungen', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('DESC_MANAGE_REPORT_STRUCTURES', 'de', 'en', 'text', 'Verwalten Sie Ihre Berichtsstrukturen und generieren Sie fehlende Übersetzungen', 'Manage your report structures and generate missing translations', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),

-- Messages
('MSG_NO_CHANGES_YET', 'de', 'de', 'text', 'Noch keine Änderungen vorgenommen. Ihre Änderungen werden hier angezeigt.', 'Noch keine Änderungen vorgenommen. Ihre Änderungen werden hier angezeigt.', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MSG_NO_CHANGES_YET', 'de', 'en', 'text', 'Noch keine Änderungen vorgenommen. Ihre Änderungen werden hier angezeigt.', 'No changes made yet. Your modifications will appear here.', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MSG_LOADING', 'de', 'de', 'text', 'Lädt...', 'Lädt...', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MSG_LOADING', 'de', 'en', 'text', 'Lädt...', 'Loading...', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),

-- Language and Translation Related
('LANGUAGE_CHANGED', 'de', 'de', 'text', 'Sprache geändert', 'Sprache geändert', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('LANGUAGE_CHANGED', 'de', 'en', 'text', 'Sprache geändert', 'Language Changed', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),

-- Common Application Labels
('APP_TITLE', 'de', 'de', 'text', 'Data Transformer', 'Data Transformer', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('APP_TITLE', 'de', 'en', 'text', 'Data Transformer', 'Data Transformer', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)))

ON CONFLICT (ui_key, language_code_target, source_field_name) 
DO UPDATE SET 
    translated_text = EXCLUDED.translated_text,
    updated_at = now(),
    updated_by = EXCLUDED.updated_by;
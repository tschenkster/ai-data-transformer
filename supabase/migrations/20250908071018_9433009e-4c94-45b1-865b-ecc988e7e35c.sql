-- Insert missing German translations for Report Structure Manager UI
-- Using simple INSERT with manual conflict handling

-- First, delete any existing records to avoid conflicts
DELETE FROM ui_translations 
WHERE ui_key IN (
  'TAB_LIST_REPORT_STRUCTURES', 'TAB_UPLOAD_NEW_STRUCTURE', 'TAB_VIEW_STRUCTURE', 'TAB_MODIFY_STRUCTURE',
  'HEADING_REPORT_STRUCTURES', 'HEADING_STRUCTURE_VIEWER', 
  'DESC_MANAGE_REPORT_STRUCTURES', 'DESC_STRUCTURE_VIEWER',
  'NAV_START', 'NAV_DASHBOARD', 'NAV_SYSTEM_ADMINISTRATION', 'NAV_REPORT_STRUCTURE_MANAGER',
  'NAV_USER_PROFILE_MANAGEMENT', 'NAV_ROLES_PERMISSIONS_MANAGEMENT', 'NAV_ENTITY_MANAGEMENT',
  'NAV_SYSTEM_TOOLS', 'NAV_DATABASE_DOCUMENTATION', 'NAV_CODEBASE_DOCUMENTATION',
  'NAV_PERFORMANCE_ANALYZER', 'NAV_FILE_ORGANIZER', 'NAV_REPORTS', 'NAV_REPORT_STRUCTURES',
  'NAV_DATA_IMPORT', 'NAV_TRIAL_BALANCE_IMPORT', 'NAV_JOURNAL_ENTRY_IMPORT',
  'NAV_COA_TRANSLATOR', 'NAV_COA_MAPPER'
) AND language_code_target = 'de';

-- Now insert the German translations
INSERT INTO ui_translations (
  ui_key,
  language_code_original,
  language_code_target,
  source_field_name,
  original_text,
  translated_text,
  source,
  created_by,
  updated_by
) VALUES 
-- Tab translations
('TAB_LIST_REPORT_STRUCTURES', 'en', 'de', 'text', 'List Report Structures', 'Berichtsstrukturen auflisten', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('TAB_UPLOAD_NEW_STRUCTURE', 'en', 'de', 'text', 'Upload New Structure', 'Neue Struktur hochladen', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('TAB_VIEW_STRUCTURE', 'en', 'de', 'text', 'View Structure', 'Struktur anzeigen', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('TAB_MODIFY_STRUCTURE', 'en', 'de', 'text', 'Modify Structure', 'Struktur bearbeiten', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

-- Heading translations
('HEADING_REPORT_STRUCTURES', 'en', 'de', 'text', 'Report Structures', 'Berichtsstrukturen', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('HEADING_STRUCTURE_VIEWER', 'en', 'de', 'text', 'Structure Viewer', 'Struktur-Betrachter', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

-- Description translations
('DESC_MANAGE_REPORT_STRUCTURES', 'en', 'de', 'text', 'Manage your report structures and generate missing translations', 'Verwalten Sie Ihre Berichtsstrukturen und generieren Sie fehlende Übersetzungen', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('DESC_STRUCTURE_VIEWER', 'en', 'de', 'text', 'Browse and explore the hierarchical structure of report line items', 'Durchsuchen und erkunden Sie die hierarchische Struktur der Berichtspositionen', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

-- Navigation breadcrumb translations
('NAV_START', 'en', 'de', 'text', 'Start', 'Start', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_DASHBOARD', 'en', 'de', 'text', 'Dashboard', 'Dashboard', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_SYSTEM_ADMINISTRATION', 'en', 'de', 'text', 'System Administration', 'Systemverwaltung', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_REPORT_STRUCTURE_MANAGER', 'en', 'de', 'text', 'Report Structure Manager', 'Berichtsstruktur-Manager', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_USER_PROFILE_MANAGEMENT', 'en', 'de', 'text', 'User Profile Management', 'Benutzerprofil-Verwaltung', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_ROLES_PERMISSIONS_MANAGEMENT', 'en', 'de', 'text', 'Roles & Permissions Management', 'Rollen- und Berechtigungsverwaltung', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_ENTITY_MANAGEMENT', 'en', 'de', 'text', 'Entity Management', 'Entitätsverwaltung', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_SYSTEM_TOOLS', 'en', 'de', 'text', 'System Tools', 'System-Tools', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_DATABASE_DOCUMENTATION', 'en', 'de', 'text', 'Database Documentation', 'Datenbank-Dokumentation', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_CODEBASE_DOCUMENTATION', 'en', 'de', 'text', 'Codebase Documentation Generator', 'Codebase-Dokumentationsgenerator', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_PERFORMANCE_ANALYZER', 'en', 'de', 'text', 'Performance Analyzer', 'Leistungsanalysator', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_FILE_ORGANIZER', 'en', 'de', 'text', 'File Organizer', 'Datei-Organisierer', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_REPORTS', 'en', 'de', 'text', 'Reports', 'Berichte', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_REPORT_STRUCTURES', 'en', 'de', 'text', 'Report Structures', 'Berichtsstrukturen', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_DATA_IMPORT', 'en', 'de', 'text', 'Data Import', 'Datenimport', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_TRIAL_BALANCE_IMPORT', 'en', 'de', 'text', 'Trial Balance Import', 'Rohbilanz-Import', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_JOURNAL_ENTRY_IMPORT', 'en', 'de', 'text', 'Journal Entry Import', 'Journalbuchungs-Import', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_COA_TRANSLATOR', 'en', 'de', 'text', 'CoA Translator', 'Kontenplan-Übersetzer', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_COA_MAPPER', 'en', 'de', 'text', 'CoA Mapper', 'Kontenplan-Zuordner', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');
-- Insert missing German translations for Report Structure Manager UI
-- Using current authenticated user for created_by and updated_by

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

-- Now insert the German translations using current user
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
('TAB_LIST_REPORT_STRUCTURES', 'en', 'de', 'text', 'List Report Structures', 'Berichtsstrukturen auflisten', 'manual', auth.uid(), auth.uid()),
('TAB_UPLOAD_NEW_STRUCTURE', 'en', 'de', 'text', 'Upload New Structure', 'Neue Struktur hochladen', 'manual', auth.uid(), auth.uid()),
('TAB_VIEW_STRUCTURE', 'en', 'de', 'text', 'View Structure', 'Struktur anzeigen', 'manual', auth.uid(), auth.uid()),
('TAB_MODIFY_STRUCTURE', 'en', 'de', 'text', 'Modify Structure', 'Struktur bearbeiten', 'manual', auth.uid(), auth.uid()),

-- Heading translations
('HEADING_REPORT_STRUCTURES', 'en', 'de', 'text', 'Report Structures', 'Berichtsstrukturen', 'manual', auth.uid(), auth.uid()),
('HEADING_STRUCTURE_VIEWER', 'en', 'de', 'text', 'Structure Viewer', 'Struktur-Betrachter', 'manual', auth.uid(), auth.uid()),

-- Description translations
('DESC_MANAGE_REPORT_STRUCTURES', 'en', 'de', 'text', 'Manage your report structures and generate missing translations', 'Verwalten Sie Ihre Berichtsstrukturen und generieren Sie fehlende Übersetzungen', 'manual', auth.uid(), auth.uid()),
('DESC_STRUCTURE_VIEWER', 'en', 'de', 'text', 'Browse and explore the hierarchical structure of report line items', 'Durchsuchen und erkunden Sie die hierarchische Struktur der Berichtspositionen', 'manual', auth.uid(), auth.uid()),

-- Navigation breadcrumb translations
('NAV_START', 'en', 'de', 'text', 'Start', 'Start', 'manual', auth.uid(), auth.uid()),
('NAV_DASHBOARD', 'en', 'de', 'text', 'Dashboard', 'Dashboard', 'manual', auth.uid(), auth.uid()),
('NAV_SYSTEM_ADMINISTRATION', 'en', 'de', 'text', 'System Administration', 'Systemverwaltung', 'manual', auth.uid(), auth.uid()),
('NAV_REPORT_STRUCTURE_MANAGER', 'en', 'de', 'text', 'Report Structure Manager', 'Berichtsstruktur-Manager', 'manual', auth.uid(), auth.uid()),
('NAV_USER_PROFILE_MANAGEMENT', 'en', 'de', 'text', 'User Profile Management', 'Benutzerprofil-Verwaltung', 'manual', auth.uid(), auth.uid()),
('NAV_ROLES_PERMISSIONS_MANAGEMENT', 'en', 'de', 'text', 'Roles & Permissions Management', 'Rollen- und Berechtigungsverwaltung', 'manual', auth.uid(), auth.uid()),
('NAV_ENTITY_MANAGEMENT', 'en', 'de', 'text', 'Entity Management', 'Entitätsverwaltung', 'manual', auth.uid(), auth.uid()),
('NAV_SYSTEM_TOOLS', 'en', 'de', 'text', 'System Tools', 'System-Tools', 'manual', auth.uid(), auth.uid()),
('NAV_DATABASE_DOCUMENTATION', 'en', 'de', 'text', 'Database Documentation', 'Datenbank-Dokumentation', 'manual', auth.uid(), auth.uid()),
('NAV_CODEBASE_DOCUMENTATION', 'en', 'de', 'text', 'Codebase Documentation Generator', 'Codebase-Dokumentationsgenerator', 'manual', auth.uid(), auth.uid()),
('NAV_PERFORMANCE_ANALYZER', 'en', 'de', 'text', 'Performance Analyzer', 'Leistungsanalysator', 'manual', auth.uid(), auth.uid()),
('NAV_FILE_ORGANIZER', 'en', 'de', 'text', 'File Organizer', 'Datei-Organisierer', 'manual', auth.uid(), auth.uid()),
('NAV_REPORTS', 'en', 'de', 'text', 'Reports', 'Berichte', 'manual', auth.uid(), auth.uid()),
('NAV_REPORT_STRUCTURES', 'en', 'de', 'text', 'Report Structures', 'Berichtsstrukturen', 'manual', auth.uid(), auth.uid()),
('NAV_DATA_IMPORT', 'en', 'de', 'text', 'Data Import', 'Datenimport', 'manual', auth.uid(), auth.uid()),
('NAV_TRIAL_BALANCE_IMPORT', 'en', 'de', 'text', 'Trial Balance Import', 'Rohbilanz-Import', 'manual', auth.uid(), auth.uid()),
('NAV_JOURNAL_ENTRY_IMPORT', 'en', 'de', 'text', 'Journal Entry Import', 'Journalbuchungs-Import', 'manual', auth.uid(), auth.uid()),
('NAV_COA_TRANSLATOR', 'en', 'de', 'text', 'CoA Translator', 'Kontenplan-Übersetzer', 'manual', auth.uid(), auth.uid()),
('NAV_COA_MAPPER', 'en', 'de', 'text', 'CoA Mapper', 'Kontenplan-Zuordner', 'manual', auth.uid(), auth.uid());
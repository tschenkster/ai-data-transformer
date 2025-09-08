-- Insert comprehensive German UI translations for all Report Structure Manager components and other pages

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
-- Structure Editor specific translations
('HEADING_STRUCTURE_EDITOR', 'en', 'de', 'text', 'Structure Editor', 'Struktur-Editor', 'manual', auth.uid(), auth.uid()),
('DESC_STRUCTURE_EDITOR', 'en', 'de', 'text', 'Manage line items, hierarchy, and structure organization', 'Verwalten Sie Positionen, Hierarchie und Strukturorganisation', 'manual', auth.uid(), auth.uid()),
('STATUS_ACTIVE', 'en', 'de', 'text', 'Active', 'Aktiv', 'manual', auth.uid(), auth.uid()),
('STATUS_INACTIVE', 'en', 'de', 'text', 'Inactive', 'Inaktiv', 'manual', auth.uid(), auth.uid()),
('BTN_ADD_ITEM', 'en', 'de', 'text', 'Add Item', 'Position hinzufügen', 'manual', auth.uid(), auth.uid()),

-- Change Log translations
('CHANGE_LOG_TITLE', 'en', 'de', 'text', 'Change Log', 'Änderungsprotokoll', 'manual', auth.uid(), auth.uid()),
('TABLE_TIME', 'en', 'de', 'text', 'Time', 'Zeit', 'manual', auth.uid(), auth.uid()),
('TABLE_ACTION_TYPE', 'en', 'de', 'text', 'Action Type', 'Aktionstyp', 'manual', auth.uid(), auth.uid()),
('TABLE_LINE_ITEM', 'en', 'de', 'text', 'Line Item', 'Position', 'manual', auth.uid(), auth.uid()),
('TABLE_UNDO', 'en', 'de', 'text', 'Undo', 'Rückgängig', 'manual', auth.uid(), auth.uid()),
('ACTION_RENAME', 'en', 'de', 'text', 'Rename', 'Umbenennen', 'manual', auth.uid(), auth.uid()),
('ACTION_MOVE', 'en', 'de', 'text', 'Move', 'Verschieben', 'manual', auth.uid(), auth.uid()),
('ACTION_CREATE', 'en', 'de', 'text', 'Create', 'Erstellen', 'manual', auth.uid(), auth.uid()),
('ACTION_DELETE', 'en', 'de', 'text', 'Delete', 'Löschen', 'manual', auth.uid(), auth.uid()),

-- Common UI translations
('BTN_SETTINGS', 'en', 'de', 'text', 'Settings', 'Einstellungen', 'manual', auth.uid(), auth.uid()),
('BTN_IMPORT', 'en', 'de', 'text', 'Import', 'Importieren', 'manual', auth.uid(), auth.uid()),
('BTN_NEW_STRUCTURE', 'en', 'de', 'text', 'New Structure', 'Neue Struktur', 'manual', auth.uid(), auth.uid()),
('BTN_SAVE', 'en', 'de', 'text', 'Save', 'Speichern', 'manual', auth.uid(), auth.uid()),
('BTN_CANCEL', 'en', 'de', 'text', 'Cancel', 'Abbrechen', 'manual', auth.uid(), auth.uid()),
('BTN_DELETE', 'en', 'de', 'text', 'Delete', 'Löschen', 'manual', auth.uid(), auth.uid()),
('BTN_EDIT', 'en', 'de', 'text', 'Edit', 'Bearbeiten', 'manual', auth.uid(), auth.uid()),
('BTN_VIEW', 'en', 'de', 'text', 'View', 'Anzeigen', 'manual', auth.uid(), auth.uid()),
('BTN_CLOSE', 'en', 'de', 'text', 'Close', 'Schließen', 'manual', auth.uid(), auth.uid()),

-- Status and feedback messages
('MSG_SUCCESS', 'en', 'de', 'text', 'Success', 'Erfolg', 'manual', auth.uid(), auth.uid()),
('MSG_ERROR', 'en', 'de', 'text', 'Error', 'Fehler', 'manual', auth.uid(), auth.uid()),
('MSG_WARNING', 'en', 'de', 'text', 'Warning', 'Warnung', 'manual', auth.uid(), auth.uid()),
('MSG_LOADING', 'en', 'de', 'text', 'Loading...', 'Wird geladen...', 'manual', auth.uid(), auth.uid()),
('MSG_NO_DATA', 'en', 'de', 'text', 'No data available', 'Keine Daten verfügbar', 'manual', auth.uid(), auth.uid()),

-- Page-specific translations
('PAGE_DASHBOARD', 'en', 'de', 'text', 'Dashboard', 'Dashboard', 'manual', auth.uid(), auth.uid()),
('PAGE_USER_MANAGEMENT', 'en', 'de', 'text', 'User Management', 'Benutzerverwaltung', 'manual', auth.uid(), auth.uid()),
('PAGE_ENTITY_MANAGEMENT', 'en', 'de', 'text', 'Entity Management', 'Entitätsverwaltung', 'manual', auth.uid(), auth.uid()),
('PAGE_ACTIVITY_LOG', 'en', 'de', 'text', 'Activity Log', 'Aktivitätsprotokoll', 'manual', auth.uid(), auth.uid()),
('PAGE_ACCOUNT_PROFILE', 'en', 'de', 'text', 'Account Profile', 'Kontoprofil', 'manual', auth.uid(), auth.uid()),

-- Form labels and placeholders
('LABEL_NAME', 'en', 'de', 'text', 'Name', 'Name', 'manual', auth.uid(), auth.uid()),
('LABEL_DESCRIPTION', 'en', 'de', 'text', 'Description', 'Beschreibung', 'manual', auth.uid(), auth.uid()),
('LABEL_EMAIL', 'en', 'de', 'text', 'Email', 'E-Mail', 'manual', auth.uid(), auth.uid()),
('LABEL_PASSWORD', 'en', 'de', 'text', 'Password', 'Passwort', 'manual', auth.uid(), auth.uid()),
('LABEL_LANGUAGE', 'en', 'de', 'text', 'Language', 'Sprache', 'manual', auth.uid(), auth.uid()),
('PLACEHOLDER_SEARCH', 'en', 'de', 'text', 'Search...', 'Suchen...', 'manual', auth.uid(), auth.uid()),
('PLACEHOLDER_SELECT', 'en', 'de', 'text', 'Select...', 'Auswählen...', 'manual', auth.uid(), auth.uid()),

-- Table headers
('TABLE_ID', 'en', 'de', 'text', 'ID', 'ID', 'manual', auth.uid(), auth.uid()),
('TABLE_NAME', 'en', 'de', 'text', 'Name', 'Name', 'manual', auth.uid(), auth.uid()),
('TABLE_VERSION', 'en', 'de', 'text', 'Version', 'Version', 'manual', auth.uid(), auth.uid()),
('TABLE_STATUS', 'en', 'de', 'text', 'Status', 'Status', 'manual', auth.uid(), auth.uid()),
('TABLE_CREATED_BY', 'en', 'de', 'text', 'Created By', 'Erstellt von', 'manual', auth.uid(), auth.uid()),
('TABLE_CREATED_AT', 'en', 'de', 'text', 'Created At', 'Erstellt am', 'manual', auth.uid(), auth.uid()),
('TABLE_ACTIONS', 'en', 'de', 'text', 'Actions', 'Aktionen', 'manual', auth.uid(), auth.uid()),

-- Authentication and roles
('ROLE_ADMIN', 'en', 'de', 'text', 'Admin', 'Administrator', 'manual', auth.uid(), auth.uid()),
('ROLE_USER', 'en', 'de', 'text', 'User', 'Benutzer', 'manual', auth.uid(), auth.uid()),
('ROLE_VIEWER', 'en', 'de', 'text', 'Viewer', 'Betrachter', 'manual', auth.uid(), auth.uid()),
('BTN_LOGIN', 'en', 'de', 'text', 'Login', 'Anmelden', 'manual', auth.uid(), auth.uid()),
('BTN_LOGOUT', 'en', 'de', 'text', 'Logout', 'Abmelden', 'manual', auth.uid(), auth.uid()),
('BTN_REGISTER', 'en', 'de', 'text', 'Register', 'Registrieren', 'manual', auth.uid(), auth.uid()),

-- Error and validation messages
('ERR_REQUIRED_FIELD', 'en', 'de', 'text', 'This field is required', 'Dieses Feld ist erforderlich', 'manual', auth.uid(), auth.uid()),
('ERR_INVALID_EMAIL', 'en', 'de', 'text', 'Invalid email address', 'Ungültige E-Mail-Adresse', 'manual', auth.uid(), auth.uid()),
('ERR_PASSWORD_TOO_SHORT', 'en', 'de', 'text', 'Password too short', 'Passwort zu kurz', 'manual', auth.uid(), auth.uid()),
('ERR_LOADING_DATA', 'en', 'de', 'text', 'An unexpected error occurred while loading data', 'Ein unerwarteter Fehler beim Laden der Daten ist aufgetreten', 'manual', auth.uid(), auth.uid()),
('WARN_PARTIAL_DATA', 'en', 'de', 'text', 'Warning', 'Warnung', 'manual', auth.uid(), auth.uid()),
('MSG_DATA_LOADED_TREE_INCOMPLETE', 'en', 'de', 'text', 'Data loaded but tree structure may be incomplete', 'Daten geladen, aber Baumstruktur könnte unvollständig sein', 'manual', auth.uid(), auth.uid())

ON CONFLICT (ui_key, language_code_target) 
DO UPDATE SET
  translated_text = EXCLUDED.translated_text,
  original_text = EXCLUDED.original_text,
  language_code_original = EXCLUDED.language_code_original,
  updated_by = EXCLUDED.updated_by,
  updated_at = now();
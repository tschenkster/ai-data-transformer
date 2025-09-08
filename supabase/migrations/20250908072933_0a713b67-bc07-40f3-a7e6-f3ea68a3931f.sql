-- Insert comprehensive German UI translations (with proper user reference)
DO $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Get current user or first available user
    SELECT id INTO current_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
    
    -- Delete existing records first to avoid conflicts
    DELETE FROM ui_translations 
    WHERE ui_key IN (
      'HEADING_STRUCTURE_EDITOR', 'DESC_STRUCTURE_EDITOR', 'STATUS_ACTIVE', 'STATUS_INACTIVE', 'BTN_ADD_ITEM',
      'CHANGE_LOG_TITLE', 'TABLE_TIME', 'TABLE_ACTION_TYPE', 'TABLE_LINE_ITEM', 'TABLE_UNDO',
      'ACTION_RENAME', 'ACTION_MOVE', 'ACTION_CREATE', 'ACTION_DELETE',
      'BTN_SETTINGS', 'BTN_IMPORT', 'BTN_NEW_STRUCTURE', 'BTN_SAVE', 'BTN_CANCEL', 'BTN_DELETE', 'BTN_EDIT', 'BTN_VIEW', 'BTN_CLOSE',
      'MSG_SUCCESS', 'MSG_ERROR', 'MSG_WARNING', 'MSG_LOADING', 'MSG_NO_DATA',
      'PAGE_DASHBOARD', 'PAGE_USER_MANAGEMENT', 'PAGE_ENTITY_MANAGEMENT', 'PAGE_ACTIVITY_LOG', 'PAGE_ACCOUNT_PROFILE',
      'LABEL_NAME', 'LABEL_DESCRIPTION', 'LABEL_EMAIL', 'LABEL_PASSWORD', 'LABEL_LANGUAGE', 'PLACEHOLDER_SEARCH', 'PLACEHOLDER_SELECT',
      'TABLE_ID', 'TABLE_NAME', 'TABLE_VERSION', 'TABLE_STATUS', 'TABLE_CREATED_BY', 'TABLE_CREATED_AT', 'TABLE_ACTIONS',
      'ROLE_ADMIN', 'ROLE_USER', 'ROLE_VIEWER', 'BTN_LOGIN', 'BTN_LOGOUT', 'BTN_REGISTER',
      'ERR_REQUIRED_FIELD', 'ERR_INVALID_EMAIL', 'ERR_PASSWORD_TOO_SHORT', 'ERR_LOADING_DATA', 'WARN_PARTIAL_DATA', 'MSG_DATA_LOADED_TREE_INCOMPLETE'
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
    -- Structure Editor specific translations
    ('HEADING_STRUCTURE_EDITOR', 'en', 'de', 'text', 'Structure Editor', 'Struktur-Editor', 'manual', current_user_id, current_user_id),
    ('DESC_STRUCTURE_EDITOR', 'en', 'de', 'text', 'Manage line items, hierarchy, and structure organization', 'Verwalten Sie Positionen, Hierarchie und Strukturorganisation', 'manual', current_user_id, current_user_id),
    ('STATUS_ACTIVE', 'en', 'de', 'text', 'Active', 'Aktiv', 'manual', current_user_id, current_user_id),
    ('STATUS_INACTIVE', 'en', 'de', 'text', 'Inactive', 'Inaktiv', 'manual', current_user_id, current_user_id),
    ('BTN_ADD_ITEM', 'en', 'de', 'text', 'Add Item', 'Position hinzufügen', 'manual', current_user_id, current_user_id),

    -- Change Log translations
    ('CHANGE_LOG_TITLE', 'en', 'de', 'text', 'Change Log', 'Änderungsprotokoll', 'manual', current_user_id, current_user_id),
    ('TABLE_TIME', 'en', 'de', 'text', 'Time', 'Zeit', 'manual', current_user_id, current_user_id),
    ('TABLE_ACTION_TYPE', 'en', 'de', 'text', 'Action Type', 'Aktionstyp', 'manual', current_user_id, current_user_id),
    ('TABLE_LINE_ITEM', 'en', 'de', 'text', 'Line Item', 'Position', 'manual', current_user_id, current_user_id),
    ('TABLE_UNDO', 'en', 'de', 'text', 'Undo', 'Rückgängig', 'manual', current_user_id, current_user_id),
    ('ACTION_RENAME', 'en', 'de', 'text', 'Rename', 'Umbenennen', 'manual', current_user_id, current_user_id),
    ('ACTION_MOVE', 'en', 'de', 'text', 'Move', 'Verschieben', 'manual', current_user_id, current_user_id),
    ('ACTION_CREATE', 'en', 'de', 'text', 'Create', 'Erstellen', 'manual', current_user_id, current_user_id),
    ('ACTION_DELETE', 'en', 'de', 'text', 'Delete', 'Löschen', 'manual', current_user_id, current_user_id),

    -- Common UI translations
    ('BTN_SETTINGS', 'en', 'de', 'text', 'Settings', 'Einstellungen', 'manual', current_user_id, current_user_id),
    ('BTN_IMPORT', 'en', 'de', 'text', 'Import', 'Importieren', 'manual', current_user_id, current_user_id),
    ('BTN_NEW_STRUCTURE', 'en', 'de', 'text', 'New Structure', 'Neue Struktur', 'manual', current_user_id, current_user_id),
    ('BTN_SAVE', 'en', 'de', 'text', 'Save', 'Speichern', 'manual', current_user_id, current_user_id),
    ('BTN_CANCEL', 'en', 'de', 'text', 'Cancel', 'Abbrechen', 'manual', current_user_id, current_user_id),

    -- Status and feedback messages
    ('MSG_SUCCESS', 'en', 'de', 'text', 'Success', 'Erfolg', 'manual', current_user_id, current_user_id),
    ('MSG_ERROR', 'en', 'de', 'text', 'Error', 'Fehler', 'manual', current_user_id, current_user_id),
    ('MSG_WARNING', 'en', 'de', 'text', 'Warning', 'Warnung', 'manual', current_user_id, current_user_id),
    ('MSG_LOADING', 'en', 'de', 'text', 'Loading...', 'Wird geladen...', 'manual', current_user_id, current_user_id),
    ('MSG_NO_DATA', 'en', 'de', 'text', 'No data available', 'Keine Daten verfügbar', 'manual', current_user_id, current_user_id),

    -- Page-specific translations
    ('PAGE_DASHBOARD', 'en', 'de', 'text', 'Dashboard', 'Dashboard', 'manual', current_user_id, current_user_id),
    ('PAGE_USER_MANAGEMENT', 'en', 'de', 'text', 'User Management', 'Benutzerverwaltung', 'manual', current_user_id, current_user_id),
    ('PAGE_ENTITY_MANAGEMENT', 'en', 'de', 'text', 'Entity Management', 'Entitätsverwaltung', 'manual', current_user_id, current_user_id),
    ('PAGE_ACTIVITY_LOG', 'en', 'de', 'text', 'Activity Log', 'Aktivitätsprotokoll', 'manual', current_user_id, current_user_id),
    ('PAGE_ACCOUNT_PROFILE', 'en', 'de', 'text', 'Account Profile', 'Kontoprofil', 'manual', current_user_id, current_user_id);

END $$;
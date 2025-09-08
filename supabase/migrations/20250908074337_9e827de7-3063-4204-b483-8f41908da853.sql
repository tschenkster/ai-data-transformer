-- Insert comprehensive German UI translations for all updated components (Fixed escaping)
-- Updated: 2025-01-08 - Adding missing translations for Header, DocumentationManager, Auth forms, SecurityAuditDashboard

INSERT INTO ui_translations (ui_key, language_code_target, language_code_original, source_field_name, original_text, translated_text, source, created_by, updated_by) VALUES

-- Header.tsx translations
('BRAND_NAME', 'de', 'en', 'text', 'DATEV Converter', 'DATEV Konverter', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_ABOUT', 'de', 'en', 'text', 'About', 'Über uns', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_PRICING', 'de', 'en', 'text', 'Pricing', 'Preise', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_LOGIN', 'de', 'en', 'text', 'Login', 'Anmelden', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NAV_REGISTER', 'de', 'en', 'text', 'Register', 'Registrieren', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

-- DocumentationManager.tsx translations
('DOC_MANAGER_TITLE', 'de', 'en', 'text', 'Documentation Manager', 'Dokumentations-Manager', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('DOC_MANAGER_DESC', 'de', 'en', 'text', 'Manage and synchronize all documentation files between storage and project folder.', 'Verwalten und synchronisieren Sie alle Dokumentationsdateien zwischen Speicher und Projektordner.', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('BTN_REFRESHING', 'de', 'en', 'text', 'Refreshing...', 'Aktualisieren...', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('BTN_REFRESH_STATUS', 'de', 'en', 'text', 'Refresh Status', 'Status aktualisieren', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('DATABASE_DOCUMENTATION', 'de', 'en', 'text', 'Database Documentation', 'Datenbank-Dokumentation', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('CODEBASE_DOCUMENTATION', 'de', 'en', 'text', 'Codebase Documentation', 'Codebase-Dokumentation', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('LATEST', 'de', 'en', 'text', 'Latest', 'Neueste', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('GENERATED', 'de', 'en', 'text', 'Generated', 'Generiert', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('SIZE', 'de', 'en', 'text', 'Size', 'Größe', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NONE', 'de', 'en', 'text', 'None', 'Keine', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('TOAST_SYNCING_DOCS', 'de', 'en', 'text', 'Syncing Documentation', 'Dokumentation synchronisieren', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('TOAST_SYNCING_DOCS_DESC', 'de', 'en', 'text', 'Updating project /docs folder with latest documentation...', 'Projekt /docs Ordner wird mit neuester Dokumentation aktualisiert...', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

-- ForgotPasswordForm.tsx translations
('RESET_PASSWORD', 'de', 'en', 'text', 'Reset Password', 'Passwort zurücksetzen', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('RESET_PASSWORD_DESC', 'de', 'en', 'text', 'Enter your email to receive reset instructions', 'Geben Sie Ihre E-Mail ein, um Anweisungen zum Zurücksetzen zu erhalten', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('CHECK_EMAIL', 'de', 'en', 'text', 'Check your email!', 'Überprüfen Sie Ihre E-Mail!', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('RESET_SENT_TO', 'de', 'en', 'text', 'We have sent password reset instructions to', 'Wir haben Anweisungen zum Zurücksetzen des Passworts gesendet an', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('EMAIL_ADDRESS', 'de', 'en', 'text', 'Email Address', 'E-Mail-Adresse', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('ENTER_EMAIL_PLACEHOLDER', 'de', 'en', 'text', 'Enter your email address', 'Geben Sie Ihre E-Mail-Adresse ein', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('BTN_SENDING', 'de', 'en', 'text', 'Sending...', 'Senden...', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('BTN_SEND_RESET_LINK', 'de', 'en', 'text', 'Send Reset Link', 'Reset-Link senden', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('REMEMBER_PASSWORD', 'de', 'en', 'text', 'Remember your password?', 'Erinnern Sie sich an Ihr Passwort?', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('SIGN_IN_INSTEAD', 'de', 'en', 'text', 'Sign in instead', 'Stattdessen anmelden', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

-- ResetPasswordForm.tsx translations
('SET_NEW_PASSWORD', 'de', 'en', 'text', 'Set New Password', 'Neues Passwort festlegen', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('ENTER_STRONG_PASSWORD', 'de', 'en', 'text', 'Enter a strong password for your account', 'Geben Sie ein starkes Passwort für Ihr Konto ein', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NEW_PASSWORD', 'de', 'en', 'text', 'New Password', 'Neues Passwort', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('ENTER_NEW_PASSWORD_PLACEHOLDER', 'de', 'en', 'text', 'Enter your new password', 'Geben Sie Ihr neues Passwort ein', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('CONFIRM_PASSWORD', 'de', 'en', 'text', 'Confirm Password', 'Passwort bestätigen', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('CONFIRM_NEW_PASSWORD_PLACEHOLDER', 'de', 'en', 'text', 'Confirm your new password', 'Bestätigen Sie Ihr neues Passwort', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('PASSWORDS_DO_NOT_MATCH', 'de', 'en', 'text', 'Passwords do not match', 'Passwörter stimmen nicht überein', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('BTN_UPDATING_PASSWORD', 'de', 'en', 'text', 'Updating Password...', 'Passwort wird aktualisiert...', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('BTN_UPDATE_PASSWORD', 'de', 'en', 'text', 'Update Password', 'Passwort aktualisieren', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

-- SecurityAuditDashboard.tsx translations  
('SECURITY_AUDIT_DASHBOARD', 'de', 'en', 'text', 'Security Audit Dashboard', 'Sicherheits-Audit Dashboard', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('MONITOR_AUTH_EVENTS', 'de', 'en', 'text', 'Monitor authentication and security events', 'Authentifizierungs- und Sicherheitsereignisse überwachen', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('BTN_REFRESH', 'de', 'en', 'text', 'Refresh', 'Aktualisieren', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('TOTAL_EVENTS', 'de', 'en', 'text', 'Total Events', 'Gesamte Ereignisse', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('FAILED_LOGINS', 'de', 'en', 'text', 'Failed Logins', 'Fehlgeschlagene Anmeldungen', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('SUSPICIOUS_ACTIVITY', 'de', 'en', 'text', 'Suspicious Activity', 'Verdächtige Aktivität', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('RATE_LIMIT_HITS', 'de', 'en', 'text', 'Rate Limit Hits', 'Rate-Limit-Treffer', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('FILTERS', 'de', 'en', 'text', 'Filters', 'Filter', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('SEARCH', 'de', 'en', 'text', 'Search', 'Suchen', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('SEARCH_ACTIONS_EMAILS', 'de', 'en', 'text', 'Search actions or emails...', 'Aktionen oder E-Mails suchen...', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('ACTION_TYPE', 'de', 'en', 'text', 'Action Type', 'Aktionstyp', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('ALL_ACTIONS', 'de', 'en', 'text', 'All Actions', 'Alle Aktionen', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('SUCCESSFUL_LOGINS', 'de', 'en', 'text', 'Successful Logins', 'Erfolgreiche Anmeldungen', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('ACCOUNT_CREATION', 'de', 'en', 'text', 'Account Creation', 'Kontoerstellung', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('LOGOUT', 'de', 'en', 'text', 'Logout', 'Abmelden', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('START_DATE', 'de', 'en', 'text', 'Start Date', 'Startdatum', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('END_DATE', 'de', 'en', 'text', 'End Date', 'Enddatum', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('BTN_APPLY_FILTERS', 'de', 'en', 'text', 'Apply Filters', 'Filter anwenden', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('SECURITY_EVENTS', 'de', 'en', 'text', 'Security Events', 'Sicherheitsereignisse', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('RECENT_SECURITY_EVENTS', 'de', 'en', 'text', 'Recent security events and authentication logs', 'Aktuelle Sicherheitsereignisse und Authentifizierungsprotokolle', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('LOADING_SECURITY_LOGS', 'de', 'en', 'text', 'Loading security logs...', 'Sicherheitsprotokolle werden geladen...', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('TIMESTAMP', 'de', 'en', 'text', 'Timestamp', 'Zeitstempel', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('ACTION', 'de', 'en', 'text', 'Action', 'Aktion', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('DETAILS', 'de', 'en', 'text', 'Details', 'Details', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('IP_ADDRESS', 'de', 'en', 'text', 'IP Address', 'IP-Adresse', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('USER_AGENT', 'de', 'en', 'text', 'User Agent', 'User Agent', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NO_SECURITY_LOGS_FOUND', 'de', 'en', 'text', 'No security logs found matching your criteria', 'Keine Sicherheitsprotokolle gefunden, die Ihren Kriterien entsprechen', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('NOT_AVAILABLE_SHORT', 'de', 'en', 'text', 'N/A', 'N/V', 'manual', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001')

ON CONFLICT (ui_key, language_code_target) 
DO UPDATE SET 
  translated_text = EXCLUDED.translated_text,
  updated_by = EXCLUDED.updated_by,
  updated_at = now();
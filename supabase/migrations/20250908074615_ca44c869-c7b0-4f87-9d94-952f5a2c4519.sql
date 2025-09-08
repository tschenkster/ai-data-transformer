-- Insert comprehensive German UI translations for all updated components (No user refs)
-- Updated: 2025-01-08 - Adding missing translations for Header, DocumentationManager, Auth forms, SecurityAuditDashboard

INSERT INTO ui_translations (ui_key, language_code_target, language_code_original, source_field_name, original_text, translated_text, source) VALUES

-- Header.tsx translations
('BRAND_NAME', 'de', 'en', 'text', 'DATEV Converter', 'DATEV Konverter', 'manual'),
('NAV_ABOUT', 'de', 'en', 'text', 'About', 'Über uns', 'manual'),
('NAV_PRICING', 'de', 'en', 'text', 'Pricing', 'Preise', 'manual'),
('NAV_LOGIN', 'de', 'en', 'text', 'Login', 'Anmelden', 'manual'),
('NAV_REGISTER', 'de', 'en', 'text', 'Register', 'Registrieren', 'manual'),

-- DocumentationManager.tsx translations
('DOC_MANAGER_TITLE', 'de', 'en', 'text', 'Documentation Manager', 'Dokumentations-Manager', 'manual'),
('DOC_MANAGER_DESC', 'de', 'en', 'text', 'Manage and synchronize all documentation files between storage and project folder.', 'Verwalten und synchronisieren Sie alle Dokumentationsdateien zwischen Speicher und Projektordner.', 'manual'),
('BTN_REFRESHING', 'de', 'en', 'text', 'Refreshing...', 'Aktualisieren...', 'manual'),
('BTN_REFRESH_STATUS', 'de', 'en', 'text', 'Refresh Status', 'Status aktualisieren', 'manual'),
('DATABASE_DOCUMENTATION', 'de', 'en', 'text', 'Database Documentation', 'Datenbank-Dokumentation', 'manual'),
('CODEBASE_DOCUMENTATION', 'de', 'en', 'text', 'Codebase Documentation', 'Codebase-Dokumentation', 'manual'),
('LATEST', 'de', 'en', 'text', 'Latest', 'Neueste', 'manual'),
('GENERATED', 'de', 'en', 'text', 'Generated', 'Generiert', 'manual'),
('SIZE', 'de', 'en', 'text', 'Size', 'Größe', 'manual'),
('NONE', 'de', 'en', 'text', 'None', 'Keine', 'manual'),
('TOAST_SYNCING_DOCS', 'de', 'en', 'text', 'Syncing Documentation', 'Dokumentation synchronisieren', 'manual'),
('TOAST_SYNCING_DOCS_DESC', 'de', 'en', 'text', 'Updating project /docs folder with latest documentation...', 'Projekt /docs Ordner wird mit neuester Dokumentation aktualisiert...', 'manual'),

-- ForgotPasswordForm.tsx translations
('RESET_PASSWORD', 'de', 'en', 'text', 'Reset Password', 'Passwort zurücksetzen', 'manual'),
('RESET_PASSWORD_DESC', 'de', 'en', 'text', 'Enter your email to receive reset instructions', 'Geben Sie Ihre E-Mail ein, um Anweisungen zum Zurücksetzen zu erhalten', 'manual'),
('CHECK_EMAIL', 'de', 'en', 'text', 'Check your email!', 'Überprüfen Sie Ihre E-Mail!', 'manual'),
('RESET_SENT_TO', 'de', 'en', 'text', 'We have sent password reset instructions to', 'Wir haben Anweisungen zum Zurücksetzen des Passworts gesendet an', 'manual'),
('EMAIL_ADDRESS', 'de', 'en', 'text', 'Email Address', 'E-Mail-Adresse', 'manual'),
('ENTER_EMAIL_PLACEHOLDER', 'de', 'en', 'text', 'Enter your email address', 'Geben Sie Ihre E-Mail-Adresse ein', 'manual'),
('BTN_SENDING', 'de', 'en', 'text', 'Sending...', 'Senden...', 'manual'),
('BTN_SEND_RESET_LINK', 'de', 'en', 'text', 'Send Reset Link', 'Reset-Link senden', 'manual'),
('REMEMBER_PASSWORD', 'de', 'en', 'text', 'Remember your password?', 'Erinnern Sie sich an Ihr Passwort?', 'manual'),
('SIGN_IN_INSTEAD', 'de', 'en', 'text', 'Sign in instead', 'Stattdessen anmelden', 'manual'),

-- ResetPasswordForm.tsx translations
('SET_NEW_PASSWORD', 'de', 'en', 'text', 'Set New Password', 'Neues Passwort festlegen', 'manual'),
('ENTER_STRONG_PASSWORD', 'de', 'en', 'text', 'Enter a strong password for your account', 'Geben Sie ein starkes Passwort für Ihr Konto ein', 'manual'),
('NEW_PASSWORD', 'de', 'en', 'text', 'New Password', 'Neues Passwort', 'manual'),
('ENTER_NEW_PASSWORD_PLACEHOLDER', 'de', 'en', 'text', 'Enter your new password', 'Geben Sie Ihr neues Passwort ein', 'manual'),
('CONFIRM_PASSWORD', 'de', 'en', 'text', 'Confirm Password', 'Passwort bestätigen', 'manual'),
('CONFIRM_NEW_PASSWORD_PLACEHOLDER', 'de', 'en', 'text', 'Confirm your new password', 'Bestätigen Sie Ihr neues Passwort', 'manual'),
('PASSWORDS_DO_NOT_MATCH', 'de', 'en', 'text', 'Passwords do not match', 'Passwörter stimmen nicht überein', 'manual'),
('BTN_UPDATING_PASSWORD', 'de', 'en', 'text', 'Updating Password...', 'Passwort wird aktualisiert...', 'manual'),
('BTN_UPDATE_PASSWORD', 'de', 'en', 'text', 'Update Password', 'Passwort aktualisieren', 'manual'),

-- SecurityAuditDashboard.tsx translations  
('SECURITY_AUDIT_DASHBOARD', 'de', 'en', 'text', 'Security Audit Dashboard', 'Sicherheits-Audit Dashboard', 'manual'),
('MONITOR_AUTH_EVENTS', 'de', 'en', 'text', 'Monitor authentication and security events', 'Authentifizierungs- und Sicherheitsereignisse überwachen', 'manual'),
('BTN_REFRESH', 'de', 'en', 'text', 'Refresh', 'Aktualisieren', 'manual'),
('TOTAL_EVENTS', 'de', 'en', 'text', 'Total Events', 'Gesamte Ereignisse', 'manual'),
('FAILED_LOGINS', 'de', 'en', 'text', 'Failed Logins', 'Fehlgeschlagene Anmeldungen', 'manual'),
('SUSPICIOUS_ACTIVITY', 'de', 'en', 'text', 'Suspicious Activity', 'Verdächtige Aktivität', 'manual'),
('RATE_LIMIT_HITS', 'de', 'en', 'text', 'Rate Limit Hits', 'Rate-Limit-Treffer', 'manual'),
('FILTERS', 'de', 'en', 'text', 'Filters', 'Filter', 'manual'),
('SEARCH', 'de', 'en', 'text', 'Search', 'Suchen', 'manual'),
('SEARCH_ACTIONS_EMAILS', 'de', 'en', 'text', 'Search actions or emails...', 'Aktionen oder E-Mails suchen...', 'manual'),
('ACTION_TYPE', 'de', 'en', 'text', 'Action Type', 'Aktionstyp', 'manual'),
('ALL_ACTIONS', 'de', 'en', 'text', 'All Actions', 'Alle Aktionen', 'manual'),
('SUCCESSFUL_LOGINS', 'de', 'en', 'text', 'Successful Logins', 'Erfolgreiche Anmeldungen', 'manual'),
('ACCOUNT_CREATION', 'de', 'en', 'text', 'Account Creation', 'Kontoerstellung', 'manual'),
('LOGOUT', 'de', 'en', 'text', 'Logout', 'Abmelden', 'manual'),
('START_DATE', 'de', 'en', 'text', 'Start Date', 'Startdatum', 'manual'),
('END_DATE', 'de', 'en', 'text', 'End Date', 'Enddatum', 'manual'),
('BTN_APPLY_FILTERS', 'de', 'en', 'text', 'Apply Filters', 'Filter anwenden', 'manual'),
('SECURITY_EVENTS', 'de', 'en', 'text', 'Security Events', 'Sicherheitsereignisse', 'manual'),
('RECENT_SECURITY_EVENTS', 'de', 'en', 'text', 'Recent security events and authentication logs', 'Aktuelle Sicherheitsereignisse und Authentifizierungsprotokolle', 'manual'),
('LOADING_SECURITY_LOGS', 'de', 'en', 'text', 'Loading security logs...', 'Sicherheitsprotokolle werden geladen...', 'manual'),
('TIMESTAMP', 'de', 'en', 'text', 'Timestamp', 'Zeitstempel', 'manual'),
('ACTION', 'de', 'en', 'text', 'Action', 'Aktion', 'manual'),
('DETAILS', 'de', 'en', 'text', 'Details', 'Details', 'manual'),
('IP_ADDRESS', 'de', 'en', 'text', 'IP Address', 'IP-Adresse', 'manual'),
('USER_AGENT', 'de', 'en', 'text', 'User Agent', 'User Agent', 'manual'),
('NO_SECURITY_LOGS_FOUND', 'de', 'en', 'text', 'No security logs found matching your criteria', 'Keine Sicherheitsprotokolle gefunden, die Ihren Kriterien entsprechen', 'manual'),
('NOT_AVAILABLE_SHORT', 'de', 'en', 'text', 'N/A', 'N/V', 'manual');
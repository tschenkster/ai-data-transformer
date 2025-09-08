-- Add comprehensive translation keys for Homepage, About, Hero, and other components
INSERT INTO ui_translations (ui_key, language_code_original, language_code_target, source_field_name, original_text, translated_text, source, created_by, updated_by) VALUES

-- Homepage Hero Section
('HERO_TITLE', 'de', 'de', 'text', 'Decision-Ready Finance Data for Startup CFOs', 'Decision-Ready Finance Data for Startup CFOs', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HERO_TITLE', 'de', 'en', 'text', 'Decision-Ready Finance Data for Startup CFOs', 'Decision-Ready Finance Data for Startup CFOs', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HERO_SUBTITLE_1', 'de', 'de', 'text', 'You need board-ready insights quickly.', 'Sie brauchen board-ready Insights schnell.', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HERO_SUBTITLE_1', 'de', 'en', 'text', 'Sie brauchen board-ready Insights schnell.', 'You need board-ready insights quickly.', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HERO_SUBTITLE_2', 'de', 'de', 'text', '...but your dealing with (DATEV) reality.', '...aber Sie müssen mit der (DATEV) Realität umgehen.', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HERO_SUBTITLE_2', 'de', 'en', 'text', '...aber Sie müssen mit der (DATEV) Realität umgehen.', '...but your dealing with (DATEV) reality.', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),

-- Hero Upload Section
('HERO_UPLOAD_TITLE', 'de', 'de', 'text', 'Convert useless DATEV reports', 'Nutzlose DATEV-Berichte umwandeln', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HERO_UPLOAD_TITLE', 'de', 'en', 'text', 'Nutzlose DATEV-Berichte umwandeln', 'Convert useless DATEV reports', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HERO_UPLOAD_SUBTITLE', 'de', 'de', 'text', '...into clean data & proper reports.', '...in saubere Daten & ordentliche Berichte.', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HERO_UPLOAD_SUBTITLE', 'de', 'en', 'text', '...in saubere Daten & ordentliche Berichte.', '...into clean data & proper reports.', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_UPLOAD_FILE', 'de', 'de', 'text', 'Upload your DATEV file', 'DATEV-Datei hochladen', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_UPLOAD_FILE', 'de', 'en', 'text', 'DATEV-Datei hochladen', 'Upload your DATEV file', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MSG_DROP_FILE', 'de', 'de', 'text', 'Drop your file here to simulate upload', 'Datei hier ablegen für Upload-Simulation', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MSG_DROP_FILE', 'de', 'en', 'text', 'Datei hier ablegen für Upload-Simulation', 'Drop your file here to simulate upload', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MSG_COMING_SOON', 'de', 'de', 'text', 'Coming soon: upload will be available once the app is live.', 'Bald verfügbar: Upload wird verfügbar sein, sobald die App live ist.', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('MSG_COMING_SOON', 'de', 'en', 'text', 'Bald verfügbar: Upload wird verfügbar sein, sobald die App live ist.', 'Coming soon: upload will be available once the app is live.', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),

-- Section Headers
('SECTION_CURRENT_REALITY', 'de', 'de', 'text', 'Current Reality', 'Aktuelle Realität', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('SECTION_CURRENT_REALITY', 'de', 'en', 'text', 'Aktuelle Realität', 'Current Reality', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('SECTION_SOLUTION', 'de', 'de', 'text', 'The Solution', 'Die Lösung', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('SECTION_SOLUTION', 'de', 'en', 'text', 'Die Lösung', 'The Solution', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HEADING_CFO_CHALLENGE', 'de', 'de', 'text', 'The Startup CFO''s Challenge', 'Die Herausforderung des Startup-CFOs', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HEADING_CFO_CHALLENGE', 'de', 'en', 'text', 'Die Herausforderung des Startup-CFOs', 'The Startup CFO''s Challenge', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HEADING_AI_WORKFLOW', 'de', 'de', 'text', 'An AI-Powered Finance Workflow', 'Ein KI-gestützter Finanzworkflow', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HEADING_AI_WORKFLOW', 'de', 'en', 'text', 'Ein KI-gestützter Finanzworkflow', 'An AI-Powered Finance Workflow', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),

-- About Page Content
('ABOUT_TITLE', 'de', 'de', 'text', 'Hi, I''m Thomas — the Startup CFO who is building the DATEV Converter app.', 'Hi, ich bin Thomas — der Startup CFO, der die DATEV Converter App entwickelt.', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('ABOUT_TITLE', 'de', 'en', 'text', 'Hi, ich bin Thomas — der Startup CFO, der die DATEV Converter App entwickelt.', 'Hi, I''m Thomas — the Startup CFO who is building the DATEV Converter app.', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_CONNECT_LINKEDIN', 'de', 'de', 'text', 'Connect on LinkedIn', 'Auf LinkedIn vernetzen', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BTN_CONNECT_LINKEDIN', 'de', 'en', 'text', 'Auf LinkedIn vernetzen', 'Connect on LinkedIn', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HEADING_ABOUT_APP', 'de', 'de', 'text', 'About DATEV Converter App', 'Über die DATEV Converter App', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HEADING_ABOUT_APP', 'de', 'en', 'text', 'Über die DATEV Converter App', 'About DATEV Converter App', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HEADING_WHY_EXISTS', 'de', 'de', 'text', 'Why this app exists', 'Warum diese App existiert', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HEADING_WHY_EXISTS', 'de', 'en', 'text', 'Warum diese App existiert', 'Why this app exists', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HEADING_WHAT_BUILDING', 'de', 'de', 'text', 'What I''m building', 'Was ich entwickle', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HEADING_WHAT_BUILDING', 'de', 'en', 'text', 'Was ich entwickle', 'What I''m building', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HEADING_CFO_WORK', 'de', 'de', 'text', 'About my Fractional CFO Work', 'Über meine Fractional CFO Arbeit', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HEADING_CFO_WORK', 'de', 'en', 'text', 'Über meine Fractional CFO Arbeit', 'About my Fractional CFO Work', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HEADING_CV_SUMMARY', 'de', 'de', 'text', 'CV Summary — Thomas Schenkelberg', 'Lebenslauf Zusammenfassung — Thomas Schenkelberg', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HEADING_CV_SUMMARY', 'de', 'en', 'text', 'Lebenslauf Zusammenfassung — Thomas Schenkelberg', 'CV Summary — Thomas Schenkelberg', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HEADING_COMPANIES', 'de', 'de', 'text', 'Companies I used to work for', 'Unternehmen, für die ich gearbeitet habe', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HEADING_COMPANIES', 'de', 'en', 'text', 'Unternehmen, für die ich gearbeitet habe', 'Companies I used to work for', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HEADING_PROJECTS', 'de', 'de', 'text', 'Completed Projects & Achievements', 'Abgeschlossene Projekte & Erfolge', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('HEADING_PROJECTS', 'de', 'en', 'text', 'Abgeschlossene Projekte & Erfolge', 'Completed Projects & Achievements', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),

-- Footer
('FOOTER_CREATED_BY', 'de', 'de', 'text', 'created with ❤️ by', 'erstellt mit ❤️ von', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('FOOTER_CREATED_BY', 'de', 'en', 'text', 'erstellt mit ❤️ von', 'created with ❤️ by', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),

-- Common UI Elements
('BADGE_CURRENT_REALITY', 'de', 'de', 'text', 'Current Reality', 'Aktuelle Realität', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BADGE_CURRENT_REALITY', 'de', 'en', 'text', 'Aktuelle Realität', 'Current Reality', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BADGE_SOLUTION', 'de', 'de', 'text', 'The Solution', 'Die Lösung', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('BADGE_SOLUTION', 'de', 'en', 'text', 'Die Lösung', 'The Solution', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),

-- Error Messages
('ERROR_TRANSLATION_LOAD', 'de', 'de', 'text', 'Failed to load interface translations', 'Fehler beim Laden der Benutzeroberflächen-Übersetzungen', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('ERROR_TRANSLATION_LOAD', 'de', 'en', 'text', 'Fehler beim Laden der Benutzeroberflächen-Übersetzungen', 'Failed to load interface translations', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('ERROR_TITLE', 'de', 'de', 'text', 'Translation Error', 'Übersetzungsfehler', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('ERROR_TITLE', 'de', 'en', 'text', 'Übersetzungsfehler', 'Translation Error', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('ERROR_LANGUAGE_CHANGE', 'de', 'de', 'text', 'Failed to change language preference', 'Fehler beim Ändern der Spracheinstellung', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('ERROR_LANGUAGE_CHANGE', 'de', 'en', 'text', 'Fehler beim Ändern der Spracheinstellung', 'Failed to change language preference', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('ERROR_GENERIC', 'de', 'de', 'text', 'Error', 'Fehler', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('ERROR_GENERIC', 'de', 'en', 'text', 'Fehler', 'Error', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),

-- Accessibility Labels
('ARIA_UPLOAD_LABEL', 'de', 'de', 'text', 'Upload your DATEV file - simulation mode', 'DATEV-Datei hochladen - Simulationsmodus', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('ARIA_UPLOAD_LABEL', 'de', 'en', 'text', 'DATEV-Datei hochladen - Simulationsmodus', 'Upload your DATEV file - simulation mode', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)))

ON CONFLICT (ui_key, language_code_target, source_field_name) 
DO UPDATE SET 
    translated_text = EXCLUDED.translated_text,
    updated_at = now(),
    updated_by = EXCLUDED.updated_by;
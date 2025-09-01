-- Add missing UI translation keys for sidebar navigation
INSERT INTO public.ui_translations (ui_key, language_code_target, translated_text, original_text, source_field_name, source) VALUES
-- Missing dashboard translation
('MENU_DASHBOARD', 'de', 'Dashboard', 'Dashboard', 'text', 'manual'),
('MENU_DASHBOARD', 'en', 'Dashboard', 'Dashboard', 'text', 'manual')
ON CONFLICT (ui_key, language_code_target) DO NOTHING;
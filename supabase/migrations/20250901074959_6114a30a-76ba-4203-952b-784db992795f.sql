-- Phase 1: Database Schema Corrections for Multilingual Support

-- First, add missing columns to existing translation tables
ALTER TABLE public.report_structures_translations 
ADD COLUMN IF NOT EXISTS language_code_original CHAR(2) REFERENCES public.system_languages(language_code),
ADD COLUMN IF NOT EXISTS original_text TEXT;

ALTER TABLE public.report_line_items_translations
ADD COLUMN IF NOT EXISTS language_code_original CHAR(2) REFERENCES public.system_languages(language_code),
ADD COLUMN IF NOT EXISTS original_text TEXT;

-- Create UI translations table
CREATE TABLE IF NOT EXISTS public.ui_translations (
  ui_translation_uuid UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ui_translation_id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY,
  ui_key TEXT NOT NULL,
  language_code_original CHAR(2) REFERENCES public.system_languages(language_code),
  language_code_target CHAR(2) NOT NULL REFERENCES public.system_languages(language_code),
  source_field_name TEXT NOT NULL DEFAULT 'text',
  original_text TEXT,
  translated_text TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai', 'import')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT unique_ui_translation UNIQUE (ui_key, language_code_target, source_field_name)
);

-- Enable RLS on ui_translations
ALTER TABLE public.ui_translations ENABLE ROW LEVEL SECURITY;

-- Add user language preference to user_accounts
ALTER TABLE public.user_accounts 
ADD COLUMN IF NOT EXISTS preferred_ui_language CHAR(2) DEFAULT 'de' REFERENCES public.system_languages(language_code);

-- Create RLS policies for ui_translations
CREATE POLICY "Anyone can view UI translations" 
  ON public.ui_translations 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage UI translations" 
  ON public.ui_translations 
  FOR ALL 
  USING (is_admin_user());

-- Create proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_structures_translations_lookup 
  ON public.report_structures_translations (report_structure_uuid, language_code_target);

CREATE INDEX IF NOT EXISTS idx_report_line_items_translations_lookup 
  ON public.report_line_items_translations (report_line_item_uuid, language_code_target);

CREATE INDEX IF NOT EXISTS idx_ui_translations_lookup 
  ON public.ui_translations (ui_key, language_code_target);

-- Create translation retrieval function with proper fallback
CREATE OR REPLACE FUNCTION public.get_translation_with_fallback(
  p_entity_type TEXT,
  p_entity_uuid UUID,
  p_field_key TEXT,
  p_language_code TEXT DEFAULT 'de'
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_translated_text TEXT;
  v_default_language TEXT := 'de';
  v_source_language TEXT;
BEGIN
  -- Handle 'orig' language code - resolve to source language
  IF p_language_code = 'orig' THEN
    IF p_entity_type = 'report_structure' THEN
      SELECT rs.source_language_code INTO v_source_language
      FROM report_structures rs
      WHERE rs.report_structure_uuid = p_entity_uuid;
    ELSIF p_entity_type = 'report_line_item' THEN
      SELECT rli.source_language_code INTO v_source_language
      FROM report_line_items rli
      WHERE rli.report_line_item_uuid = p_entity_uuid;
    END IF;
    
    p_language_code := COALESCE(v_source_language, v_default_language);
  END IF;

  -- Try to get translation in requested language
  IF p_entity_type = 'report_structure' THEN
    SELECT rst.translated_text INTO v_translated_text
    FROM report_structures_translations rst
    WHERE rst.report_structure_uuid = p_entity_uuid
      AND rst.language_code_target = p_language_code
      AND rst.field_key = p_field_key;
  ELSIF p_entity_type = 'report_line_item' THEN
    SELECT rlit.translated_text INTO v_translated_text
    FROM report_line_items_translations rlit
    WHERE rlit.report_line_item_uuid = p_entity_uuid
      AND rlit.language_code_target = p_language_code
      AND rlit.field_key = p_field_key;
  ELSIF p_entity_type = 'ui' THEN
    SELECT uit.translated_text INTO v_translated_text
    FROM ui_translations uit
    WHERE uit.ui_key = p_entity_uuid::TEXT
      AND uit.language_code_target = p_language_code
      AND uit.source_field_name = p_field_key;
  END IF;

  -- Fallback to default language if not found and not already default
  IF v_translated_text IS NULL AND p_language_code != v_default_language THEN
    IF p_entity_type = 'report_structure' THEN
      SELECT rst.translated_text INTO v_translated_text
      FROM report_structures_translations rst
      WHERE rst.report_structure_uuid = p_entity_uuid
        AND rst.language_code_target = v_default_language
        AND rst.field_key = p_field_key;
    ELSIF p_entity_type = 'report_line_item' THEN
      SELECT rlit.translated_text INTO v_translated_text
      FROM report_line_items_translations rlit
      WHERE rlit.report_line_item_uuid = p_entity_uuid
        AND rlit.language_code_target = v_default_language
        AND rlit.field_key = p_field_key;
    ELSIF p_entity_type = 'ui' THEN
      SELECT uit.translated_text INTO v_translated_text
      FROM ui_translations uit
      WHERE uit.ui_key = p_entity_uuid::TEXT
        AND uit.language_code_target = v_default_language
        AND uit.source_field_name = p_field_key;
    END IF;
  END IF;

  -- Return translation or placeholder
  RETURN COALESCE(v_translated_text, '[missing:' || p_field_key || ']');
END;
$$;

-- Create function to ensure translation completeness
CREATE OR REPLACE FUNCTION public.ensure_translation_completeness(
  p_entity_type TEXT,
  p_entity_uuid UUID,
  p_source_texts JSONB,
  p_source_language TEXT DEFAULT 'de'
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  field_key TEXT;
  field_value TEXT;
  target_lang RECORD;
BEGIN
  -- For each field in source_texts
  FOR field_key, field_value IN SELECT * FROM jsonb_each_text(p_source_texts) LOOP
    -- For each enabled language
    FOR target_lang IN SELECT language_code FROM system_languages WHERE is_enabled = true LOOP
      -- Check if translation exists
      IF p_entity_type = 'report_structure' THEN
        INSERT INTO report_structures_translations (
          report_structure_uuid,
          language_code_original,
          language_code_target,
          field_key,
          original_text,
          translated_text,
          source,
          created_by,
          updated_by
        ) VALUES (
          p_entity_uuid,
          p_source_language,
          target_lang.language_code,
          field_key,
          field_value,
          CASE WHEN target_lang.language_code = p_source_language THEN field_value ELSE NULL END,
          CASE WHEN target_lang.language_code = p_source_language THEN 'import' ELSE 'ai' END,
          auth.uid(),
          auth.uid()
        ) ON CONFLICT (report_structure_uuid, language_code_target, field_key) DO NOTHING;
      ELSIF p_entity_type = 'report_line_item' THEN
        INSERT INTO report_line_items_translations (
          report_line_item_uuid,
          language_code_original,
          language_code_target,
          field_key,
          original_text,
          translated_text,
          source,
          created_by,
          updated_by
        ) VALUES (
          p_entity_uuid,
          p_source_language,
          target_lang.language_code,
          field_key,
          field_value,
          CASE WHEN target_lang.language_code = p_source_language THEN field_value ELSE NULL END,
          CASE WHEN target_lang.language_code = p_source_language THEN 'import' ELSE 'ai' END,
          auth.uid(),
          auth.uid()
        ) ON CONFLICT (report_line_item_uuid, language_code_target, field_key) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Update triggers for updated_at
CREATE TRIGGER update_ui_translations_updated_at
  BEFORE UPDATE ON public.ui_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_translations_updated_at();

-- Populate initial UI translations for key interface elements
INSERT INTO public.ui_translations (ui_key, language_code_target, source_field_name, translated_text, source) VALUES
-- Navigation
('NAV_HOME', 'de', 'text', 'Startseite', 'manual'),
('NAV_HOME', 'en', 'text', 'Home', 'manual'),
('NAV_DASHBOARD', 'de', 'text', 'Dashboard', 'manual'),
('NAV_DASHBOARD', 'en', 'text', 'Dashboard', 'manual'),
('NAV_REPORTS', 'de', 'text', 'Berichte', 'manual'),
('NAV_REPORTS', 'en', 'text', 'Reports', 'manual'),
('NAV_STRUCTURES', 'de', 'text', 'Strukturen', 'manual'),
('NAV_STRUCTURES', 'en', 'text', 'Structures', 'manual'),
('NAV_ADMIN', 'de', 'text', 'Administration', 'manual'),
('NAV_ADMIN', 'en', 'text', 'Administration', 'manual'),

-- Buttons
('BTN_SAVE', 'de', 'text', 'Speichern', 'manual'),
('BTN_SAVE', 'en', 'text', 'Save', 'manual'),
('BTN_CANCEL', 'de', 'text', 'Abbrechen', 'manual'),
('BTN_CANCEL', 'en', 'text', 'Cancel', 'manual'),
('BTN_DELETE', 'de', 'text', 'Löschen', 'manual'),
('BTN_DELETE', 'en', 'text', 'Delete', 'manual'),
('BTN_EDIT', 'de', 'text', 'Bearbeiten', 'manual'),
('BTN_EDIT', 'en', 'text', 'Edit', 'manual'),
('BTN_CREATE', 'de', 'text', 'Erstellen', 'manual'),
('BTN_CREATE', 'en', 'text', 'Create', 'manual'),

-- Common labels
('LABEL_LANGUAGE', 'de', 'text', 'Sprache', 'manual'),
('LABEL_LANGUAGE', 'en', 'text', 'Language', 'manual'),
('LABEL_STATUS', 'de', 'text', 'Status', 'manual'),
('LABEL_STATUS', 'en', 'text', 'Status', 'manual'),
('LABEL_CREATED', 'de', 'text', 'Erstellt', 'manual'),
('LABEL_CREATED', 'en', 'text', 'Created', 'manual'),
('LABEL_UPDATED', 'de', 'text', 'Aktualisiert', 'manual'),
('LABEL_UPDATED', 'en', 'text', 'Updated', 'manual')

ON CONFLICT (ui_key, language_code_target, source_field_name) DO NOTHING;
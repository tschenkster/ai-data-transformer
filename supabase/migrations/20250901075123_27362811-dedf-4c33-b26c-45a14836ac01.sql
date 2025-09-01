-- Phase 1: Database Schema Corrections for Multilingual Support (Corrected)

-- First, rename existing language_code columns to language_code_target for clarity
ALTER TABLE public.report_structures_translations 
RENAME COLUMN language_code TO language_code_target;

ALTER TABLE public.report_line_items_translations
RENAME COLUMN language_code TO language_code_target;

-- Add missing columns to existing translation tables
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

-- Update the unique constraints to match new column names
ALTER TABLE public.report_structures_translations 
DROP CONSTRAINT IF EXISTS report_structures_translations_report_structure_uuid_langua_key;

ALTER TABLE public.report_structures_translations 
ADD CONSTRAINT unique_structure_translation 
UNIQUE (report_structure_uuid, language_code_target, field_key);

ALTER TABLE public.report_line_items_translations 
DROP CONSTRAINT IF EXISTS report_line_items_translations_report_line_item_uuid_langua_key;

ALTER TABLE public.report_line_items_translations 
ADD CONSTRAINT unique_line_item_translation 
UNIQUE (report_line_item_uuid, language_code_target, field_key);

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

-- Update triggers for updated_at
CREATE TRIGGER update_ui_translations_updated_at
  BEFORE UPDATE ON public.ui_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_translations_updated_at();
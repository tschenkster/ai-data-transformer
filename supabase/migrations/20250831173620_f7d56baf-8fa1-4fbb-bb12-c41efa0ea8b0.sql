-- Multilingual Support System
-- Create system languages, translation tables, and supporting functions

-- 1. System Languages Table
CREATE TABLE IF NOT EXISTS public.system_languages (
  language_code CHAR(2) PRIMARY KEY CHECK (language_code ~ '^[a-z]{2}$'),
  language_name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ensure only one default language
CREATE UNIQUE INDEX idx_system_languages_default 
ON public.system_languages (is_default) 
WHERE is_default = true;

-- 2. Report Structures Translations Table
CREATE TABLE IF NOT EXISTS public.report_structures_translations (
  report_structure_translation_uuid UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_structure_translation_id INTEGER GENERATED ALWAYS AS IDENTITY UNIQUE,
  report_structure_uuid UUID NOT NULL,
  language_code CHAR(2) NOT NULL,
  field_key TEXT NOT NULL CHECK (field_key IN (
    'report_structure_name', 
    'description'
  )),
  translated_text TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai', 'import')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  
  -- Foreign keys
  CONSTRAINT fk_report_structures_translations_structure 
    FOREIGN KEY (report_structure_uuid) 
    REFERENCES public.report_structures(report_structure_uuid) 
    ON DELETE CASCADE,
  CONSTRAINT fk_report_structures_translations_language 
    FOREIGN KEY (language_code) 
    REFERENCES public.system_languages(language_code) 
    ON DELETE RESTRICT,
  CONSTRAINT fk_report_structures_translations_created_by 
    FOREIGN KEY (created_by) 
    REFERENCES auth.users(id) 
    ON DELETE SET NULL,
  CONSTRAINT fk_report_structures_translations_updated_by 
    FOREIGN KEY (updated_by) 
    REFERENCES auth.users(id) 
    ON DELETE SET NULL
);

-- Unique constraint for translations
ALTER TABLE public.report_structures_translations 
ADD CONSTRAINT uq_report_structures_translations_unique 
UNIQUE (report_structure_uuid, language_code, field_key);

-- Performance indexes
CREATE INDEX idx_report_structures_translations_lookup 
ON public.report_structures_translations (report_structure_uuid, language_code);

CREATE INDEX idx_report_structures_translations_field 
ON public.report_structures_translations (field_key);

-- 3. Report Line Items Translations Table
CREATE TABLE IF NOT EXISTS public.report_line_items_translations (
  report_line_item_translation_uuid UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_line_item_translation_id INTEGER GENERATED ALWAYS AS IDENTITY UNIQUE,
  report_line_item_uuid UUID NOT NULL,
  language_code CHAR(2) NOT NULL,
  field_key TEXT NOT NULL CHECK (field_key IN (
    'report_line_item_description',
    'level_1_line_item_description',
    'level_2_line_item_description', 
    'level_3_line_item_description',
    'level_4_line_item_description',
    'level_5_line_item_description',
    'level_6_line_item_description',
    'level_7_line_item_description',
    'description_of_leaf',
    'display_hierarchy_path'
  )),
  translated_text TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai', 'import')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  
  -- Foreign keys
  CONSTRAINT fk_report_line_items_translations_item 
    FOREIGN KEY (report_line_item_uuid) 
    REFERENCES public.report_line_items(report_line_item_uuid) 
    ON DELETE CASCADE,
  CONSTRAINT fk_report_line_items_translations_language 
    FOREIGN KEY (language_code) 
    REFERENCES public.system_languages(language_code) 
    ON DELETE RESTRICT,
  CONSTRAINT fk_report_line_items_translations_created_by 
    FOREIGN KEY (created_by) 
    REFERENCES auth.users(id) 
    ON DELETE SET NULL,
  CONSTRAINT fk_report_line_items_translations_updated_by 
    FOREIGN KEY (updated_by) 
    REFERENCES auth.users(id) 
    ON DELETE SET NULL
);

-- Unique constraint for translations
ALTER TABLE public.report_line_items_translations 
ADD CONSTRAINT uq_report_line_items_translations_unique 
UNIQUE (report_line_item_uuid, language_code, field_key);

-- Performance indexes
CREATE INDEX idx_report_line_items_translations_lookup 
ON public.report_line_items_translations (report_line_item_uuid, language_code);

CREATE INDEX idx_report_line_items_translations_field 
ON public.report_line_items_translations (field_key);

-- 4. Add source language tracking to main tables
ALTER TABLE public.report_structures 
ADD COLUMN IF NOT EXISTS source_language_code CHAR(2) 
REFERENCES public.system_languages(language_code);

ALTER TABLE public.report_line_items 
ADD COLUMN IF NOT EXISTS source_language_code CHAR(2) 
REFERENCES public.system_languages(language_code);

-- 5. Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_report_structures_translations_updated_at
  BEFORE UPDATE ON public.report_structures_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_translations_updated_at();

CREATE TRIGGER trigger_report_line_items_translations_updated_at
  BEFORE UPDATE ON public.report_line_items_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_translations_updated_at();

-- 6. Seed system languages
INSERT INTO public.system_languages (language_code, language_name, is_default, is_enabled) 
VALUES 
  ('de', 'German', true, true),
  ('en', 'English', false, true)
ON CONFLICT (language_code) DO NOTHING;

-- 7. RLS Policies
ALTER TABLE public.system_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_structures_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_line_items_translations ENABLE ROW LEVEL SECURITY;

-- System languages policies
CREATE POLICY "Anyone can view enabled languages" ON public.system_languages
  FOR SELECT USING (is_enabled = true);

CREATE POLICY "Admins can manage languages" ON public.system_languages
  FOR ALL USING (is_admin_user());

-- Report structures translations policies
CREATE POLICY "Users can view translations for accessible structures" 
ON public.report_structures_translations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.report_structures rs 
    WHERE rs.report_structure_uuid = report_structures_translations.report_structure_uuid
  )
);

CREATE POLICY "Admins can manage structure translations" 
ON public.report_structures_translations FOR ALL 
USING (is_admin_user());

-- Report line items translations policies  
CREATE POLICY "Users can view translations for accessible line items" 
ON public.report_line_items_translations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.report_line_items rli 
    WHERE rli.report_line_item_uuid = report_line_items_translations.report_line_item_uuid
  )
);

CREATE POLICY "Admins can manage line item translations" 
ON public.report_line_items_translations FOR ALL 
USING (is_admin_user());
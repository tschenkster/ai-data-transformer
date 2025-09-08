-- Phase 1: Data Assessment & Cleanup
-- First, let's assess and fix the existing NULL values

-- Step 1: Backup current translation data (create a view for reference)
CREATE OR REPLACE VIEW translation_backup_before_fix AS 
SELECT 
  'report_structures' as table_name,
  rst.report_structure_translation_id::text as id,
  rst.report_structure_uuid::text as entity_uuid,
  rst.source_field_name,
  rst.language_code_original,
  rst.original_text,
  rst.language_code_target,
  rst.translated_text,
  rst.source
FROM report_structures_translations rst
UNION ALL
SELECT 
  'report_line_items' as table_name,
  rlt.report_line_item_translation_id::text as id,
  rlt.report_line_item_uuid::text as entity_uuid,
  rlt.source_field_name,
  rlt.language_code_original,
  rlt.original_text,
  rlt.language_code_target,
  rlt.translated_text,
  rlt.source
FROM report_line_items_translations rlt;

-- Step 2: Fix NULL values in report_structures_translations
-- Update language_code_original to match the source language from the parent structure
UPDATE report_structures_translations rst
SET 
  language_code_original = COALESCE(
    rst.language_code_original,
    (SELECT rs.source_language_code 
     FROM report_structures rs 
     WHERE rs.report_structure_uuid = rst.report_structure_uuid),
    'de'  -- fallback to German if no source language set
  ),
  original_text = COALESCE(
    rst.original_text,
    CASE 
      WHEN rst.source_field_name = 'report_structure_name' THEN
        (SELECT rs.report_structure_name 
         FROM report_structures rs 
         WHERE rs.report_structure_uuid = rst.report_structure_uuid)
      -- Add other field mappings as needed
      ELSE rst.original_text
    END
  )
WHERE rst.language_code_original IS NULL OR rst.original_text IS NULL;

-- Step 3: Fix NULL values in report_line_items_translations 
UPDATE report_line_items_translations rlt
SET 
  language_code_original = COALESCE(
    rlt.language_code_original,
    (SELECT rli.source_language_code 
     FROM report_line_items rli 
     WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid),
    (SELECT rs.source_language_code 
     FROM report_line_items rli
     JOIN report_structures rs ON rs.report_structure_uuid = rli.report_structure_uuid
     WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid),
    'de'  -- fallback to German
  ),
  original_text = COALESCE(
    rlt.original_text,
    CASE 
      WHEN rlt.source_field_name = 'report_line_item_description' THEN
        (SELECT rli.report_line_item_description 
         FROM report_line_items rli 
         WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid)
      WHEN rlt.source_field_name = 'level_1_line_item_description' THEN
        (SELECT rli.level_1_line_item_description 
         FROM report_line_items rli 
         WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid)
      WHEN rlt.source_field_name = 'level_2_line_item_description' THEN
        (SELECT rli.level_2_line_item_description 
         FROM report_line_items rli 
         WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid)
      WHEN rlt.source_field_name = 'level_3_line_item_description' THEN
        (SELECT rli.level_3_line_item_description 
         FROM report_line_items rli 
         WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid)
      WHEN rlt.source_field_name = 'level_4_line_item_description' THEN
        (SELECT rli.level_4_line_item_description 
         FROM report_line_items rli 
         WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid)
      WHEN rlt.source_field_name = 'level_5_line_item_description' THEN
        (SELECT rli.level_5_line_item_description 
         FROM report_line_items rli 
         WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid)
      WHEN rlt.source_field_name = 'level_6_line_item_description' THEN
        (SELECT rli.level_6_line_item_description 
         FROM report_line_items rli 
         WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid)
      WHEN rlt.source_field_name = 'level_7_line_item_description' THEN
        (SELECT rli.level_7_line_item_description 
         FROM report_line_items rli 
         WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid)
      WHEN rlt.source_field_name = 'description_of_leaf' THEN
        (SELECT rli.description_of_leaf 
         FROM report_line_items rli 
         WHERE rli.report_line_item_uuid = rlt.report_line_item_uuid)
      ELSE rlt.original_text
    END
  )
WHERE rlt.language_code_original IS NULL OR rlt.original_text IS NULL;

-- Step 4: Add constraints to prevent future NULL values
-- First add NOT NULL constraints after data is cleaned up
ALTER TABLE report_structures_translations
  ALTER COLUMN language_code_original SET NOT NULL,
  ALTER COLUMN original_text SET NOT NULL;

ALTER TABLE report_line_items_translations
  ALTER COLUMN language_code_original SET NOT NULL,
  ALTER COLUMN original_text SET NOT NULL;

-- Step 5: Fix the create_translation_entries function to prevent NULL creation
CREATE OR REPLACE FUNCTION public.create_translation_entries(
  p_entity_type text,
  p_entity_uuid uuid,
  p_translations jsonb,
  p_source_language text DEFAULT 'de'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  translation jsonb;
  field_key text;
  translated_text text;
  target_lang text;
  original_text text;
  source_lang text;
BEGIN
  -- Validate inputs
  IF p_entity_type IS NULL OR p_entity_uuid IS NULL OR p_translations IS NULL THEN
    RAISE EXCEPTION 'Entity type, UUID, and translations cannot be NULL';
  END IF;

  -- Ensure source language is set
  source_lang := COALESCE(p_source_language, 'de');

  -- Loop through translations array
  FOR translation IN SELECT * FROM jsonb_array_elements(p_translations)
  LOOP
    field_key := translation->>'field_key';
    translated_text := translation->>'text_value';
    target_lang := translation->>'lang_code';

    -- Skip if required fields are missing
    IF field_key IS NULL OR translated_text IS NULL OR target_lang IS NULL THEN
      RAISE WARNING 'Skipping incomplete translation: field_key=%, text_value=%, lang_code=%', field_key, translated_text, target_lang;
      CONTINUE;
    END IF;

    -- Get original text from the source entity based on field key
    IF p_entity_type = 'report_structure' THEN
      SELECT CASE 
        WHEN field_key = 'report_structure_name' THEN rs.report_structure_name
        WHEN field_key = 'description' THEN rs.description
        ELSE NULL
      END INTO original_text
      FROM report_structures rs
      WHERE rs.report_structure_uuid = p_entity_uuid;
      
    ELSIF p_entity_type = 'report_line_item' THEN
      SELECT CASE 
        WHEN field_key = 'report_line_item_description' THEN rli.report_line_item_description
        WHEN field_key = 'level_1_line_item_description' THEN rli.level_1_line_item_description
        WHEN field_key = 'level_2_line_item_description' THEN rli.level_2_line_item_description
        WHEN field_key = 'level_3_line_item_description' THEN rli.level_3_line_item_description
        WHEN field_key = 'level_4_line_item_description' THEN rli.level_4_line_item_description
        WHEN field_key = 'level_5_line_item_description' THEN rli.level_5_line_item_description
        WHEN field_key = 'level_6_line_item_description' THEN rli.level_6_line_item_description
        WHEN field_key = 'level_7_line_item_description' THEN rli.level_7_line_item_description
        WHEN field_key = 'description_of_leaf' THEN rli.description_of_leaf
        ELSE NULL
      END INTO original_text
      FROM report_line_items rli
      WHERE rli.report_line_item_uuid = p_entity_uuid;
    END IF;

    -- Ensure we have original text - use translated text as fallback if no original found
    IF original_text IS NULL THEN
      original_text := translated_text;
      RAISE WARNING 'No original text found for entity % field %, using translated text as original', p_entity_uuid, field_key;
    END IF;

    -- Insert or update translation
    IF p_entity_type = 'report_structure' THEN
      INSERT INTO report_structures_translations (
        report_structure_uuid,
        language_code_target,
        source_field_name,
        translated_text,
        language_code_original,
        original_text,
        source,
        created_by,
        updated_by
      ) VALUES (
        p_entity_uuid,
        target_lang,
        field_key,
        translated_text,
        source_lang,  -- Always set source language
        original_text,  -- Always set original text
        'ai_generated',
        auth.uid(),
        auth.uid()
      )
      ON CONFLICT (report_structure_uuid, language_code_target, source_field_name)
      DO UPDATE SET
        translated_text = EXCLUDED.translated_text,
        language_code_original = EXCLUDED.language_code_original,
        original_text = EXCLUDED.original_text,
        updated_by = auth.uid(),
        updated_at = now();

    ELSIF p_entity_type = 'report_line_item' THEN
      INSERT INTO report_line_items_translations (
        report_line_item_uuid,
        language_code_target,
        source_field_name,
        translated_text,
        language_code_original,
        original_text,
        source,
        created_by,
        updated_by
      ) VALUES (
        p_entity_uuid,
        target_lang,
        field_key,
        translated_text,
        source_lang,  -- Always set source language
        original_text,  -- Always set original text
        'ai_generated',
        auth.uid(),
        auth.uid()
      )
      ON CONFLICT (report_line_item_uuid, language_code_target, source_field_name)
      DO UPDATE SET
        translated_text = EXCLUDED.translated_text,
        language_code_original = EXCLUDED.language_code_original,
        original_text = EXCLUDED.original_text,
        updated_by = auth.uid(),
        updated_at = now();
    END IF;
  END LOOP;
END;
$function$;

-- Step 6: Create validation trigger to prevent NULL insertions
CREATE OR REPLACE FUNCTION prevent_null_translation_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check for NULL values in critical fields
  IF NEW.language_code_original IS NULL THEN
    RAISE EXCEPTION 'language_code_original cannot be NULL';
  END IF;
  
  IF NEW.original_text IS NULL THEN
    RAISE EXCEPTION 'original_text cannot be NULL';
  END IF;
  
  IF NEW.language_code_target IS NULL THEN
    RAISE EXCEPTION 'language_code_target cannot be NULL';
  END IF;
  
  IF NEW.source_field_name IS NULL THEN
    RAISE EXCEPTION 'source_field_name cannot be NULL';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Apply validation triggers
DROP TRIGGER IF EXISTS prevent_null_fields_report_structures_translations ON report_structures_translations;
CREATE TRIGGER prevent_null_fields_report_structures_translations
  BEFORE INSERT OR UPDATE ON report_structures_translations
  FOR EACH ROW EXECUTE FUNCTION prevent_null_translation_fields();

DROP TRIGGER IF EXISTS prevent_null_fields_report_line_items_translations ON report_line_items_translations;
CREATE TRIGGER prevent_null_fields_report_line_items_translations
  BEFORE INSERT OR UPDATE ON report_line_items_translations
  FOR EACH ROW EXECUTE FUNCTION prevent_null_translation_fields();

-- Step 7: Create monitoring function
CREATE OR REPLACE FUNCTION check_translation_data_integrity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  struct_nulls integer;
  line_nulls integer;
BEGIN
  -- Count NULL values in translation tables
  SELECT COUNT(*) INTO struct_nulls
  FROM report_structures_translations
  WHERE language_code_original IS NULL OR original_text IS NULL;

  SELECT COUNT(*) INTO line_nulls  
  FROM report_line_items_translations
  WHERE language_code_original IS NULL OR original_text IS NULL;

  result := jsonb_build_object(
    'timestamp', now(),
    'report_structures_null_count', struct_nulls,
    'report_line_items_null_count', line_nulls,
    'total_null_count', struct_nulls + line_nulls,
    'is_clean', (struct_nulls + line_nulls) = 0
  );

  RETURN result;
END;
$function$;
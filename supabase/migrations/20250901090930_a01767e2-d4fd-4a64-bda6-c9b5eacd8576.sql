-- Fix the migrate_existing_translations function to use correct column names
CREATE OR REPLACE FUNCTION public.migrate_existing_translations()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_structure_count INTEGER := 0;
  v_line_item_count INTEGER := 0;
  v_structure RECORD;
  v_line_item RECORD;
BEGIN
  -- Migrate report structures
  FOR v_structure IN 
    SELECT 
      report_structure_uuid,
      report_structure_name,
      description,
      source_language_code
    FROM report_structures
  LOOP
    -- Insert German translations (assuming existing data is German)
    IF v_structure.report_structure_name IS NOT NULL THEN
      INSERT INTO report_structures_translations (
        report_structure_uuid,
        language_code_target,
        source_field_name,
        translated_text,
        original_text,
        language_code_original,
        source,
        created_by
      ) VALUES (
        v_structure.report_structure_uuid,
        'de',
        'report_structure_name',
        v_structure.report_structure_name,
        v_structure.report_structure_name,
        'de',
        'import',
        auth.uid()
      ) ON CONFLICT (report_structure_uuid, language_code_target, source_field_name) DO NOTHING;
    END IF;
    
    IF v_structure.description IS NOT NULL THEN
      INSERT INTO report_structures_translations (
        report_structure_uuid,
        language_code_target,
        source_field_name,
        translated_text,
        original_text,
        language_code_original,
        source,
        created_by
      ) VALUES (
        v_structure.report_structure_uuid,
        'de',
        'description',
        v_structure.description,
        v_structure.description,
        'de',
        'import',
        auth.uid()
      ) ON CONFLICT (report_structure_uuid, language_code_target, source_field_name) DO NOTHING;
    END IF;
    
    -- Update source language if not set
    UPDATE report_structures 
    SET source_language_code = 'de'
    WHERE report_structure_uuid = v_structure.report_structure_uuid 
      AND source_language_code IS NULL;
    
    v_structure_count := v_structure_count + 1;
  END LOOP;
  
  -- Migrate report line items
  FOR v_line_item IN
    SELECT 
      report_line_item_uuid,
      report_line_item_description,
      level_1_line_item_description,
      level_2_line_item_description,
      level_3_line_item_description,
      level_4_line_item_description,
      level_5_line_item_description,
      level_6_line_item_description,
      level_7_line_item_description,
      description_of_leaf,
      hierarchy_path,
      source_language_code
    FROM report_line_items
  LOOP
    -- Insert all non-null description fields as German translations
    IF v_line_item.report_line_item_description IS NOT NULL THEN
      INSERT INTO report_line_items_translations (
        report_line_item_uuid,
        language_code_target,
        source_field_name,
        translated_text,
        original_text,
        language_code_original,
        source,
        created_by
      ) VALUES (
        v_line_item.report_line_item_uuid,
        'de',
        'report_line_item_description',
        v_line_item.report_line_item_description,
        v_line_item.report_line_item_description,
        'de',
        'import',
        auth.uid()
      ) ON CONFLICT (report_line_item_uuid, language_code_target, source_field_name) DO NOTHING;
    END IF;

    -- Handle other description fields if they exist
    IF v_line_item.description_of_leaf IS NOT NULL THEN
      INSERT INTO report_line_items_translations (
        report_line_item_uuid,
        language_code_target,
        source_field_name,
        translated_text,
        original_text,
        language_code_original,
        source,
        created_by
      ) VALUES (
        v_line_item.report_line_item_uuid,
        'de',
        'description_of_leaf',
        v_line_item.description_of_leaf,
        v_line_item.description_of_leaf,
        'de',
        'import',
        auth.uid()
      ) ON CONFLICT (report_line_item_uuid, language_code_target, source_field_name) DO NOTHING;
    END IF;
    
    -- Update source language if not set
    UPDATE report_line_items 
    SET source_language_code = 'de'
    WHERE report_line_item_uuid = v_line_item.report_line_item_uuid 
      AND source_language_code IS NULL;
    
    v_line_item_count := v_line_item_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'structures_migrated', v_structure_count,
    'line_items_migrated', v_line_item_count,
    'total_migrated', v_structure_count + v_line_item_count
  );
END;
$function$;

-- Fix the create_translation_entries function to use correct column names
CREATE OR REPLACE FUNCTION public.create_translation_entries(p_entity_type text, p_entity_uuid uuid, p_translations jsonb, p_source_language text DEFAULT 'de'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_source_field_name TEXT;
  v_lang_code TEXT;
  v_translation TEXT;
  v_original_text TEXT;
  v_table_name TEXT;
  v_uuid_column TEXT;
BEGIN
  -- Determine translation table and UUID column
  IF p_entity_type = 'report_structure' THEN
    v_table_name := 'report_structures_translations';
    v_uuid_column := 'report_structure_uuid';
  ELSIF p_entity_type = 'report_line_item' THEN
    v_table_name := 'report_line_items_translations';
    v_uuid_column := 'report_line_item_uuid';
  ELSE
    RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
  END IF;
  
  -- Handle both single translation object and array of translations
  IF jsonb_typeof(p_translations) = 'array' THEN
    -- Insert translations from array
    FOR v_source_field_name, v_lang_code, v_translation, v_original_text IN
      SELECT 
        COALESCE(field_key, source_field_name),
        lang_code,  
        text_value,
        COALESCE(original_text, text_value)
      FROM jsonb_to_recordset(p_translations) AS x(
        field_key TEXT,
        source_field_name TEXT,
        lang_code TEXT,
        text_value TEXT,
        original_text TEXT
      )
    LOOP
      EXECUTE format('
        INSERT INTO %I (
          %s, 
          language_code_target, 
          source_field_name, 
          translated_text,
          original_text,
          language_code_original,
          source,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (%s, language_code_target, source_field_name) 
        DO UPDATE SET 
          translated_text = EXCLUDED.translated_text,
          original_text = EXCLUDED.original_text,
          updated_at = now(),
          updated_by = auth.uid()
      ', v_table_name, v_uuid_column, v_uuid_column)
      USING 
        p_entity_uuid, 
        v_lang_code, 
        v_source_field_name, 
        v_translation,
        v_original_text,
        CASE WHEN v_lang_code = p_source_language THEN p_source_language ELSE p_source_language END,
        CASE WHEN v_lang_code = p_source_language THEN 'import' ELSE 'ai' END,
        auth.uid();
    END LOOP;
  ELSE
    -- Handle single translation object
    v_source_field_name := COALESCE(p_translations->>'field_key', p_translations->>'source_field_name');
    v_lang_code := p_translations->>'lang_code';
    v_translation := p_translations->>'text_value';
    v_original_text := COALESCE(p_translations->>'original_text', v_translation);
    
    IF v_source_field_name IS NOT NULL AND v_lang_code IS NOT NULL AND v_translation IS NOT NULL THEN
      EXECUTE format('
        INSERT INTO %I (
          %s, 
          language_code_target, 
          source_field_name, 
          translated_text,
          original_text,
          language_code_original,
          source,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (%s, language_code_target, source_field_name) 
        DO UPDATE SET 
          translated_text = EXCLUDED.translated_text,
          original_text = EXCLUDED.original_text,
          updated_at = now(),
          updated_by = auth.uid()
      ', v_table_name, v_uuid_column, v_uuid_column)
      USING 
        p_entity_uuid, 
        v_lang_code, 
        v_source_field_name, 
        v_translation,
        v_original_text,
        CASE WHEN v_lang_code = p_source_language THEN p_source_language ELSE p_source_language END,
        CASE WHEN v_lang_code = p_source_language THEN 'import' ELSE 'ai' END,
        auth.uid();
    END IF;
  END IF;
END;
$function$;
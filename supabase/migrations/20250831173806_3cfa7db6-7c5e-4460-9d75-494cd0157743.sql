-- Translation helper functions and data migration utilities

-- 1. Function to get translation with fallback logic
CREATE OR REPLACE FUNCTION public.get_translation(
  p_entity_type TEXT,
  p_entity_uuid UUID,
  p_field_key TEXT,
  p_language_code TEXT DEFAULT NULL
) 
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_requested_lang TEXT;
  v_default_lang TEXT;
  v_source_lang TEXT;
  v_translation TEXT;
  v_table_name TEXT;
BEGIN
  -- Get default language
  SELECT language_code INTO v_default_lang 
  FROM system_languages 
  WHERE is_default = true;
  
  -- Handle 'orig' language parameter
  IF p_language_code = 'orig' THEN
    IF p_entity_type = 'report_structure' THEN
      SELECT source_language_code INTO v_source_lang
      FROM report_structures 
      WHERE report_structure_uuid = p_entity_uuid;
    ELSIF p_entity_type = 'report_line_item' THEN
      SELECT source_language_code INTO v_source_lang
      FROM report_line_items 
      WHERE report_line_item_uuid = p_entity_uuid;
    END IF;
    v_requested_lang := COALESCE(v_source_lang, v_default_lang);
  ELSE
    v_requested_lang := COALESCE(p_language_code, v_default_lang);
  END IF;
  
  -- Determine translation table
  IF p_entity_type = 'report_structure' THEN
    v_table_name := 'report_structures_translations';
  ELSIF p_entity_type = 'report_line_item' THEN
    v_table_name := 'report_line_items_translations';
  ELSE
    RETURN '[invalid entity type]';
  END IF;
  
  -- Try to get requested language
  EXECUTE format('
    SELECT translated_text 
    FROM %I 
    WHERE %s = $1 AND language_code = $2 AND field_key = $3
  ', v_table_name, 
     CASE WHEN p_entity_type = 'report_structure' THEN 'report_structure_uuid' 
          ELSE 'report_line_item_uuid' END)
  INTO v_translation
  USING p_entity_uuid, v_requested_lang, p_field_key;
  
  -- If found, return it
  IF v_translation IS NOT NULL THEN
    RETURN v_translation;
  END IF;
  
  -- Fallback to default language if different
  IF v_requested_lang != v_default_lang THEN
    EXECUTE format('
      SELECT translated_text 
      FROM %I 
      WHERE %s = $1 AND language_code = $2 AND field_key = $3
    ', v_table_name,
       CASE WHEN p_entity_type = 'report_structure' THEN 'report_structure_uuid' 
            ELSE 'report_line_item_uuid' END)
    INTO v_translation
    USING p_entity_uuid, v_default_lang, p_field_key;
    
    IF v_translation IS NOT NULL THEN
      RETURN v_translation;
    END IF;
  END IF;
  
  -- Final fallback placeholder
  RETURN '[missing:' || p_field_key || ']';
END;
$$;

-- 2. Function to create translation entries for an entity
CREATE OR REPLACE FUNCTION public.create_translation_entries(
  p_entity_type TEXT,
  p_entity_uuid UUID,
  p_translations JSONB,
  p_source_language TEXT DEFAULT 'de'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_field_key TEXT;
  v_lang_code TEXT;
  v_translation TEXT;
  v_table_name TEXT;
BEGIN
  -- Determine translation table
  IF p_entity_type = 'report_structure' THEN
    v_table_name := 'report_structures_translations';
  ELSIF p_entity_type = 'report_line_item' THEN
    v_table_name := 'report_line_items_translations';
  ELSE
    RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
  END IF;
  
  -- Insert translations
  FOR v_field_key, v_lang_code, v_translation IN
    SELECT 
      field_key,
      lang_code,  
      text_value
    FROM jsonb_to_recordset(p_translations) AS x(
      field_key TEXT,
      lang_code TEXT,
      text_value TEXT
    )
  LOOP
    EXECUTE format('
      INSERT INTO %I (
        %s, 
        language_code, 
        field_key, 
        translated_text, 
        source,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (%s, language_code, field_key) 
      DO UPDATE SET 
        translated_text = EXCLUDED.translated_text,
        updated_at = now(),
        updated_by = auth.uid()
    ', v_table_name,
       CASE WHEN p_entity_type = 'report_structure' THEN 'report_structure_uuid' 
            ELSE 'report_line_item_uuid' END,
       CASE WHEN p_entity_type = 'report_structure' THEN 'report_structure_uuid' 
            ELSE 'report_line_item_uuid' END)
    USING 
      p_entity_uuid, 
      v_lang_code, 
      v_field_key, 
      v_translation,
      CASE WHEN v_lang_code = p_source_language THEN 'import' ELSE 'ai' END,
      auth.uid();
  END LOOP;
END;
$$;

-- 3. Function to migrate existing data to translation tables
CREATE OR REPLACE FUNCTION public.migrate_existing_translations()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
        language_code,
        field_key,
        translated_text,
        source,
        created_by
      ) VALUES (
        v_structure.report_structure_uuid,
        'de',
        'report_structure_name',
        v_structure.report_structure_name,
        'import',
        auth.uid()
      ) ON CONFLICT DO NOTHING;
    END IF;
    
    IF v_structure.description IS NOT NULL THEN
      INSERT INTO report_structures_translations (
        report_structure_uuid,
        language_code,
        field_key,
        translated_text,
        source,
        created_by
      ) VALUES (
        v_structure.report_structure_uuid,
        'de',
        'description',
        v_structure.description,
        'import',
        auth.uid()
      ) ON CONFLICT DO NOTHING;
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
    -- Insert all non-null fields as German translations
    PERFORM public.create_translation_entries(
      'report_line_item',
      v_line_item.report_line_item_uuid,
      jsonb_build_array(
        jsonb_build_object('field_key', 'report_line_item_description', 'lang_code', 'de', 'text_value', v_line_item.report_line_item_description),
        jsonb_build_object('field_key', 'level_1_line_item_description', 'lang_code', 'de', 'text_value', v_line_item.level_1_line_item_description),
        jsonb_build_object('field_key', 'level_2_line_item_description', 'lang_code', 'de', 'text_value', v_line_item.level_2_line_item_description),
        jsonb_build_object('field_key', 'level_3_line_item_description', 'lang_code', 'de', 'text_value', v_line_item.level_3_line_item_description),
        jsonb_build_object('field_key', 'level_4_line_item_description', 'lang_code', 'de', 'text_value', v_line_item.level_4_line_item_description),
        jsonb_build_object('field_key', 'level_5_line_item_description', 'lang_code', 'de', 'text_value', v_line_item.level_5_line_item_description),
        jsonb_build_object('field_key', 'level_6_line_item_description', 'lang_code', 'de', 'text_value', v_line_item.level_6_line_item_description),
        jsonb_build_object('field_key', 'level_7_line_item_description', 'lang_code', 'de', 'text_value', v_line_item.level_7_line_item_description),
        jsonb_build_object('field_key', 'description_of_leaf', 'lang_code', 'de', 'text_value', v_line_item.description_of_leaf),
        jsonb_build_object('field_key', 'display_hierarchy_path', 'lang_code', 'de', 'text_value', v_line_item.hierarchy_path)
      ),
      'de'
    );
    
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
    'message', format('Successfully migrated %s structures and %s line items', v_structure_count, v_line_item_count)
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_translation(TEXT, UUID, TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_translation_entries(TEXT, UUID, JSONB, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.migrate_existing_translations() TO authenticated, anon;
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportStructureData {
  report_line_item_key: string;
  report_line_item_description?: string;
  parent_report_line_item_key?: string;
  sort_order: number;
  hierarchy_path?: string;
  level_1_line_item_description?: string;
  level_2_line_item_description?: string;
  level_3_line_item_description?: string;
  level_4_line_item_description?: string;
  level_5_line_item_description?: string;
  level_6_line_item_description?: string;
  level_7_line_item_description?: string;
  line_item_type?: string;
  description_of_leaf?: string;
  is_leaf: boolean;
  is_calculated: boolean;
  display: boolean;
  data_source?: string;
  comment?: number;
}

interface ColumnMapping {
  fileColumn: string;
  dbColumn: string;
  mapped: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
  const { 
    structureData, 
    filename, 
    userId, 
    userEmail, 
    overwriteMode = false, 
    targetStructureId,
    unmappedColumns = [],
    columnMappings = [],
    importedStructureId,
    structureName
  } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`Processing report structure: ${filename} for user: ${userEmail}`);
  console.log(`Structure name: ${structureName || 'Not provided'}`);
  console.log(`Overwrite mode: ${overwriteMode}, Target structure: ${targetStructureId}`);
  console.log(`Unmapped columns: ${unmappedColumns.length} rows`);
  console.log(`Column mappings: ${columnMappings.length} mappings`);
    // Validate input data
    if (!Array.isArray(structureData) || structureData.length === 0) {
      throw new Error('Invalid structure data provided');
    }

    let structureId: number;
    let structureUuid: string;
    let currentStructureName: string;
    let version: number = 1;

    if (overwriteMode && targetStructureId) {
      // Get current structure info and increment version
      const { data: currentStructure, error: fetchError } = await supabase
        .from('report_structures')
        .select('report_structure_id, report_structure_name, version, report_structure_uuid')
        .eq('report_structure_id', parseInt(targetStructureId))
        .single();

      if (fetchError) {
        console.error('Error fetching existing structure:', fetchError);
        throw new Error(`Failed to fetch target structure: ${fetchError.message}`);
      }

      structureId = currentStructure.report_structure_id;
      version = currentStructure.version + 1;
      currentStructureName = currentStructure.report_structure_name;
      structureUuid = currentStructure.report_structure_uuid;

      // Detect language of the imported data early for overwrite mode too
      let sourceLanguage = 'de'; // Default to German
      try {
        // Use first non-empty description for language detection
        const sampleText = structureData.find((item: ReportStructureData) => 
          item.report_line_item_description && item.report_line_item_description.trim()
        )?.report_line_item_description;
        
        if (sampleText) {
          const { data: detectionResult, error: detectionError } = await supabase.functions.invoke('detect-language', {
            body: { text: sampleText }
          });
          
          if (!detectionError && detectionResult?.language) {
            sourceLanguage = detectionResult.language;
            console.log(`Detected source language: ${sourceLanguage}`);
          }
        }
      } catch (error) {
        console.log('Language detection failed, using default (German):', error);
      }

      // Update existing structure with new version and source language
      const { data: structure, error: updateError } = await supabase
        .from('report_structures')
        .update({
          version: version,
          updated_at: new Date().toISOString(),
          source_language_code: sourceLanguage // Set source language on structure
        })
        .eq('report_structure_id', structureId)
        .select('report_structure_id, report_structure_uuid')
        .single();

      if (updateError) {
        console.error('Error updating structure:', updateError);
        throw new Error(`Failed to update structure: ${updateError.message}`);
      }

      // Delete existing line items for this structure using integer ID for performance
      const { error: deleteError } = await supabase
        .from('report_line_items')
        .delete()
        .eq('report_structure_id', structureId);

      if (deleteError) {
        console.error('Error deleting existing line items:', deleteError);
        throw new Error(`Failed to delete existing line items: ${deleteError.message}`);
      }

      console.log(`Updated structure ID: ${structureId}, UUID: ${structureUuid} to version ${version}`);
    } else {
      // Validation for new structure
      if (!structureName || !structureName.trim()) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Structure name is required for new structures' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 400 
          }
        );
      }

      // Create new report structure
      structureUuid = crypto.randomUUID();
      
      // Detect language of the imported data early
      let sourceLanguage = 'de'; // Default to German
      try {
        // Use first non-empty description for language detection
        const sampleText = structureData.find((item: ReportStructureData) => 
          item.report_line_item_description && item.report_line_item_description.trim()
        )?.report_line_item_description;
        
        if (sampleText) {
          const { data: detectionResult, error: detectionError } = await supabase.functions.invoke('detect-language', {
            body: { text: sampleText }
          });
          
          if (!detectionError && detectionResult?.language) {
            sourceLanguage = detectionResult.language;
            console.log(`Detected source language: ${sourceLanguage}`);
          }
        }
      } catch (error) {
        console.log('Language detection failed, using default (German):', error);
      }
      
      const { data: structure, error: structureError } = await supabase
        .from('report_structures')
        .insert({
          report_structure_uuid: structureUuid,
          report_structure_name: structureName.trim(),
          is_active: false, // Will be set by trigger if it's the first one
          created_by_supabase_user_uuid: userId,
          created_by_user_name: userEmail,
          version: 1,
          name_of_import_file: filename,
          imported_structure_id: importedStructureId || 'Not specified',
          source_language_code: sourceLanguage // Set source language on structure
        })
        .select('report_structure_id, report_structure_uuid')
        .single();

      if (structureError) {
        console.error('Error creating structure:', structureError);
        throw new Error(`Failed to create report structure: ${structureError.message}`);
      }
      
      structureId = structure.report_structure_id;
      structureUuid = structure.report_structure_uuid;
      console.log(`Created new structure ID: ${structureId}, UUID: ${structureUuid}`);
    }

    // First pass: Create line items with UUIDs and preserve original file order
    const keyToUuidMap = new Map<string, string>();
    
    // Preserve original file order - no sorting to maintain the exact row sequence from upload
    console.log(`Processing ${structureData.length} items preserving original file order (row 2 → sort_order 0, row 3 → sort_order 1, etc.)`);
    
    const lineItems = structureData.map((item: ReportStructureData, index: number) => {
      // Validate required fields
      if (!item.report_line_item_key) {
        throw new Error(`Missing report_line_item_key at row ${index + 1}`);
      }

      const itemUuid = item.report_line_item_uuid || crypto.randomUUID();
      keyToUuidMap.set(item.report_line_item_key, itemUuid);

      // Store unmapped column data for this row if available
      const unmappedRowData = unmappedColumns.find((row: any) => row.row_index === index);
      const additionalData = unmappedRowData ? 
        Object.fromEntries(
          Object.entries(unmappedRowData).filter(([key]) => key !== 'row_index')
        ) : null;

      return {
        report_line_item_uuid: itemUuid,
        report_line_item_description: item.report_line_item_description || item.hierarchy_path || item.report_line_item_key,
        report_structure_id: structureId,  // Integer foreign key for performance
        report_structure_uuid: structureUuid,  // UUID foreign key for business logic
        report_structure_name: overwriteMode ? currentStructureName : structureName,
        report_line_item_key: item.report_line_item_key,
        parent_report_line_item_key: item.parent_report_line_item_key || null,
        parent_report_line_item_uuid: null, // Will be set in second pass
        is_parent_key_existing: !!item.parent_report_line_item_key,
        sort_order: index, // Preserve original file order: Excel row (index + 2) → sort_order index
        hierarchy_path: item.hierarchy_path || null,
        level_1_line_item_description: item.level_1_line_item_description || null,
        level_2_line_item_description: item.level_2_line_item_description || null,
        level_3_line_item_description: item.level_3_line_item_description || null,
        level_4_line_item_description: item.level_4_line_item_description || null,
        level_5_line_item_description: item.level_5_line_item_description || null,
        level_6_line_item_description: item.level_6_line_item_description || null,
        level_7_line_item_description: item.level_7_line_item_description || null,
        line_item_type: item.line_item_type || null,
        description_of_leaf: item.description_of_leaf || null,
        is_leaf: item.is_leaf || false,
        is_calculated: item.is_calculated || false,
        display: item.display !== false, // Default to true
        data_source: `uploaded by ${userEmail} on ${new Date().toISOString().split('T')[0]}`,
        comment: additionalData ? JSON.stringify(additionalData) : (item.comment?.toString() || null)
      };
    });

    // Second pass: Set parent UUIDs based on parent keys
    lineItems.forEach(item => {
      if (item.parent_report_line_item_key) {
        const parentUuid = keyToUuidMap.get(item.parent_report_line_item_key);
        if (parentUuid) {
          item.parent_report_line_item_uuid = parentUuid;
        }
      }
    });

    // Validate sort_order uniqueness before insertion
    const sortOrderCounts = new Map<number, number>();
    lineItems.forEach(item => {
      const count = sortOrderCounts.get(item.sort_order) || 0;
      sortOrderCounts.set(item.sort_order, count + 1);
    });
    
    const duplicates = Array.from(sortOrderCounts.entries()).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      console.error('Duplicate sort_order values detected:', duplicates);
      throw new Error(`Duplicate sort_order values found: ${duplicates.map(([order]) => order).join(', ')}`);
    }
    
    console.log(`Validated ${lineItems.length} items with unique sort_order values (0-${lineItems.length - 1})`);

    // sourceLanguage is already detected above, just log it
    console.log(`Using detected source language: ${sourceLanguage}`);

    // Add source language to line items
    lineItems.forEach(item => {
      item.source_language_code = sourceLanguage;
    });

    // Insert line items in batches
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < lineItems.length; i += batchSize) {
      const batch = lineItems.slice(i, i + batchSize);
      
      console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}: items ${i} to ${Math.min(i + batchSize - 1, lineItems.length - 1)}`);
      console.log(`File order mapping for batch: Excel rows ${i + 2}-${Math.min(i + batchSize - 1, lineItems.length - 1) + 2} → sort_order ${i}-${Math.min(i + batchSize - 1, lineItems.length - 1)}`);
      
      const { error: lineItemsError } = await supabase
        .from('report_line_items')
        .insert(batch);

      if (lineItemsError) {
        console.error('Error inserting line items batch:', lineItemsError);
        console.error('Batch details:', batch.map(item => ({ 
          key: item.report_line_item_key, 
          sort_order: item.sort_order, 
          file_row: item.sort_order + 2 
        })));
        
        // Cleanup: delete the structure if line items failed and it's a new structure
        if (!overwriteMode) {
          await supabase
            .from('report_structures')
            .delete()
            .eq('report_structure_uuid', structureUuid);
        }
        
        throw new Error(`Failed to insert line items batch ${Math.floor(i / batchSize) + 1}: ${lineItemsError.message}`);
      }

      insertedCount += batch.length;
      console.log(`Successfully inserted ${insertedCount}/${lineItems.length} line items`);
    }

    // Convert auto-generated IDs to concatenated format using RPC function
    console.log(`Converting ${insertedCount} line item IDs to concatenated format for structure ${structureId}`);
    
    const { data: conversionResult, error: conversionError } = await supabase
      .rpc('convert_line_items_to_concatenated_format', { 
        p_structure_id: structureId 
      });

    if (conversionError) {
      console.error('Error converting to concatenated IDs:', conversionError);
      console.log('Continuing with auto-generated IDs...');
    } else if (conversionResult) {
      console.log('Concatenated ID conversion result:', conversionResult);
      if (conversionResult.success) {
        console.log(`Successfully converted ${conversionResult.items_updated} line items to concatenated format`);
        if (conversionResult.new_id_range) {
          console.log(`New ID range: ${conversionResult.new_id_range}`);
        }
      } else {
        console.error('Conversion failed:', conversionResult.message);
      }
    }

    // Generate AI translations for the imported data
    try {
      console.log('Generating AI translations for imported structure...');
      
      // Collect translatable fields from structure
      const structureTexts = [{
        field_key: 'report_structure_name',
        text: overwriteMode ? currentStructureName : structureName
      }];

      // Generate translations for structure first
      if (structureTexts.length > 0) {
        const { data: structureTranslationResult, error: structureTranslationError } = await supabase.functions.invoke('ai-translation', {
          body: {
            texts: structureTexts,
            sourceLanguage,
            targetLanguages: sourceLanguage === 'de' ? ['en'] : ['de'],
            entityType: 'report_structure',
            entityUuid: structureUuid,
            autoSave: true
          }
        });

        if (structureTranslationError) {
          console.error('Structure translation generation failed:', structureTranslationError);
        } else {
          console.log('Structure AI translations generated successfully');
        }
      }

      // Generate translations for line items in batches
      const batchSize = 10; // Smaller batch size for line items
      for (let i = 0; i < lineItems.length; i += batchSize) {
        const batch = lineItems.slice(i, i + batchSize);
        const batchTexts = batch.flatMap(item => {
          const texts = [];
          if (item.report_line_item_description) {
            texts.push({
              field_key: `${item.report_line_item_key}_description`,
              text: item.report_line_item_description,
              entity_uuid: item.report_line_item_uuid
            });
          }
          return texts;
        });

        if (batchTexts.length > 0) {
          // Process each line item individually to ensure proper entity mapping
          for (const textItem of batchTexts) {
            try {
              const { data: lineItemTranslationResult, error: lineItemTranslationError } = await supabase.functions.invoke('ai-translation', {
                body: {
                  texts: [textItem],
                  sourceLanguage,
                  targetLanguages: sourceLanguage === 'de' ? ['en'] : ['de'],
                  entityType: 'report_line_item',
                  entityUuid: textItem.entity_uuid,
                  autoSave: true
                }
              });

              if (lineItemTranslationError) {
                console.error(`Line item translation failed for ${textItem.entity_uuid}:`, lineItemTranslationError);
              } else {
                console.log(`Line item translation generated for ${textItem.entity_uuid}`);
              }
            } catch (error) {
              console.error(`Translation error for line item ${textItem.entity_uuid}:`, error);
            }
          }
        }
        
        // Brief delay between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.log('Translation generation failed (non-critical):', error);
    }

    console.log(`Successfully processed structure with ${lineItems.length} line items preserving original file order`);
    console.log(`Order mapping confirmed: File rows 2-${lineItems.length + 1} → Database sort_order 0-${lineItems.length - 1}`);

    return new Response(
      JSON.stringify({
        success: true,
        structure_uuid: structureUuid,
        structure_name: overwriteMode ? currentStructureName : structureName,
        line_items_count: lineItems.length,
        version: version,
        overwrite_mode: overwriteMode,
        unmapped_columns_stored: unmappedColumns.length,
        column_mappings: columnMappings.length,
        file_order_preserved: true,
        order_mapping: `File rows 2-${lineItems.length + 1} → Sort order 0-${lineItems.length - 1}`,
        message: `Report structure "${overwriteMode ? currentStructureName : structureName}" processed successfully with original file order preserved`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in process-report-structure function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
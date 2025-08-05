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
    let currentStructureName: string;
    let version: number = 1;

    if (overwriteMode && targetStructureId) {
      // Get current structure info and increment version
      const { data: currentStructure, error: fetchError } = await supabase
        .from('report_structures')
        .select('report_structure_name, version')
        .eq('report_structure_id', targetStructureId)
        .single();

      if (fetchError) {
        console.error('Error fetching existing structure:', fetchError);
        throw new Error(`Failed to fetch target structure: ${fetchError.message}`);
      }

      version = currentStructure.version + 1;
      currentStructureName = currentStructure.report_structure_name;

      // Update existing structure with new version
      const { data: structure, error: updateError } = await supabase
        .from('report_structures')
        .update({
          version: version,
          updated_at: new Date().toISOString()
        })
        .eq('report_structure_id', targetStructureId)
        .select('report_structure_id')
        .single();

      if (updateError) {
        console.error('Error updating structure:', updateError);
        throw new Error(`Failed to update structure: ${updateError.message}`);
      }
      
      structureId = targetStructureId;

      // Delete existing line items for this structure
      const { error: deleteError } = await supabase
        .from('report_line_items')
        .delete()
        .eq('report_structure_id', targetStructureId);

      if (deleteError) {
        console.error('Error deleting existing line items:', deleteError);
        throw new Error(`Failed to delete existing line items: ${deleteError.message}`);
      }

      console.log(`Updated structure ${structureId} to version ${version}`);
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
      const { data: structure, error: structureError } = await supabase
        .from('report_structures')
        .insert({
          report_structure_uuid: crypto.randomUUID(),
          report_structure_name: structureName.trim(),
          is_active: false, // Will be set by trigger if it's the first one
          created_by_user_id: userId,
          created_by_user_name: userEmail,
          version: 1,
          name_of_import_file: filename,
          imported_structure_id: importedStructureId || 'Not specified'
        })
        .select('report_structure_id')
        .single();

      if (structureError) {
        console.error('Error creating structure:', structureError);
        throw new Error(`Failed to create report structure: ${structureError.message}`);
      }
      
      structureId = structure.report_structure_id;
      console.log(`Created new structure with ID: ${structureId}`);
    }

    // Process and validate line items
    const lineItems = structureData.map((item: ReportStructureData, index: number) => {
      // Validate required fields
      if (!item.report_line_item_key) {
        throw new Error(`Missing report_line_item_key at row ${index + 1}`);
      }

      // Store unmapped column data for this row if available
      const unmappedRowData = unmappedColumns.find((row: any) => row.row_index === index);
      const additionalData = unmappedRowData ? 
        Object.fromEntries(
          Object.entries(unmappedRowData).filter(([key]) => key !== 'row_index')
        ) : null;

      return {
        report_line_item_uuid: crypto.randomUUID(),
        report_line_item_description: item.report_line_item_description || item.hierarchy_path || item.report_line_item_key,
        report_structure_id: structureId,
        report_structure_name: overwriteMode ? currentStructureName : structureName,
        report_line_item_key: item.report_line_item_key,
        parent_report_line_item_key: item.parent_report_line_item_key || null,
        is_parent_key_existing: !!item.parent_report_line_item_key,
        sort_order: item.sort_order || index,
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
        data_source: item.data_source || null,
        comment: additionalData ? JSON.stringify(additionalData) : (item.comment?.toString() || null)
      };
    });

    // Insert line items in batches
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < lineItems.length; i += batchSize) {
      const batch = lineItems.slice(i, i + batchSize);
      
      const { error: lineItemsError } = await supabase
        .from('report_line_items')
        .insert(batch);

      if (lineItemsError) {
        console.error('Error inserting line items batch:', lineItemsError);
        // Cleanup: delete the structure if line items failed and it's a new structure
        if (!overwriteMode) {
          await supabase
            .from('report_structures')
            .delete()
            .eq('report_structure_id', structureId);
        }
        
        throw new Error(`Failed to insert line items: ${lineItemsError.message}`);
      }

      insertedCount += batch.length;
      console.log(`Inserted ${insertedCount}/${lineItems.length} line items`);
    }

    console.log(`Successfully processed structure with ${lineItems.length} line items`);

    return new Response(
      JSON.stringify({
        success: true,
        structure_id: structureId,
        structure_name: overwriteMode ? currentStructureName : structureName,
        line_items_count: lineItems.length,
        version: version,
        overwrite_mode: overwriteMode,
        unmapped_columns_stored: unmappedColumns.length,
        column_mappings: columnMappings.length,
        message: `Report structure "${overwriteMode ? currentStructureName : structureName}" processed successfully`
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
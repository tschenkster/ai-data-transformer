import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportStructureData {
  report_line_item_key: string;
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { structureData, filename, userId, userEmail } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing report structure: ${filename} for user: ${userEmail}`);

    // Validate input data
    if (!Array.isArray(structureData) || structureData.length === 0) {
      throw new Error('Invalid structure data provided');
    }

    // Generate structure name from filename
    const structureName = filename.replace(/\.(csv|xlsx|xls)$/i, '');

    // Start transaction by creating the report structure
    const { data: structure, error: structureError } = await supabase
      .from('report_structures')
      .insert({
        report_structure_name: structureName,
        is_active: false, // Will be set by trigger if it's the first one
        created_by_user_id: userId,
        created_by_user_name: userEmail,
        version: 1
      })
      .select()
      .single();

    if (structureError) {
      console.error('Error creating structure:', structureError);
      throw new Error(`Failed to create report structure: ${structureError.message}`);
    }

    console.log(`Created structure with ID: ${structure.report_structure_id}`);

    // Process and validate line items
    const lineItems = structureData.map((item: ReportStructureData, index: number) => {
      // Validate required fields
      if (!item.report_line_item_key) {
        throw new Error(`Missing report_line_item_key at row ${index + 1}`);
      }

      return {
        report_structure_id: structure.report_structure_id,
        report_structure_name: structureName,
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
        comment: item.comment || null
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
        // Cleanup: delete the structure if line items failed
        await supabase
          .from('report_structures')
          .delete()
          .eq('report_structure_id', structure.report_structure_id);
        
        throw new Error(`Failed to insert line items: ${lineItemsError.message}`);
      }

      insertedCount += batch.length;
      console.log(`Inserted ${insertedCount}/${lineItems.length} line items`);
    }

    console.log(`Successfully processed structure with ${lineItems.length} line items`);

    return new Response(
      JSON.stringify({
        success: true,
        structure_id: structure.report_structure_id,
        structure_name: structureName,
        line_items_count: lineItems.length,
        message: `Report structure "${structureName}" processed successfully`
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
// Python Service Integration for Enhanced Processing
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

export async function processWithPythonService(
  supabase: any,
  filePath: string,
  fileName: string, 
  entityUuid: string,
  persistToDatabase: boolean,
  pythonServiceUrl: string
) {
  console.log('Using enhanced processing with Docling + pandas');
  
  try {
    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('user-uploads-trial-balances')
      .download(filePath);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Convert to form data for Python service
    const formData = new FormData();
    formData.append('file', new Blob([await fileData.arrayBuffer()]), fileName);
    formData.append('entity_uuid', entityUuid);
    formData.append('persist_to_database', persistToDatabase.toString());

    // Call Python service
    const response = await fetch(`${pythonServiceUrl}/process-file`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Python service error: ${errorText}`);
    }

    const result = await response.json();
    console.log(`Enhanced processing completed: ${result.row_count} rows processed`);

    // If persistence requested, save to database
    if (persistToDatabase && result.data) {
      const { data: insertResult, error: insertError } = await supabase
        .rpc('insert_trial_balance_data', { p_data: result.data });

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`Failed to save data: ${insertError.message}`);
      }

      result.persistResult = insertResult;
    }

    return new Response(JSON.stringify({
      success: true,
      enhanced_processing: true,
      characteristics: result.characteristics,
      data: result.data,
      rowCount: result.row_count,
      validation_results: result.validation_results,
      quality_report: result.quality_report,
      message: `Enhanced processing completed: ${result.message}`,
      processing_capabilities: [
        'Advanced PDF table extraction with Docling',
        'German accounting format support with pandas', 
        'Comprehensive data validation and quality analysis',
        'AI-powered file characteristic detection'
      ]
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Enhanced processing failed, falling back to legacy:', error);
    throw error; // Will trigger fallback to legacy processing
  }
}
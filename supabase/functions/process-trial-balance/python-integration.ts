// Python Service Integration for Enhanced Processing
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

export async function processWithPythonService(
  supabase: any,
  filePath: string,
  fileName: string, 
  entityUuid: string,
  persistToDatabase: boolean,
  forcePersist: boolean,
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
    console.log(`✅ GPT-5 Enhanced processing completed: ${result.row_count} rows processed`);
    console.log(`📊 Processing capabilities used: ${result.processing_capabilities || 'Standard Docling + pandas'}`);
    
    // Check if this requires a different workflow (non-trial balance)
    const isTrialBalance = result.characteristics?.content_type === 'trial_balance';
    console.log(`🔍 Content type detected as '${result.characteristics?.content_type}', is trial balance: ${isTrialBalance}`);

    // For non-trial balance files, return confirmation data unless forcePersist is true
    if (!isTrialBalance && !forcePersist) {
      const previewData = result.data?.slice(0, 5).map((row: any) => ({
        account_number: row.account_number,
        account_description: row.account_description,
        account_type: row.account_type,
        amount: row.amount,
        period_key_yyyymm: row.period_key_yyyymm,
        currency_code: row.currency_code
      })) || [];

      return new Response(JSON.stringify({
        success: true,
        enhanced_processing: true,
        content_type_warning: true,
        detected_content_type: result.characteristics?.content_type || 'unknown',
        message: `This file appears to be a ${(result.characteristics?.content_type || 'unknown').replace('_', ' ')} rather than a trial balance.`,
        data: result.data,
        preview_data: previewData,
        rowCount: result.row_count || 0,
        characteristics: result.characteristics,
        processing_method: 'enhanced'
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If persistence requested and (is trial balance OR forcePersist), save to database
    if (persistToDatabase && (isTrialBalance || forcePersist)) {
      console.log(`Persisting ${result.row_count} rows to database for entity ${entityUuid} (forcePersist: ${forcePersist})`);
      
      const { data: insertResult, error: insertError } = await supabase
        .rpc('insert_trial_balance_data', { p_data: result.data });

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`Failed to save data: ${insertError.message}`);
      }

      console.log('Data saved to database:', insertResult);
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
      persistResult: result.persistResult,
      message: persistToDatabase 
        ? `Successfully processed and saved ${result.row_count} trial balance records`
        : `Enhanced processing completed: ${result.message}`,
      processing_method: 'enhanced',
      processing_capabilities: [
        'GPT-5 powered intelligent column mapping',
        'Advanced German accounting terminology recognition',
        'Account description inference using GPT-5',
        'Enhanced Docling PDF table extraction',
        'German format support with pandas', 
        'AI-powered data validation and quality analysis'
      ]
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Enhanced processing failed, falling back to legacy:', error);
    throw error; // Will trigger fallback to legacy processing
  }
}
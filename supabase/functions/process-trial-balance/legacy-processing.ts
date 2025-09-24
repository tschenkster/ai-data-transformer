// Legacy processing fallback method
import { corsHeaders } from '../_shared/cors.ts';

export async function processWithLegacyMethod(
  supabase: any,
  filePath: string,
  fileName: string,
  entityUuid: string,
  persistToDatabase: boolean
) {
  console.log('Processing with fallback legacy method');
  
  try {
    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('trial-balance-uploads')
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    console.log(`File downloaded successfully, size: ${fileData.size} bytes`);
    
    // Basic file processing - return minimal structure for fallback
    const basicResult = {
      success: true,
      enhanced_processing: false,
      data: [],
      rowCount: 0,
      message: 'File processed with basic fallback method',
      processing_method: 'legacy_fallback',
      file_characteristics: {
        file_type: fileName.split('.').pop()?.toLowerCase() || 'unknown',
        content_type: 'unknown',
        origin_system: 'Unknown'
      }
    };
    
    return new Response(JSON.stringify(basicResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Legacy processing error:', error);
    return new Response(JSON.stringify({
      success: false,
      enhanced_processing: false,
      error: error.message,
      processing_method: 'legacy_fallback_error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessRawFileRequest {
  file_path: string
  entity_uuid: string
  user_uuid: string
  processing_phase: 'raw_storage' | 'normalization' | 'full_pipeline'
  custom_mapping?: Record<string, any>
  force_normalization?: boolean
  persist_to_database?: boolean
}

interface ProcessRawFileResponse {
  success: boolean
  phase: string
  file_uuid?: string
  processing_summary?: any
  normalization_result?: any
  message: string
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { 
      file_path, 
      entity_uuid, 
      user_uuid, 
      processing_phase = 'full_pipeline',
      custom_mapping,
      force_normalization = false,
      persist_to_database = false 
    }: ProcessRawFileRequest = await req.json()

    console.log(`Processing file with two-phase approach: ${file_path}, phase: ${processing_phase}`)

    // Get Python service URL
    const pythonServiceUrl = Deno.env.get('PYTHON_SERVICE_URL') || 'http://localhost:8000'

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('user-uploads-trial-balances')
      .download(file_path)

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`)
    }

    const filename = file_path.split('/').pop() || 'unknown_file'

    if (processing_phase === 'raw_storage' || processing_phase === 'full_pipeline') {
      console.log(`Phase 1: Storing raw data for file: ${filename}`)

      // Phase 1: Store raw data
      const formData = new FormData()
      formData.append('file', fileData, filename)
      formData.append('entity_uuid', entity_uuid)
      formData.append('user_uuid', user_uuid)

      const rawStorageResponse = await fetch(`${pythonServiceUrl}/process-raw-file`, {
        method: 'POST',
        body: formData,
      })

      if (!rawStorageResponse.ok) {
        const errorText = await rawStorageResponse.text()
        throw new Error(`Raw storage failed: ${rawStorageResponse.status} - ${errorText}`)
      }

      const rawStorageResult = await rawStorageResponse.json()

      if (!rawStorageResult.success) {
        throw new Error(`Raw storage failed: ${rawStorageResult.message}`)
      }

      console.log(`Phase 1 complete: ${rawStorageResult.processing_summary.rows_stored} rows stored`)

      // If only raw storage requested, return early
      if (processing_phase === 'raw_storage') {
        return new Response(
          JSON.stringify({
            success: true,
            phase: 'raw_storage',
            file_uuid: rawStorageResult.file_uuid,
            processing_summary: rawStorageResult.processing_summary,
            message: rawStorageResult.message
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      // Continue with normalization for full pipeline
      const file_uuid = rawStorageResult.file_uuid

      console.log(`Phase 2: Normalizing raw data for file UUID: ${file_uuid}`)

      // Phase 2: Normalize raw data
      const normalizationFormData = new FormData()
      normalizationFormData.append('file_uuid', file_uuid)
      normalizationFormData.append('entity_uuid', entity_uuid)
      normalizationFormData.append('persist_to_database', persist_to_database.toString())
      normalizationFormData.append('force_normalization', force_normalization.toString())
      
      if (custom_mapping) {
        normalizationFormData.append('custom_mapping', JSON.stringify(custom_mapping))
      }

      const normalizationResponse = await fetch(`${pythonServiceUrl}/normalize-raw-file`, {
        method: 'POST',
        body: normalizationFormData,
      })

      if (!normalizationResponse.ok) {
        const errorText = await normalizationResponse.text()
        throw new Error(`Normalization failed: ${normalizationResponse.status} - ${errorText}`)
      }

      const normalizationResult = await normalizationResponse.json()

      if (!normalizationResult.success) {
        throw new Error(`Normalization failed: ${normalizationResult.message}`)
      }

      console.log(`Phase 2 complete: ${normalizationResult.normalization_result.normalized_rows} rows normalized`)

      // Persist to Supabase trial balance table if requested and successful
      let supabaseInsertResult = null
      if (persist_to_database && normalizationResult.normalization_result.normalized_rows > 0) {
        try {
          console.log('Persisting normalized data to Supabase...')
          
          // Call the existing insert_trial_balance_data RPC function
          const { data: insertData, error: insertError } = await supabase.rpc(
            'insert_trial_balance_data',
            {
              p_entity_uuid: entity_uuid,
              p_trial_balance_data: normalizationResult.normalization_result.processing_summary?.processed_data || []
            }
          )

          if (insertError) {
            console.error('Supabase insert error:', insertError)
          } else {
            supabaseInsertResult = insertData
            console.log('Successfully persisted to Supabase trial balance table')
          }
        } catch (e) {
          console.error('Error persisting to Supabase:', e)
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          phase: 'full_pipeline',
          file_uuid,
          processing_summary: rawStorageResult.processing_summary,
          normalization_result: normalizationResult.normalization_result,
          supabase_insert_result: supabaseInsertResult,
          message: `Two-phase processing complete. ${normalizationResult.normalization_result.normalized_rows} rows processed.`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )

    } else if (processing_phase === 'normalization') {
      // Phase 2 only: Normalize existing raw data
      console.log(`Phase 2 only: Normalizing existing raw data`)

      const normalizationFormData = new FormData()
      normalizationFormData.append('file_uuid', file_path) // Use file_path as file_uuid for normalization-only
      normalizationFormData.append('entity_uuid', entity_uuid)
      normalizationFormData.append('persist_to_database', persist_to_database.toString())
      normalizationFormData.append('force_normalization', force_normalization.toString())
      
      if (custom_mapping) {
        normalizationFormData.append('custom_mapping', JSON.stringify(custom_mapping))
      }

      const normalizationResponse = await fetch(`${pythonServiceUrl}/normalize-raw-file`, {
        method: 'POST',
        body: normalizationFormData,
      })

      if (!normalizationResponse.ok) {
        const errorText = await normalizationResponse.text()
        throw new Error(`Normalization failed: ${normalizationResponse.status} - ${errorText}`)
      }

      const normalizationResult = await normalizationResponse.json()

      return new Response(
        JSON.stringify({
          success: true,
          phase: 'normalization',
          normalization_result: normalizationResult.normalization_result,
          message: normalizationResult.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    throw new Error(`Invalid processing_phase: ${processing_phase}`)

  } catch (error) {
    console.error('Error in process-raw-file function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'File processing failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
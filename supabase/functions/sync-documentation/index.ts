import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FileObject {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: {
    eTag?: string;
    size?: number;
    mimetype?: string;
    cacheControl?: string;
    lastModified?: string;
    contentLength?: number;
    httpStatusCode?: number;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting documentation sync process...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify user is authenticated and is super admin
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication failed' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user is super admin
    const { data: isSuperAdmin } = await supabase.rpc('is_super_admin_user');
    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Access denied: Super admin privileges required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User authenticated as super admin');

    // Fetch files from database-docs bucket, sorted by created_at desc to get the latest
    console.log('Fetching latest documentation files...');
    const { data: files, error: listError } = await supabase.storage
      .from('database-docs')
      .list('', {
        limit: 10,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('Error listing files:', listError);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to list files: ${listError.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Filter for database structure files and get the latest
    const databaseFiles = files?.filter(file => 
      file.name.startsWith('DATABASE-STRUCTURE_') && file.name.endsWith('.md')
    ) || [];

    if (databaseFiles.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No database structure files found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const latestFile = databaseFiles[0]; // Already sorted by created_at desc
    console.log(`Found latest database documentation: ${latestFile.name}`);

    // Download the file
    console.log('Downloading file from storage...');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('database-docs')
      .download(latestFile.name);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to download file: ${downloadError.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Convert blob to text
    const fileContent = await fileData.text();
    console.log(`Downloaded file content (${fileContent.length} characters)`);

    // Log the sync operation
    await supabase.rpc('log_security_event', {
      p_action: 'documentation_sync',
      p_target_user_id: user.id,
      p_details: {
        filename: latestFile.name,
        file_size: fileData.size,
        sync_timestamp: new Date().toISOString(),
        operation: 'download_to_local_docs'
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        filename: latestFile.name,
        size: fileData.size,
        content: fileContent,
        synced_at: new Date().toISOString(),
        message: `Successfully synced ${latestFile.name} to local documentation`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in documentation sync:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error during documentation sync',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
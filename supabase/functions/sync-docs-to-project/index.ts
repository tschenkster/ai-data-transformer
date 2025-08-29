import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncResult {
  success: boolean;
  synced_files: string[];
  docs_updated: boolean;
  error?: string;
  total_files?: number;
  total_size?: number;
  file_contents?: Array<{
    filename: string;
    path: string;
    content: string;
    size: number;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting docs synchronization to project...');

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Admin client for storage (bypasses RLS as needed)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

    const token = authHeader.replace('Bearer ', '');

    // User-scoped client for RPC that relies on auth.uid()
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false }
    });

    // Verify user token
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication failed' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user is super admin using user-scoped client (for proper auth.uid())
    const { data: isSuperAdmin, error: superAdminErr } = await supabaseUser.rpc('is_super_admin_user');
    if (superAdminErr || !isSuperAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Access denied: Super admin privileges required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User authenticated as super admin');

    const syncedFiles: string[] = [];
    let totalSize = 0;
    const fileContents: Array<{
      filename: string;
      path: string;
      content: string;
      size: number;
    }> = [];

    // Sync database documentation
    console.log('Syncing database documentation...');
    const { data: dbFiles, error: dbListError } = await supabaseAdmin.storage
      .from('database-docs')
      .list('', {
        limit: 5,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (!dbListError && dbFiles && dbFiles.length > 0) {
      const latestDbFile = dbFiles[0];
      if (latestDbFile.name.startsWith('DATABASE-STRUCTURE_') && latestDbFile.name.endsWith('.md')) {
        const { data: dbFileData, error: dbDownloadError } = await supabaseAdmin.storage
          .from('database-docs')
          .download(latestDbFile.name);

        if (!dbDownloadError && dbFileData) {
          const content = await dbFileData.text();
          console.log(`Synced database documentation: ${latestDbFile.name} (${dbFileData.size} bytes)`);
          syncedFiles.push(`docs/database/${latestDbFile.name}`);
          totalSize += dbFileData.size || 0;
          
          fileContents.push({
            filename: latestDbFile.name,
            path: `docs/database/${latestDbFile.name}`,
            content: content,
            size: dbFileData.size || 0
          });
        }
      }
    }

    // Sync codebase documentation
    console.log('Syncing codebase documentation...');
    const { data: codebaseFiles, error: codebaseListError } = await supabaseAdmin.storage
      .from('codebase-docs')
      .list('', {
        limit: 5,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (!codebaseListError && codebaseFiles && codebaseFiles.length > 0) {
      const latestCodebaseFile = codebaseFiles[0];
      if (latestCodebaseFile.name.startsWith('CODEBASE-STRUCTURE_') && latestCodebaseFile.name.endsWith('.md')) {
        const { data: codebaseFileData, error: codebaseDownloadError } = await supabaseAdmin.storage
          .from('codebase-docs')
          .download(latestCodebaseFile.name);

        if (!codebaseDownloadError && codebaseFileData) {
          const content = await codebaseFileData.text();
          console.log(`Synced codebase documentation: ${latestCodebaseFile.name} (${codebaseFileData.size} bytes)`);
          syncedFiles.push(`docs/codebase/${latestCodebaseFile.name}`);
          totalSize += codebaseFileData.size || 0;
          
          fileContents.push({
            filename: latestCodebaseFile.name,
            path: `docs/codebase/${latestCodebaseFile.name}`,
            content: content,
            size: codebaseFileData.size || 0
          });
        }
      }
    }

    // Create README files for docs structure
    const docsReadmeFiles = [
      {
        filename: 'README.md',
        path: 'docs/README.md',
        content: `# Documentation

This folder contains auto-generated documentation for the project.

## Structure

- \`database/\` - Database schema and structure documentation
- \`codebase/\` - Codebase structure and analysis documentation
- \`api/\` - API documentation

## Auto-Generated Files

The documentation in this folder is automatically generated and synced from the system's documentation generators. Manual edits may be overwritten during the next sync.

Last updated: ${new Date().toISOString()}
`,
        size: 0
      },
      {
        filename: 'README.md',
        path: 'docs/database/README.md',
        content: `# Database Documentation

This folder contains auto-generated database documentation.

## Files

The latest database structure documentation is automatically synced here from the system's database documentation generator.

Last updated: ${new Date().toISOString()}
`,
        size: 0
      },
      {
        filename: 'README.md',
        path: 'docs/codebase/README.md',
        content: `# Codebase Documentation

This folder contains auto-generated codebase documentation.

## Files

The latest codebase structure analysis is automatically synced here from the system's codebase documentation generator.

Last updated: ${new Date().toISOString()}
`,
        size: 0
      }
    ];

    // Add README files to content and sync lists
    fileContents.push(...docsReadmeFiles);
    syncedFiles.push(...docsReadmeFiles.map(f => f.path));

    // Log the sync operation
    await supabaseUser.rpc('log_security_event', {
      p_action: 'docs_sync_to_project',
      p_target_user_id: user.id,
      p_details: {
        synced_files: syncedFiles,
        total_files: syncedFiles.length,
        total_size: totalSize,
        sync_timestamp: new Date().toISOString(),
        operation: 'sync_docs_to_project_folder'
      }
    });

    const result: SyncResult = {
      success: true,
      synced_files: syncedFiles,
      docs_updated: syncedFiles.length > 0,
      total_files: syncedFiles.length,
      total_size: totalSize,
      file_contents: fileContents
    };

    console.log(`Documentation sync completed: ${syncedFiles.length} files synced (${totalSize} bytes)`);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in docs sync:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error during documentation sync',
        details: error.message 
      } as SyncResult),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
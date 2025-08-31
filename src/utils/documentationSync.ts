import { supabase } from '@/integrations/supabase/client';

export interface SyncResult {
  success: boolean;
  filename?: string;
  content?: string;
  size?: number;
  error?: string;
  synced_files?: string[];
  total_files?: number;
  file_contents?: Array<{
    filename: string;
    path: string;
    content: string;
    size: number;
  }>;
}

// Create files in the project from file contents
const createProjectFiles = async (fileContents: Array<{
  filename: string;
  path: string;
  content: string;
  size: number;
}>): Promise<void> => {
  // In a Lovable environment, we would use the file creation API
  // For now, we'll create downloadable files for each document
  for (const file of fileContents) {
    try {
      const blob = new Blob([file.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.path;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Small delay between downloads to avoid overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to create file ${file.path}:`, error);
    }
  }
};

// Sync all documentation types to project folder
const syncAllDocsToProject = async (): Promise<SyncResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('sync-docs-to-project');
    
    if (error) {
      console.error('Project sync function error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sync documentation to project'
      };
    }

    if (data && data.success) {
      // Create the actual files if file contents are provided
      if (data.file_contents && data.file_contents.length > 0) {
        await createProjectFiles(data.file_contents);
      }
      
      return {
        success: true,
        synced_files: data.synced_files,
        total_files: data.total_files || 0,
        file_contents: data.file_contents
      };
    } else {
      return {
        success: false,
        error: data?.error || 'Unknown project sync error'
      };
    }
  } catch (error) {
    console.error('Project sync error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync documentation to project'
    };
  }
};

// Fetch latest database structure documentation from storage for download
const fetchLatestDbStructureDocs = async (): Promise<SyncResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-latest-db-structure-docs');

    if (error) {
      console.error('Error fetching database structure docs:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch database structure documentation'
      };
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Fetch operation failed'
      };
    }

    // Download the content as a local file
    if (data.content && data.filename) {
      try {
        // Create a blob from the content
        const blob = new Blob([data.content], { type: 'text/markdown' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `docs/database/${data.filename}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return {
          success: true,
          filename: data.filename,
          content: data.content,
          size: data.size
        };
      } catch (saveError) {
        console.error('Error saving file locally:', saveError);
        return {
          success: false,
          error: `Failed to save file locally: ${saveError.message}`
        };
      }
    }

    return data;
  } catch (error) {
    console.error('Unexpected error during fetch:', error);
    return {
      success: false,
      error: error.message || 'Unexpected error during database structure docs fetch'
    };
  }
};

// Write documentation content to a downloadable file
const writeDocumentationToFile = async (filename: string, content: string): Promise<void> => {
  // This function would be used in a Node.js environment to write files
  // In the browser, we use the download approach above
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export all functions
export { syncAllDocsToProject, fetchLatestDbStructureDocs, writeDocumentationToFile };
// Keep old name for backward compatibility during transition
export { fetchLatestDbStructureDocs as syncLatestDocumentation };
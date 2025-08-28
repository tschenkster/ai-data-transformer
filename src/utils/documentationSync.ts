import { supabase } from '@/integrations/supabase/client';

export interface SyncResult {
  success: boolean;
  filename?: string;
  content?: string;
  size?: number;
  error?: string;
}

export const syncLatestDocumentation = async (): Promise<SyncResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('sync-documentation', {
      body: { action: 'sync' }
    });

    if (error) {
      console.error('Error syncing documentation:', error);
      return {
        success: false,
        error: error.message || 'Failed to sync documentation'
      };
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Sync operation failed'
      };
    }

    // Save the content to local file in docs/database/
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
    console.error('Unexpected error during sync:', error);
    return {
      success: false,
      error: error.message || 'Unexpected error during documentation sync'
    };
  }
};

export const writeDocumentationToFile = async (filename: string, content: string): Promise<void> => {
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
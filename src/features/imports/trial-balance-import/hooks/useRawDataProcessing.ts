import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProcessingResult {
  success: boolean;
  phase: 'raw_storage' | 'normalization' | 'full_pipeline';
  file_uuid?: string;
  summary?: string;
  detailed_summary?: any;
  error?: string;
}

interface ProcessingOptions {
  persist_to_database?: boolean;
  custom_mapping?: Record<string, string>;
  processing_phase: 'raw_storage' | 'normalization' | 'full_pipeline';
}

export function useRawDataProcessing() {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<'raw_storage' | 'normalization' | 'complete' | null>(null);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const { toast } = useToast();

  const sanitizeFileName = (fileName: string): string => {
    const lastDotIndex = fileName.lastIndexOf('.');
    const name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
    
    const sanitized = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s-_]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
    
    return sanitized + extension.toLowerCase();
  };

  const uploadFile = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedOriginalName = sanitizeFileName(file.name);
    const fileName = `raw-data-${sanitizedOriginalName}-${timestamp}`;
    const filePath = `${user.id}/${fileName}`;

    const { error } = await supabase.storage
      .from('user-uploads-trial-balances')
      .upload(filePath, file);

    if (error) {
      if (error.message.includes('Invalid key')) {
        throw new Error('File name contains invalid characters. Please rename your file using only letters, numbers, and hyphens.');
      }
      throw new Error(`Upload failed: ${error.message}`);
    }

    return filePath;
  };

  const processFile = async (
    file: File, 
    entityUuid: string, 
    options: ProcessingOptions
  ): Promise<ProcessingResult> => {
    try {
      setUploading(true);
      setProcessing(false);
      setUploadProgress(0);

      // Phase 1: Upload file
      setUploadProgress(25);
      const filePath = await uploadFile(file);
      
      setUploading(false);
      setProcessing(true);
      setUploadProgress(50);

      // Phase 2: Process with new raw data system
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      setCurrentPhase(options.processing_phase === 'full_pipeline' ? 'raw_storage' : options.processing_phase);

      const response = await supabase.functions.invoke('process-raw-file', {
        body: {
          file_path: filePath,
          entity_uuid: entityUuid,
          user_uuid: session.user.id,
          processing_phase: options.processing_phase,
          persist_to_database: options.persist_to_database || false,
          custom_mapping: options.custom_mapping
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setUploadProgress(100);
      setCurrentPhase('complete');
      
      const result = response.data as ProcessingResult;
      setProcessingResult(result);

      if (result.success) {
        toast({
          title: 'Success',
          description: result.summary || `Successfully completed ${result.phase} phase`,
        });
      } else {
        throw new Error(result.error || 'Processing failed');
      }

      return result;

    } catch (error: any) {
      console.error('Processing error:', error);
      const errorResult: ProcessingResult = {
        success: false,
        phase: options.processing_phase,
        error: error.message
      };
      setProcessingResult(errorResult);
      
      toast({
        title: 'Processing Failed',
        description: error.message,
        variant: 'destructive'
      });

      throw error;
    } finally {
      setUploading(false);
      setProcessing(false);
      setUploadProgress(0);
      setCurrentPhase(null);
    }
  };

  const processStoredFile = async (
    fileUuid: string,
    options: Omit<ProcessingOptions, 'processing_phase'> & { processing_phase: 'normalization' }
  ): Promise<ProcessingResult> => {
    try {
      setProcessing(true);
      setCurrentPhase('normalization');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('process-raw-file', {
        body: {
          file_uuid: fileUuid,
          user_uuid: session.user.id,
          processing_phase: 'normalization',
          persist_to_database: options.persist_to_database || false,
          custom_mapping: options.custom_mapping
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data as ProcessingResult;
      setProcessingResult(result);
      setCurrentPhase('complete');

      if (result.success) {
        toast({
          title: 'Success',
          description: result.summary || 'Successfully completed normalization phase',
        });
      } else {
        throw new Error(result.error || 'Normalization failed');
      }

      return result;

    } catch (error: any) {
      console.error('Normalization error:', error);
      const errorResult: ProcessingResult = {
        success: false,
        phase: 'normalization',
        error: error.message
      };
      setProcessingResult(errorResult);
      
      toast({
        title: 'Normalization Failed',
        description: error.message,
        variant: 'destructive'
      });

      throw error;
    } finally {
      setProcessing(false);
      setCurrentPhase(null);
    }
  };

  const reset = () => {
    setProcessingResult(null);
    setUploadProgress(0);
    setCurrentPhase(null);
    setUploading(false);
    setProcessing(false);
  };

  return {
    // State
    uploading,
    processing,
    uploadProgress,
    currentPhase,
    processingResult,

    // Actions
    processFile,
    processStoredFile,
    reset
  };
}
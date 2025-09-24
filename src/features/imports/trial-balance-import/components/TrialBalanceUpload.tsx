import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileSpreadsheet, Upload, Database, AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRawDataProcessing } from '../hooks/useRawDataProcessing';

interface TrialBalanceUploadProps {
  entityUuid: string;
  onUploadComplete?: (result: any) => void;
}

interface ProcessingResult {
  success: boolean;
  phase: 'raw_storage' | 'normalization' | 'full_pipeline';
  file_uuid?: string;
  summary?: string;
  detailed_summary?: any;
  error?: string;
}

export function TrialBalanceUpload({ entityUuid, onUploadComplete }: TrialBalanceUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'raw_storage' | 'normalization' | 'full_pipeline'>('full_pipeline');
  const [storedFileUuid, setStoredFileUuid] = useState<string | null>(null);
  const { toast } = useToast();
  
  const {
    uploading,
    processing,
    uploadProgress,
    currentPhase,
    processingResult,
    processFile,
    processStoredFile,
    reset
  } = useRawDataProcessing();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf']
    },
    multiple: false,
    maxSize: 20 * 1024 * 1024, // 20MB limit
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        reset();
      }
    },
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      if (error?.code === 'file-too-large') {
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 20MB.',
          variant: 'destructive'
        });
      } else if (error?.code === 'file-invalid-type') {
        toast({
          title: 'Invalid file type',
          description: 'Please select an XLSX, CSV, or PDF file.',
          variant: 'destructive'
        });
      }
    }
  });

  const handleProcessRawStorage = async () => {
    if (!selectedFile) return;

    try {
      const result = await processFile(selectedFile, entityUuid, {
        processing_phase: 'raw_storage',
        persist_to_database: false
      });

      if (result.success && result.file_uuid) {
        setStoredFileUuid(result.file_uuid);
        setActiveTab('normalization');
      }

      onUploadComplete?.(result);
    } catch (error) {
      console.error('Raw storage processing error:', error);
    }
  };

  const handleProcessNormalization = async () => {
    if (!storedFileUuid) return;

    try {
      const result = await processStoredFile(storedFileUuid, {
        processing_phase: 'normalization',
        persist_to_database: true
      });

      onUploadComplete?.(result);
    } catch (error) {
      console.error('Normalization processing error:', error);
    }
  };

  const handleProcessFullPipeline = async (persistToDatabase: boolean) => {
    if (!selectedFile) return;

    try {
      const result = await processFile(selectedFile, entityUuid, {
        processing_phase: 'full_pipeline',
        persist_to_database: persistToDatabase
      });

      onUploadComplete?.(result);
    } catch (error) {
      console.error('Full pipeline processing error:', error);
    }
  };

  const getPhaseDescription = (phase: string) => {
    switch (phase) {
      case 'raw_storage':
        return 'Store file data in its original format for inspection and validation';
      case 'normalization':
        return 'Transform raw data into structured trial balance format';
      case 'full_pipeline':
        return 'Complete end-to-end processing with both storage and normalization';
      default:
        return '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Trial Balance Upload - Two-Phase Processing
          </CardTitle>
          <CardDescription>
            Upload your trial balance in XLSX, CSV, or PDF format. Maximum file size: 20MB.
            Choose between raw storage first or complete processing pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-lg">Drop your trial balance file here...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Drag & drop your trial balance file here</p>
                <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
                <Button variant="outline" type="button">
                  Browse Files
                </Button>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                  </p>
                </div>
                <Badge variant="secondary">{selectedFile.name.split('.').pop()?.toUpperCase()}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Progress */}
      {(uploading || processing) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary animate-spin" />
                <span className="text-sm font-medium">
                  {uploading && 'Uploading file...'}
                  {processing && currentPhase === 'raw_storage' && 'Processing raw data storage...'}
                  {processing && currentPhase === 'normalization' && 'Normalizing data...'}
                  {processing && !currentPhase && 'Processing trial balance...'}
                </span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {currentPhase === 'raw_storage' && 'Phase 1: Storing raw file data...'}
                {currentPhase === 'normalization' && 'Phase 2: Converting to trial balance format...'}
                {!currentPhase && 'This may take up to 60 seconds for large files.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Options - Two-Phase System */}
      {selectedFile && !uploading && !processing && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Options</CardTitle>
            <CardDescription>
              Choose your processing approach: phase-by-phase control or complete pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="raw_storage" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Raw Storage
                </TabsTrigger>
                <TabsTrigger value="normalization" className="flex items-center gap-2" disabled={!storedFileUuid}>
                  <ArrowRight className="h-4 w-4" />
                  Normalization
                </TabsTrigger>
                <TabsTrigger value="full_pipeline" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Full Pipeline
                </TabsTrigger>
              </TabsList>

              <TabsContent value="raw_storage" className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Phase 1: Raw Storage</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {getPhaseDescription('raw_storage')}
                  </p>
                  <Button onClick={handleProcessRawStorage} className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Store Raw Data
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="normalization" className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Phase 2: Normalization</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {getPhaseDescription('normalization')}
                  </p>
                  {storedFileUuid ? (
                    <Button onClick={handleProcessNormalization} className="w-full">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Normalize Stored Data
                    </Button>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Complete Phase 1 (Raw Storage) first to enable normalization.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="full_pipeline" className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Complete Pipeline</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {getPhaseDescription('full_pipeline')}
                  </p>
                  <div className="grid gap-2 md:grid-cols-2">
                    <Button 
                      onClick={() => handleProcessFullPipeline(false)}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Process Only</span>
                      </div>
                      <p className="text-sm text-muted-foreground text-left">
                        Complete processing without database persistence
                      </p>
                    </Button>

                    <Button 
                      onClick={() => handleProcessFullPipeline(true)}
                      className="h-auto p-4 flex flex-col items-start gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        <span className="font-medium">Process & Save</span>
                      </div>
                      <p className="text-sm text-muted-foreground text-left">
                        Complete processing and save to database
                      </p>
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Processing Results */}
      {processingResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {processingResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Processing Results - {processingResult.phase.replace('_', ' ').toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {processingResult.success ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">
                    {processingResult.phase === 'raw_storage' && 'Raw data stored successfully'}
                    {processingResult.phase === 'normalization' && 'Data normalized successfully'}
                    {processingResult.phase === 'full_pipeline' && 'Processing completed successfully'}
                  </span>
                </div>

                {processingResult.summary && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{processingResult.summary}</AlertDescription>
                  </Alert>
                )}

                {processingResult.detailed_summary && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Processing Details</h4>
                    <pre className="text-sm whitespace-pre-wrap">
                      {typeof processingResult.detailed_summary === 'string' 
                        ? processingResult.detailed_summary 
                        : JSON.stringify(processingResult.detailed_summary, null, 2)}
                    </pre>
                  </div>
                )}

                {processingResult.file_uuid && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">File Information</h4>
                    <p className="text-sm text-muted-foreground">
                      File UUID: <code className="bg-muted px-2 py-1 rounded text-xs">{processingResult.file_uuid}</code>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {processingResult.error || 'An error occurred during processing'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
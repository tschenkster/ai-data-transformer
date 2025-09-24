import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Upload, Database, AlertCircle, CheckCircle } from 'lucide-react';

interface ProcessingResult {
  success: boolean;
  phase: string;
  file_uuid?: string;
  processing_summary?: any;
  normalization_result?: any;
  message: string;
}

const RawDataProcessor = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingPhase, setProcessingPhase] = useState<'raw_storage' | 'normalization' | 'full_pipeline'>('full_pipeline');
  const [persistToDatabase, setPersistToDatabase] = useState(false);
  const [forceNormalization, setForceNormalization] = useState(false);
  const [fileUuid, setFileUuid] = useState<string>('');
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
    },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        setProcessingResult(null);
      }
    },
  });

  const uploadFile = async (file: File) => {
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `raw-uploads/${Date.now()}_${sanitizedFileName}`;

    const { error } = await supabase.storage
      .from('file-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return filePath;
  };

  const processFile = async (phase: 'raw_storage' | 'normalization' | 'full_pipeline') => {
    if (!selectedFile && phase !== 'normalization') {
      toast.error('Please select a file first');
      return;
    }

    if (phase === 'normalization' && !fileUuid) {
      toast.error('Please provide a file UUID for normalization');
      return;
    }

    setProcessing(true);
    setUploadProgress(0);
    
    try {
      let filePath = fileUuid; // For normalization phase
      
      if (phase !== 'normalization' && selectedFile) {
        // Upload file to storage
        setUploadProgress(25);
        filePath = await uploadFile(selectedFile);
        setUploadProgress(50);
      }

      // Process with Python service through edge function
      const { data, error } = await supabase.functions.invoke('process-raw-file', {
        body: {
          file_path: filePath,
          entity_uuid: '123e4567-e89b-12d3-a456-426614174000', // Default entity UUID
          user_uuid: '123e4567-e89b-12d3-a456-426614174001', // Default user UUID
          processing_phase: phase,
          persist_to_database: persistToDatabase,
          force_normalization: forceNormalization,
        },
      });

      if (error) throw error;

      setUploadProgress(100);
      setProcessingResult(data);
      
      if (data.file_uuid) {
        setFileUuid(data.file_uuid);
      }

      toast.success(data.message);
    } catch (error) {
      console.error('Processing error:', error);
      toast.error(`Processing failed: ${error.message}`);
      setProcessingResult({
        success: false,
        phase: phase,
        message: error.message,
      });
    } finally {
      setProcessing(false);
      setTimeout(() => setUploadProgress(0), 2000);
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
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Raw Data Processor
          </CardTitle>
          <CardDescription>
            Two-phase file processing with complete transparency. Store raw data first, then normalize separately.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={processingPhase} onValueChange={(value: any) => setProcessingPhase(value)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="raw_storage" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Phase 1: Raw Storage
          </TabsTrigger>
          <TabsTrigger value="normalization" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Phase 2: Normalization
          </TabsTrigger>
          <TabsTrigger value="full_pipeline" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Full Pipeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="raw_storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Phase 1: Raw Data Storage</CardTitle>
              <CardDescription>
                Parse and store file content in human-readable format with complete transparency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                {selectedFile ? (
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                ) : (
                  <div>
                    <p>Drag & drop a file here, or click to select</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Supports: XLSX, XLS, CSV, PDF
                    </p>
                  </div>
                )}
              </div>

              <Button 
                onClick={() => processFile('raw_storage')} 
                disabled={!selectedFile || processing}
                className="w-full"
              >
                {processing ? 'Storing Raw Data...' : 'Store Raw Data Only'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="normalization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Phase 2: Data Normalization</CardTitle>
              <CardDescription>
                Convert previously stored raw data to trial balance format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-uuid">File UUID</Label>
                <input
                  id="file-uuid"
                  type="text"
                  value={fileUuid}
                  onChange={(e) => setFileUuid(e.target.value)}
                  placeholder="Enter file UUID from Phase 1"
                  className="w-full px-3 py-2 border border-input rounded-md"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="persist-db"
                  checked={persistToDatabase}
                  onCheckedChange={setPersistToDatabase}
                />
                <Label htmlFor="persist-db">Persist to Database</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="force-norm"
                  checked={forceNormalization}
                  onCheckedChange={setForceNormalization}
                />
                <Label htmlFor="force-norm">Force Normalization (ignore validation errors)</Label>
              </div>

              <Button 
                onClick={() => processFile('normalization')} 
                disabled={!fileUuid || processing}
                className="w-full"
              >
                {processing ? 'Normalizing Data...' : 'Normalize Raw Data'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="full_pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Full Pipeline: Raw Storage + Normalization</CardTitle>
              <CardDescription>
                Complete two-phase processing in one operation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                {selectedFile ? (
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                ) : (
                  <div>
                    <p>Drag & drop a file here, or click to select</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Supports: XLSX, XLS, CSV, PDF
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="persist-db-full"
                  checked={persistToDatabase}
                  onCheckedChange={setPersistToDatabase}
                />
                <Label htmlFor="persist-db-full">Persist to Database</Label>
              </div>

              <Button 
                onClick={() => processFile('full_pipeline')} 
                disabled={!selectedFile || processing}
                className="w-full"
              >
                {processing ? 'Processing Full Pipeline...' : 'Run Full Pipeline'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {processing && (
        <Card>
          <CardContent className="pt-6">
            <Progress value={uploadProgress} className="mb-2" />
            <p className="text-sm text-center text-muted-foreground">
              Processing... {uploadProgress}%
            </p>
          </CardContent>
        </Card>
      )}

      {processingResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {processingResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Processing Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={processingResult.success ? "default" : "destructive"}>
                {processingResult.phase}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {processingResult.message}
              </span>
            </div>

            {processingResult.file_uuid && (
              <Alert>
                <AlertDescription>
                  <strong>File UUID:</strong> {processingResult.file_uuid}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Use this UUID for Phase 2 normalization
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {processingResult.processing_summary && (
              <div className="space-y-2">
                <h4 className="font-medium">Processing Summary</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                  {JSON.stringify(processingResult.processing_summary, null, 2)}
                </pre>
              </div>
            )}

            {processingResult.normalization_result && (
              <div className="space-y-2">
                <h4 className="font-medium">Normalization Result</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                  {JSON.stringify(processingResult.normalization_result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RawDataProcessor;
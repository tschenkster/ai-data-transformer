import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet, Upload, Download, Database, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TrialBalanceUploadProps {
  entityUuid: string;
  onUploadComplete?: (result: any) => void;
}

interface ProcessingResult {
  success: boolean;
  data?: any[];
  rowCount?: number;
  characteristics?: any;
  message?: string;
  error?: string;
  enhanced_processing?: boolean;
  processing_method?: string;
  processing_capabilities?: string[];
  validation_results?: any;
  quality_report?: any;
  content_type_warning?: boolean;
  detected_content_type?: string;
  preview_data?: any[];
}

export function TrialBalanceUpload({ entityUuid, onUploadComplete }: TrialBalanceUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingResult, setPendingResult] = useState<ProcessingResult | null>(null);
  const { toast } = useToast();

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
        setProcessingResult(null);
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

  // Utility function to sanitize file names for Supabase Storage
  const sanitizeFileName = (fileName: string): string => {
    // Get file extension
    const lastDotIndex = fileName.lastIndexOf('.');
    const name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
    
    // Normalize and sanitize the name part
    const sanitized = name
      .normalize('NFD') // Decompose combined characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics/accents
      .replace(/[^a-zA-Z0-9\s-_]/g, '') // Keep only alphanumeric, spaces, hyphens, underscores
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .toLowerCase();
    
    return sanitized + extension.toLowerCase();
  };

  const uploadFile = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedOriginalName = sanitizeFileName(file.name);
    const fileName = `trial-balance-uploaded-${sanitizedOriginalName}-${timestamp}`;
    const filePath = `${user.id}/${fileName}`;

    const { error } = await supabase.storage
      .from('user-uploads-trial-balances')
      .upload(filePath, file);

    if (error) {
      // Provide more helpful error messages
      if (error.message.includes('Invalid key')) {
        throw new Error('File name contains invalid characters. Please rename your file using only letters, numbers, and hyphens.');
      }
      throw new Error(`Upload failed: ${error.message}`);
    }

    return filePath;
  };

  const processFile = async (filePath: string, fileName: string, options: { persistToDatabase: boolean }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const response = await supabase.functions.invoke('process-trial-balance', {
      body: {
        filePath,
        fileName,
        entityUuid,
        persistToDatabase: options.persistToDatabase
      }
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data;
  };

  const handleProcess = async (persistToDatabase: boolean) => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Upload file
      setUploadProgress(25);
      const filePath = await uploadFile(selectedFile);

      // Process file
      setUploading(false);
      setProcessing(true);
      setUploadProgress(50);

      // Always process with persistToDatabase: false initially to check for warnings
      const result = await processFile(filePath, selectedFile.name, { 
        persistToDatabase: false 
      });
      
      setUploadProgress(100);

      // Check if we have a content type warning and the user wants to save to database
      if (result.content_type_warning && persistToDatabase) {
        setPendingResult(result);
        setShowConfirmDialog(true);
        setProcessing(false);
        return;
      }

      // If no warning or user chose download only, proceed normally
      let finalResult = result;
      if (persistToDatabase && !result.content_type_warning) {
        // Re-process with persistToDatabase: true for clean trial balance files
        finalResult = await processFile(filePath, selectedFile.name, { persistToDatabase: true });
      }

      setProcessingResult(finalResult);
      
      toast({
        title: 'Success',
        description: persistToDatabase 
          ? `Successfully processed and saved ${finalResult.rowCount} rows`
          : `Successfully processed ${finalResult.rowCount} rows for download`,
      });

      onUploadComplete?.(finalResult);

    } catch (error: any) {
      console.error('Processing error:', error);
      setProcessingResult({
        success: false,
        error: error.message
      });
      toast({
        title: 'Processing Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      setProcessing(false);
      setUploadProgress(0);
    }
  };

  const handleConfirmSave = async () => {
    if (!selectedFile || !pendingResult) return;
    
    try {
      setProcessing(true);
      setShowConfirmDialog(false);
      
      // Re-process with persistToDatabase: true
      const filePath = await uploadFile(selectedFile);
      const result = await processFile(filePath, selectedFile.name, { persistToDatabase: true });
      
      setProcessingResult(result);
      
      toast({
        title: 'Success',
        description: `Successfully processed and saved ${result.rowCount} rows to database`,
      });

      onUploadComplete?.(result);
      setPendingResult(null);
      
    } catch (error: any) {
      console.error('Processing error:', error);
      setProcessingResult({
        success: false,
        error: error.message
      });
      toast({
        title: 'Processing Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadOnly = () => {
    if (pendingResult) {
      setProcessingResult(pendingResult);
      toast({
        title: 'Success',
        description: `Successfully processed ${pendingResult.rowCount} rows for download`,
      });
    }
    setShowConfirmDialog(false);
    setPendingResult(null);
  };

  const formatContentType = (contentType: string | undefined): string => {
    if (!contentType) return 'unknown file type';
    
    const typeMap: Record<string, string> = {
      'pl': 'P&L Report',
      'balance_sheet': 'Balance Sheet',
      'cash_flow': 'Cash Flow Statement',
      'trial_balance': 'Trial Balance'
    };
    
    return typeMap[contentType] || contentType.replace(/_/g, ' ').toUpperCase();
  };

  const downloadProcessedData = () => {
    if (!processingResult?.data) return;

    // Convert to CSV format
    const headers = Object.keys(processingResult.data[0]);
    const csvContent = [
      headers.join(','),
      ...processingResult.data.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed-trial-balance-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
            Upload Trial Balance
          </CardTitle>
          <CardDescription>
            Upload your trial balance in XLSX, CSV, or PDF format. Maximum file size: 20MB.
            Enhanced processing with Docling + pandas provides superior accuracy for complex documents.
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
                  {uploading ? 'Uploading file...' : 'Processing trial balance...'}
                </span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                This may take up to 60 seconds for large files.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Options */}
      {selectedFile && !uploading && !processing && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Options</CardTitle>
            <CardDescription>
              Choose how you want to handle the processed trial balance data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Button 
                onClick={() => handleProcess(false)}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2"
              >
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span className="font-medium">Download Only</span>
                </div>
                <p className="text-sm text-muted-foreground text-left">
                  Process and download as XLSX/CSV without saving to database
                </p>
              </Button>

              <Button 
                onClick={() => handleProcess(true)}
                className="h-auto p-4 flex flex-col items-start gap-2"
              >
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="font-medium">Save to Database</span>
                </div>
                <p className="text-sm text-muted-foreground text-left">
                  Process and persist data for future analysis and reporting
                </p>
              </Button>
            </div>
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
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              Processing Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {processingResult.success ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {processingResult.message || `Successfully processed ${processingResult.rowCount} rows`}
                  </AlertDescription>
                </Alert>

                {/* Enhanced Processing Indicator */}
                {processingResult.enhanced_processing && (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-900 dark:text-green-100">Enhanced Processing Used</span>
                    </div>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      This file was processed using Docling + pandas for superior accuracy and data quality.
                    </p>
                    {processingResult.processing_capabilities && (
                      <ul className="mt-2 text-xs text-green-700 dark:text-green-300 list-disc list-inside">
                        {processingResult.processing_capabilities.map((capability: string, idx: number) => (
                          <li key={idx}>{capability}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Processing Method Indicator */}
                <div className="mb-3 flex items-center gap-2">
                  <Badge variant={processingResult.enhanced_processing ? "default" : "outline"}>
                    {processingResult.enhanced_processing ? "Enhanced Processing" : "Standard Processing"}
                  </Badge>
                  {processingResult.processing_method && (
                    <Badge variant="secondary">{processingResult.processing_method}</Badge>
                  )}
                </div>

                {processingResult.characteristics && (
                  <div className="space-y-3">
                    <h4 className="font-medium">AI-Detected File Characteristics:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {processingResult.characteristics.contentType && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Content Type:</span>
                          <Badge variant="secondary">{processingResult.characteristics.contentType}</Badge>
                        </div>
                      )}
                      {processingResult.characteristics.reportingFrequency && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Frequency:</span>
                          <Badge variant="secondary">{processingResult.characteristics.reportingFrequency}</Badge>
                        </div>
                      )}
                      {processingResult.characteristics.currency && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Currency:</span>
                          <Badge variant="secondary">{processingResult.characteristics.currency}</Badge>
                        </div>
                      )}
                      {processingResult.characteristics.originSystem && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Origin System:</span>
                          <Badge variant="secondary">{processingResult.characteristics.originSystem}</Badge>
                        </div>
                      )}
                      {processingResult.characteristics.quality && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Data Quality:</span>
                          <Badge variant={processingResult.characteristics.quality === 'high' ? 'default' : 'outline'}>
                            {processingResult.characteristics.quality}
                          </Badge>
                        </div>
                      )}
                      {processingResult.characteristics.structure && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Structure:</span>
                          <Badge variant="secondary">{processingResult.characteristics.structure}</Badge>
                        </div>
                      )}
                      {processingResult.characteristics.complexity && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Complexity:</span>
                          <Badge variant="outline">{processingResult.characteristics.complexity}</Badge>
                        </div>
                      )}
                      {processingResult.characteristics.confidence && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">AI Confidence:</span>
                          <Badge variant={processingResult.characteristics.confidence >= 0.8 ? 'default' : 'outline'}>
                            {Math.round(processingResult.characteristics.confidence * 100)}%
                          </Badge>
                        </div>
                      )}
                    </div>
                    {processingResult.characteristics.recommendations && processingResult.characteristics.recommendations.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">AI Recommendations:</h5>
                        <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                          {processingResult.characteristics.recommendations.map((rec: string, idx: number) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Enhanced Quality Report */}
                    {processingResult.quality_report && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                        <h5 className="font-medium mb-2">Data Quality Analysis:</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="text-center">
                            <div className="font-medium text-lg">{Math.round(processingResult.quality_report.overall_score * 100)}%</div>
                            <div className="text-muted-foreground">Overall</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-lg">{Math.round(processingResult.quality_report.completeness_score * 100)}%</div>
                            <div className="text-muted-foreground">Complete</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-lg">{Math.round(processingResult.quality_report.consistency_score * 100)}%</div>
                            <div className="text-muted-foreground">Consistent</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-lg">{Math.round(processingResult.quality_report.accuracy_score * 100)}%</div>
                            <div className="text-muted-foreground">Accurate</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Validation Results */}
                    {processingResult.validation_results && (
                      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                        <h5 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Validation Summary:</h5>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="text-center">
                            <div className="font-medium text-lg">{processingResult.validation_results.validation_score || 'N/A'}</div>
                            <div className="text-muted-foreground">Score</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-lg text-red-600">{processingResult.validation_results.error_count || 0}</div>
                            <div className="text-muted-foreground">Errors</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-lg text-yellow-600">{processingResult.validation_results.warning_count || 0}</div>
                            <div className="text-muted-foreground">Warnings</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {processingResult.data && (
                  <div className="pt-4">
                    <Separator className="mb-4" />
                    <Button onClick={downloadProcessedData} variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Processed Data (CSV)
                    </Button>
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

      {/* Confirmation Dialog for Non-Trial Balance Files */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>File Type Confirmation</DialogTitle>
            <DialogDescription>
              This file appears to be a {formatContentType(pendingResult?.detected_content_type)} rather than a trial balance.
            </DialogDescription>
          </DialogHeader>
          
          {pendingResult?.preview_data && (
            <div className="my-4">
              <h4 className="mb-2 font-medium">Data Preview (first 5 rows):</h4>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Account Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Account Type</TableHead>
                      <TableHead>Period</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingResult.preview_data.slice(0, 5).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.account_number || 'N/A'}</TableCell>
                        <TableCell>{row.account_description || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          {row.amount ? new Intl.NumberFormat('de-DE', { 
                            style: 'currency', 
                            currency: row.currency_code || 'EUR' 
                          }).format(row.amount) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {row.account_type?.toUpperCase() || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.period_key_yyyymm || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">
            Do you want to save this data to the trial balance table anyway?
          </p>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownloadOnly}
            >
              No, Download Only
            </Button>
            <Button onClick={handleConfirmSave}>
              Yes, Save to Database
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
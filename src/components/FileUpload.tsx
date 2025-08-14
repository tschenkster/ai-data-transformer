import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, File } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onFileProcessed: (data: { accounts: any[]; filename: string; totalAccounts: number }) => void;
  mode?: 'accounts' | 'report-structure' | 'coa-translation';
}

interface FileData {
  name: string;
  size: number;
  type: string;
}

export function FileUpload({ onFileProcessed, mode = 'accounts' }: FileUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);

  const processCSV = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            if (mode === 'report-structure') {
              // For report structures, validate required columns and process as raw data
              const headers = results.meta.fields || [];
              const requiredColumns = ['report_line_item_key'];
              const optionalColumns = ['report_line_item_description', 'hierarchy_path', 'parent_report_line_item_key'];
              
              const missingColumns = requiredColumns.filter(col => 
                !headers.some(header => header.toLowerCase().includes(col.toLowerCase()))
              );
              
              if (missingColumns.length > 0) {
                reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
                return;
              }
              
              console.log('Available columns:', headers);
              console.log('Found optional columns:', optionalColumns.filter(col => 
                headers.some(header => header.toLowerCase().includes(col.toLowerCase()))
              ));
              
              // Return the raw data for report structure processing
              resolve(results.data as any);
            } else if (mode === 'coa-translation') {
              // CoA Translation mode - flexible column mapping
              const headers = results.meta.fields || [];
              
              // Find account number and description columns
              const accountNumberCol = headers.find(h => 
                h.toLowerCase().includes('account') && (h.toLowerCase().includes('number') || h.toLowerCase().includes('code'))
              ) || headers[0];
              
              const descriptionCol = headers.find(h => 
                h.toLowerCase().includes('description') || h.toLowerCase().includes('name')
              ) || headers[1];
              
              if (!accountNumberCol || !descriptionCol) {
                reject(new Error('Could not identify account number and description columns'));
                return;
              }
              
              // Map to standard format
              const accountData = results.data
                .filter((row: any) => row[accountNumberCol] && row[descriptionCol])
                .map((row: any) => ({
                  accountNumber: String(row[accountNumberCol]).trim(),
                  originalDescription: String(row[descriptionCol]).trim()
                }));
              
              console.log('CoA translation data:', accountData);
              resolve(accountData as any);
            } else {
              // Original account extraction logic
              const accounts: string[] = [];
              const headers = results.meta.fields || [];
              
              const accountColumn = headers.find(header => 
                header.toLowerCase().includes('account') || 
                header.toLowerCase().includes('name') ||
                header.toLowerCase().includes('description')
              ) || headers[0];

              results.data.forEach((row: any) => {
                const accountName = row[accountColumn]?.toString().trim();
                if (accountName && accountName !== '') {
                  accounts.push(accountName);
                }
              });

              resolve(accounts);
            }
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(error)
      });
    });
  };

  const processExcel = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          if (mode === 'report-structure') {
            // For report structures, use header row and return structured data
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            const headers = jsonData[0] as string[] || [];
            
            // Validate required columns
            const requiredColumns = ['report_line_item_key'];
            const optionalColumns = ['report_line_item_description', 'hierarchy_path', 'parent_report_line_item_key'];
            const missingColumns = requiredColumns.filter(col => 
              !headers.some(header => header?.toString().toLowerCase().includes(col.toLowerCase()))
            );
            
            if (missingColumns.length > 0) {
              reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
              return;
            }
            
            console.log('Available columns:', headers);
            console.log('Found optional columns:', optionalColumns.filter(col => 
              headers.some(header => header?.toString().toLowerCase().includes(col.toLowerCase()))
            ));
            
            // Convert to objects with headers
            const structuredData = [];
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i] as any[];
              if (row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
                const rowObject: any = {};
                headers.forEach((header, index) => {
                  if (header && row[index] !== undefined) {
                    rowObject[header.toString()] = row[index];
                  }
                });
                structuredData.push(rowObject);
              }
            }
            
            resolve(structuredData as any);
          } else if (mode === 'coa-translation') {
            // CoA Translation mode - flexible column mapping
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            const headers = jsonData[0] || [];
            
            // Find account number and description columns
            const accountNumberIndex = (headers as string[]).findIndex((h: string) => 
              h.toLowerCase().includes('account') && (h.toLowerCase().includes('number') || h.toLowerCase().includes('code'))
            );
            
            const descriptionIndex = (headers as string[]).findIndex((h: string) => 
              h.toLowerCase().includes('description') || h.toLowerCase().includes('name')
            );
            
            // Use first two columns as fallback
            const accountColIndex = accountNumberIndex >= 0 ? accountNumberIndex : 0;
            const descColIndex = descriptionIndex >= 0 ? descriptionIndex : 1;
            
            if ((headers as string[]).length < 2) {
              reject(new Error('File must contain at least 2 columns (account number and description)'));
              return;
            }
            
            // Map to standard format
            const accountData = jsonData.slice(1)
              .filter((row: any) => row[accountColIndex] && row[descColIndex])
              .map((row: any) => ({
                accountNumber: String(row[accountColIndex]).trim(),
                originalDescription: String(row[descColIndex]).trim()
              }));
            
            console.log('CoA translation data:', accountData);
            resolve(accountData as any);
          } else {
            // Original account extraction logic
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            const accounts: string[] = [];
            const headers = jsonData[0] as string[] || [];
            
            const accountColumnIndex = headers.findIndex(header => 
              header?.toString().toLowerCase().includes('account') || 
              header?.toString().toLowerCase().includes('name') ||
              header?.toString().toLowerCase().includes('description')
            );
            
            const columnIndex = accountColumnIndex !== -1 ? accountColumnIndex : 0;

            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i] as any[];
              const accountName = row[columnIndex]?.toString().trim();
              if (accountName && accountName !== '') {
                accounts.push(accountName);
              }
            }

            resolve(accounts);
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      setUploadProgress(25);
      
      let accounts: string[];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        accounts = await processCSV(file);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        accounts = await processExcel(file);
      } else {
        throw new Error('Unsupported file format');
      }

      setUploadProgress(75);

      if (mode === 'report-structure') {
        if (!Array.isArray(accounts) || accounts.length === 0) {
          throw new Error('No valid report structure data found in the file');
        }
        
        setUploadProgress(100);
        
        onFileProcessed({
          accounts: accounts as any, // For report structure, this contains the raw data
          filename: file.name,
          totalAccounts: accounts.length
        });
      } else if (mode === 'coa-translation') {
        if (!Array.isArray(accounts) || accounts.length === 0) {
          throw new Error('No valid account data found in the file');
        }
        
        setUploadProgress(100);
        
        onFileProcessed({
          accounts: accounts as any, // For CoA translation, this contains AccountData[]
          filename: file.name,
          totalAccounts: accounts.length
        });
      } else {
        if (accounts.length === 0) {
          throw new Error('No account names found in the file');
        }

        setUploadProgress(100);

        onFileProcessed({
          accounts,
          filename: file.name,
          totalAccounts: accounts.length
        });
      }

      toast({
        title: "File processed successfully",
        description: mode === 'report-structure' 
          ? `Processed ${accounts.length} report line items ready for upload.`
          : mode === 'coa-translation'
          ? `Processed ${accounts.length} accounts ready for translation.`
          : `Found ${accounts.length} account names ready for mapping.`,
      });

    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: "File processing failed",
        description: error instanceof Error ? error.message : "Please check your file format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
      setSelectedFile(null);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile({
        name: file.name,
        size: file.size,
        type: file.type
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    disabled: isProcessing
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload File
        </CardTitle>
        <CardDescription>
          {mode === 'report-structure' 
            ? 'Upload a CSV or Excel file containing your report structure with required columns'
            : mode === 'coa-translation'
            ? 'Upload a CSV or Excel file containing account numbers and descriptions for translation'
            : 'Upload a CSV or Excel file containing account names for AI-powered mapping'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-muted">
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium">
                {isDragActive ? 'Drop your file here' : 'Drag & drop a file here'}
              </p>
              <p className="text-sm text-muted-foreground">
                Or click to select a CSV or Excel file
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supported formats: .csv, .xlsx, .xls
              </p>
            </div>
          </div>
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <File className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                const file = fileInput?.files?.[0];
                if (file) processFile(file);
              }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Process File'}
            </Button>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing file...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, File, Eye, ArrowLeft, ArrowRight, Check, X, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileSecurityValidator } from '@/shared/utils/fileSecurityUtils';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ColumnMapping {
  dbColumn: string;
  fileColumn: string;
  mapped: boolean;
}

interface PreviewData {
  headers: string[];
  rows: any[][];
  totalRows: number;
}

interface ParentKeyValidation {
  validParents: number;
  invalidParents: number;
  missingKeys: string[];
  validationResults: {
    line_item_key: string;
    parent_key: string;
    is_valid: boolean;
    row_index: number;
  }[];
}

interface FileUploadProps {
  onFileProcessed: (data: { 
    structureData: any[]; 
    filename: string; 
    totalRows: number;
    mappings: ColumnMapping[];
    unmappedColumns: Record<string, any>[];
    overwriteMode: boolean;
    targetStructureId?: string;
    importedStructureId?: string;
    structureName?: string;
    parentKeyValidation: ParentKeyValidation;
    uploadedFilePath?: string; // Add uploaded file path
  }) => void;
}

interface ReportStructure {
  report_structure_id: number;
  report_structure_uuid: string;
  report_structure_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_supabase_user_uuid: string;
  created_by_user_name: string;
  version: number;
}

const REQUIRED_COLUMNS = [
  'report_line_item_key',
  'report_line_item_description', 
  'parent_report_line_item_key'
];

// System-generated fields that should not be mapped by users
const SYSTEM_GENERATED_COLUMNS = [
  'report_line_item_id',
  'report_line_item_uuid',
  'report_structure_id',
  'report_structure_uuid', 
  'report_structure_name',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'data_source',
  'sort_order'
];

export function AdvancedFileUpload({ onFileProcessed }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [overwriteMode, setOverwriteMode] = useState(false);
  const [newStructureName, setNewStructureName] = useState('');
  const [targetStructureId, setTargetStructureId] = useState<string>('');
  const [importedStructureId, setImportedStructureId] = useState<string>('');
  const [structures, setStructures] = useState<ReportStructure[]>([]);
  const [parentKeyValidation, setParentKeyValidation] = useState<ParentKeyValidation | null>(null);
  const [showValidationResults, setShowValidationResults] = useState(false);

  // Fetch available structures for overwrite mode
  const fetchStructures = async () => {
    try {
      const { data, error } = await supabase
        .from('report_structures')
        .select('report_structure_id, report_structure_uuid, report_structure_name, version, is_active, created_at, updated_at, created_by_supabase_user_uuid, created_by_user_name')
        .order('report_structure_name');

      if (error) throw error;
      setStructures(data || []);
    } catch (error) {
      console.error('Error fetching structures:', error);
    }
  };

  // Fetch structures when component mounts
  React.useEffect(() => {
    fetchStructures();
  }, []);

  const processFileForPreview = async (file: File): Promise<PreviewData> => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        Papa.parse(file, {
          header: false,
          skipEmptyLines: true,
          preview: 6, // Get header + 5 rows
          complete: (results) => {
            const data = results.data as any[][];
            if (data.length === 0) {
              reject(new Error('File is empty'));
              return;
            }
            resolve({
              headers: data[0] as string[],
              rows: data.slice(1),
              totalRows: results.meta.cursor || data.length - 1
            });
          },
          error: reject
        });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            if (jsonData.length === 0) {
              reject(new Error('File is empty'));
              return;
            }

            resolve({
              headers: jsonData[0] as string[],
              rows: jsonData.slice(1, 6), // First 5 data rows
              totalRows: jsonData.length - 1
            });
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error('Unsupported file format'));
      }
    });
  };

  const processFullFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data as any[]),
          error: reject
        });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error('Unsupported file format'));
      }
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      // Enhanced security validation before processing
      await FileSecurityValidator.validateFile(file, {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        allowedExtensions: ['.csv', '.xls', '.xlsx'],
        checkMagicNumbers: true,
        sanitizeFilename: true
      });
      
      // Additional CSV content validation
      if (file.name.endsWith('.csv')) {
        await FileSecurityValidator.validateCSVContent(file);
      }
    } catch (error) {
      toast({
        title: "File validation failed",
        description: error instanceof Error ? error.message : "File validation failed",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setUploadProgress(25);

    try {
      const preview = await processFileForPreview(file);
      setPreviewData(preview);
      setUploadProgress(50);
      
       // Initialize reversed column mappings - one entry per required database field
       const mappings: ColumnMapping[] = REQUIRED_COLUMNS.map(dbColumn => {
         // Auto-detect the best matching file column for each database field
         let bestMatch = '';
         let matchScore = 0; // Higher score = better match
         
         console.log(`🔍 Auto-detecting column for database field: ${dbColumn}`);
         console.log(`Available file columns:`, preview.headers);
         
         for (const header of preview.headers) {
           const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
           let currentScore = 0;
           
           // Enhanced pattern matching for each specific field with scoring
           if (dbColumn === 'report_line_item_key') {
             // Exact match gets highest priority
             if (normalizedHeader === 'report_line_item_key') {
               currentScore = 100;
               console.log(`  ✅ EXACT MATCH: "${header}" -> score: ${currentScore}`);
             } else if (header.toLowerCase() === 'report_line_item_key') {
               currentScore = 95;
               console.log(`  ✅ CASE-INSENSITIVE EXACT: "${header}" -> score: ${currentScore}`);
             } else if (normalizedHeader.includes('report_line_item_key')) {
               currentScore = 90;
               console.log(`  ✅ CONTAINS FULL KEY: "${header}" -> score: ${currentScore}`);
             } else if (normalizedHeader === 'report_key' || normalizedHeader === 'report_item_key') {
               currentScore = 85;
               console.log(`  ⚡ PARTIAL MATCH: "${header}" -> score: ${currentScore}`);
             } else if (normalizedHeader.includes('report') && normalizedHeader.includes('key') && !normalizedHeader.includes('parent')) {
               currentScore = 80;
               console.log(`  🔶 PATTERN MATCH: "${header}" -> score: ${currentScore}`);
             }
            } else if (dbColumn === 'report_line_item_description') {
              if (normalizedHeader === 'report_line_item_description') {
                currentScore = 100;
              } else if (normalizedHeader.includes('description') || normalizedHeader.includes('desc')) {
                currentScore = 85;
              } else if (normalizedHeader === 'name' || normalizedHeader === 'title') {
                currentScore = 70;
              }
            } else if (dbColumn === 'parent_report_line_item_key') {
             if (normalizedHeader === 'parent_report_line_item_key') {
               currentScore = 100;
             } else if (normalizedHeader.includes('parent') && normalizedHeader.includes('key')) {
               currentScore = 90;
             } else if (normalizedHeader.includes('parent')) {
               currentScore = 80;
             }
           }
           
           // Update best match if this score is better
           if (currentScore > matchScore) {
             matchScore = currentScore;
             bestMatch = header;
             console.log(`  🎯 NEW BEST MATCH: "${header}" with score ${currentScore}`);
           }
         }
         
         console.log(`📝 Final mapping for ${dbColumn}: "${bestMatch}" (score: ${matchScore})`);
         
         return {
           dbColumn,
           fileColumn: bestMatch,
           mapped: !!bestMatch
         };
       });

      setColumnMappings(mappings);
      setUploadProgress(100);
      setShowPreview(true);
    } catch (error) {
      toast({
        title: "Preview failed",
        description: error instanceof Error ? error.message : "Could not preview file",
        variant: "destructive",
      });
      setUploadProgress(0);
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

  const updateColumnMapping = (dbColumn: string, fileColumn: string) => {
    setColumnMappings(prev => prev.map(mapping => 
      mapping.dbColumn === dbColumn 
        ? { ...mapping, fileColumn, mapped: !!fileColumn && fileColumn !== 'unmapped' }
        : mapping
    ));
  };

  const getAvailableFileColumns = (currentDbColumn: string) => {
    const usedColumns = columnMappings
      .filter(m => m.dbColumn !== currentDbColumn && m.mapped && m.fileColumn)
      .map(m => m.fileColumn);
    
    return previewData?.headers.filter(header => !usedColumns.includes(header)) || [];
  };

  const validateMappings = () => {
    return REQUIRED_COLUMNS.every(field => 
      columnMappings.find(m => m.dbColumn === field)?.mapped && 
      columnMappings.find(m => m.dbColumn === field)?.fileColumn
    );
  };

  const validateParentKeys = (data: any[], keyMapping: ColumnMapping, parentKeyMapping: ColumnMapping): ParentKeyValidation => {
    const keyColumn = keyMapping.fileColumn;
    const parentKeyColumn = parentKeyMapping.fileColumn;
    
    console.log('🔍 Starting parent key validation...');
    console.log(`Key column: "${keyColumn}", Parent column: "${parentKeyColumn}"`);
    console.log('Sample data:', data.slice(0, 3));
    
    if (!keyColumn || !parentKeyColumn) {
      console.log('❌ Missing column mappings for validation');
      return {
        validParents: 0,
        invalidParents: 0,
        missingKeys: [],
        validationResults: []
      };
    }

    // Build set of all available keys (case-insensitive)
    const availableKeys = new Set<string>();
    data.forEach((row, index) => {
      if (row[keyColumn]) {
        const key = row[keyColumn].toString().trim().toLowerCase();
        availableKeys.add(key);
        console.log(`✅ Added available key: "${key}" (row ${index + 2})`);
      }
    });

    console.log(`📊 Total available keys: ${availableKeys.size}`);
    console.log('Available keys:', Array.from(availableKeys));

    // Validate parent references
    const validationResults: ParentKeyValidation['validationResults'] = [];
    const missingKeys = new Set<string>();

    data.forEach((row, index) => {
      const lineItemKey = row[keyColumn]?.toString()?.trim() || '';
      const parentKey = row[parentKeyColumn]?.toString()?.trim() || '';
      
      if (parentKey) {
        const parentKeyLower = parentKey.toLowerCase();
        const isValid = availableKeys.has(parentKeyLower);
        
        console.log(`🔎 Validating row ${index + 2}: parent "${parentKey}" (normalized: "${parentKeyLower}") -> ${isValid ? '✅ VALID' : '❌ INVALID'}`);
        
        validationResults.push({
          line_item_key: lineItemKey,
          parent_key: parentKey,
          is_valid: isValid,
          row_index: index
        });
        
        if (!isValid) {
          missingKeys.add(parentKey);
          console.log(`❌ Missing parent key: "${parentKey}"`);
        }
      }
    });

    const validParents = validationResults.filter(r => r.is_valid).length;
    const invalidParents = validationResults.filter(r => !r.is_valid).length;

    const result = {
      validParents,
      invalidParents,
      missingKeys: Array.from(missingKeys),
      validationResults
    };

    console.log('🎯 Parent key validation completed:', result);
    return result;
  };

  const processFile = async () => {
    if (!selectedFile || !previewData) return;

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      if (!validateMappings()) {
        const unmappedRequired = columnMappings
          .filter(mapping => !mapping.mapped || !mapping.fileColumn)
          .map(mapping => mapping.dbColumn);
        throw new Error(`The following required fields must be mapped: ${unmappedRequired.join(', ')}`);
      }

      if (!overwriteMode && !newStructureName.trim()) {
        throw new Error('Structure name is required for new structures');
      }

      if (overwriteMode && !targetStructureId) {
        throw new Error('Please select a target structure for overwrite mode');
      }

      // Step 1: Store file in Supabase Storage
      setUploadProgress(10);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const storedFileName = `report-structure-uploaded-${selectedFile.name}-${timestamp}`;
      
      console.log(`Storing file in Supabase Storage: ${storedFileName}`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads-report-structures')
        .upload(storedFileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('File storage error:', uploadError);
        throw new Error(`Failed to store file: ${uploadError.message}`);
      }

      console.log('File successfully stored in Supabase Storage:', uploadData.path);

      setUploadProgress(25);
      const fullData = await processFullFile(selectedFile);
      setUploadProgress(50);

      // Apply column mappings and separate unmapped data
      const mappedData: any[] = [];
      const unmappedData: Record<string, any>[] = [];

      // Get all mapped file columns
      const mappedFileColumns = columnMappings
        .filter(m => m.mapped && m.fileColumn)
        .map(m => m.fileColumn);

      fullData.forEach((row, index) => {
        const mappedRow: any = {};
        const unmappedRow: Record<string, any> = {};

        // Map the required fields
        columnMappings.forEach(mapping => {
          if (mapping.mapped && mapping.fileColumn) {
            mappedRow[mapping.dbColumn] = row[mapping.fileColumn];
          }
        });

        // Collect unmapped columns
        Object.keys(row).forEach(fileColumn => {
          if (!mappedFileColumns.includes(fileColumn)) {
            unmappedRow[fileColumn] = row[fileColumn];
          }
        });

        // Add sort_order
        mappedRow.sort_order = index;

        mappedData.push(mappedRow);
        if (Object.keys(unmappedRow).length > 0) {
          unmappedData.push({ row_index: index, ...unmappedRow });
        }
      });

      setUploadProgress(75);

      // Validate parent key references using the ORIGINAL FILE DATA (not mapped data)
      // This is crucial because validation needs to check the raw column values
      const keyMapping = columnMappings.find(m => m.dbColumn === 'report_line_item_key');
      const parentKeyMapping = columnMappings.find(m => m.dbColumn === 'parent_report_line_item_key');
      
      console.log('🔍 Parent key validation setup:');
      console.log('Key mapping:', keyMapping);
      console.log('Parent key mapping:', parentKeyMapping);
      console.log('Sample raw data for validation:', fullData.slice(0, 3));
      
      const validation = validateParentKeys(fullData, keyMapping!, parentKeyMapping!);
      
      setParentKeyValidation(validation);

      // Flag items with invalid parent keys
      mappedData.forEach((item, index) => {
        const validationResult = validation.validationResults.find(r => r.row_index === index);
        if (validationResult && !validationResult.is_valid) {
          item.parent_key_status = 'PARENT_KEY_NOT_EXISTING';
        }
      });

      const result = {
        structureData: mappedData,
        filename: selectedFile.name,
        totalRows: fullData.length,
        mappings: columnMappings,
        unmappedColumns: unmappedData,
        overwriteMode,
        targetStructureId: overwriteMode ? targetStructureId : undefined,
        importedStructureId: importedStructureId || undefined,
        structureName: overwriteMode ? undefined : newStructureName.trim(),
        parentKeyValidation: validation,
        uploadedFilePath: uploadData.path // Add the stored file path
      };

      setUploadProgress(100);
      onFileProcessed(result);

      // Reset state
      setSelectedFile(null);
      setPreviewData(null);
      setShowPreview(false);
      setColumnMappings([]);
      setOverwriteMode(false);
      setNewStructureName('');
      setTargetStructureId('');
      setImportedStructureId('');

    } catch (error) {
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
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
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="space-y-4 pt-6">
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
              <Button onClick={() => setShowPreview(true)} disabled={!previewData}>
                <Eye className="w-4 h-4 mr-2" />
                Preview & Configure
              </Button>
            </div>
          )}

          {parentKeyValidation && parentKeyValidation.invalidParents > 0 && (
            <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">Parent Key Validation Issues</p>
                  <p className="text-sm text-yellow-600">
                    {parentKeyValidation.invalidParents} items reference non-existing parent keys
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowValidationResults(true)}>
                View Details
              </Button>
            </div>
          )}

          {/* Validation Results Dialog */}
          <Dialog open={showValidationResults} onOpenChange={setShowValidationResults}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Parent Key Validation Results</DialogTitle>
                <DialogDescription>
                  Review parent key validation issues before processing the import.
                </DialogDescription>
              </DialogHeader>
              
              {parentKeyValidation && (
                <div className="space-y-4 overflow-auto">
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{parentKeyValidation.validParents}</div>
                      <div className="text-sm text-muted-foreground">Valid References</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{parentKeyValidation.invalidParents}</div>
                      <div className="text-sm text-muted-foreground">Invalid References</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{parentKeyValidation.missingKeys.length}</div>
                      <div className="text-sm text-muted-foreground">Missing Keys</div>
                    </div>
                  </div>

                  {parentKeyValidation.missingKeys.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Missing Parent Keys:</h4>
                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <div className="flex flex-wrap gap-2">
                          {parentKeyValidation.missingKeys.map(key => (
                            <Badge key={key} variant="destructive">{key}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-medium">Validation Details:</h4>
                    <div className="border rounded-lg overflow-auto max-h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Row</TableHead>
                            <TableHead>Line Item Key</TableHead>
                            <TableHead>Parent Key</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parentKeyValidation.validationResults
                            .filter(r => !r.is_valid)
                            .map((result, index) => (
                              <TableRow key={index}>
                                <TableCell>{result.row_index + 2}</TableCell>
                                <TableCell className="font-mono">{result.line_item_key}</TableCell>
                                <TableCell className="font-mono">{result.parent_key}</TableCell>
                                <TableCell>
                                  <Badge variant="destructive">Missing</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={() => setShowValidationResults(false)}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Preview and Configuration Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>File Preview & Configuration</DialogTitle>
          </DialogHeader>

          {previewData && (
            <Tabs defaultValue="preview" className="flex-1 overflow-hidden">
              <TabsList>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  Data Preview
                  {previewData && <Badge variant="outline" className="text-xs bg-green-100 text-green-800">✓</Badge>}
                </TabsTrigger>
                <TabsTrigger 
                  value="mapping" 
                  className="flex items-center gap-2"
                >
                  Column Mapping
                  {validateMappings() && <Badge variant="outline" className="text-xs bg-green-100 text-green-800">✓</Badge>}
                  {!validateMappings() && previewData && <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800">!</Badge>}
                </TabsTrigger>
                <TabsTrigger 
                  value="options" 
                  className="flex items-center gap-2"
                >
                  Import Options
                  {((!overwriteMode && newStructureName) || (overwriteMode && targetStructureId)) && 
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-800">✓</Badge>
                  }
                  {validateMappings() && !(!overwriteMode && newStructureName) && !(overwriteMode && targetStructureId) && 
                    <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800">!</Badge>
                  }
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="overflow-auto">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Showing first 5 rows of {previewData.totalRows} total rows
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {previewData.headers.length} columns detected
                      </p>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg overflow-auto max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {previewData.headers.map((header, index) => (
                            <TableHead key={index} className="whitespace-nowrap">
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.rows.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {previewData.headers.map((_, colIndex) => (
                              <TableCell key={colIndex} className="whitespace-nowrap">
                                {row[colIndex]?.toString() || ''}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="mapping" className="overflow-y-auto max-h-[60vh]">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Column Mapping</h3>
                    <p className="text-sm text-muted-foreground">
                      Select which file column contains the data for each required database field.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {columnMappings.map((mapping, index) => {
                      const availableColumns = getAvailableFileColumns(mapping.dbColumn);
                      const currentSelection = mapping.fileColumn || '';
                      const allOptions = currentSelection && !availableColumns.includes(currentSelection) 
                        ? [currentSelection, ...availableColumns] 
                        : availableColumns;

                      // Get preview data for the selected column
                      const previewValues = previewData && mapping.fileColumn 
                        ? previewData.rows.slice(0, 3).map(row => {
                            const colIndex = previewData.headers.indexOf(mapping.fileColumn);
                            return colIndex >= 0 ? row[colIndex] : '';
                          }).filter(val => val !== undefined && val !== '')
                        : [];

                      const getFieldLabel = (dbColumn: string) => {
                        switch (dbColumn) {
                          case 'report_line_item_key': return 'Report Line Item Key';
                          case 'report_line_item_description': return 'Report Line Item Description';
                          case 'line_item_key': return 'Line Item Key';
                          case 'parent_report_line_item_key': return 'Parent Report Line Item Key';
                          default: return dbColumn.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        }
                      };

                      const getFieldDescription = (dbColumn: string) => {
                        switch (dbColumn) {
                          case 'report_line_item_key': return 'Reference key for the line item';
                          case 'report_line_item_description': return 'Description or name of the line item';
                          case 'line_item_key': return 'Unique key stored in database (goes into \'report_line_item_key\')';
                          case 'parent_report_line_item_key': return 'Key of parent item (goes into \'parent_report_line_item_key\')';
                          default: return '';
                        }
                      };

                      return (
                        <div key={mapping.dbColumn} className="grid grid-cols-12 gap-3 p-3 border rounded-lg items-center">
                          <div className="col-span-5">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-medium text-primary">
                                {getFieldLabel(mapping.dbColumn)}
                                <span className="text-red-500 ml-1">*</span>
                              </Label>
                              {mapping.mapped && mapping.fileColumn ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <X className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {getFieldDescription(mapping.dbColumn)}
                            </p>
                          </div>
                          
                          <div className="col-span-4">
                            <Select
                              value={mapping.fileColumn || 'unmapped'}
                              onValueChange={(value) => updateColumnMapping(mapping.dbColumn, value === 'unmapped' ? '' : value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select column..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unmapped">
                                  <span className="text-muted-foreground">Select a column...</span>
                                </SelectItem>
                                {allOptions.map(col => (
                                  <SelectItem key={col} value={col}>
                                    {col}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {previewValues.length > 0 && (
                            <div className="col-span-3">
                              <div className="text-xs text-muted-foreground mb-1">Preview:</div>
                              <div className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                                {previewValues.slice(0, 2).map((val, i) => (
                                  <div key={i} className="truncate">{val?.toString() || '(empty)'}</div>
                                ))}
                                {previewValues.length > 2 && <div>...</div>}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium flex items-center gap-2">
                        Step 1: Column Mapping
                        {validateMappings() ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">✓ Complete</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200">Incomplete</Badge>
                        )}
                      </h4>
                      <div className="text-sm text-muted-foreground">
                        {columnMappings.filter(m => m.mapped).length}/{REQUIRED_COLUMNS.length} required fields mapped
                      </div>
                    </div>
                    {!validateMappings() && (
                      <div className="text-amber-700 text-sm">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Please map all required fields to proceed to import options</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="options" className="overflow-auto">
                <div className="space-y-6">
                  {/* Import Options Status */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium flex items-center gap-2">
                        Step 2: Import Configuration
                        {((!overwriteMode && newStructureName) || (overwriteMode && targetStructureId)) ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">✓ Complete</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200">Required</Badge>
                        )}
                      </h4>
                    </div>
                    {!(!overwriteMode && newStructureName) && !(overwriteMode && targetStructureId) && (
                      <div className="text-amber-700 text-sm">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span>
                            {!overwriteMode 
                              ? "Please enter a structure name to create a new report structure"
                              : "Please select a target structure to update"
                            }
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Choose Import Mode</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="create-new"
                          name="import-mode"
                          checked={!overwriteMode}
                          onChange={() => setOverwriteMode(false)}
                        />
                        <Label htmlFor="create-new">Create new report structure</Label>
                      </div>
                      
                      {!overwriteMode && (
                        <div className="ml-6 space-y-4">
                          <div>
                            <Label htmlFor="structure-name">Structure Name *</Label>
                            <Input
                              id="structure-name"
                              value={newStructureName}
                              onChange={(e) => setNewStructureName(e.target.value)}
                              placeholder="Enter name for new structure (required)"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="imported-structure-id">Imported Structure ID (Optional)</Label>
                            <Input
                              id="imported-structure-id"
                              value={importedStructureId}
                              onChange={(e) => setImportedStructureId(e.target.value)}
                              placeholder="Enter the structure ID from your file system"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="overwrite-existing"
                          name="import-mode"
                          checked={overwriteMode}
                          onChange={() => setOverwriteMode(true)}
                        />
                        <Label htmlFor="overwrite-existing">Update existing structure (create new version)</Label>
                      </div>

                      {overwriteMode && (
                        <div className="ml-6">
                          <Label htmlFor="target-structure">Target Structure</Label>
                          <Select value={targetStructureId} onValueChange={setTargetStructureId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select structure to update" />
                            </SelectTrigger>
                            <SelectContent>
                              {structures.map(structure => (
                                <SelectItem key={structure.report_structure_id} value={structure.report_structure_id.toString()}>
                                  {structure.report_structure_name} (v{structure.version})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Additional Storage</h4>
                    <p className="text-sm text-muted-foreground">
                      Unmapped columns will be automatically stored in a flexible format for future reference and audit purposes.
                    </p>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm">
                        <strong>Unmapped columns:</strong> {
                          previewData 
                            ? previewData.headers
                                .filter(header => !columnMappings.some(m => m.fileColumn === header && m.mapped))
                                .join(', ') || 'None'
                            : 'None'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              {/* Import readiness indicator */}
              {(!validateMappings() || (!overwriteMode && !newStructureName) || (overwriteMode && !targetStructureId)) && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>
                    {!validateMappings() 
                      ? "Complete column mapping first"
                      : !overwriteMode && !newStructureName 
                      ? "Enter structure name in Import Options"
                      : "Select target structure in Import Options"
                    }
                  </span>
                </div>
              )}
              <Button 
                onClick={processFile} 
                disabled={!validateMappings() || (!overwriteMode && !newStructureName) || (overwriteMode && !targetStructureId)}
                className={
                  (!validateMappings() || (!overwriteMode && !newStructureName) || (overwriteMode && !targetStructureId))
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }
              >
                Import Data
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
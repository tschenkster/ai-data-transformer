import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, File, Eye, ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
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

export function EnhancedFileUpload({ onFileProcessed }: FileUploadProps) {
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
        
        for (const header of preview.headers) {
          const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
          
          // Enhanced pattern matching for each specific field
          if (dbColumn === 'report_line_item_key') {
            if (normalizedHeader.includes('key') || normalizedHeader.includes('id') || 
                normalizedHeader === 'report_line_item_key' || normalizedHeader === 'line_item_key' ||
                normalizedHeader === 'item_key' || normalizedHeader === 'code') {
              bestMatch = header;
              break;
            }
          } else if (dbColumn === 'report_line_item_description') {
            if (normalizedHeader.includes('description') || normalizedHeader.includes('desc') || 
                normalizedHeader === 'report_line_item_description' || normalizedHeader === 'line_item_description' ||
                normalizedHeader === 'item_description' || normalizedHeader === 'name' || normalizedHeader === 'title') {
              bestMatch = header;
              break;
            }
          } else if (dbColumn === 'parent_report_line_item_key') {
            if (normalizedHeader.includes('parent') || normalizedHeader.includes('parent_key') ||
                normalizedHeader === 'parent_report_line_item_key' || normalizedHeader === 'parent_line_item_key' ||
                normalizedHeader === 'parent_id' || normalizedHeader === 'parent_code') {
              bestMatch = header;
              break;
            }
          }
        }
        
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
    return columnMappings.every(mapping => mapping.mapped && mapping.fileColumn);
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

      const result = {
        structureData: mappedData,
        filename: selectedFile.name,
        totalRows: fullData.length,
        mappings: columnMappings,
        unmappedColumns: unmappedData,
        overwriteMode,
        targetStructureId: overwriteMode ? targetStructureId : undefined,
        importedStructureId: importedStructureId || undefined,
        structureName: overwriteMode ? undefined : newStructureName.trim()
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

      {/* Preview and Configuration Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>File Preview & Configuration</DialogTitle>
            <DialogDescription>
              Review your data and configure column mappings before import
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <Tabs defaultValue="preview" className="flex-1 overflow-hidden">
              <TabsList>
                <TabsTrigger value="preview">Data Preview</TabsTrigger>
                <TabsTrigger value="mapping">Column Mapping</TabsTrigger>
                <TabsTrigger value="options">Import Options</TabsTrigger>
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

                      return (
                        <div key={mapping.dbColumn} className="space-y-3 p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Label className="text-sm font-medium text-primary">
                                {mapping.dbColumn.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                                <span className="text-red-500 ml-1">*</span>
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                {mapping.dbColumn === 'report_line_item_key' && 'Unique identifier for each line item'}
                                {mapping.dbColumn === 'report_line_item_description' && 'Description or name of the line item'}
                                {mapping.dbColumn === 'parent_report_line_item_key' && 'Key of the parent item (for hierarchical data)'}
                              </p>
                            </div>
                            <div className="w-8 flex justify-center">
                              {mapping.mapped && mapping.fileColumn ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <X className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <Select
                                value={mapping.fileColumn || 'unmapped'}
                                onValueChange={(value) => updateColumnMapping(mapping.dbColumn, value === 'unmapped' ? '' : value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select file column" />
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
                              <div className="flex-1">
                                <div className="text-xs text-muted-foreground mb-1">Preview:</div>
                                <div className="text-xs bg-muted p-2 rounded text-muted-foreground">
                                  {previewValues.slice(0, 2).map((val, i) => (
                                    <div key={i} className="truncate">{val?.toString() || '(empty)'}</div>
                                  ))}
                                  {previewValues.length > 2 && <div>...</div>}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      Mapping Status
                      {validateMappings() ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Complete</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Incomplete</Badge>
                      )}
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p>Required fields mapped: {columnMappings.filter(m => m.mapped).length}/{REQUIRED_COLUMNS.length}</p>
                      <p>Available file columns: {previewData?.headers.length || 0}</p>
                      <p>Unmapped file columns: {(previewData?.headers.length || 0) - columnMappings.filter(m => m.mapped).length}</p>
                      {!validateMappings() && (
                        <p className="text-amber-700 font-medium mt-2">⚠️ Please map all required fields to proceed</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="options" className="overflow-auto">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Import Options</h3>
                    
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
            <Button 
              onClick={processFile} 
              disabled={!validateMappings() || (!overwriteMode && !newStructureName) || (overwriteMode && !targetStructureId)}
            >
              Import Data
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
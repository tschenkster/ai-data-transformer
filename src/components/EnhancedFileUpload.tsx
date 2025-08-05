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
  fileColumn: string;
  dbColumn: string;
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
  }) => void;
}

interface ReportStructure {
  id: number;
  report_structure_uuid: string;
  report_structure_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
  created_by_user_name: string;
  version: number;
}

const REQUIRED_COLUMNS = ['report_line_item_key'];
const OPTIONAL_COLUMNS = [
  'report_line_item_description',
  'parent_report_line_item_key',
  'hierarchy_path',
  'level_1_line_item_description',
  'level_2_line_item_description',
  'level_3_line_item_description',
  'level_4_line_item_description',
  'level_5_line_item_description',
  'level_6_line_item_description',
  'level_7_line_item_description',
  'line_item_type',
  'description_of_leaf',
  'is_leaf',
  'is_calculated',
  'display',
  'data_source',
  'sort_order',
  'report_line_item_id'
];

export function EnhancedFileUpload({ onFileProcessed }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [showMapping, setShowMapping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [overwriteMode, setOverwriteMode] = useState(false);
  const [newStructureName, setNewStructureName] = useState('');
  const [targetStructureId, setTargetStructureId] = useState<string>('');
  const [structures, setStructures] = useState<ReportStructure[]>([]);

  // Fetch available structures for overwrite mode
  const fetchStructures = async () => {
    try {
      const { data, error } = await supabase
        .from('report_structures')
        .select('id, report_structure_uuid, report_structure_name, version, is_active, created_at, updated_at, created_by_user_id, created_by_user_name')
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
      
      // Initialize column mappings
      const mappings: ColumnMapping[] = preview.headers.map(header => {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const dbMatch = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS].find(col => 
          col.toLowerCase().includes(normalizedHeader) || 
          normalizedHeader.includes(col.toLowerCase().replace(/_/g, ''))
        );
        
        return {
          fileColumn: header,
          dbColumn: dbMatch || 'unmapped',
          mapped: !!dbMatch
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

  const updateColumnMapping = (fileColumn: string, dbColumn: string) => {
    setColumnMappings(prev => prev.map(mapping => 
      mapping.fileColumn === fileColumn 
        ? { ...mapping, dbColumn, mapped: !!dbColumn && dbColumn !== 'unmapped' }
        : mapping
    ));
  };

  const validateMappings = () => {
    const mappedRequiredColumns = REQUIRED_COLUMNS.filter(col => 
      columnMappings.some(mapping => mapping.dbColumn === col && mapping.mapped)
    );
    
    return mappedRequiredColumns.length === REQUIRED_COLUMNS.length;
  };

  const processFile = async () => {
    if (!selectedFile || !previewData) return;

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      if (!validateMappings()) {
        throw new Error('Required columns must be mapped');
      }

      setUploadProgress(25);
      const fullData = await processFullFile(selectedFile);
      setUploadProgress(50);

      // Apply column mappings and separate unmapped data
      const mappedData: any[] = [];
      const unmappedData: Record<string, any>[] = [];

      fullData.forEach((row, index) => {
        const mappedRow: any = {};
        const unmappedRow: Record<string, any> = {};

        columnMappings.forEach(mapping => {
          if (mapping.mapped && mapping.dbColumn && mapping.dbColumn !== 'unmapped') {
            mappedRow[mapping.dbColumn] = row[mapping.fileColumn];
          } else if (mapping.fileColumn in row) {
            unmappedRow[mapping.fileColumn] = row[mapping.fileColumn];
          }
        });

        // Add sort_order if not mapped
        if (!mappedRow.sort_order) {
          mappedRow.sort_order = index;
        }

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
        targetStructureId: overwriteMode ? targetStructureId : undefined
      };

      setUploadProgress(100);
      onFileProcessed(result);

      // Reset state
      setSelectedFile(null);
      setPreviewData(null);
      setShowPreview(false);
      setShowMapping(false);
      setColumnMappings([]);
      setOverwriteMode(false);
      setNewStructureName('');
      setTargetStructureId('');

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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Enhanced File Upload
          </CardTitle>
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Column Mapping</h3>
                    <p className="text-sm text-muted-foreground">
                      Map your file columns to database fields. Required fields are marked with a red asterisk.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {columnMappings.map((mapping, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex-1">
                          <Label className="text-sm font-medium">{mapping.fileColumn}</Label>
                          <p className="text-xs text-muted-foreground">File column</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <Select
                            value={mapping.dbColumn}
                            onValueChange={(value) => updateColumnMapping(mapping.fileColumn, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select database field" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unmapped">Not mapped</SelectItem>
                              {REQUIRED_COLUMNS.map(col => (
                                <SelectItem key={col} value={col}>
                                  {col} <span className="text-red-500">*</span>
                                </SelectItem>
                              ))}
                              {OPTIONAL_COLUMNS.map(col => (
                                <SelectItem key={col} value={col}>
                                  {col}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-8">
                          {mapping.mapped ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Mapping Status</h4>
                    <div className="space-y-1 text-sm">
                      <p>Required fields mapped: {columnMappings.filter(m => m.mapped && REQUIRED_COLUMNS.includes(m.dbColumn)).length}/{REQUIRED_COLUMNS.length}</p>
                      <p>Optional fields mapped: {columnMappings.filter(m => m.mapped && OPTIONAL_COLUMNS.includes(m.dbColumn)).length}/{OPTIONAL_COLUMNS.length}</p>
                      <p>Unmapped columns: {columnMappings.filter(m => !m.mapped).length}</p>
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
                        <div className="ml-6">
                          <Label htmlFor="structure-name">Structure Name</Label>
                          <Input
                            id="structure-name"
                            value={newStructureName}
                            onChange={(e) => setNewStructureName(e.target.value)}
                            placeholder="Enter name for new structure"
                          />
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
                                <SelectItem key={structure.id} value={structure.id.toString()}>
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
                        <strong>Unmapped columns:</strong> {columnMappings.filter(m => !m.mapped).map(m => m.fileColumn).join(', ') || 'None'}
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
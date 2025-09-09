import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { formatLineItemIdForDisplay, extractStructureIdFromLineItemId } from '@/features/report-structure-manager/utils/lineItemUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, Eye, Settings, Plus, FileText, Database, AlertTriangle, Edit, Check, X, Trash2 } from 'lucide-react';
import { AdvancedFileUpload } from '@/features/imports/shared-pipeline';
import ReportStructureViewer from './ReportStructureViewer';
import ReportStructureModifier from './ReportStructureModifier';
import { useUnifiedTranslation } from '@/contexts/UnifiedTranslationProvider';
import { ReportStructureService } from '../services/reportStructureService';
import { EnhancedReportService } from '@/features/multilingual/services/enhancedReportService';
import { TranslationTestButton } from '@/components/admin/TranslationTestButton';
import { useUITranslations } from '@/hooks/useUITranslations';

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
  name_of_import_file?: string;
  imported_structure_id?: string;
}

interface ReportLineItem {
  report_line_item_id: number;
  report_line_item_uuid: string;
  report_structure_id: number;  // Integer foreign key
  report_structure_uuid: string;  // UUID foreign key
  report_structure_name: string;
  report_line_item_key: string;
  report_line_item_description?: string;
  parent_report_line_item_key?: string;
  parent_report_line_item_uuid?: string;
  is_parent_key_existing: boolean;
  sort_order: number;
  hierarchy_path?: string;
  level_1_line_item_description?: string;
  level_2_line_item_description?: string;
  level_3_line_item_description?: string;
  level_4_line_item_description?: string;
  level_5_line_item_description?: string;
  level_6_line_item_description?: string;
  level_7_line_item_description?: string;
  line_item_type?: string;
  description_of_leaf?: string;
  is_leaf: boolean;
  is_calculated: boolean;
  display: boolean;
  data_source?: string;
  comment?: string;
}

export default function ReportStructureManager() {
  const { user, userRoles, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const { contentLanguage } = useUnifiedTranslation();
  const { t } = useUITranslations();
  const [structures, setStructures] = useState<ReportStructure[]>([]);
  const [activeStructure, setActiveStructure] = useState<ReportStructure | null>(null);
  const [lineItems, setLineItems] = useState<ReportLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [structuresWithMappings, setStructuresWithMappings] = useState<Set<number>>(new Set());
  const [selectedStructureForModify, setSelectedStructureForModify] = useState<number | null>(null);

  const fetchStructures = async () => {
    try {
      const data = await ReportStructureService.fetchStructures(contentLanguage);
      setStructures(data || []);
      const active = data?.find(s => s.is_active) || null;
      setActiveStructure(active);
    } catch (error) {
      console.error('Error fetching structures:', error);
      toast({
        title: "Error",
        description: "Failed to fetch report structures",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLineItems = async (structureId: number) => {
    try {
      const data = await EnhancedReportService.fetchLineItemsWithTranslations(
        structureId,
        contentLanguage
      );

      setLineItems(data || []);
    } catch (error) {
      console.error('Error fetching line items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch line items",
        variant: "destructive",
      });
    }
  };

  const checkStructuresWithMappings = async () => {
    // Legacy CoA mapping tables have been removed
    // No structures have mappings anymore since the old mapping system is deprecated
    setStructuresWithMappings(new Set());
  };

  useEffect(() => {
    fetchStructures();
    checkStructuresWithMappings();
  }, [contentLanguage]);

  const toggleStructureStatus = async (structureId: number, currentStatus: boolean) => {
    if (!isSuperAdmin) {
      toast({
        title: "Access Denied",
        description: "Only Super Admins can change report structure status",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('report_structures')
        .update({ is_active: !currentStatus })
        .eq('report_structure_id', structureId);

      if (error) throw error;

      const statusText = !currentStatus ? "activated" : "deactivated";
      toast({
        title: "Success",
        description: `Report structure ${statusText} successfully`,
      });
      
      fetchStructures();
    } catch (error) {
      console.error('Error updating structure status:', error);
      toast({
        title: "Error",
        description: "Failed to update structure status",
        variant: "destructive",
      });
    }
  };

  const deleteStructure = async (structureId: number, structureName: string) => {
    if (!confirm(`Are you sure you want to delete "${structureName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('report_structures')
        .delete()
        .eq('report_structure_id', structureId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Report structure deleted successfully",
      });
      
      fetchStructures();
    } catch (error) {
      console.error('Error deleting structure:', error);
      toast({
        title: "Error",
        description: "Failed to delete structure",
        variant: "destructive",
      });
    }
  };

  const handleFileProcessed = async (fileData: {
    structureData: any[];
    filename: string;
    totalRows: number;
    mappings: any[];
    unmappedColumns: Record<string, any>[];
    overwriteMode: boolean;
    targetStructureId?: string;
    importedStructureId?: string;
    structureName?: string;
    parentKeyValidation: any;
    uploadedFilePath?: string; // Add uploaded file path
  }) => {
    if (!user) return;

    setUploading(true);
    try {
      console.log('Processing enhanced file data:', fileData);
      
      // Use the pre-mapped structure data
      const structureData = fileData.structureData;

      console.log('Calling edge function with:', {
        structureData: structureData.slice(0, 3), // Log first 3 items for debugging
        filename: fileData.filename,
        userId: user.id,
        userEmail: user.email,
        overwriteMode: fileData.overwriteMode,
        targetStructureId: fileData.targetStructureId,
        unmappedColumns: fileData.unmappedColumns.slice(0, 3),
        mappings: fileData.mappings,
      });

      // Call edge function to process the uploaded structure
      const { data: result, error } = await supabase.functions.invoke('process-report-structure', {
        body: {
          structureData,
          filename: fileData.filename,
          userId: user.id,
          userEmail: user.email,
          structureName: fileData.structureName,
          overwriteMode: fileData.overwriteMode,
          targetStructureId: fileData.targetStructureId,
          unmappedColumns: fileData.unmappedColumns,
          columnMappings: fileData.mappings,
          importedStructureId: fileData.importedStructureId,
          parentKeyValidation: fileData.parentKeyValidation,
          uploadedFilePath: fileData.uploadedFilePath, // Pass the uploaded file path
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Edge function result:', result);

      toast({
        title: "Success",
        description: `Report structure "${fileData.filename}" processed successfully`,
      });
      
      fetchStructures();
    } catch (error) {
      console.error('Error processing structure:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process report structure",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dayMonth = date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const time = date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${dayMonth} ${time}`;
  };

  const getActionsForStructure = (structure: ReportStructure) => {
    const actions = [];

    // Status toggle action - only for super admins  
    if (isSuperAdmin) {
      actions.push(
        <Button
          key="toggle-status"
          variant="ghost"
          size="sm"
          onClick={() => toggleStructureStatus(structure.report_structure_id, !structure.is_active)}
        >
          {structure.is_active ? (
            <>
              <X className="h-4 w-4 mr-1" />
              {t('BTN_DEACTIVATE', 'Deactivate')}
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-1" />
              {t('BTN_ACTIVATE', 'Activate')}
            </>
          )}
        </Button>
      );
    }

    // View action - always show
    actions.push(
      <Button
        key="view"
        variant="ghost"
        size="sm"
        onClick={() => {
          fetchLineItems(structure.report_structure_id);
          // Switch to viewer tab
          const viewerTab = document.querySelector('[data-state="inactive"][value="viewer"]') as HTMLElement;
          if (viewerTab) viewerTab.click();
        }}
      >
        <Eye className="h-4 w-4 mr-1" />
        {t('BTN_VIEW', 'View')}
      </Button>
    );

    // Modify action - only show for super admins
    if (isSuperAdmin) {
      actions.push(
        <Button
          key="modify"
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedStructureForModify(structure.report_structure_id);
            // Switch to modifier tab
            const modifierTab = document.querySelector('[data-state="inactive"][value="modifier"]') as HTMLElement;
            if (modifierTab) modifierTab.click();
          }}
        >
          <Edit className="h-4 w-4 mr-1" />
          {t('BTN_MODIFY', 'Modify')}
        </Button>
      );

      // Delete action - only show for super admins
      actions.push(
        <Button
          key="delete"
          variant="ghost"
          size="sm"
          onClick={() => deleteStructure(structure.report_structure_id, structure.report_structure_name)}
          disabled={structuresWithMappings.has(structure.report_structure_id)}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          {t('BTN_DELETE', 'Delete')}
        </Button>
      );
    }

    return actions;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg">Loading report structures...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <div className="border-b bg-card/50 rounded-t-lg p-4">
          <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/30">
            <TabsTrigger value="overview" className="flex items-center gap-2 text-sm font-medium">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">{t('TAB_LIST_REPORT_STRUCTURES', 'List Report Structures')}</span>
              <span className="sm:hidden">List</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2 text-sm font-medium">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">{t('TAB_UPLOAD_NEW_STRUCTURE', 'Upload New Structure')}</span>
              <span className="sm:hidden">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="viewer" className="flex items-center gap-2 text-sm font-medium">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">{t('TAB_VIEW_STRUCTURE', 'View Structure')}</span>
              <span className="sm:hidden">View</span>
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="modifier" className="flex items-center gap-2 text-sm font-medium">
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">{t('TAB_MODIFY_STRUCTURE', 'Modify Structure')}</span>
                <span className="sm:hidden">Modify</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <div className="bg-background rounded-b-lg">
          <TabsContent value="overview" className="mt-0 p-6">
            <div className="space-y-6">
              <div className="flex flex-col space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">{t('HEADING_REPORT_STRUCTURES', 'Report Structures')}</h2>
                <p className="text-muted-foreground">
                  {t('DESC_MANAGE_REPORT_STRUCTURES', 'Manage your report structures and generate missing translations')}
                </p>
              </div>
              {structures.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-lg bg-muted/20">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No report structures found</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Upload a CSV or Excel file to create your first structure and start managing your reports.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Translation Management Section */}
                  <Card className="border-muted/40 bg-gradient-to-r from-muted/30 to-muted/20">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-medium">Translation Management</CardTitle>
                      <CardDescription>Generate and manage translations for your report structures</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {structures.map((structure) => (
                        <TranslationTestButton
                          key={structure.report_structure_uuid}
                          structureUuid={structure.report_structure_uuid}
                          structureName={structure.report_structure_name}
                        />
                      ))}
                    </CardContent>
                  </Card>

                  {/* Structures Table */}
                  <Card className="border-muted/40">
                    <CardContent className="p-0">
                      <div className="overflow-hidden rounded-lg border border-muted/40">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow className="border-muted/40 hover:bg-muted/40">
                              <TableHead className="font-semibold text-foreground/90">{t('TABLE_ID', 'ID')}</TableHead>
                              <TableHead className="font-semibold text-foreground/90">{t('TABLE_NAME', 'Name')}</TableHead>
                              <TableHead className="font-semibold text-foreground/90">{t('TABLE_VERSION', 'Version')}</TableHead>
                              <TableHead className="font-semibold text-foreground/90">{t('TABLE_STATUS', 'Status')}</TableHead>
                              <TableHead className="font-semibold text-foreground/90">{t('TABLE_CREATED_BY', 'Created By')}</TableHead>
                              <TableHead className="font-semibold text-foreground/90">{t('TABLE_CREATED_AT', 'Created At')}</TableHead>
                              <TableHead className="font-semibold text-foreground/90 text-right">{t('TABLE_ACTIONS', 'Actions')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {structures.map((structure, index) => (
                              <TableRow 
                                key={structure.report_structure_id} 
                                className={`border-muted/30 hover:bg-muted/20 transition-colors ${
                                  index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                                }`}
                              >
                                <TableCell className="font-mono text-sm text-muted-foreground">
                                  {structure.report_structure_id}
                                </TableCell>
                                <TableCell className="font-medium text-foreground">
                                  {structure.report_structure_name}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{structure.version}</TableCell>
                                <TableCell>
                                  {structure.is_active ? (
                                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                                      <Check className="w-3 h-3 mr-1" />
                                      {t('STATUS_ACTIVE', 'Active')}
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                                      {t('STATUS_INACTIVE', 'Disabled')}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{structure.created_by_user_name}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">{formatDate(structure.created_at)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-end gap-1">
                                    {getActionsForStructure(structure)}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-0 p-6">
            <div className="space-y-6">
              <div className="flex flex-col space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">Upload New Structure</h2>
                <p className="text-muted-foreground">
                  Import a new report structure from CSV or Excel files
                </p>
              </div>
              <Card className="border-muted/40">
                <CardContent className="pt-6">
                  <AdvancedFileUpload onFileProcessed={handleFileProcessed} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="viewer" className="mt-0 p-6">
            <div className="space-y-6">
              <div className="flex flex-col space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">{t('HEADING_STRUCTURE_VIEWER', 'Structure Viewer')}</h2>
                <p className="text-muted-foreground">
                  {t('DESC_STRUCTURE_VIEWER', 'Browse and explore the hierarchical structure of report line items')}
                </p>
              </div>
              <Card className="border-muted/40">
                <CardContent className="pt-6">
                  <ReportStructureViewer
                    structures={structures}
                    activeStructure={activeStructure}
                    onStructureChange={(structureId) => {
                      if (structureId) {
                        fetchLineItems(structureId);
                      } else {
                        setLineItems([]);
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="modifier" className="mt-0 p-6">
              <div className="space-y-6">
                <div className="flex flex-col space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight">{t('HEADING_STRUCTURE_MODIFIER', 'Structure Modifier')}</h2>
                  <p className="text-muted-foreground">
                    {t('DESC_STRUCTURE_MODIFIER', 'Edit and manage report structure line items and hierarchy')}
                  </p>
                </div>
                <ReportStructureModifier />
              </div>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
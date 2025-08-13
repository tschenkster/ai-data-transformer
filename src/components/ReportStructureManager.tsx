import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, Eye, Settings, Plus, FileText, Database, AlertTriangle, Edit, Check, X } from 'lucide-react';
import { EnhancedFileUpload } from '@/components/EnhancedFileUpload';
import ReportStructureViewer from '@/components/ReportStructureViewer';
import ReportStructureModifier from '@/components/ReportStructureModifier';
import { ActionButtons, createSetActiveAction, createViewAction, createModifyAction, createDeleteAction } from '@/components/ui/action-buttons';

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
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [structures, setStructures] = useState<ReportStructure[]>([]);
  const [activeStructure, setActiveStructure] = useState<ReportStructure | null>(null);
  const [lineItems, setLineItems] = useState<ReportLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [structuresWithMappings, setStructuresWithMappings] = useState<Set<number>>(new Set());
  const [selectedStructureForModify, setSelectedStructureForModify] = useState<number | null>(null);

  const fetchStructures = async () => {
    try {
      const { data, error } = await supabase
        .from('report_structures')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

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
      // Use integer ID for performance in joins
      const { data, error } = await supabase
        .from('report_line_items')
        .select('*')
        .eq('report_structure_id', structureId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

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
    try {
      // Get all report line items that have been used in mappings
      const { data: mappingData, error: mappingError } = await supabase
        .from('account_mappings')
        .select('report_line_item_uuid')
        .not('report_line_item_uuid', 'is', null);

      if (mappingError) throw mappingError;

      if (mappingData && mappingData.length > 0) {
        const lineItemUuids = mappingData.map(m => m.report_line_item_uuid);
        
        // Get the report structure UUIDs for these line items
        const { data: lineItemData, error: lineItemError } = await supabase
          .from('report_line_items')
          .select('report_structure_uuid')
          .in('report_line_item_uuid', lineItemUuids);

        if (lineItemError) throw lineItemError;

        // Get structure IDs from UUIDs
        const structureUuids = lineItemData?.map(item => item.report_structure_uuid).filter(Boolean) || [];
        
        if (structureUuids.length > 0) {
          const { data: structureData, error: structureError } = await supabase
            .from('report_structures')
            .select('report_structure_id')
            .in('report_structure_uuid', structureUuids);

          if (structureError) throw structureError;

          const structureIds = new Set(
            structureData?.map(item => item.report_structure_id).filter(Boolean) || []
          );
          setStructuresWithMappings(structureIds);
        }
      }
    } catch (error) {
      console.error('Error checking structures with mappings:', error);
    }
  };

  useEffect(() => {
    fetchStructures();
    checkStructuresWithMappings();
  }, []);

  const setActiveStructureHandler = async (structureId: number) => {
    try {
      const { error } = await supabase
        .from('report_structures')
        .update({ is_active: true })
        .eq('report_structure_id', structureId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Active structure updated successfully",
      });
      
      fetchStructures();
    } catch (error) {
      console.error('Error setting active structure:', error);
      toast({
        title: "Error",
        description: "Failed to set active structure",
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

    // Set Active action - only show when structure is not active
    if (!structure.is_active) {
      actions.push(createSetActiveAction(
        () => setActiveStructureHandler(structure.report_structure_id)
      ));
    }

    // View action - always show
    actions.push(createViewAction(
      () => {
        fetchLineItems(structure.report_structure_id);
        // Switch to viewer tab
        const viewerTab = document.querySelector('[data-state="inactive"][value="viewer"]') as HTMLElement;
        if (viewerTab) viewerTab.click();
      }
    ));

    // Modify action - only show for super admins
    if (isSuperAdmin) {
      actions.push(createModifyAction(
        () => {
          setSelectedStructureForModify(structure.report_structure_id);
          // Switch to modifier tab
          const modifierTab = document.querySelector('[data-state="inactive"][value="modifier"]') as HTMLElement;
          if (modifierTab) modifierTab.click();
        }
      ));
    }

    // Delete action - always show but disabled if structure has mappings
    actions.push(createDeleteAction(
      () => deleteStructure(structure.report_structure_id, structure.report_structure_name),
      structuresWithMappings.has(structure.report_structure_id)
    ));

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
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">
          <Database className="w-4 h-4 mr-2" />
          List Report Structures
        </TabsTrigger>
        <TabsTrigger value="upload">
          <Upload className="w-4 h-4 mr-2" />
          Upload New Structure
        </TabsTrigger>
        <TabsTrigger value="viewer">
          <Eye className="w-4 h-4 mr-2" />
          View Structure
        </TabsTrigger>
        {isSuperAdmin && (
          <TabsTrigger value="modifier">
            <Edit className="w-4 h-4 mr-2" />
            Modify Structure
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardContent>
            {structures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No report structures found</p>
                <p className="text-sm">Upload a CSV or Excel file to create your first structure</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {structures.map((structure) => (
                    <TableRow key={structure.report_structure_id}>
                      <TableCell className="font-mono text-sm">
                        {structure.report_structure_id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {structure.report_structure_name}
                      </TableCell>
                      <TableCell>{structure.version}</TableCell>
                      <TableCell>
                        {structure.is_active ? (
                          <Badge variant="default">
                            <Check className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell>{structure.created_by_user_name}</TableCell>
                      <TableCell>{formatDate(structure.created_at)}</TableCell>
                      <TableCell>
                        <ActionButtons 
                          actions={getActionsForStructure(structure)}
                          title=""
                          className="space-y-0"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </TabsContent>

      <TabsContent value="upload" className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <EnhancedFileUpload onFileProcessed={handleFileProcessed} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="viewer" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Structure Viewer</CardTitle>
            <CardDescription>
              Browse and explore the hierarchical structure of report line items
            </CardDescription>
          </CardHeader>
          <CardContent>
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
      </TabsContent>

  {isSuperAdmin && (
    <TabsContent value="modifier" className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          {/* Structure selection is now handled within ReportStructureModifier */}
          <ReportStructureModifier />
        </CardContent>
      </Card>
    </TabsContent>
  )}
    </Tabs>
  );
}
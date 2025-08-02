import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, Eye, Settings, Plus, FileText, Check, X, Database, AlertTriangle } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import ReportStructureViewer from '@/components/ReportStructureViewer';

interface ReportStructure {
  report_structure_id: string;
  report_structure_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
  created_by_user_name: string;
  version: number;
}

interface ReportLineItem {
  report_line_item_id: string;
  report_structure_id: string;
  report_structure_name: string;
  report_line_item_key: string;
  parent_report_line_item_key?: string;
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
  comment?: number;
}

export default function ReportStructureManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [structures, setStructures] = useState<ReportStructure[]>([]);
  const [activeStructure, setActiveStructure] = useState<ReportStructure | null>(null);
  const [lineItems, setLineItems] = useState<ReportLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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

  const fetchLineItems = async (structureId: string) => {
    try {
      const { data, error } = await supabase
        .from('report_line_items')
        .select('*')
        .eq('report_structure_id', structureId)
        .order('sort_order');

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

  useEffect(() => {
    fetchStructures();
  }, []);

  const setActiveStructureHandler = async (structureId: string) => {
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

  const deleteStructure = async (structureId: string, structureName: string) => {
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

  const handleFileProcessed = async (fileData: { accounts: any[]; filename: string; totalAccounts: number }) => {
    if (!user) return;

    setUploading(true);
    try {
      console.log('Processing file data:', fileData);
      
      // Use the raw structure data from the file
      const structureData = fileData.accounts.map((item: any, index: number) => {
        // Map file columns to expected database format
        const mapped = {
          report_line_item_key: item.report_line_item_key || item['Report Line Item Key'] || `ITEM_${index + 1}`,
          parent_report_line_item_key: item.parent_report_line_item_key || item['Parent Report Line Item Key'] || null,
          sort_order: item.sort_order || item['Sort Order'] || index,
          level_1_line_item_description: item.level_1_line_item_description || item['Level 1 Line Item Description'] || null,
          level_2_line_item_description: item.level_2_line_item_description || item['Level 2 Line Item Description'] || null,
          level_3_line_item_description: item.level_3_line_item_description || item['Level 3 Line Item Description'] || null,
          level_4_line_item_description: item.level_4_line_item_description || item['Level 4 Line Item Description'] || null,
          level_5_line_item_description: item.level_5_line_item_description || item['Level 5 Line Item Description'] || null,
          level_6_line_item_description: item.level_6_line_item_description || item['Level 6 Line Item Description'] || null,
          level_7_line_item_description: item.level_7_line_item_description || item['Level 7 Line Item Description'] || null,
          is_leaf: item.is_leaf === true || item['Is Leaf'] === true || item.is_leaf === 'true' || item['Is Leaf'] === 'true',
          is_calculated: item.is_calculated === true || item['Is Calculated'] === true || item.is_calculated === 'true' || item['Is Calculated'] === 'true',
          display: item.display !== false && item['Display'] !== false && item.display !== 'false' && item['Display'] !== 'false',
          line_item_type: item.line_item_type || item['Line Item Type'] || null,
          description_of_leaf: item.description_of_leaf || item['Description of Leaf'] || null,
          data_source: item.data_source || item['Data Source'] || null,
        };
        
        console.log(`Mapped item ${index}:`, mapped);
        return mapped;
      });

      console.log('Calling edge function with:', {
        structureData: structureData.slice(0, 3), // Log first 3 items for debugging
        filename: fileData.filename,
        userId: user.id,
        userEmail: user.email,
      });

      // Call edge function to process the uploaded structure
      const { data: result, error } = await supabase.functions.invoke('process-report-structure', {
        body: {
          structureData,
          filename: fileData.filename,
          userId: user.id,
          userEmail: user.email,
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          Overview
        </TabsTrigger>
        <TabsTrigger value="upload">
          <Upload className="w-4 h-4 mr-2" />
          Upload Structure
        </TabsTrigger>
        <TabsTrigger value="viewer">
          <Eye className="w-4 h-4 mr-2" />
          Structure Viewer
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Report Structures</CardTitle>
            <CardDescription>
              Manage report structures and their versions. Only one structure can be active at a time.
            </CardDescription>
          </CardHeader>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {structures.map((structure) => (
                    <TableRow key={structure.report_structure_id}>
                      <TableCell className="font-medium">
                        {structure.report_structure_name}
                      </TableCell>
                      <TableCell>v{structure.version}</TableCell>
                      <TableCell>
                        {structure.is_active ? (
                          <Badge variant="default">
                            <Check className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>{structure.created_by_user_name}</TableCell>
                      <TableCell>{formatDate(structure.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {!structure.is_active && (
                            <Button
                              size="sm"
                              onClick={() => setActiveStructureHandler(structure.report_structure_id)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Set Active
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              fetchLineItems(structure.report_structure_id);
                              // Switch to viewer tab
                              const viewerTab = document.querySelector('[data-state="inactive"][value="viewer"]') as HTMLElement;
                              if (viewerTab) viewerTab.click();
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteStructure(structure.report_structure_id, structure.report_structure_name)}
                            disabled={structure.is_active}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {activeStructure && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                Active Structure
              </CardTitle>
              <CardDescription>
                Currently active report structure used for account mapping
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="font-medium">{activeStructure.report_structure_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Version</label>
                  <p className="font-medium">v{activeStructure.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created By</label>
                  <p className="font-medium">{activeStructure.created_by_user_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="font-medium">{formatDate(activeStructure.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="upload" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Upload Report Structure</CardTitle>
            <CardDescription>
              Upload a CSV or Excel file containing your report structure. The file should include columns for hierarchy levels and account mappings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">File Format Requirements</h4>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      <li>• Include columns for report_line_item_key, hierarchy levels (level_1 to level_7)</li>
                      <li>• Use parent_report_line_item_key to define hierarchy relationships</li>
                      <li>• Mark leaf items with is_leaf = true</li>
                      <li>• Set sort_order for proper ordering</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <FileUpload onFileProcessed={handleFileProcessed} mode="report-structure" />
            </div>
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
    </Tabs>
  );
}
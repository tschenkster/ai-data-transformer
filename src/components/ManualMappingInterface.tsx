import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Target, Check, Calculator, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ReportStructure {
  report_structure_id: string;
  report_structure_name: string;
  is_active: boolean;
}

interface ReportLineItem {
  report_line_item_id: string;
  report_structure_id: string;
  report_structure_name: string;
  report_line_item_key: string;
  parent_report_line_item_key?: string;
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
  report_line_item_description?: string;
}

interface TreeNodeData {
  id: string;
  key: string;
  description: string;
  level: number;
  children: TreeNodeData[];
  item: ReportLineItem;
}

interface ManualMappingInterfaceProps {
  onMappingCreated?: () => void;
}

export default function ManualMappingInterface({ onMappingCreated }: ManualMappingInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeStructure, setActiveStructure] = useState<ReportStructure | null>(null);
  const [lineItems, setLineItems] = useState<ReportLineItem[]>([]);
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [filteredItems, setFilteredItems] = useState<ReportLineItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [originalAccount, setOriginalAccount] = useState('');
  const [selectedLineItem, setSelectedLineItem] = useState<ReportLineItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchActiveStructure = async () => {
    try {
      const { data, error } = await supabase
        .from('report_structures')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No active structure found
          setActiveStructure(null);
          return;
        }
        throw error;
      }

      setActiveStructure(data);
    } catch (error) {
      console.error('Error fetching active structure:', error);
      toast({
        title: "Error",
        description: "Failed to fetch active report structure",
        variant: "destructive",
      });
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

  const getItemDisplayName = (item: ReportLineItem): string => {
    if (item.report_line_item_description) return item.report_line_item_description;
    
    for (let i = 1; i <= 7; i++) {
      const desc = item[`level_${i}_line_item_description` as keyof ReportLineItem] as string;
      if (desc) return desc;
    }
    
    if (item.description_of_leaf) return item.description_of_leaf;
    if (item.hierarchy_path) return item.hierarchy_path;
    return item.report_line_item_key;
  };

  const buildTreeData = () => {
    const itemMap = new Map<string, ReportLineItem>();
    lineItems.forEach(item => {
      itemMap.set(item.report_line_item_key, item);
    });

    const buildNode = (item: ReportLineItem, level: number = 0): TreeNodeData => {
      const children = lineItems
        .filter(child => child.parent_report_line_item_key === item.report_line_item_key)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(child => buildNode(child, level + 1));

      return {
        id: item.report_line_item_id,
        key: item.report_line_item_key,
        description: getItemDisplayName(item),
        level,
        children,
        item,
      };
    };

    const rootItems = lineItems
      .filter(item => !item.parent_report_line_item_key || !itemMap.has(item.parent_report_line_item_key))
      .sort((a, b) => a.sort_order - b.sort_order);

    return rootItems.map(item => buildNode(item));
  };

  useEffect(() => {
    fetchActiveStructure();
  }, []);

  useEffect(() => {
    if (activeStructure) {
      fetchLineItems(activeStructure.report_structure_id);
    }
    setLoading(false);
  }, [activeStructure]);

  useEffect(() => {
    if (lineItems.length > 0) {
      setTreeData(buildTreeData());
    }
  }, [lineItems]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = lineItems.filter(item => {
        const displayName = getItemDisplayName(item).toLowerCase();
        const key = item.report_line_item_key.toLowerCase();
        const search = searchTerm.toLowerCase();
        return displayName.includes(search) || key.includes(search);
      });
      setFilteredItems(filtered);
    } else {
      setFilteredItems([]);
    }
  }, [searchTerm, lineItems]);

  const handleCreateMapping = async () => {
    if (!user || !selectedLineItem || !originalAccount.trim()) return;

    setCreating(true);
    try {
      const { error } = await supabase
        .from('account_mappings')
        .insert({
          user_id: user.id,
          original_account_name: originalAccount.trim(),
          mapped_account_name: getItemDisplayName(selectedLineItem),
          report_line_item_id: selectedLineItem.report_line_item_id,
          confidence_score: 1.0, // Manual mapping has 100% confidence
          reasoning: 'Manual mapping created by user',
          validated: true,
          validated_by: user.id,
          validated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Account mapping created successfully",
      });

      // Reset form
      setOriginalAccount('');
      setSelectedLineItem(null);
      setSearchTerm('');
      setIsDialogOpen(false);
      
      onMappingCreated?.();
    } catch (error) {
      console.error('Error creating mapping:', error);
      toast({
        title: "Error",
        description: "Failed to create account mapping",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const renderTreeNode = (node: TreeNodeData, level: number = 0): React.ReactNode => {
    const isSelected = selectedLineItem?.report_line_item_id === node.item.report_line_item_id;
    
    return (
      <div key={node.id} className="space-y-1">
        <div
          onClick={() => setSelectedLineItem(node.item)}
          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
            isSelected ? 'bg-primary/10 border border-primary' : 'hover:bg-muted/50'
          }`}
          style={{ marginLeft: `${level * 16}px` }}
        >
          <div className="flex-1 flex items-center gap-2">
            <span className="font-medium">{node.description}</span>
            <div className="flex items-center gap-1">
              {node.item.is_calculated && (
                <Badge variant="secondary" className="text-xs">
                  <Calculator className="h-3 w-3 mr-1" />
                  Calc
                </Badge>
              )}
              {!node.item.display && (
                <Badge variant="outline" className="text-xs">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hidden
                </Badge>
              )}
              {node.item.is_leaf && (
                <Badge variant="default" className="text-xs">
                  Leaf
                </Badge>
              )}
            </div>
          </div>
          {isSelected && <Check className="h-4 w-4 text-primary" />}
        </div>
        {node.children.length > 0 && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!activeStructure) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manual Account Mapping</CardTitle>
          <CardDescription>Create direct mappings between account names and report line items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active report structure found</p>
            <p className="text-sm">Please activate a report structure to enable manual mapping</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Manual Account Mapping
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Mapping
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Create Account Mapping</DialogTitle>
                <DialogDescription>
                  Map an account name to a specific line item in the active report structure: {activeStructure.report_structure_name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Original Account Name</label>
                  <Input
                    value={originalAccount}
                    onChange={(e) => setOriginalAccount(e.target.value)}
                    placeholder="Enter the original account name to map"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Search Report Line Items</label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search line items..."
                      className="pl-10"
                    />
                  </div>
                </div>

                {selectedLineItem && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Selected: {getItemDisplayName(selectedLineItem)}</p>
                        <p className="text-sm text-muted-foreground">Key: {selectedLineItem.report_line_item_key}</p>
                      </div>
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                )}

                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                  {searchTerm.trim() ? (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Search Results</h4>
                      {filteredItems.length > 0 ? (
                        filteredItems.map(item => {
                          const isSelected = selectedLineItem?.report_line_item_id === item.report_line_item_id;
                          return (
                            <div
                              key={item.report_line_item_id}
                              onClick={() => setSelectedLineItem(item)}
                              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected ? 'bg-primary/10 border border-primary' : 'hover:bg-muted/50'
                              }`}
                            >
                              <div>
                                <p className="font-medium">{getItemDisplayName(item)}</p>
                                <p className="text-sm text-muted-foreground">{item.report_line_item_key}</p>
                              </div>
                              {isSelected && <Check className="h-4 w-4 text-primary" />}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">No items found matching your search</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Report Structure Hierarchy</h4>
                      {treeData.map(node => renderTreeNode(node))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateMapping}
                    disabled={!originalAccount.trim() || !selectedLineItem || creating}
                  >
                    {creating ? 'Creating...' : 'Create Mapping'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Create direct mappings between account names and report line items using the active structure: <strong>{activeStructure.report_structure_name}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Click "New Mapping" to create manual account mappings</p>
          <p className="text-sm">Map specific account names to report line items for precise control</p>
        </div>
      </CardContent>
    </Card>
  );
}
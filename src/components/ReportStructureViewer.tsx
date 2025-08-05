import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { useToast } from '@/hooks/use-toast';
import { Search, ChevronRight, ChevronDown, FileText, Folder, Calculator, Database } from 'lucide-react';

interface ReportStructure {
  report_structure_id: number;
  report_structure_uuid: string;
  report_structure_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
  created_by_user_name: string;
  version: number;
}

interface ReportLineItem {
  report_line_item_id: number;
  report_line_item_uuid: string;
  report_structure_id: number;
  report_structure_name: string;
  report_line_item_key: string;
  report_line_item_description?: string;
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
  comment?: string;
}

interface TreeNodeData {
  id: string;
  label: string;
  children: TreeNodeData[];
  item: ReportLineItem;
  isExpanded: boolean;
}

interface ReportStructureViewerProps {
  structures: ReportStructure[];
  activeStructure: ReportStructure | null;
  onStructureChange: (structureId: number | null) => void;
}

export default function ReportStructureViewer({ 
  structures, 
  activeStructure,
  onStructureChange 
}: ReportStructureViewerProps) {
  const { toast } = useToast();
  const [selectedStructure, setSelectedStructure] = useState<string>('');
  const [lineItems, setLineItems] = useState<ReportLineItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ReportLineItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (activeStructure) {
      setSelectedStructure(activeStructure.report_structure_id.toString());
      fetchLineItems(activeStructure.report_structure_id);
    }
  }, [activeStructure]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = lineItems.filter(item => 
        item.report_line_item_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.level_1_line_item_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.level_2_line_item_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.level_3_line_item_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.level_4_line_item_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.level_5_line_item_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.level_6_line_item_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.level_7_line_item_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description_of_leaf?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(lineItems);
    }
  }, [searchTerm, lineItems]);

  useEffect(() => {
    buildTreeData();
  }, [filteredItems]);

  const fetchLineItems = async (structureId: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('report_line_items')
        .select('*')
        .eq('report_structure_id', structureId)
        .order('sort_order');

      if (error) throw error;

      setLineItems(data || []);
      onStructureChange(structureId);
    } catch (error) {
      console.error('Error fetching line items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch line items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const buildTreeData = () => {
    const itemMap = new Map<string, TreeNodeData>();
    const rootItems: TreeNodeData[] = [];

    // Create nodes for all items
    filteredItems.forEach(item => {
      const node: TreeNodeData = {
        id: item.report_line_item_key,
        label: getItemDisplayName(item),
        children: [],
        item,
        isExpanded: expandedNodes.has(item.report_line_item_key)
      };
      itemMap.set(item.report_line_item_key, node);
    });

    // Build hierarchy
    filteredItems.forEach(item => {
      const node = itemMap.get(item.report_line_item_key);
      if (!node) return;

      if (item.parent_report_line_item_key) {
        const parent = itemMap.get(item.parent_report_line_item_key);
        if (parent) {
          parent.children.push(node);
        } else {
          // Parent not in filtered results, add to root
          rootItems.push(node);
        }
      } else {
        rootItems.push(node);
      }
    });

    // Sort children by sort_order
    const sortChildren = (nodes: TreeNodeData[]) => {
      nodes.sort((a, b) => a.item.sort_order - b.item.sort_order);
      nodes.forEach(node => sortChildren(node.children));
    };

    sortChildren(rootItems);
    setTreeData(rootItems);
  };

  const getItemDisplayName = (item: ReportLineItem) => {
    // Use report_line_item_description as primary display field
    if (item.report_line_item_description) {
      return item.report_line_item_description;
    }
    
    // Fallback to hierarchy path
    if (item.hierarchy_path) {
      return item.hierarchy_path;
    }
    
    // Last fallback to the key
    return item.report_line_item_key;
  };

  const handleStructureChange = (value: string) => {
    setSelectedStructure(value);
    if (value) {
      const structureId = parseInt(value);
      fetchLineItems(structureId);
    } else {
      setLineItems([]);
      onStructureChange(null);
    }
  };

  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
    buildTreeData();
  };

  const renderTreeNode = (node: TreeNodeData, level: number = 0): JSX.Element => {
    const hasChildren = node.children.length > 0;
    const isExpanded = node.isExpanded;

    return (
      <div key={node.id} className="select-none">
        <div 
          className={`flex items-center gap-2 py-2 px-2 hover:bg-accent/50 rounded-md cursor-pointer ${
            level > 0 ? `ml-${Math.min(level * 4, 16)}` : ''
          }`}
          style={{ marginLeft: level * 16 }}
          onClick={() => hasChildren && toggleNodeExpansion(node.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
          
          {node.item.is_leaf ? (
            <FileText className="w-4 h-4 text-blue-500" />
          ) : (
            <Folder className="w-4 h-4 text-yellow-500" />
          )}
          
          <span className="text-sm flex-1">{node.label}</span>
          
          <div className="flex items-center gap-1">
            {node.item.is_calculated && (
              <Badge variant="secondary" className="text-xs">
                <Calculator className="w-3 h-3 mr-1" />
                Calc
              </Badge>
            )}
            {node.item.data_source && (
              <Badge variant="outline" className="text-xs">
                <Database className="w-3 h-3 mr-1" />
                {node.item.data_source}
              </Badge>
            )}
            {!node.item.display && (
              <Badge variant="destructive" className="text-xs">
                Hidden
              </Badge>
            )}
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <Select value={selectedStructure} onValueChange={handleStructureChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a report structure" />
            </SelectTrigger>
            <SelectContent>
              {structures.map((structure) => (
                <SelectItem key={structure.report_structure_id} value={structure.report_structure_id.toString()}>
                  {structure.report_structure_name} 
                  {structure.is_active && ' (Active)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search line items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-lg">Loading structure...</div>
        </div>
      ) : lineItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No line items found</p>
          {selectedStructure && <p className="text-sm">This structure appears to be empty</p>}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No items match your search</p>
          <p className="text-sm">Try adjusting your search terms</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Structure Hierarchy ({filteredItems.length} items)
            </CardTitle>
            <CardDescription>
              Hierarchical view of report line items. Click folders to expand/collapse.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto border rounded-lg p-2">
              {treeData.map(node => renderTreeNode(node))}
            </div>
            
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Folder className="w-4 h-4 text-yellow-500" />
                <span>Folder</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Leaf Item</span>
              </div>
              <div className="flex items-center gap-1">
                <Calculator className="w-3 h-3" />
                <span>Calculated</span>
              </div>
              <div className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                <span>Has Data Source</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
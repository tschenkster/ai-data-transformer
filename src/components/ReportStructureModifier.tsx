import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import ChangeHistoryTable, { ChangeHistoryEntry } from './ChangeHistoryTable';
import CreateLineItemDialog from './CreateLineItemDialog';
import DeleteLineItemDialog from './DeleteLineItemDialog';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  FileText, 
  Folder, 
  Calculator, 
  Database, 
  GripVertical,
  Edit,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Loader2
} from 'lucide-react';
import { buildTreeFromGlobalOrder, reorderItemWithinParent, flattenTreeToSequentialOrder } from '@/lib/sortOrderUtils';

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

interface TreeNodeData {
  id: string;
  key: string;
  description: string;
  level: number;
  children: TreeNodeData[];
  item: ReportLineItem;
  isExpanded?: boolean;
}

interface SortableItemProps {
  node: TreeNodeData;
  level: number;
  isEditing: boolean;
  onEditStart: (key: string) => void;
  onEditSave: (key: string, newDescription: string) => void;
  onEditCancel: () => void;
  editingValue: string;
  onEditingValueChange: (value: string) => void;
  onToggleExpansion: (nodeId: string) => void;
  expandedNodes: Set<string>;
  onDelete: (item: ReportLineItem) => void;
}

function SortableItem({ 
  node, 
  level, 
  isEditing, 
  onEditStart, 
  onEditSave, 
  onEditCancel,
  editingValue,
  onEditingValueChange,
  onToggleExpansion,
  expandedNodes,
  onDelete
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasChildren = node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="select-none"
    >
      <div 
        className={`flex items-center gap-2 py-1 px-2 hover:bg-accent/50 rounded-md ${
          hasChildren ? 'cursor-pointer' : 'cursor-default'
        }`}
        style={{ marginLeft: level * 16 }}
      >
        {hasChildren ? (
          <div 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleExpansion(node.id);
            }}
            className="cursor-pointer"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        ) : (
          <div className="w-4 h-4" />
        )}

        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>

        {node.item.is_leaf ? (
          <FileText className="w-4 h-4 text-blue-500" />
        ) : (
          <Folder className="w-4 h-4 text-yellow-500" />
        )}
        
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editingValue}
              onChange={(e) => onEditingValueChange(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onEditSave(node.key, editingValue);
                } else if (e.key === 'Escape') {
                  onEditCancel();
                }
              }}
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEditSave(node.key, editingValue)}
            >
              <Check className="w-4 h-4 text-green-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onEditCancel}
            >
              <X className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <span 
              className="text-sm flex-1 cursor-pointer hover:bg-accent/30 rounded px-1 py-0.5"
              onClick={(e) => {
                e.stopPropagation();
                onEditStart(node.key);
              }}
              title="Click to edit description"
            >
              {node.description}
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          {!node.item.display && (
            <Badge variant="destructive" className="text-xs">
              Hidden
            </Badge>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.item);
            }}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

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

interface ReportStructureModifierProps {
  // Now manages its own structure selection
}

export default function ReportStructureModifier({}: ReportStructureModifierProps) {
  const { toast } = useToast();
  
  // Structure selection state
  const [structures, setStructures] = useState<ReportStructure[]>([]);
  const [selectedStructureUuid, setSelectedStructureUuid] = useState<string>('');
  const [structuresLoading, setStructuresLoading] = useState(true);
  
  // Line items state
  const [lineItems, setLineItems] = useState<ReportLineItem[]>([]);
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [changeHistory, setChangeHistory] = useState<ChangeHistoryEntry[]>([]);
  const [recentlyUndoneItems, setRecentlyUndoneItems] = useState<Set<string>>(new Set());
  const [loadingChanges, setLoadingChanges] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ReportLineItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchStructures();
  }, []);

  useEffect(() => {
    if (selectedStructureUuid) {
      fetchLineItems(selectedStructureUuid);
    } else {
      setLineItems([]);
      setTreeData([]);
    }
  }, [selectedStructureUuid]);

  const fetchStructures = async () => {
    setStructuresLoading(true);
    try {
      const { data, error } = await supabase
        .from('report_structures')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setStructures(data || []);
      
      // Auto-select active structure if available
      const activeStructure = data?.find(s => s.is_active);
      if (activeStructure) {
        setSelectedStructureUuid(activeStructure.report_structure_uuid);
      }
    } catch (error) {
      console.error('Error fetching structures:', error);
      toast({
        title: "Error",
        description: "Failed to fetch report structures",
        variant: "destructive",
      });
    } finally {
      setStructuresLoading(false);
    }
  };

  const fetchLineItems = async (structureUuid: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('report_line_items')
        .select('*')
        .eq('report_structure_uuid', structureUuid)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching line items:', error);
        toast({
          title: "Error",
          description: "Failed to load report structure items",
          variant: "destructive",
        });
        return;
      }

      setLineItems(data || []);
      
      // Build tree data from the fetched items
      const treeData = buildTreeData(data || []);
      setTreeData(treeData);
      
      // Load change history
      await fetchChangeHistory(structureUuid);
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchChangeHistory = async (structureUuid: string) => {
    setLoadingChanges(true);
    try {
      const { data, error } = await supabase
        .from('report_structures_change_log')
        .select('*')
        .eq('structure_uuid', structureUuid)
        .eq('is_undone', false)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching change history:', error);
        return;
      }

      // Fetch hierarchy_path for each change entry by joining with line items
      const enrichedData = await Promise.all(
        (data || []).map(async (entry) => {
          if (entry.line_item_uuid) {
            const { data: lineItem } = await supabase
              .from('report_line_items')
              .select('hierarchy_path')
              .eq('report_line_item_uuid', entry.line_item_uuid)
              .single();
            
            return {
              ...entry,
              hierarchy_path: lineItem?.hierarchy_path || null
            };
          }
          return {
            ...entry,
            hierarchy_path: null
          };
        })
      );

      setChangeHistory(enrichedData);
    } catch (error) {
      console.error('Error fetching change history:', error);
    } finally {
      setLoadingChanges(false);
    }
  };

  const buildTreeData = (items: ReportLineItem[]): TreeNodeData[] => {
    // Use the new global sort order utility
    const treeNodes = buildTreeFromGlobalOrder(items);
    
    // Add UI-specific properties and calculate levels
    const enhanceTreeNodes = (nodes: TreeNodeData[], level: number = 0): TreeNodeData[] => {
      return nodes.map(node => ({
        ...node,
        key: node.item.report_line_item_key,
        description: getItemDisplayName(node.item),
        level,
        isExpanded: expandedNodes.has(node.item.report_line_item_uuid),
        children: enhanceTreeNodes(node.children, level + 1)
      }));
    };

    return enhanceTreeNodes(treeNodes);
  };

  const getItemDisplayName = (item: ReportLineItem) => {
    if (item.report_line_item_description) {
      return item.report_line_item_description;
    }
    if (item.hierarchy_path) {
      return item.hierarchy_path;
    }
    return item.report_line_item_key;
  };

  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const logStructureChange = async (
    lineItemUuid: string | null,
    lineItemId: number | null,
    actionType: 'create' | 'delete' | 'rename' | 'move',
    lineItemKey: string,
    lineItemDescription: string,
    previousState?: any,
    newState?: any
  ) => {
    if (!selectedStructureUuid) return;
    
    try {
      const { data: structure } = await supabase
        .from('report_structures')
        .select('report_structure_id')
        .eq('report_structure_uuid', selectedStructureUuid)
        .single();

      if (!structure) return;

      const { error } = await supabase.rpc('log_structure_change', {
        p_structure_uuid: selectedStructureUuid,
        p_structure_id: structure.report_structure_id,
        p_line_item_uuid: lineItemUuid,
        p_line_item_id: lineItemId,
        p_action_type: actionType,
        p_line_item_key: lineItemKey,
        p_line_item_description: lineItemDescription,
        p_previous_state: previousState ? JSON.stringify(previousState) : null,
        p_new_state: newState ? JSON.stringify(newState) : null
      });

      if (error) {
        console.error('Error logging change:', error);
      } else {
        // Refresh change history
        await fetchChangeHistory(selectedStructureUuid);
      }
    } catch (error) {
      console.error('Error logging change:', error);
    }
  };

  const highlightRecentlyUndoneItem = (itemKey: string) => {
    setRecentlyUndoneItems(prev => new Set(prev).add(itemKey));
    // Remove highlight after 2 seconds
    setTimeout(() => {
      setRecentlyUndoneItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }, 2000);
  };

  const handleEdit = async (key: string, newDescription: string) => {
    try {
      // Find the item being edited to record the change
      const item = lineItems.find(item => item.report_line_item_key === key);
      if (!item) return;

      const previousDescription = item.report_line_item_description || getItemDisplayName(item);

      const { error } = await supabase
        .from('report_line_items')
        .update({ report_line_item_description: newDescription })
        .eq('report_line_item_key', key)
        .eq('report_structure_uuid', selectedStructureUuid);

      if (error) throw error;

      // Log the change for undo functionality
      await logStructureChange(
        item.report_line_item_uuid,
        item.report_line_item_id,
        'rename',
        key,
        newDescription,
        { description: previousDescription },
        { description: newDescription }
      );

      // Update local state and rebuild tree to reflect the change immediately
      const updatedItems = lineItems.map(item => 
        item.report_line_item_key === key 
          ? { ...item, report_line_item_description: newDescription }
          : item
      );
      setLineItems(updatedItems);
      
      // Rebuild tree data with updated description
      const newTreeData = buildTreeData(updatedItems);
      setTreeData(newTreeData);

      setEditingItem(null);
      setEditingValue('');

      toast({
        title: "Success",
        description: "Description updated successfully",
      });
    } catch (error) {
      console.error('Error updating description:', error);
      toast({
        title: "Error",
        description: "Failed to update description",
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !selectedStructureUuid) {
      return;
    }

    // Show loading state during reorder
    setLoading(true);
    
    const originalSortOrder = lineItems.find(item => item.report_line_item_uuid === active.id)?.sort_order;

    try {
      console.log(`Drag end: moving ${active.id} to position of ${over.id}`);
      
      // Use the new utility function for global sort order management
      const result = await reorderItemWithinParent(
        treeData, 
        active.id as string, 
        over.id as string, 
        selectedStructureUuid
      );

      if (!result.success) {
        console.error('Reorder failed:', result.error);
        toast({
          title: "Invalid Move",
          description: result.error || "Failed to reorder items",
          variant: "destructive",
        });
        return;
      }

      console.log('Reorder successful, refreshing data');

      // Find items for logging
      const activeItem = lineItems.find(item => item.report_line_item_uuid === active.id);
      if (activeItem && originalSortOrder !== undefined) {
        // Log the change for undo functionality
        await logStructureChange(
          activeItem.report_line_item_uuid,
          activeItem.report_line_item_id,
          'move',
          activeItem.report_line_item_key,
          getItemDisplayName(activeItem),
          { sortOrder: originalSortOrder },
          { sortOrder: -1 } // Will be updated after refresh
        );
      }

      // Refresh data to reflect new global sort order
      await fetchLineItems(selectedStructureUuid);

      // Show detailed success message
      const updateDetails = result.updatedCount ? ` (${result.updatedCount} items updated)` : '';
      toast({
        title: "Success",
        description: `Items reordered successfully${updateDetails}`,
      });
    } catch (error) {
      console.error('Error reordering items:', error);
      toast({
        title: "Error",
        description: "Failed to reorder items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAllFlatItems = (nodes: TreeNodeData[]): TreeNodeData[] => {
    const flat: TreeNodeData[] = [];
    const traverse = (items: TreeNodeData[]) => {
      items.forEach(item => {
        flat.push(item);
        traverse(item.children);
      });
    };
    traverse(nodes);
    return flat;
  };

  const handleUndo = async (changeUuid: string) => {
    const entry = changeHistory.find(e => e.change_uuid === changeUuid);
    if (!entry || entry.is_undone) return;

    try {
      if (entry.action_type === 'rename') {
        // Undo rename by restoring previous description
        const previousState = typeof entry.previous_state === 'string' 
          ? JSON.parse(entry.previous_state) 
          : entry.previous_state;

        const { error } = await supabase
          .from('report_line_items')
          .update({ 
            report_line_item_description: previousState?.description 
          })
          .eq('report_line_item_key', entry.line_item_key)
          .eq('report_structure_uuid', selectedStructureUuid);

        if (error) throw error;

        // Reload line items to get updated description and rebuild tree
        await fetchLineItems(selectedStructureUuid);
        
        highlightRecentlyUndoneItem(entry.line_item_key);

      } else if (entry.action_type === 'move') {
        // Undo move by restoring previous sort order
        const previousState = typeof entry.previous_state === 'string' 
          ? JSON.parse(entry.previous_state) 
          : entry.previous_state;

        const { error } = await supabase
          .from('report_line_items')
          .update({ 
            sort_order: previousState?.sortOrder 
          })
          .eq('report_line_item_key', entry.line_item_key)
          .eq('report_structure_uuid', selectedStructureUuid);

        if (error) throw error;

        highlightRecentlyUndoneItem(entry.line_item_key);

        // Reload line items to get updated sort order
        await fetchLineItems(selectedStructureUuid);

      } else if (entry.action_type === 'create') {
        // Undo create by deleting the item
        const { error } = await supabase
          .from('report_line_items')
          .delete()
          .eq('report_line_item_uuid', entry.line_item_uuid)
          .eq('report_structure_uuid', selectedStructureUuid);

        if (error) throw error;

        // Reload line items
        await fetchLineItems(selectedStructureUuid);

      } else if (entry.action_type === 'delete') {
        // Undo delete by recreating the item
        const previousState = typeof entry.previous_state === 'string' 
          ? JSON.parse(entry.previous_state) 
          : entry.previous_state;

        if (previousState) {
          // Remove fields that shouldn't be restored
          const { children, ...itemData } = previousState;
          
          const { error } = await supabase
            .from('report_line_items')
            .insert(itemData);

          if (error) throw error;

          // TODO: Restore children if they were cascade deleted
          
          // Reload line items
          await fetchLineItems(selectedStructureUuid);
        }
      }

      // Mark entry as undone in database
      const { error } = await supabase
        .from('report_structures_change_log')
        .update({ 
          is_undone: true, 
          undone_at: new Date().toISOString() 
        })
        .eq('change_uuid', changeUuid);

      if (error) throw error;

      // Refresh change history
      await fetchChangeHistory(selectedStructureUuid);

      toast({
        title: "Change undone",
        description: "The change has been successfully undone",
      });

    } catch (error) {
      console.error('Error undoing change:', error);
      toast({
        title: "Error",
        description: "Failed to undo the change",
        variant: "destructive",
      });
    }
  };

  const renderTreeNodes = (nodes: TreeNodeData[]): JSX.Element[] => {
    return nodes.map(node => {
      const hasChildren = node.children.length > 0;
      const isExpanded = expandedNodes.has(node.id);

      return (
        <div key={node.id} className="space-y-1">
          <SortableItem
            node={node}
            level={node.level}
            isEditing={editingItem === node.key}
            onEditStart={(key) => {
              setEditingItem(key);
              setEditingValue(node.description);
            }}
            onEditSave={handleEdit}
            onEditCancel={() => {
              setEditingItem(null);
              setEditingValue('');
            }}
            editingValue={editingValue}
            onEditingValueChange={setEditingValue}
            onToggleExpansion={toggleNodeExpansion}
            expandedNodes={expandedNodes}
            onDelete={handleDeleteItem}
          />
          {hasChildren && isExpanded && (
            <div className="space-y-1">
              {renderTreeNodes(node.children)}
            </div>
          )}
        </div>
      );
    });
  };

  const handleDeleteItem = (item: ReportLineItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const getChildrenForItem = (itemUuid: string): ReportLineItem[] => {
    return lineItems.filter(item => item.parent_report_line_item_uuid === itemUuid);
  };

  const getAllParentOptions = (): TreeNodeData[] => {
    // Return all non-leaf items as potential parents
    return getAllFlatItems(treeData).filter(node => !node.item.is_leaf);
  };

  if (structuresLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Structure Modifier</CardTitle>
          <CardDescription>Loading available report structures...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading structures...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show structure selection if no structure is selected
  if (!selectedStructureUuid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Structure Modifier</CardTitle>
          <CardDescription>Select a report structure to modify its line items</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="structure-select">Select Report Structure</Label>
            <Select value={selectedStructureUuid} onValueChange={setSelectedStructureUuid}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a structure to modify..." />
              </SelectTrigger>
              <SelectContent>
                {structures.map((structure) => (
                  <SelectItem key={structure.report_structure_uuid} value={structure.report_structure_uuid}>
                    {structure.report_structure_name}
                    {structure.is_active && " (Active)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {structures.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No report structures found</p>
              <p className="text-sm">Upload a structure first to begin modification</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Structure Modifier</CardTitle>
          <CardDescription>Loading structure data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading line items...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (lineItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Structure Modifier</CardTitle>
          <CardDescription>
            {structures.find(s => s.report_structure_uuid === selectedStructureUuid)?.report_structure_name || 'Selected Structure'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="structure-select">Report Structure</Label>
            <Select value={selectedStructureUuid} onValueChange={setSelectedStructureUuid}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {structures.map((structure) => (
                  <SelectItem key={structure.report_structure_uuid} value={structure.report_structure_uuid}>
                    {structure.report_structure_name}
                    {structure.is_active && " (Active)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>This structure appears to be empty</p>
            <p className="text-sm">Add some line items to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allItems = getAllFlatItems(treeData);

  const selectedStructure = structures.find(s => s.report_structure_uuid === selectedStructureUuid);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Structure Modifier</CardTitle>
            <CardDescription>
              {selectedStructure?.report_structure_name}
              {selectedStructure?.is_active && " (Active)"}
            </CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>
        
        {/* Structure Selection */}
        <div className="pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="structure-select">Report Structure</Label>
            <Select value={selectedStructureUuid} onValueChange={setSelectedStructureUuid}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {structures.map((structure) => (
                  <SelectItem key={structure.report_structure_uuid} value={structure.report_structure_uuid}>
                    {structure.report_structure_name}
                    {structure.is_active && " (Active)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={allItems.map(item => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0.5 max-h-96 overflow-y-auto">
              {renderTreeNodes(treeData)}
            </div>
          </SortableContext>
        </DndContext>

        <ChangeHistoryTable
          changeHistory={changeHistory}
          onUndo={handleUndo}
          recentlyUndoneItems={recentlyUndoneItems}
        />

        <CreateLineItemDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          structureUuid={selectedStructureUuid}
          parentOptions={getAllParentOptions()}
          onItemCreated={() => fetchLineItems(selectedStructureUuid)}
        />

        <DeleteLineItemDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          item={itemToDelete}
          children={itemToDelete ? getChildrenForItem(itemToDelete.report_line_item_uuid) : []}
          structureUuid={selectedStructureUuid}
          onItemDeleted={() => fetchLineItems(selectedStructureUuid)}
        />
      </CardContent>
    </Card>
  );
}
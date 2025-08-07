import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Trash2
} from 'lucide-react';

interface ReportLineItem {
  report_line_item_id: number;
  report_line_item_uuid: string;
  report_structure_uuid: string;
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

interface ReportStructureModifierProps {
  structureUuid: string;
}

export default function ReportStructureModifier({ structureUuid }: ReportStructureModifierProps) {
  const { toast } = useToast();
  const [lineItems, setLineItems] = useState<ReportLineItem[]>([]);
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [loading, setLoading] = useState(true);
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
    fetchLineItems(structureUuid);
  }, [structureUuid]);

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

      setChangeHistory(data || []);
    } catch (error) {
      console.error('Error fetching change history:', error);
    } finally {
      setLoadingChanges(false);
    }
  };

  const buildTreeData = (items: ReportLineItem[]): TreeNodeData[] => {
    const itemMap = new Map<string, TreeNodeData>();
    const rootItems: TreeNodeData[] = [];

    // Create nodes for all items
    items.forEach(item => {
      const node: TreeNodeData = {
        id: item.report_line_item_uuid,
        key: item.report_line_item_key,
        description: getItemDisplayName(item),
        level: 0,
        children: [],
        item,
        isExpanded: expandedNodes.has(item.report_line_item_uuid)
      };
      itemMap.set(item.report_line_item_uuid, node);
    });

    // Build hierarchy and calculate levels using UUIDs
    items.forEach(item => {
      const node = itemMap.get(item.report_line_item_uuid);
      if (!node) return;

      if (item.parent_report_line_item_uuid) {
        const parent = itemMap.get(item.parent_report_line_item_uuid);
        if (parent) {
          parent.children.push(node);
          node.level = parent.level + 1;
        } else {
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
    return rootItems;
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
    try {
      const { data: structure } = await supabase
        .from('report_structures')
        .select('report_structure_id')
        .eq('report_structure_uuid', structureUuid)
        .single();

      if (!structure) return;

      const { error } = await supabase.rpc('log_structure_change', {
        p_structure_uuid: structureUuid,
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
        await fetchChangeHistory(structureUuid);
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
        .eq('report_structure_uuid', structureUuid);

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

    if (!over || active.id === over.id) {
      return;
    }

    // Find all items at the same level
    const flatItems = getAllFlatItems(treeData);
    const activeItem = flatItems.find(item => item.id === active.id);
    const overItem = flatItems.find(item => item.id === over.id);

    if (!activeItem || !overItem) return;

    // Only allow reordering within the same parent
    if (activeItem.item.parent_report_line_item_uuid !== overItem.item.parent_report_line_item_uuid) {
      toast({
        title: "Invalid Move",
        description: "Items can only be reordered within the same parent",
        variant: "destructive",
      });
      return;
    }

    // Get siblings (items with same parent)
    const siblings = flatItems.filter(item => 
      item.item.parent_report_line_item_uuid === activeItem.item.parent_report_line_item_uuid
    );

    const oldIndex = siblings.findIndex(item => item.id === active.id);
    const newIndex = siblings.findIndex(item => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const originalSortOrder = activeItem.item.sort_order;
    const newOrder = arrayMove(siblings, oldIndex, newIndex);

    try {
      // Update sort_order for all affected items
      const updates = newOrder.map((item, index) => ({
        id: item.item.report_line_item_id,
        sort_order: index
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('report_line_items')
          .update({ sort_order: update.sort_order })
          .eq('report_line_item_id', update.id);

        if (error) throw error;
      }

      const newSortOrder = newIndex;

      // Log the change for undo functionality
      await logStructureChange(
        activeItem.item.report_line_item_uuid,
        activeItem.item.report_line_item_id,
        'move',
        activeItem.item.report_line_item_key,
        getItemDisplayName(activeItem.item),
        { sortOrder: originalSortOrder },
        { sortOrder: newSortOrder }
      );

      // Refresh data
      fetchLineItems(structureUuid);

      toast({
        title: "Success",
        description: "Items reordered successfully",
      });
    } catch (error) {
      console.error('Error reordering items:', error);
      toast({
        title: "Error",
        description: "Failed to reorder items",
        variant: "destructive",
      });
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
          .eq('report_structure_uuid', structureUuid);

        if (error) throw error;

        // Update local state
        setLineItems(prev => prev.map(item => 
          item.report_line_item_key === entry.line_item_key 
            ? { ...item, report_line_item_description: previousState?.description }
            : item
        ));
        
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
          .eq('report_structure_uuid', structureUuid);

        if (error) throw error;

        highlightRecentlyUndoneItem(entry.line_item_key);

        // Reload line items to get updated sort order
        await fetchLineItems(structureUuid);

      } else if (entry.action_type === 'create') {
        // Undo create by deleting the item
        const { error } = await supabase
          .from('report_line_items')
          .delete()
          .eq('report_line_item_uuid', entry.line_item_uuid)
          .eq('report_structure_uuid', structureUuid);

        if (error) throw error;

        // Reload line items
        await fetchLineItems(structureUuid);

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
          await fetchLineItems(structureUuid);
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
      await fetchChangeHistory(structureUuid);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg">Loading structure for modification...</div>
      </div>
    );
  }

  if (lineItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Structure Modifier</CardTitle>
          <CardDescription>No line items found for this structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>This structure appears to be empty</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allItems = getAllFlatItems(treeData);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Structure Modifier</CardTitle>
            <CardDescription>Modify the report structure by editing, reordering, adding, or deleting items</CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
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
          structureUuid={structureUuid}
          parentOptions={getAllParentOptions()}
          onItemCreated={() => fetchLineItems(structureUuid)}
        />

        <DeleteLineItemDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          item={itemToDelete}
          children={itemToDelete ? getChildrenForItem(itemToDelete.report_line_item_uuid) : []}
          structureUuid={structureUuid}
          onItemDeleted={() => fetchLineItems(structureUuid)}
        />
      </CardContent>
    </Card>
  );
}
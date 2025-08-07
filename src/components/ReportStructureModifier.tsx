import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
  ChevronDown
} from 'lucide-react';

interface ReportLineItem {
  report_line_item_id: number;
  report_line_item_uuid: string;
  report_structure_id: number;
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
  expandedNodes
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
            <span className="text-sm flex-1">{node.description}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          {node.item.is_calculated && (
            <Badge variant="secondary" className="text-xs">
              <Calculator className="w-3 h-3 mr-1" />
              Calculated
            </Badge>
          )}
          {!node.item.display && (
            <Badge variant="destructive" className="text-xs">
              Hidden
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

interface ReportStructureModifierProps {
  structureId: number;
  onSave: () => void;
}

export default function ReportStructureModifier({ structureId, onSave }: ReportStructureModifierProps) {
  const { toast } = useToast();
  const [lineItems, setLineItems] = useState<ReportLineItem[]>([]);
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchLineItems();
  }, [structureId]);

  useEffect(() => {
    buildTreeData();
  }, [lineItems, expandedNodes]);

  const fetchLineItems = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const buildTreeData = () => {
    const itemMap = new Map<string, TreeNodeData>();
    const rootItems: TreeNodeData[] = [];

    // Create nodes for all items
    lineItems.forEach(item => {
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
    lineItems.forEach(item => {
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
    setTreeData(rootItems);
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

  const handleEdit = async (key: string, newDescription: string) => {
    try {
      const { error } = await supabase
        .from('report_line_items')
        .update({ report_line_item_description: newDescription })
        .eq('report_line_item_key', key)
        .eq('report_structure_id', structureId);

      if (error) throw error;

      // Update local state
      setLineItems(prev => prev.map(item => 
        item.report_line_item_key === key 
          ? { ...item, report_line_item_description: newDescription }
          : item
      ));

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

      // Refresh data
      fetchLineItems();

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
      <CardContent className="pt-6">
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

        <div className="mt-6 flex justify-end">
          <Button onClick={onSave}>
            Save Changes
          </Button>
        </div>
        
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <GripVertical className="w-4 h-4" />
            <span>Drag to reorder</span>
          </div>
          <div className="flex items-center gap-1">
            <Edit className="w-4 h-4" />
            <span>Click to edit</span>
          </div>
          <div className="flex items-center gap-1">
            <Folder className="w-4 h-4 text-yellow-500" />
            <span>Folder</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4 text-blue-500" />
            <span>Leaf</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Edit2, Save, X, GripVertical, Calculator, Eye, EyeOff } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface SortableItemProps {
  node: TreeNodeData;
  level: number;
  onEdit: (id: string, description: string) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editingValue: string;
  setEditingValue: (value: string) => void;
}

function SortableItem({ node, level, onEdit, editingId, setEditingId, editingValue, setEditingValue }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleEditStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(node.id);
    setEditingValue(node.description);
  };

  const handleEditSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(node.id, editingValue);
    setEditingId(null);
  };

  const handleEditCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditingValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onEdit(node.id, editingValue);
      setEditingId(null);
    }
    if (e.key === 'Escape') {
      setEditingId(null);
      setEditingValue('');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 border rounded-lg bg-card hover:bg-muted/50 transition-colors ${
        level * 20
      }px ml-${level * 4}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div className="flex-1 flex items-center gap-2">
        {editingId === node.id ? (
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
              autoFocus
            />
            <Button size="sm" onClick={handleEditSave}>
              <Save className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleEditCancel}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            <span className="flex-1 font-medium">{node.description}</span>
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
              <Button size="sm" variant="ghost" onClick={handleEditStart}>
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface ReportStructureModifierProps {
  structureId: string;
  onSave?: () => void;
}

export default function ReportStructureModifier({ structureId, onSave }: ReportStructureModifierProps) {
  const { toast } = useToast();
  const [lineItems, setLineItems] = useState<ReportLineItem[]>([]);
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    const itemMap = new Map<string, ReportLineItem>();
    lineItems.forEach(item => {
      itemMap.set(item.report_line_item_key, item);
    });

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
    if (structureId) {
      fetchLineItems();
    }
  }, [structureId]);

  useEffect(() => {
    if (lineItems.length > 0) {
      setTreeData(buildTreeData());
    }
  }, [lineItems]);

  const handleEdit = async (itemId: string, newDescription: string) => {
    if (!newDescription.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('report_line_items')
        .update({ report_line_item_description: newDescription.trim() })
        .eq('report_line_item_id', itemId);

      if (error) throw error;

      // Update local state
      setLineItems(prev => prev.map(item =>
        item.report_line_item_id === itemId
          ? { ...item, report_line_item_description: newDescription.trim() }
          : item
      ));

      toast({
        title: "Success",
        description: "Line item updated successfully",
      });

      onSave?.();
    } catch (error) {
      console.error('Error updating line item:', error);
      toast({
        title: "Error",
        description: "Failed to update line item",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const flattenTreeData = (nodes: TreeNodeData[]): TreeNodeData[] => {
    const flat: TreeNodeData[] = [];
    const traverse = (nodes: TreeNodeData[]) => {
      nodes.forEach(node => {
        flat.push(node);
        if (node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    traverse(nodes);
    return flat;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const flatItems = flattenTreeData(treeData);
    const oldIndex = flatItems.findIndex(item => item.id === active.id);
    const newIndex = flatItems.findIndex(item => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    setSaving(true);
    try {
      const reorderedItems = arrayMove(flatItems, oldIndex, newIndex);
      
      // Update sort orders
      const updates = reorderedItems.map((item, index) => ({
        report_line_item_id: item.id,
        sort_order: index,
      }));

      // Batch update sort orders
      for (const update of updates) {
        const { error } = await supabase
          .from('report_line_items')
          .update({ sort_order: update.sort_order })
          .eq('report_line_item_id', update.report_line_item_id);

        if (error) throw error;
      }

      // Refresh data
      await fetchLineItems();

      toast({
        title: "Success",
        description: "Item order updated successfully",
      });

      onSave?.();
    } catch (error) {
      console.error('Error reordering items:', error);
      toast({
        title: "Error",
        description: "Failed to reorder items",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderTreeNodes = (nodes: TreeNodeData[], level: number = 0): React.ReactNode[] => {
    return nodes.map(node => (
      <div key={node.id} className="space-y-2">
        <SortableItem
          node={node}
          level={level}
          onEdit={handleEdit}
          editingId={editingId}
          setEditingId={setEditingId}
          editingValue={editingValue}
          setEditingValue={setEditingValue}
        />
        {node.children.length > 0 && (
          <div className="ml-6 space-y-2">
            {renderTreeNodes(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg">Loading structure...</div>
      </div>
    );
  }

  if (lineItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No line items found for this structure</p>
      </div>
    );
  }

  const flatItems = flattenTreeData(treeData);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit2 className="h-5 w-5" />
          Structure Modifier
          {saving && <span className="text-sm font-normal text-muted-foreground">(Saving...)</span>}
        </CardTitle>
        <CardDescription>
          Drag and drop to reorder items, click the edit icon to modify descriptions.
          Changes are saved automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-[600px] overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={flatItems.map(item => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {renderTreeNodes(treeData)}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}
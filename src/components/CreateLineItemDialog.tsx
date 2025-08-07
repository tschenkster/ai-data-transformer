import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TreeNodeData {
  id: string;
  key: string;
  description: string;
  level: number;
  children: TreeNodeData[];
  item: any;
}

interface CreateLineItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  structureUuid: string;
  parentOptions: TreeNodeData[];
  onItemCreated: () => void;
}

export default function CreateLineItemDialog({ 
  open, 
  onOpenChange, 
  structureUuid, 
  parentOptions, 
  onItemCreated 
}: CreateLineItemDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    key: '',
    description: '',
    parentUuid: 'root',
    isLeaf: true,
    display: true,
    lineItemType: 'standard'
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      key: '',
      description: '',
      parentUuid: 'root',
      isLeaf: true,
      display: true,
      lineItemType: 'standard'
    });
  };

  const generateKey = () => {
    // Generate a unique key based on timestamp
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `item_${timestamp}_${random}`;
  };

  const getNextSortOrder = async (parentUuid: string | null) => {
    const { data, error } = await supabase
      .from('report_line_items')
      .select('sort_order')
      .eq('report_structure_uuid', structureUuid)
      .eq('parent_report_line_item_uuid', parentUuid || '')
      .order('sort_order', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return 0;
    }

    return data[0].sort_order + 1;
  };

  const handleSubmit = async () => {
    if (!formData.key.trim() || !formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Key and description are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if key already exists
      const { data: existingItem } = await supabase
        .from('report_line_items')
        .select('report_line_item_key')
        .eq('report_structure_uuid', structureUuid)
        .eq('report_line_item_key', formData.key)
        .single();

      if (existingItem) {
        toast({
          title: "Validation Error", 
          description: "An item with this key already exists",
          variant: "destructive",
        });
        return;
      }

      // Get structure info
      const { data: structure } = await supabase
        .from('report_structures')
        .select('report_structure_name, report_structure_id')
        .eq('report_structure_uuid', structureUuid)
        .single();

      if (!structure) {
        throw new Error('Structure not found');
      }

      const parentUuid = formData.parentUuid === 'root' ? null : formData.parentUuid;
      const sortOrder = await getNextSortOrder(parentUuid);

      // Create new item
      const newItem = {
        report_structure_id: structure.report_structure_id,  // Integer foreign key
        report_structure_uuid: structureUuid,  // UUID foreign key
        report_structure_name: structure.report_structure_name,
        report_line_item_key: formData.key,
        report_line_item_description: formData.description,
        parent_report_line_item_uuid: parentUuid,
        parent_report_line_item_key: parentUuid ? 
          parentOptions.find(p => p.id === parentUuid)?.key : null,
        is_parent_key_existing: !!parentUuid,
        sort_order: sortOrder,
        is_leaf: formData.isLeaf,
        is_calculated: false,
        display: formData.display,
        line_item_type: formData.lineItemType
      };

      const { data: createdItem, error } = await supabase
        .from('report_line_items')
        .insert(newItem)
        .select()
        .single();

      if (error) throw error;

      // Log the creation
      await supabase.rpc('log_structure_change', {
        p_structure_uuid: structureUuid,
        p_structure_id: structure.report_structure_id,
        p_line_item_uuid: createdItem.report_line_item_uuid,
        p_line_item_id: createdItem.report_line_item_id,
        p_action_type: 'create',
        p_line_item_key: formData.key,
        p_line_item_description: formData.description,
        p_previous_state: null,
        p_new_state: JSON.stringify(createdItem)
      });

      toast({
        title: "Success",
        description: "Line item created successfully",
      });

      resetForm();
      onOpenChange(false);
      onItemCreated();

    } catch (error) {
      console.error('Error creating line item:', error);
      toast({
        title: "Error",
        description: "Failed to create line item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Line Item</DialogTitle>
          <DialogDescription>
            Add a new line item to the report structure. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="key">Line Item Key *</Label>
            <div className="flex gap-2">
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                placeholder="Enter unique key"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData(prev => ({ ...prev, key: generateKey() }))}
                size="sm"
              >
                Generate
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter description"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="parent">Parent Item</Label>
            <Select 
              value={formData.parentUuid} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, parentUuid: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent (optional for root item)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">None (Root Level)</SelectItem>
                {parentOptions.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {'  '.repeat(option.level)}{option.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Item Type</Label>
            <Select 
              value={formData.lineItemType} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, lineItemType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="calculated">Calculated</SelectItem>
                <SelectItem value="header">Header</SelectItem>
                <SelectItem value="total">Total</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isLeaf"
              checked={formData.isLeaf}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isLeaf: checked }))}
            />
            <Label htmlFor="isLeaf">Is Leaf Item</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="display"
              checked={formData.display}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, display: checked }))}
            />
            <Label htmlFor="display">Display in Reports</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
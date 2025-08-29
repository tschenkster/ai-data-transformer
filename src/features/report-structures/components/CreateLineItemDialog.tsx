import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { formatLineItemIdForDisplay, extractStructureIdFromLineItemId } from '@/features/report-structures/utils/lineItemUtils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { slugifyToKey } from '@/shared/utils';

interface CreateLineItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  structureUuid: string;
  onItemCreated: () => void;
}

export default function CreateLineItemDialog({ open, onOpenChange, structureUuid, onItemCreated }: CreateLineItemDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => setDescription('');

  const getNextAvailableSortOrder = async () => {
    const { data, error } = await supabase
      .from('report_line_items')
      .select('sort_order')
      .eq('report_structure_uuid', structureUuid)
      .order('sort_order', { ascending: false })
      .limit(1);
    if (error || !data?.length) return 0;
    return (data[0] as any).sort_order + 1;
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast({ title: 'Description required', description: 'Please enter a description for the new line item.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Fetch structure metadata
      const { data: structure, error: structErr } = await supabase
        .from('report_structures')
        .select('report_structure_name, report_structure_id')
        .eq('report_structure_uuid', structureUuid)
        .single();
      if (structErr || !structure) throw structErr || new Error('Structure not found');

      // Generate a tentative unique key from description
      let keyBase = slugifyToKey(description);
      if (!keyBase) keyBase = `item_${Date.now().toString(36)}`;

      // Ensure uniqueness (simple retry suffix)
      let finalKey = keyBase;
      for (let i = 0; i < 5; i++) {
        const { data: existing } = await supabase
          .from('report_line_items')
          .select('report_line_item_key')
          .eq('report_structure_uuid', structureUuid)
          .eq('report_line_item_key', finalKey)
          .maybeSingle();
        if (!existing) break;
        finalKey = `${keyBase}-${Math.random().toString(36).slice(2, 5)}`;
      }

      const sortOrder = await getNextAvailableSortOrder();

      const userName = user?.email || 'unknown user';
      const newItem = {
        report_structure_id: (structure as any).report_structure_id,
        report_structure_uuid: structureUuid,
        report_structure_name: (structure as any).report_structure_name,
        report_line_item_key: finalKey,
        report_line_item_description: description.trim(),
        parent_report_line_item_uuid: null,
        parent_report_line_item_key: null,
        is_parent_key_existing: false,
        sort_order: sortOrder,
        is_leaf: true,
        is_calculated: false,
        display: true,
        line_item_type: 'standard',
        data_source: `added by ${userName} on ${new Date().toISOString().split('T')[0]}`,
      };

      const { data: createdItem, error } = await supabase
        .from('report_line_items')
        .insert(newItem)
        .select()
        .single();
      if (error) throw error;

      await supabase.rpc('log_structure_change', {
        p_structure_uuid: structureUuid,
        p_structure_id: (structure as any).report_structure_id,
        p_line_item_uuid: (createdItem as any).report_line_item_uuid,
        p_line_item_id: (createdItem as any).report_line_item_id,
        p_action_type: 'create',
        p_line_item_key: finalKey,
        p_line_item_description: description.trim(),
        p_previous_state: null,
        p_new_state: JSON.stringify(createdItem),
      });

      toast({ title: 'Item created', description: 'Drag the new item to its place in the tree.' });
      reset();
      onOpenChange(false);
      onItemCreated();
    } catch (e) {
      console.error('Error creating line item:', e);
      toast({ title: 'Error', description: 'Failed to create line item', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Line Item</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Gross Profit"
            />
          </div>
          <p className="text-xs text-muted-foreground">You can set the position by dragging it in the tree after creation.</p>
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

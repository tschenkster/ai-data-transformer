import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, FileText, Folder } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatLineItemIdForDisplay, extractStructureIdFromLineItemId } from '@/lib/lineItemUtils';
import { useToast } from '@/hooks/use-toast';

interface ReportLineItem {
  report_line_item_id: number;
  report_line_item_uuid: string;
  report_structure_uuid: string;
  report_structure_name: string;
  report_line_item_key: string;
  report_line_item_description?: string;
  parent_report_line_item_uuid?: string;
  is_leaf: boolean;
  sort_order: number;
}

interface DeleteLineItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ReportLineItem | null;
  children: ReportLineItem[];
  structureUuid: string;
  onItemDeleted: () => void;
}

export default function DeleteLineItemDialog({ 
  open, 
  onOpenChange, 
  item, 
  children, 
  structureUuid, 
  onItemDeleted 
}: DeleteLineItemDialogProps) {
  const { toast } = useToast();
  const [deleteStrategy, setDeleteStrategy] = useState<'prevent' | 'cascade' | 'orphan'>('prevent');
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  const hasChildren = children.length > 0;
  const hasAccountMappings = false; // TODO: Check if item has account mappings

  const handleDelete = async () => {
    if (!item) return;

    if (hasChildren && deleteStrategy === 'prevent') {
      toast({
        title: "Cannot Delete",
        description: "This item has children. Please choose a different strategy.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get structure info for logging
      const { data: structure } = await supabase
        .from('report_structures')
        .select('report_structure_id')
        .eq('report_structure_uuid', structureUuid)
        .single();

      if (!structure) {
        throw new Error('Structure not found');
      }

      // Store item state for undo functionality
      const itemState = { ...item, children: children.map(c => c.report_line_item_uuid) };

      if (hasChildren) {
        if (deleteStrategy === 'cascade') {
          // Delete all children recursively
          const getAllDescendants = (parentUuid: string, allItems: ReportLineItem[]): string[] => {
            const directChildren = allItems.filter(i => i.parent_report_line_item_uuid === parentUuid);
            let descendants = directChildren.map(c => c.report_line_item_uuid);
            
            directChildren.forEach(child => {
              descendants = descendants.concat(getAllDescendants(child.report_line_item_uuid, allItems));
            });
            
            return descendants;
          };

          // Get all line items to find all descendants
          const { data: allItems } = await supabase
            .from('report_line_items')
            .select('*')
            .eq('report_structure_uuid', structureUuid);

          if (allItems) {
            const descendantUuids = getAllDescendants(item.report_line_item_uuid, allItems);
            
            // Delete all descendants first
            if (descendantUuids.length > 0) {
              const { error: deleteChildrenError } = await supabase
                .from('report_line_items')
                .delete()
                .in('report_line_item_uuid', descendantUuids);

              if (deleteChildrenError) throw deleteChildrenError;
            }
          }

        } else if (deleteStrategy === 'orphan') {
          // Move children up one level
          const { error: updateChildrenError } = await supabase
            .from('report_line_items')
            .update({ 
              parent_report_line_item_uuid: item.parent_report_line_item_uuid,
              parent_report_line_item_key: item.parent_report_line_item_uuid ? 
                // TODO: Get parent key from database
                null : null,
              is_parent_key_existing: !!item.parent_report_line_item_uuid
            })
            .eq('parent_report_line_item_uuid', item.report_line_item_uuid);

          if (updateChildrenError) throw updateChildrenError;
        }
      }

      // Delete the main item
      const { error: deleteError } = await supabase
        .from('report_line_items')
        .delete()
        .eq('report_line_item_uuid', item.report_line_item_uuid);

      if (deleteError) throw deleteError;

      // Update sort order for remaining siblings
      const { data: siblings } = await supabase
        .from('report_line_items')
        .select('*')
        .eq('report_structure_uuid', structureUuid)
        .eq('parent_report_line_item_uuid', item.parent_report_line_item_uuid || '')
        .gt('sort_order', item.sort_order)
        .order('sort_order');

      if (siblings && siblings.length > 0) {
        for (const sibling of siblings) {
          await supabase
            .from('report_line_items')
            .update({ sort_order: sibling.sort_order - 1 })
            .eq('report_line_item_uuid', sibling.report_line_item_uuid);
        }
      }

      // Log the deletion for undo functionality
      await supabase.rpc('log_structure_change', {
        p_structure_uuid: structureUuid,
        p_structure_id: structure.report_structure_id,
        p_line_item_uuid: item.report_line_item_uuid,
        p_line_item_id: item.report_line_item_id,
        p_action_type: 'delete',
        p_line_item_key: item.report_line_item_key,
        p_line_item_description: item.report_line_item_description || '',
        p_previous_state: JSON.stringify(itemState),
        p_new_state: null
      });

      toast({
        title: "Success",
        description: `Line item${hasChildren && deleteStrategy === 'cascade' ? ' and children' : ''} deleted successfully`,
      });

      onOpenChange(false);
      onItemDeleted();

    } catch (error) {
      console.error('Error deleting line item:', error);
      toast({
        title: "Error",
        description: "Failed to delete line item",
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
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Line Item
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{item.report_line_item_description || item.report_line_item_key}"?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
            {item.is_leaf ? (
              <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
            ) : (
              <Folder className="h-5 w-5 text-yellow-500 mt-0.5" />
            )}
            <div>
              <div className="font-medium">{item.report_line_item_description || item.report_line_item_key}</div>
              <div className="text-sm text-muted-foreground">Key: {item.report_line_item_key}</div>
            </div>
          </div>

          {hasAccountMappings && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This item has account mappings that will also be deleted.
              </AlertDescription>
            </Alert>
          )}

          {hasChildren && (
            <div className="space-y-3">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This item has {children.length} child item{children.length > 1 ? 's' : ''}. 
                  Choose what to do with them:
                </AlertDescription>
              </Alert>

              <RadioGroup value={deleteStrategy} onValueChange={(value: any) => setDeleteStrategy(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="prevent" id="prevent" />
                  <Label htmlFor="prevent">Prevent deletion (keep children)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cascade" id="cascade" />
                  <Label htmlFor="cascade">Delete all children recursively</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="orphan" id="orphan" />
                  <Label htmlFor="orphan">Move children up one level</Label>
                </div>
              </RadioGroup>

              {deleteStrategy === 'cascade' && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This will permanently delete this item and all {children.length} child items.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading || (hasChildren && deleteStrategy === 'prevent')}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
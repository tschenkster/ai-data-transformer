import { supabase } from '@/integrations/supabase/client';

// Use the full ReportLineItem interface to match the component
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
  item: ReportLineItem;
  children: TreeNodeData[];
  isExpanded?: boolean;
}

interface UpdateSortOrderResult {
  success: boolean;
  updated_count?: number;
  total_count?: number;
  error?: string;
  message?: string;
}

/**
 * Flattens a tree structure into a sequential array using pre-order traversal
 * This ensures proper hierarchical ordering for global sort_order assignment
 * @param treeData - The tree structure to flatten
 * @param preserveOrder - If true, preserves the current array order (for reordering operations)
 */
export function flattenTreeToSequentialOrder(treeData: TreeNodeData[], preserveOrder = false): ReportLineItem[] {
  const flattened: ReportLineItem[] = [];
  
  const traverse = (nodes: TreeNodeData[]) => {
    // When preserveOrder is true (during reordering), maintain the current array order
    // Otherwise, sort by existing sort_order for initial tree building
    const nodesToProcess = preserveOrder 
      ? nodes 
      : [...nodes].sort((a, b) => a.item.sort_order - b.item.sort_order);
    
    for (const node of nodesToProcess) {
      flattened.push(node.item);
      if (node.children.length > 0) {
        traverse(node.children);
      }
    }
  };
  
  traverse(treeData);
  return flattened;
}

/**
 * Updates sort_order for all items in a structure using improved sequential updates
 */
export async function updateGlobalSortOrder(
  structureUuid: string, 
  orderedItems: ReportLineItem[]
): Promise<{ success: boolean; error?: string; updatedCount?: number }> {
  try {
    // Create batch updates for all items with new sequential sort_order
    const updates = orderedItems.map((item, index) => ({
      report_line_item_id: item.report_line_item_id,
      sort_order: index
    }));

    // Validate payload to avoid bad requests
    const sortOrders = updates.map(u => u.sort_order);
    const uniqueCount = new Set(sortOrders).size;
    const min = Math.min(...sortOrders);
    const max = Math.max(...sortOrders);
    if (uniqueCount !== sortOrders.length || min !== 0 || max !== updates.length - 1) {
      console.error('Invalid sort order payload', { uniqueCount, expected: updates.length, min, max });
      return { success: false, error: 'Invalid sort order payload generated on client' };
    }

    console.log(`Updating sort order for ${updates.length} items in structure ${structureUuid}`);
    console.log('Attempting atomic sort order update using database function');

    const attemptRpc = async () => {
      return (supabase as any).rpc('update_sort_orders_transaction', {
        p_structure_uuid: structureUuid,
        p_updates: updates
      }) as Promise<{ data: UpdateSortOrderResult | null; error: any }>;
    };

    // First attempt
    let { data: dbResult, error: dbError } = await attemptRpc();

    // Retry once if it failed (transient issues)
    if ((dbError || !dbResult?.success)) {
      console.warn('Atomic update failed, retrying once...', dbError || dbResult?.error);
      await new Promise(res => setTimeout(res, 150));
      const retry = await attemptRpc();
      dbResult = retry.data;
      dbError = retry.error;
    }

    if (!dbError && dbResult?.success) {
      console.log('Atomic database transaction completed successfully');
      return { 
        success: true, 
        updatedCount: dbResult.updated_count || updates.length 
      };
    }

    const errorMsg = dbError?.message || dbResult?.error || 'Unknown error from update_sort_orders_transaction';
    console.error('Atomic update failed definitively:', errorMsg);
    return { success: false, error: errorMsg };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in updateGlobalSortOrder:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Reorders an item within the same parent level and updates global sort_order
 */
export async function reorderItemWithinParent(
  treeData: TreeNodeData[],
  activeItemId: string,
  overItemId: string,
  structureUuid: string
): Promise<{ success: boolean; error?: string; details?: string; updatedCount?: number }> {
  // Find all flat items
  const allItems = flattenTreeToSequentialOrder(treeData);
  const activeItem = allItems.find(item => item.report_line_item_uuid === activeItemId);
  const overItem = allItems.find(item => item.report_line_item_uuid === overItemId);

  if (!activeItem || !overItem) {
    return { success: false, error: "Items not found" };
  }

  // Check if items have the same parent (constraint)
  if (activeItem.parent_report_line_item_uuid !== overItem.parent_report_line_item_uuid) {
    return { success: false, error: "Items can only be reordered within the same parent" };
  }

  // Find the parent node in tree
  const parentUuid = activeItem.parent_report_line_item_uuid;
  let parentNode: TreeNodeData | null = null;

  const findParentNode = (nodes: TreeNodeData[]): TreeNodeData | null => {
    for (const node of nodes) {
      if (!parentUuid) {
        // Root level items - use the entire tree as parent
        return { 
          id: 'root', 
          key: 'root',
          description: 'Root', 
          level: -1,
          item: {} as ReportLineItem, 
          children: nodes 
        };
      }
      if (node.id === parentUuid) {
        return node;
      }
      const found = findParentNode(node.children);
      if (found) return found;
    }
    return null;
  };

  if (!parentUuid) {
    // Root level reordering
    parentNode = { 
      id: 'root', 
      key: 'root',
      description: 'Root',
      level: -1,
      item: {} as ReportLineItem, 
      children: treeData 
    };
  } else {
    parentNode = findParentNode(treeData);
  }

  if (!parentNode) {
    return { success: false, error: "Parent node not found" };
  }

  // Get siblings and their current positions
  const siblings = parentNode.children;
  const activeIndex = siblings.findIndex(child => child.id === activeItemId);
  const overIndex = siblings.findIndex(child => child.id === overItemId);

  if (activeIndex === -1 || overIndex === -1) {
    return { success: false, error: "Sibling positions not found" };
  }

  // Reorder siblings array
  const reorderedSiblings = [...siblings];
  const [movedItem] = reorderedSiblings.splice(activeIndex, 1);
  reorderedSiblings.splice(overIndex, 0, movedItem);

  // Update the parent's children with new order
  parentNode.children = reorderedSiblings;

  // Rebuild the entire tree structure for global ordering
  const newTreeData = parentUuid ? treeData : reorderedSiblings;
  
  // Flatten to get new global sequential order - preserve the reordered structure
  const newOrderedItems = flattenTreeToSequentialOrder(newTreeData, true);
  
  // Update database with new global sort_order
  console.log(`Attempting to reorder item ${activeItemId} over ${overItemId}`);
  console.log(`New order will update ${newOrderedItems.length} items`);
  
  const updateResult = await updateGlobalSortOrder(structureUuid, newOrderedItems);
  
  if (!updateResult.success) {
    console.error('Database update failed:', updateResult.error);
    return { 
      success: false, 
      error: updateResult.error || 'Failed to update database',
      details: `Updated ${updateResult.updatedCount || 0} of ${newOrderedItems.length} items`
    };
  }

  console.log(`Reorder operation completed successfully - updated ${updateResult.updatedCount} items`);
  return { success: true, updatedCount: updateResult.updatedCount };
}

/**
 * Builds tree data from flat line items using global sort_order
 */
export function buildTreeFromGlobalOrder(items: ReportLineItem[]): TreeNodeData[] {
  // Sort by global sort_order first to ensure proper ordering
  const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order);
  
  const itemMap = new Map<string, TreeNodeData>();
  const rootItems: TreeNodeData[] = [];

  // Create nodes for all items
  sortedItems.forEach(item => {
    const node: TreeNodeData = {
      id: item.report_line_item_uuid,
      key: item.report_line_item_key,
      description: item.report_line_item_description || item.report_line_item_key,
      level: 0,
      item,
      children: []
    };
    itemMap.set(item.report_line_item_uuid, node);
  });

  // Build hierarchy while preserving global sort order
  sortedItems.forEach(item => {
    const node = itemMap.get(item.report_line_item_uuid);
    if (!node) return;

    if (item.parent_report_line_item_uuid) {
      const parent = itemMap.get(item.parent_report_line_item_uuid);
      if (parent) {
        parent.children.push(node);
      } else {
        // Parent not found, treat as root
        rootItems.push(node);
      }
    } else {
      rootItems.push(node);
    }
  });

  return rootItems;
}
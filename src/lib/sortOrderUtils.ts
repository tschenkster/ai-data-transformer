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

export async function updateGlobalSortOrderWithTimeout(
  structureUuid: string,
  orderedItems: ReportLineItem[],
  timeoutMs = 10000
): Promise<{ success: boolean; error?: string; updatedCount?: number }> {
  let didTimeout = false;
  try {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => {
        didTimeout = true;
        reject(new Error('update_sort_orders_transaction timed out'));
      }, timeoutMs);
    });

    const result = await Promise.race([
      updateGlobalSortOrder(structureUuid, orderedItems),
      timeout,
    ]);

    return result as { success: boolean; error?: string; updatedCount?: number };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sort order update timeout/error:', msg);
    return { success: false, error: didTimeout ? 'timeout' : msg };
  }
}

// Helper function to find an item in the tree structure
function findItemInTree(treeData: TreeNodeData[], itemId: string): TreeNodeData | null {
  for (const node of treeData) {
    if (node.id === itemId) {
      return node;
    }
    const found = findItemInTree(node.children, itemId);
    if (found) {
      return found;
    }
  }
  return null;
}

// Enhanced hierarchical item reordering with cross-parent support
export async function reorderItem(
  treeData: TreeNodeData[], 
  activeItemId: string, 
  overItemId: string, 
  structureUuid: string,
  dropPosition: 'before' | 'after' | 'inside' = 'after'
): Promise<{ success: boolean; error?: string; details?: string; updatedCount?: number }> {
  try {
    console.log('🔄 Starting hierarchical reorder operation', { activeItemId, overItemId, structureUuid, dropPosition });

    // Find the active and over items in the tree
    const activeItem = findItemInTree(treeData, activeItemId);
    const overItem = findItemInTree(treeData, overItemId);

    if (!activeItem || !overItem) {
      return { 
        success: false, 
        error: 'Item not found in tree structure',
        details: `Active: ${!!activeItem}, Over: ${!!overItem}`
      };
    }

    console.log('📦 Found items:', {
      active: { id: activeItem.item.report_line_item_id, key: activeItem.item.report_line_item_key },
      over: { id: overItem.item.report_line_item_id, key: overItem.item.report_line_item_key },
      dropPosition
    });

    // Determine new parent and position based on drop position
    let newParentUuid: string | null = null;
    let targetPosition = 0;

    if (dropPosition === 'inside') {
      // Moving inside the over item (making it a child)
      newParentUuid = overItem.item.report_line_item_uuid;
      targetPosition = overItem.children?.length || 0;
    } else {
      // Moving before/after the over item (same parent as over item)
      newParentUuid = overItem.item.parent_report_line_item_uuid || null;
      
      // Find siblings of the over item to determine correct position
      let siblings: TreeNodeData[] = [];
      if (newParentUuid) {
        // Find the parent item and get its children
        const findParent = (nodes: TreeNodeData[]): TreeNodeData | null => {
          for (const node of nodes) {
            if (node.item.report_line_item_uuid === newParentUuid) return node;
            const found = findParent(node.children);
            if (found) return found;
          }
          return null;
        };
        const parent = findParent(treeData);
        siblings = parent?.children || [];
      } else {
        // Root level siblings
        siblings = treeData.filter(item => !item.item.parent_report_line_item_uuid);
      }
      
      // Calculate target position based on current sort_order in the flat structure
      const overSortOrder = overItem.item.sort_order;
      targetPosition = dropPosition === 'before' ? overSortOrder : overSortOrder + 1;
    }

    console.log('🎯 Target placement:', { newParentUuid, targetPosition });

    // Use the new hierarchical reordering RPC function
    const { data, error } = await (supabase as any).rpc('reorder_line_item_with_hierarchy', {
      p_structure_uuid: structureUuid,
      p_moved_item_uuid: activeItemId,
      p_new_parent_uuid: newParentUuid,
      p_target_position: targetPosition
    });

    if (error) {
      console.error('❌ Database RPC failed:', error);
      return { 
        success: false, 
        error: `Database operation failed: ${error.message}`,
        details: error.details || 'Unknown database error'
      };
    }

    // Type the response data properly
    const result = data as any;
    if (!result?.success) {
      console.error('❌ Reorder operation failed:', result);
      return { 
        success: false, 
        error: result?.error || 'Reorder operation failed',
        details: result?.message || 'Unknown operation error'
      };
    }

    console.log('✅ Hierarchical reorder completed successfully:', result);
    return {
      success: true,
      updatedCount: result.affected_count,
      details: result.message
    };

  } catch (error) {
    console.error('💥 Hierarchical reorder operation failed:', error);
    return { 
      success: false, 
      error: 'Failed to reorder items',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Legacy function for backward compatibility - now redirects to new hierarchical function
export async function reorderItemWithinParent(
  treeData: TreeNodeData[], 
  activeItemId: string, 
  overItemId: string, 
  structureUuid: string
): Promise<{ success: boolean; error?: string; details?: string; updatedCount?: number }> {
  return reorderItem(treeData, activeItemId, overItemId, structureUuid, 'after');
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
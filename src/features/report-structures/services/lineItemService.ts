import { supabase } from '@/integrations/supabase/client';
import { ReportLineItem } from '@/features/report-structures/types';

export class LineItemService {
  static async fetchLineItems(structureId: number): Promise<ReportLineItem[]> {
    // Use integer ID for performance in joins
    const { data, error } = await supabase
      .from('report_line_items')
      .select('*')
      .eq('report_structure_id', structureId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createLineItem(
    lineItem: Omit<ReportLineItem, 'report_line_item_id' | 'report_line_item_uuid' | 'created_at' | 'updated_at'>
  ): Promise<ReportLineItem> {
    const { data, error } = await supabase
      .from('report_line_items')
      .insert(lineItem as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateLineItem(
    lineItemId: number, 
    updates: Partial<Omit<ReportLineItem, 'report_line_item_id' | 'report_line_item_uuid' | 'created_at'>>
  ): Promise<ReportLineItem> {
    const { data, error } = await supabase
      .from('report_line_items')
      .update(updates as any)
      .eq('report_line_item_id', lineItemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteLineItem(lineItemId: number): Promise<void> {
    const { error } = await supabase
      .from('report_line_items')
      .delete()
      .eq('report_line_item_id', lineItemId);

    if (error) throw error;
  }

  static async reorderLineItem(
    structureUuid: string,
    movedItemUuid: string,
    newParentUuid?: string,
    targetPosition?: number,
    newDescription?: string
  ): Promise<any> {
    const { data, error } = await supabase.rpc('reorder_line_item_with_hierarchy', {
      p_structure_uuid: structureUuid,
      p_moved_item_uuid: movedItemUuid,
      p_new_parent_uuid: newParentUuid,
      p_target_position: targetPosition,
      p_new_description: newDescription
    });

    if (error) throw error;
    return data;
  }

  static buildHierarchyTree(lineItems: ReportLineItem[]): ReportLineItem[] {
    const itemsMap = new Map<string, ReportLineItem & { children: ReportLineItem[] }>();
    const rootItems: (ReportLineItem & { children: ReportLineItem[] })[] = [];

    // First pass: create items with children array
    lineItems.forEach(item => {
      itemsMap.set(item.report_line_item_uuid, { ...item, children: [] });
    });

    // Second pass: build hierarchy
    lineItems.forEach(item => {
      const itemWithChildren = itemsMap.get(item.report_line_item_uuid)!;
      
      if (item.parent_report_line_item_uuid) {
        const parent = itemsMap.get(item.parent_report_line_item_uuid);
        if (parent) {
          parent.children.push(itemWithChildren);
        }
      } else {
        rootItems.push(itemWithChildren);
      }
    });

    return rootItems;
  }

  static getLineItemLevel(item: ReportLineItem): number {
    if (item.level_1_line_item_description && !item.level_2_line_item_description) return 1;
    if (item.level_2_line_item_description && !item.level_3_line_item_description) return 2;
    if (item.level_3_line_item_description && !item.level_4_line_item_description) return 3;
    if (item.level_4_line_item_description && !item.level_5_line_item_description) return 4;
    if (item.level_5_line_item_description && !item.level_6_line_item_description) return 5;
    if (item.level_6_line_item_description && !item.level_7_line_item_description) return 6;
    if (item.level_7_line_item_description) return 7;
    return 0;
  }
}
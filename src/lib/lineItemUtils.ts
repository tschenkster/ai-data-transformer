/**
 * Utility functions for working with concatenated line item IDs
 */

/**
 * Extract structure ID from concatenated line item ID
 * Uses the formula: structure_id = Math.floor(line_item_id / 10000)
 */
export function extractStructureIdFromLineItemId(lineItemId: number): number {
  return Math.floor(lineItemId / 10000);
}

/**
 * Extract local line item ID from concatenated ID
 * Uses the formula: local_id = line_item_id % 10000
 */
export function extractLocalIdFromLineItemId(lineItemId: number): number {
  return lineItemId % 10000;
}

/**
 * Generate concatenated line item ID from structure ID and local ID
 * Uses the formula: concatenated_id = (structure_id * 10000) + local_id
 */
export function generateConcatenatedLineItemId(structureId: number, localId: number): number {
  return (structureId * 10000) + localId;
}

/**
 * Check if a line item ID is in concatenated format
 * Returns true if the ID is >= 10000 (meaning it has a structure prefix)
 */
export function isConcatenatedId(lineItemId: number): boolean {
  return lineItemId >= 10000;
}

/**
 * Format line item ID for display
 * Shows the concatenated format for easy identification
 */
export function formatLineItemIdForDisplay(lineItemId: number): string {
  if (!isConcatenatedId(lineItemId)) {
    return lineItemId.toString();
  }
  
  const structureId = extractStructureIdFromLineItemId(lineItemId);
  const localId = extractLocalIdFromLineItemId(lineItemId);
  return `${structureId}.${localId.toString().padStart(4, '0')}`;
}
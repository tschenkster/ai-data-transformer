// String utility functions for shared use across features

/**
 * Slugify a text to a safe key (lowercase, hyphens, alphanumerics only)
 * @param text - The input text to slugify
 * @returns A safe, lowercase string with hyphens for spaces
 */
export function slugifyToKey(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

/**
 * Capitalize the first letter of a string
 * @param text - The input text
 * @returns The text with first letter capitalized
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convert camelCase to kebab-case
 * @param text - The camelCase input
 * @returns The kebab-case output
 */
export function camelToKebab(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert kebab-case to camelCase
 * @param text - The kebab-case input
 * @returns The camelCase output
 */
export function kebabToCamel(text: string): string {
  return text.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
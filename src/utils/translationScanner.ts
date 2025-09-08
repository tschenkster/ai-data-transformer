/**
 * Translation Scanner Utility
 * Helps identify hardcoded strings and convert them to translation keys
 */

export interface HardcodedString {
  file: string;
  line: number;
  column: number;
  text: string;
  suggestedKey: string;
  category: 'MENU' | 'BTN' | 'HEADING' | 'DESC' | 'MSG' | 'STATUS' | 'FIELD' | 'ERROR' | 'TABLE' | 'OTHER';
}

export class TranslationScanner {
  private static readonly PATTERNS = {
    // JSX text content
    JSX_TEXT: />\s*([A-Z][^<{]*)\s*</g,
    // String literals in JSX attributes
    JSX_ATTRIBUTE: /(title|placeholder|alt|label|aria-label)="([A-Z][^"]+)"/g,
    // String literals in JavaScript
    STRING_LITERAL: /['"`]([A-Z][^'"`]*[a-z][^'"`]*)[`'"`]/g,
    // Template literals
    TEMPLATE_LITERAL: /`([A-Z][^`]*)`/g,
  };

  private static readonly TRANSLATION_KEY_MAPPING = {
    // Menu patterns
    'System Administration': 'MENU_SYSTEM_ADMINISTRATION',
    'Dashboard': 'MENU_DASHBOARD', 
    'User Profile Management': 'MENU_USER_PROFILE_MANAGEMENT',
    'Roles & Permissions': 'MENU_ROLES_PERMISSIONS',
    'Entity Management': 'MENU_ENTITY_MANAGEMENT',
    'Activity Log': 'MENU_ACTIVITY_LOG',
    'System Tools': 'MENU_SYSTEM_TOOLS',
    'Data Import & Transformation': 'MENU_DATA_IMPORT_TRANSFORMATION',
    'CoA Translator': 'MENU_COA_TRANSLATOR',
    'CoA Mapper': 'MENU_COA_MAPPER',
    'Trial Balance Import': 'MENU_TRIAL_BALANCE_IMPORT',
    'Journal Import': 'MENU_JOURNAL_IMPORT',
    'Report Structure Manager': 'MENU_REPORT_STRUCTURE_MANAGER',
    'Memory Maintenance': 'MENU_MEMORY_MAINTENANCE',
    'Data Downloads & Reports': 'MENU_REPORTS',
    'Financial Reports': 'MENU_FINANCIAL_REPORTS',
    'SQL Tables': 'MENU_SQL_TABLES',
    'Start': 'MENU_START',
    'Account': 'MENU_ACCOUNT',
    'Logout': 'MENU_LOGOUT',

    // Button patterns
    'Refresh': 'BTN_REFRESH',
    'Refreshing...': 'BTN_REFRESHING',
    'Refresh Status': 'BTN_REFRESH_STATUS',
    'Sending...': 'BTN_SENDING',
    'Send Reset Link': 'BTN_SEND_RESET_LINK',
    'Updating Password...': 'BTN_UPDATING_PASSWORD',
    'Update Password': 'BTN_UPDATE_PASSWORD',
    'Apply Filters': 'BTN_APPLY_FILTERS',
    'Save': 'BTN_SAVE',
    'Cancel': 'BTN_CANCEL',
    'Delete': 'BTN_DELETE',
    'Edit': 'BTN_EDIT',
    'Create': 'BTN_CREATE',
    'Close': 'BTN_CLOSE',

    // Table headers
    'Time': 'TABLE_TIME',
    'Action Type': 'TABLE_ACTION_TYPE',
    'Line Item': 'TABLE_LINE_ITEM',
    'Undo': 'TABLE_UNDO',
    'ID': 'TABLE_ID',
    'Name': 'TABLE_NAME',
    'Version': 'TABLE_VERSION',
    'Status': 'TABLE_STATUS',
    'Actions': 'TABLE_ACTIONS',

    // Headings
    'Report Structures': 'HEADING_REPORT_STRUCTURES',

    // Messages
    'No changes made yet. Your modifications will appear here.': 'MSG_NO_CHANGES_YET',
    'Loading...': 'MSG_LOADING',

    // Language
    'Language Changed': 'LANGUAGE_CHANGED',
    'Data Transformer': 'APP_TITLE',
  };

  /**
   * Generate a translation key from text
   */
  static generateTranslationKey(text: string, context: 'MENU' | 'BTN' | 'HEADING' | 'DESC' | 'MSG' | 'STATUS' | 'FIELD' | 'ERROR' | 'TABLE' | 'OTHER' = 'OTHER'): string {
    // Check if we have a predefined mapping
    const predefined = this.TRANSLATION_KEY_MAPPING[text as keyof typeof this.TRANSLATION_KEY_MAPPING];
    if (predefined) {
      return predefined;
    }

    // Generate key from text
    const baseKey = text
      .replace(/[^\w\s]/g, '') // Remove special characters
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length

    return `${context}_${baseKey}`;
  }

  /**
   * Determine category from context
   */
  static categorizeString(text: string, context: string): HardcodedString['category'] {
    const lowerText = text.toLowerCase();
    const lowerContext = context.toLowerCase();

    if (lowerContext.includes('menu') || lowerContext.includes('nav')) return 'MENU';
    if (lowerContext.includes('button') || lowerText.includes('click')) return 'BTN';
    if (lowerContext.includes('heading') || lowerContext.includes('title')) return 'HEADING';
    if (lowerContext.includes('table') || lowerContext.includes('header')) return 'TABLE';
    if (lowerText.includes('error') || lowerText.includes('failed')) return 'ERROR';
    if (lowerContext.includes('input') || lowerContext.includes('field')) return 'FIELD';
    if (lowerText.includes('loading') || lowerText.includes('processing')) return 'STATUS';
    if (lowerContext.includes('description') || lowerText.length > 30) return 'DESC';
    if (lowerText.includes('message') || lowerText.includes('notification')) return 'MSG';

    return 'OTHER';
  }

  /**
   * Create translation replacement code
   */
  static createTranslationReplacement(originalText: string, translationKey: string, isJSX = false): string {
    if (isJSX) {
      return `{t('${translationKey}', '${originalText.replace(/'/g, "\\'")}')}`; 
    }
    return `t('${translationKey}', '${originalText.replace(/'/g, "\\'")}')`; 
  }

  /**
   * Check if text should be translated
   */
  static shouldTranslate(text: string): boolean {
    // Skip if too short
    if (text.length < 2) return false;
    
    // Skip if it's already a translation key or function call
    if (text.includes('t(') || text.includes('_') || text.toUpperCase() === text) return false;
    
    // Skip if it's a URL, email, or code
    if (text.includes('http') || text.includes('@') || text.includes('.com') || text.includes('://')) return false;
    
    // Skip if it's primarily numbers or symbols
    if (!/[a-zA-Z]/.test(text) || text.match(/^\d+$/)) return false;
    
    // Skip if it's a single word that's likely a variable or identifier
    if (!text.includes(' ') && text.length < 4 && text.match(/^[a-z]+$/)) return false;

    return true;
  }
}

/**
 * Translation migration helper
 */
export class TranslationMigrator {
  /**
   * Generate database insert statements for new translation keys
   */
  static generateDatabaseInsert(translationKeys: Array<{key: string, text: string, category: string}>): string {
    const inserts = translationKeys.map(({key, text, category}) => {
      const germanText = text; // For now, assume source is German
      const englishText = text; // Will need actual translation
      
      return `
-- ${category}: ${key}
('${key}', 'de', 'de', 'text', '${germanText.replace(/'/g, "''")}', '${germanText.replace(/'/g, "''")}', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),
('${key}', 'de', 'en', 'text', '${germanText.replace(/'/g, "''")}', '${englishText.replace(/'/g, "''")}', 'manual', COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))),`;
    });

    return `
INSERT INTO ui_translations (ui_key, language_code_original, language_code_target, source_field_name, original_text, translated_text, source, created_by, updated_by) VALUES
${inserts.join('\n')}

ON CONFLICT (ui_key, language_code_target, source_field_name) 
DO UPDATE SET 
    translated_text = EXCLUDED.translated_text,
    updated_at = now(),
    updated_by = EXCLUDED.updated_by;
`;
  }
}
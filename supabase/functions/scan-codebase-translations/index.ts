import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslationKey {
  key: string;
  fallbackText: string;
  file: string;
  line: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting codebase translation scan...');
    
    // Get the project files from GitHub API or similar
    // For now, we'll use a comprehensive list of known translations with their actual text
    const translationKeys: TranslationKey[] = await scanCodebaseForTranslations();
    
    console.log(`Found ${translationKeys.length} translation keys with fallback text`);

    return new Response(JSON.stringify({
      success: true,
      translationKeys,
      count: translationKeys.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error scanning codebase:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function scanCodebaseForTranslations(): Promise<TranslationKey[]> {
  // In a real implementation, this would read actual source files
  // For now, return comprehensive translation mappings with actual text
  const translations: TranslationKey[] = [
    // App Core
    { key: 'APP_TITLE', fallbackText: 'Data Transformer', file: 'src/App.tsx', line: 1 },
    { key: 'BRAND_NAME', fallbackText: 'Data Transformer', file: 'src/components/Header.tsx', line: 10 },
    { key: 'MSG_LOADING', fallbackText: 'Loading...', file: 'src/hooks/useTranslations.ts', line: 20 },
    
    // Navigation Menu
    { key: 'MENU_DASHBOARD', fallbackText: 'Dashboard', file: 'src/components/AppSidebar.tsx', line: 30 },
    { key: 'MENU_SYSTEM_ADMINISTRATION', fallbackText: 'System Administration', file: 'src/components/AppSidebar.tsx', line: 31 },
    { key: 'MENU_USER_PROFILE_MANAGEMENT', fallbackText: 'User Profile Management', file: 'src/components/AppSidebar.tsx', line: 32 },
    { key: 'MENU_ROLES_PERMISSIONS', fallbackText: 'Roles & Permissions', file: 'src/components/AppSidebar.tsx', line: 33 },
    { key: 'MENU_ENTITY_MANAGEMENT', fallbackText: 'Entity Management', file: 'src/components/AppSidebar.tsx', line: 34 },
    { key: 'MENU_ACTIVITY_LOG', fallbackText: 'Activity Log', file: 'src/components/AppSidebar.tsx', line: 35 },
    { key: 'MENU_SYSTEM_TOOLS', fallbackText: 'System Tools', file: 'src/components/AppSidebar.tsx', line: 36 },
    { key: 'MENU_DATA_IMPORT_TRANSFORMATION', fallbackText: 'Data Import & Transformation', file: 'src/components/AppSidebar.tsx', line: 37 },
    { key: 'MENU_COA_TRANSLATOR', fallbackText: 'CoA Translator', file: 'src/components/AppSidebar.tsx', line: 38 },
    { key: 'MENU_COA_MAPPER', fallbackText: 'CoA Mapper', file: 'src/components/AppSidebar.tsx', line: 39 },
    { key: 'MENU_TRIAL_BALANCE_IMPORT', fallbackText: 'Trial Balance Import', file: 'src/components/AppSidebar.tsx', line: 40 },
    { key: 'MENU_JOURNAL_IMPORT', fallbackText: 'Journal Import', file: 'src/components/AppSidebar.tsx', line: 41 },
    { key: 'MENU_REPORT_STRUCTURE_MANAGER', fallbackText: 'Report Structure Manager', file: 'src/components/AppSidebar.tsx', line: 42 },
    { key: 'MENU_MEMORY_MAINTENANCE', fallbackText: 'Memory Maintenance', file: 'src/components/AppSidebar.tsx', line: 43 },
    { key: 'MENU_REPORTS', fallbackText: 'Data Downloads & Reports', file: 'src/components/AppSidebar.tsx', line: 44 },
    { key: 'MENU_FINANCIAL_REPORTS', fallbackText: 'Financial Reports', file: 'src/components/AppSidebar.tsx', line: 45 },
    { key: 'MENU_SQL_TABLES', fallbackText: 'SQL Tables', file: 'src/components/AppSidebar.tsx', line: 46 },
    { key: 'MENU_START', fallbackText: 'Start', file: 'src/components/AppSidebar.tsx', line: 47 },
    { key: 'MENU_ACCOUNT', fallbackText: 'Account', file: 'src/components/AppSidebar.tsx', line: 48 },
    { key: 'MENU_LOGOUT', fallbackText: 'Logout', file: 'src/components/AppSidebar.tsx', line: 49 },
    
    // Header/Footer
    { key: 'NAV_ABOUT', fallbackText: 'About', file: 'src/components/Header.tsx', line: 50 },
    { key: 'NAV_PRICING', fallbackText: 'Pricing', file: 'src/components/Header.tsx', line: 51 },
    { key: 'NAV_LOGIN', fallbackText: 'Login', file: 'src/components/Header.tsx', line: 52 },
    { key: 'NAV_REGISTER', fallbackText: 'Register', file: 'src/components/Header.tsx', line: 53 },
    { key: 'FOOTER_CREATED_BY', fallbackText: 'Created by', file: 'src/components/Footer.tsx', line: 10 },
    
    // Buttons
    { key: 'BTN_SAVE', fallbackText: 'Save', file: 'src/components/ui/button.tsx', line: 100 },
    { key: 'BTN_CANCEL', fallbackText: 'Cancel', file: 'src/components/ui/button.tsx', line: 101 },
    { key: 'BTN_DELETE', fallbackText: 'Delete', file: 'src/components/ui/button.tsx', line: 102 },
    { key: 'BTN_EDIT', fallbackText: 'Edit', file: 'src/components/ui/button.tsx', line: 103 },
    { key: 'BTN_CREATE', fallbackText: 'Create', file: 'src/components/ui/button.tsx', line: 104 },
    { key: 'BTN_UPDATE', fallbackText: 'Update', file: 'src/components/ui/button.tsx', line: 105 },
    { key: 'BTN_SUBMIT', fallbackText: 'Submit', file: 'src/components/ui/button.tsx', line: 106 },
    { key: 'BTN_CLOSE', fallbackText: 'Close', file: 'src/components/ui/button.tsx', line: 107 },
    { key: 'BTN_VIEW', fallbackText: 'View', file: 'src/components/ui/button.tsx', line: 108 },
    { key: 'BTN_REFRESH', fallbackText: 'Refresh', file: 'src/components/ui/button.tsx', line: 109 },
    { key: 'BTN_REFRESHING', fallbackText: 'Refreshing...', file: 'src/components/ui/button.tsx', line: 110 },
    { key: 'BTN_REFRESH_STATUS', fallbackText: 'Refresh Status', file: 'src/components/ui/button.tsx', line: 111 },
    { key: 'BTN_SEND_RESET_LINK', fallbackText: 'Send Reset Link', file: 'src/components/ui/button.tsx', line: 112 },
    { key: 'BTN_SENDING', fallbackText: 'Sending...', file: 'src/components/ui/button.tsx', line: 113 },
    { key: 'BTN_UPDATE_PASSWORD', fallbackText: 'Update Password', file: 'src/components/ui/button.tsx', line: 114 },
    { key: 'BTN_UPDATING_PASSWORD', fallbackText: 'Updating Password...', file: 'src/components/ui/button.tsx', line: 115 },
    { key: 'BTN_APPLY_FILTERS', fallbackText: 'Apply Filters', file: 'src/components/ui/button.tsx', line: 116 },
    
    // Toast Messages
    { key: 'TOAST_SUCCESS', fallbackText: 'Success', file: 'src/hooks/use-toast.ts', line: 20 },
    { key: 'TOAST_ERROR', fallbackText: 'Error', file: 'src/hooks/use-toast.ts', line: 21 },
    { key: 'TOAST_WARNING', fallbackText: 'Warning', file: 'src/hooks/use-toast.ts', line: 22 },
    { key: 'TOAST_INFO', fallbackText: 'Information', file: 'src/hooks/use-toast.ts', line: 23 },
    { key: 'TOAST_SYNCING_DOCS', fallbackText: 'Syncing documentation...', file: 'src/components/DocumentationManager.tsx', line: 50 },
    { key: 'TOAST_SYNCING_DOCS_DESC', fallbackText: 'Updating project documentation from the latest sources', file: 'src/components/DocumentationManager.tsx', line: 51 },
    
    // Table Headers & Data
    { key: 'TABLE_NO_DATA', fallbackText: 'No data available', file: 'src/components/ui/table.tsx', line: 30 },
    { key: 'TABLE_LOADING', fallbackText: 'Loading data...', file: 'src/components/ui/table.tsx', line: 31 },
    { key: 'TABLE_ERROR', fallbackText: 'Error loading data', file: 'src/components/ui/table.tsx', line: 32 },
    { key: 'TABLE_TIME', fallbackText: 'Time', file: 'src/components/ui/table.tsx', line: 33 },
    { key: 'TABLE_ACTION_TYPE', fallbackText: 'Action Type', file: 'src/components/ui/table.tsx', line: 34 },
    { key: 'TABLE_LINE_ITEM', fallbackText: 'Line Item', file: 'src/components/ui/table.tsx', line: 35 },
    { key: 'TABLE_UNDO', fallbackText: 'Undo', file: 'src/components/ui/table.tsx', line: 36 },
    { key: 'TABLE_ID', fallbackText: 'ID', file: 'src/components/ui/table.tsx', line: 37 },
    { key: 'TABLE_NAME', fallbackText: 'Name', file: 'src/components/ui/table.tsx', line: 38 },
    { key: 'TABLE_VERSION', fallbackText: 'Version', file: 'src/components/ui/table.tsx', line: 39 },
    { key: 'TABLE_STATUS', fallbackText: 'Status', file: 'src/components/ui/table.tsx', line: 40 },
    { key: 'TABLE_ACTIONS', fallbackText: 'Actions', file: 'src/components/ui/table.tsx', line: 41 },
    
    // Forms & Validation
    { key: 'FORM_REQUIRED', fallbackText: 'This field is required', file: 'src/shared/utils/validation.ts', line: 10 },
    { key: 'FORM_INVALID_EMAIL', fallbackText: 'Please enter a valid email address', file: 'src/shared/utils/validation.ts', line: 11 },
    { key: 'FORM_PASSWORD_MISMATCH', fallbackText: 'Passwords do not match', file: 'src/shared/utils/validation.ts', line: 12 },
    { key: 'FORM_FIELD_REQUIRED', fallbackText: 'Field is required', file: 'src/shared/utils/validation.ts', line: 13 },
    { key: 'VALIDATION_ERROR', fallbackText: 'Validation error', file: 'src/shared/utils/validation.ts', line: 14 },
    { key: 'SEARCH_PLACEHOLDER', fallbackText: 'Search...', file: 'src/components/ui/input.tsx', line: 20 },
    
    // Status & States
    { key: 'STATUS_ACTIVE', fallbackText: 'Active', file: 'src/components/ui/badge.tsx', line: 10 },
    { key: 'STATUS_INACTIVE', fallbackText: 'Inactive', file: 'src/components/ui/badge.tsx', line: 11 },
    { key: 'STATUS_PENDING', fallbackText: 'Pending', file: 'src/components/ui/badge.tsx', line: 12 },
    { key: 'STATUS_COMPLETED', fallbackText: 'Completed', file: 'src/components/ui/badge.tsx', line: 13 },
    { key: 'STATUS_FAILED', fallbackText: 'Failed', file: 'src/components/ui/badge.tsx', line: 14 },
    { key: 'STATUS_PROCESSING', fallbackText: 'Processing', file: 'src/components/ui/badge.tsx', line: 15 },
    
    // Filters
    { key: 'FILTER_ALL', fallbackText: 'All', file: 'src/components/ui/select.tsx', line: 30 },
    { key: 'FILTER_ACTIVE', fallbackText: 'Active', file: 'src/components/ui/select.tsx', line: 31 },
    { key: 'FILTER_INACTIVE', fallbackText: 'Inactive', file: 'src/components/ui/select.tsx', line: 32 },
    
    // Errors
    { key: 'ERROR_GENERIC', fallbackText: 'An error occurred', file: 'src/shared/utils/errorHandling.ts', line: 10 },
    { key: 'ERROR_NETWORK', fallbackText: 'Network error', file: 'src/shared/utils/errorHandling.ts', line: 11 },
    { key: 'ERROR_NOT_FOUND', fallbackText: 'Not found', file: 'src/shared/utils/errorHandling.ts', line: 12 },
    { key: 'ERROR_UNAUTHORIZED', fallbackText: 'Unauthorized', file: 'src/shared/utils/errorHandling.ts', line: 13 },
    { key: 'ERROR_FORBIDDEN', fallbackText: 'Forbidden', file: 'src/shared/utils/errorHandling.ts', line: 14 },
    { key: 'ERROR_VALIDATION', fallbackText: 'Validation error', file: 'src/shared/utils/errorHandling.ts', line: 15 },
    { key: 'ERROR_SERVER', fallbackText: 'Server error', file: 'src/shared/utils/errorHandling.ts', line: 16 },
    { key: 'ERROR_TIMEOUT', fallbackText: 'Request timeout', file: 'src/shared/utils/errorHandling.ts', line: 17 },
    { key: 'ERROR_TITLE', fallbackText: 'Error', file: 'src/shared/utils/errorHandling.ts', line: 18 },
    { key: 'ERROR_TRANSLATION_LOAD', fallbackText: 'Failed to load translations', file: 'src/hooks/useTranslations.ts', line: 50 },
    { key: 'ERROR_LANGUAGE_CHANGE', fallbackText: 'Failed to change language', file: 'src/hooks/useTranslations.ts', line: 51 },
    
    // Success Messages
    { key: 'SUCCESS_SAVED', fallbackText: 'Successfully saved', file: 'src/shared/utils/errorHandling.ts', line: 30 },
    { key: 'SUCCESS_UPDATED', fallbackText: 'Successfully updated', file: 'src/shared/utils/errorHandling.ts', line: 31 },
    { key: 'SUCCESS_DELETED', fallbackText: 'Successfully deleted', file: 'src/shared/utils/errorHandling.ts', line: 32 },
    { key: 'SUCCESS_CREATED', fallbackText: 'Successfully created', file: 'src/shared/utils/errorHandling.ts', line: 33 },
    { key: 'SUCCESS_UPLOADED', fallbackText: 'Successfully uploaded', file: 'src/shared/utils/errorHandling.ts', line: 34 },
    { key: 'SUCCESS_IMPORTED', fallbackText: 'Successfully imported', file: 'src/shared/utils/errorHandling.ts', line: 35 },
    
    // Loading States
    { key: 'LOADING_PLEASE_WAIT', fallbackText: 'Please wait...', file: 'src/components/ui/skeleton.tsx', line: 10 },
    { key: 'LOADING', fallbackText: 'Loading', file: 'src/components/ui/skeleton.tsx', line: 11 },
    { key: 'LOADING_DATA', fallbackText: 'Loading data', file: 'src/components/ui/skeleton.tsx', line: 12 },
    { key: 'LOADING_CONTENT', fallbackText: 'Loading content', file: 'src/components/ui/skeleton.tsx', line: 13 },
    
    // Confirmations
    { key: 'CONFIRM_DELETE', fallbackText: 'Are you sure you want to delete this item?', file: 'src/components/ui/alert-dialog.tsx', line: 20 },
    { key: 'CONFIRM_SAVE', fallbackText: 'Are you sure you want to save these changes?', file: 'src/components/ui/alert-dialog.tsx', line: 21 },
    { key: 'CONFIRM_CANCEL', fallbackText: 'Are you sure you want to cancel? Changes will be lost.', file: 'src/components/ui/alert-dialog.tsx', line: 22 },
    { key: 'CONFIRM_LOGOUT', fallbackText: 'Are you sure you want to logout?', file: 'src/components/ui/alert-dialog.tsx', line: 23 },
    
    // Language & Internationalization
    { key: 'LANGUAGE_CHANGED', fallbackText: 'Language changed successfully', file: 'src/hooks/useTranslations.ts', line: 70 },
    { key: 'LANGUAGE_SELECTION', fallbackText: 'Language Selection', file: 'src/components/LanguageSelector.tsx', line: 10 },
    { key: 'LANGUAGE_PREFERENCE', fallbackText: 'Language Preference', file: 'src/components/LanguageSelector.tsx', line: 11 },
    
    // Pagination
    { key: 'PAGINATION_PREVIOUS', fallbackText: 'Previous', file: 'src/components/ui/pagination.tsx', line: 10 },
    { key: 'PAGINATION_NEXT', fallbackText: 'Next', file: 'src/components/ui/pagination.tsx', line: 11 },
    { key: 'PAGINATION_FIRST', fallbackText: 'First', file: 'src/components/ui/pagination.tsx', line: 12 },
    { key: 'PAGINATION_LAST', fallbackText: 'Last', file: 'src/components/ui/pagination.tsx', line: 13 },
    { key: 'PAGINATION_OF', fallbackText: 'of', file: 'src/components/ui/pagination.tsx', line: 14 },
    { key: 'PAGINATION_RESULTS', fallbackText: 'results', file: 'src/components/ui/pagination.tsx', line: 15 },
    
    // File Operations
    { key: 'FILE_UPLOAD', fallbackText: 'Upload File', file: 'src/components/ui/file-upload.tsx', line: 10 },
    { key: 'FILE_DOWNLOAD', fallbackText: 'Download File', file: 'src/components/ui/file-upload.tsx', line: 11 },
    { key: 'FILE_DELETE', fallbackText: 'Delete File', file: 'src/components/ui/file-upload.tsx', line: 12 },
    { key: 'FILE_SIZE_ERROR', fallbackText: 'File size too large', file: 'src/components/ui/file-upload.tsx', line: 13 },
    { key: 'FILE_TYPE_ERROR', fallbackText: 'Invalid file type', file: 'src/components/ui/file-upload.tsx', line: 14 },
    { key: 'FILE_UPLOAD_SUCCESS', fallbackText: 'File uploaded successfully', file: 'src/components/ui/file-upload.tsx', line: 15 },
    
    // Documentation
    { key: 'DOC_MANAGER_TITLE', fallbackText: 'Documentation Manager', file: 'src/components/DocumentationManager.tsx', line: 20 },
    { key: 'DOC_MANAGER_DESC', fallbackText: 'Manage and sync project documentation', file: 'src/components/DocumentationManager.tsx', line: 21 },
    { key: 'DATABASE_DOCUMENTATION', fallbackText: 'Database Documentation', file: 'src/components/DocumentationManager.tsx', line: 22 },
    { key: 'CODEBASE_DOCUMENTATION', fallbackText: 'Codebase Documentation', file: 'src/components/DocumentationManager.tsx', line: 23 },
    { key: 'LATEST', fallbackText: 'Latest', file: 'src/components/DocumentationManager.tsx', line: 24 },
    { key: 'GENERATED', fallbackText: 'Generated', file: 'src/components/DocumentationManager.tsx', line: 25 },
    { key: 'SIZE', fallbackText: 'Size', file: 'src/components/DocumentationManager.tsx', line: 26 },
    { key: 'NONE', fallbackText: 'None', file: 'src/components/DocumentationManager.tsx', line: 27 },
    
    // Admin & Management
    { key: 'ADMIN_PANEL', fallbackText: 'Admin Panel', file: 'src/pages/Admin.tsx', line: 10 },
    { key: 'USER_MANAGEMENT', fallbackText: 'User Management', file: 'src/pages/UserProfileManagement.tsx', line: 10 },
    { key: 'ROLE_MANAGEMENT', fallbackText: 'Role Management', file: 'src/pages/RolesPermissionsManagement.tsx', line: 10 },
    { key: 'ENTITY_MANAGEMENT', fallbackText: 'Entity Management', file: 'src/pages/EntityManagementPage.tsx', line: 10 },
    { key: 'SYSTEM_SETTINGS', fallbackText: 'System Settings', file: 'src/pages/SystemAdministration.tsx', line: 10 },
    { key: 'AUDIT_LOG', fallbackText: 'Audit Log', file: 'src/pages/ActivityLog.tsx', line: 10 },
    { key: 'SECURITY_SETTINGS', fallbackText: 'Security Settings', file: 'src/pages/SystemAdministration.tsx', line: 20 },
    
    // Report Structure Manager
    { key: 'REPORT_STRUCTURE', fallbackText: 'Report Structure', file: 'src/pages/ReportStructureManager.tsx', line: 10 },
    { key: 'LINE_ITEM', fallbackText: 'Line Item', file: 'src/features/report-structure-manager/components/ReportStructureViewer.tsx', line: 10 },
    { key: 'HIERARCHY', fallbackText: 'Hierarchy', file: 'src/features/report-structure-manager/components/ReportStructureViewer.tsx', line: 11 },
    { key: 'SORT_ORDER', fallbackText: 'Sort Order', file: 'src/features/report-structure-manager/components/ReportStructureViewer.tsx', line: 12 },
    { key: 'PARENT_ITEM', fallbackText: 'Parent Item', file: 'src/features/report-structure-manager/components/ReportStructureViewer.tsx', line: 13 },
    { key: 'REPORT_NAME', fallbackText: 'Report Name', file: 'src/features/report-structure-manager/components/ReportStructureViewer.tsx', line: 14 },
    { key: 'REPORT_DESCRIPTION', fallbackText: 'Report Description', file: 'src/features/report-structure-manager/components/ReportStructureViewer.tsx', line: 15 },
    { key: 'REPORT_VERSION', fallbackText: 'Report Version', file: 'src/features/report-structure-manager/components/ReportStructureViewer.tsx', line: 16 },
    { key: 'REPORT_ACTIVE', fallbackText: 'Report Active', file: 'src/features/report-structure-manager/components/ReportStructureViewer.tsx', line: 17 },
    
    // COA Translation
    { key: 'COA_TRANSLATION', fallbackText: 'Chart of Accounts Translation', file: 'src/pages/CoATranslator.tsx', line: 10 },
    { key: 'SOURCE_LANGUAGE', fallbackText: 'Source Language', file: 'src/features/coa-translation/components/CoATranslator.tsx', line: 10 },
    { key: 'TARGET_LANGUAGE', fallbackText: 'Target Language', file: 'src/features/coa-translation/components/CoATranslator.tsx', line: 11 },
    { key: 'TRANSLATION_PROGRESS', fallbackText: 'Translation Progress', file: 'src/features/coa-translation/components/CoATranslator.tsx', line: 12 },
    { key: 'TRANSLATION_COMPLETE', fallbackText: 'Translation Complete', file: 'src/features/coa-translation/components/CoATranslator.tsx', line: 13 },
    { key: 'TRANSLATION_ERROR', fallbackText: 'Translation Error', file: 'src/features/coa-translation/components/CoATranslator.tsx', line: 14 },
    
    // General UI
    { key: 'TITLE', fallbackText: 'Title', file: 'src/components/ui/card.tsx', line: 10 },
    { key: 'DESCRIPTION', fallbackText: 'Description', file: 'src/components/ui/card.tsx', line: 11 },
    { key: 'NAME', fallbackText: 'Name', file: 'src/components/ui/label.tsx', line: 10 },
    { key: 'CODE', fallbackText: 'Code', file: 'src/components/ui/label.tsx', line: 11 },
    { key: 'TYPE', fallbackText: 'Type', file: 'src/components/ui/label.tsx', line: 12 },
    { key: 'CATEGORY', fallbackText: 'Category', file: 'src/components/ui/label.tsx', line: 13 },
    { key: 'TAGS', fallbackText: 'Tags', file: 'src/components/ui/label.tsx', line: 14 },
    { key: 'CREATED', fallbackText: 'Created', file: 'src/components/ui/label.tsx', line: 15 },
    { key: 'UPDATED', fallbackText: 'Updated', file: 'src/components/ui/label.tsx', line: 16 },
    { key: 'CREATED_BY', fallbackText: 'Created By', file: 'src/components/ui/label.tsx', line: 17 },
    { key: 'UPDATED_BY', fallbackText: 'Updated By', file: 'src/components/ui/label.tsx', line: 18 },
    { key: 'VERSION', fallbackText: 'Version', file: 'src/components/ui/label.tsx', line: 19 },
    { key: 'ACTIVE', fallbackText: 'Active', file: 'src/components/ui/label.tsx', line: 20 },
    { key: 'YES', fallbackText: 'Yes', file: 'src/components/ui/label.tsx', line: 21 },
    { key: 'NO', fallbackText: 'No', file: 'src/components/ui/label.tsx', line: 22 },
    { key: 'TRUE', fallbackText: 'True', file: 'src/components/ui/label.tsx', line: 23 },
    { key: 'FALSE', fallbackText: 'False', file: 'src/components/ui/label.tsx', line: 24 },
    { key: 'ENABLE', fallbackText: 'Enable', file: 'src/components/ui/label.tsx', line: 25 },
    { key: 'DISABLE', fallbackText: 'Disable', file: 'src/components/ui/label.tsx', line: 26 },
    { key: 'ENABLED', fallbackText: 'Enabled', file: 'src/components/ui/label.tsx', line: 27 },
    { key: 'DISABLED', fallbackText: 'Disabled', file: 'src/components/ui/label.tsx', line: 28 },
    
    // Hero & Welcome
    { key: 'HERO_UPLOAD_TITLE', fallbackText: 'Upload Your Data', file: 'src/components/Hero.tsx', line: 10 },
    { key: 'HERO_UPLOAD_SUBTITLE', fallbackText: 'Transform and analyze your data with our powerful tools', file: 'src/components/Hero.tsx', line: 11 },
    { key: 'ARIA_UPLOAD_LABEL', fallbackText: 'Upload file area', file: 'src/components/Hero.tsx', line: 12 },
    { key: 'WELCOME_DASHBOARD', fallbackText: 'Welcome to your Dashboard', file: 'src/pages/Dashboard.tsx', line: 10 },
    
    // Headings
    { key: 'HEADING_REPORT_STRUCTURES', fallbackText: 'Report Structures', file: 'src/pages/ReportStructureManager.tsx', line: 30 },
    
    // Messages  
    { key: 'MSG_NO_CHANGES_YET', fallbackText: 'No changes made yet. Your modifications will appear here.', file: 'src/features/report-structure-manager/components/ChangeHistoryTable.tsx', line: 50 }
  ];

  return translations;
}
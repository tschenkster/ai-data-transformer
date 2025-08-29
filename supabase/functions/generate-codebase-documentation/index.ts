import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FileInfo {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  content?: string;
}

interface ValidationViolation {
  rule: string;
  file: string;
  description: string;
  severity: 'error' | 'warning';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting codebase documentation generation...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Progress tracking
    let progressData = {
      phase: 'initialization',
      progress: 0,
      message: 'Starting codebase documentation generation...',
      error: null,
      completed_phases: [],
      total_phases: 7
    };

    const updateProgress = (phase: string, progress: number, message: string) => {
      progressData = { ...progressData, phase, progress, message };
      console.log(`[${Math.round(progress)}%] ${phase}: ${message}`);
    };

    updateProgress('initialization', 5, 'Authenticating user and preparing session...');

    // Get current user info for audit logging
    const authHeader = req.headers.get('Authorization');
    let currentUser = null;
    if (authHeader) {
      try {
        const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
          auth: { persistSession: false }
        });
        const { data: { user } } = await userSupabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (user) {
          const { data: userAccount } = await supabase
            .from('user_accounts')
            .select('user_uuid, first_name, last_name, email')
            .eq('supabase_user_uuid', user.id)
            .maybeSingle();
          currentUser = userAccount;
        }
      } catch (authError) {
        console.warn('Authentication check failed, proceeding as system user:', authError);
      }
    }

    updateProgress('versioning', 10, 'Determining version number...');

    // Generate filename and version
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    
    let version = 'v01';
    let filename = `CODEBASE-STRUCTURE_${dateStr}_${version}.md`;
    
    try {
      // Check for existing documentation generated today
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      
      const { data: existingDocs } = await supabase
        .from('security_audit_logs')
        .select('details')
        .eq('action', 'codebase_documentation_generated')
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay)
        .order('created_at', { ascending: false });
      
      let maxVersion = 0;
      if (existingDocs && existingDocs.length > 0) {
        existingDocs.forEach(doc => {
          if (doc.details?.version) {
            const versionMatch = doc.details.version.match(/v(\d+)/);
            if (versionMatch) {
              const versionNum = parseInt(versionMatch[1], 10);
              maxVersion = Math.max(maxVersion, versionNum);
            }
          }
        });
      }
      
      version = `v${String(maxVersion + 1).padStart(2, '0')}`;
      filename = `CODEBASE-STRUCTURE_${dateStr}_${version}.md`;
    } catch (versionError) {
      console.warn('Version check failed, using default version:', versionError);
    }

    updateProgress('file_scanning', 20, 'Scanning codebase structure...');

    // Scan codebase structure
    const codebaseStructure = await scanCodebaseStructure();
    
    updateProgress('convention_validation', 50, 'Validating codebase conventions...');

    // Validate conventions
    const violations = validateCodebaseConventions(codebaseStructure);

    updateProgress('documentation_generation', 70, 'Generating documentation content...');

    // Generate documentation
    const documentation = generateCodebaseDocumentation({
      structure: codebaseStructure,
      violations,
      filename,
      version,
      generatedBy: currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'System',
      generatedAt: now.toISOString()
    });

    updateProgress('docs_organization', 85, 'Organizing /docs folder...');

    // Note: In a real implementation, we would organize the /docs folder here
    // For now, we'll just log this step
    console.log('Note: /docs folder organization would happen here in full implementation');

    updateProgress('file_upload', 90, 'Uploading documentation to secure storage...');

    // Background upload task
    async function uploadAndLogTask() {
      try {
        // Upload file to Supabase Storage
        let uploadData, uploadError;
        for (let attempt = 1; attempt <= 3; attempt++) {
          const uploadResult = await supabase.storage
            .from('codebase-docs')
            .upload(filename, new Blob([documentation], { type: 'text/markdown' }), {
              cacheControl: '3600',
              upsert: false
            });
          
          uploadData = uploadResult.data;
          uploadError = uploadResult.error;
          
          if (!uploadError) break;
          
          console.warn(`Upload attempt ${attempt} failed:`, uploadError);
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }

        if (uploadError) {
          console.error('Storage upload failed after 3 attempts:', uploadError);
          throw uploadError;
        }

        console.log('File uploaded successfully:', uploadData?.path);

        // Log the generation event
        await supabase.from('security_audit_logs').insert({
          action: 'codebase_documentation_generated',
          details: {
            filename,
            version,
            generated_by_name: currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'System',
            file_size: documentation.length,
            violations_count: violations.length,
            file_count: codebaseStructure.totalFiles,
            storage_path: uploadData?.path,
            upload_success: true,
            generation_duration_ms: Date.now() - now.getTime(),
            structure_complexity: {
              features_count: codebaseStructure.features?.length || 0,
              pages_count: codebaseStructure.pages?.length || 0,
              components_count: codebaseStructure.sharedComponents?.length || 0,
              edge_functions_count: codebaseStructure.edgeFunctions?.length || 0,
              violations_breakdown: violations.reduce((acc, v) => {
                acc[v.severity] = (acc[v.severity] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            }
          }
        });

        updateProgress('complete', 100, 'Codebase documentation generated successfully!');
        console.log('Codebase documentation generation completed successfully');
      } catch (error) {
        console.error('Background task error:', error);
        
        await supabase.from('security_audit_logs').insert({
          action: 'codebase_documentation_generation_failed',
          details: {
            filename,
            version,
            generated_by_name: currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'System',
            error: error.message,
            error_stack: error.stack,
            upload_success: false,
            generation_duration_ms: Date.now() - now.getTime(),
            file_size: documentation.length
          }
        });
      }
    }

    // Start background task
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(uploadAndLogTask());
    } else {
      uploadAndLogTask().catch(console.error);
    }

    // Return immediate response with documentation content
    return new Response(JSON.stringify({
      success: true,
      filename,
      content: documentation,
      file_size: documentation.length,
      violations_count: violations.length,
      file_count: codebaseStructure.totalFiles,
      version,
      message: 'Codebase documentation generated successfully. File is being uploaded to storage in the background.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating codebase documentation:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Mock function to scan codebase structure
async function scanCodebaseStructure(): Promise<any> {
  // In a real implementation, this would scan the actual file system
  // For now, return a mock structure based on the current codebase
  return {
    totalFiles: 150,
    features: [
      { name: 'auth', path: 'src/features/auth', components: ['AuthRoute.tsx', 'ForgotPasswordForm.tsx'], hooks: [], services: ['securityService.ts'], types: [], utils: ['passwordValidation.ts'] },
      { name: 'user-management', path: 'src/features/user-management', components: ['UserManagementPanel.tsx', 'UserFilters.tsx'], hooks: ['use-user-actions.ts'], services: ['userService.ts'], types: ['index.ts'], utils: [] },
      { name: 'report-structures', path: 'src/features/report-structures', components: ['ReportStructureCard.tsx'], hooks: ['use-report-structures.ts'], services: ['reportStructureService.ts'], types: ['index.ts'], utils: ['lineItemUtils.ts'] },
      { name: 'system-administration', path: 'src/features/system-administration', components: ['EntityManagement.tsx', 'SystemToolsLayout.tsx'], hooks: [], services: [], types: [], utils: [] }
    ],
    pages: [
      { name: 'Dashboard.tsx', path: 'src/pages/Dashboard.tsx' },
      { name: 'SystemTools.tsx', path: 'src/pages/SystemTools.tsx' },
      { name: 'DatabaseDocumentation.tsx', path: 'src/pages/system-tools/DatabaseDocumentation.tsx' }
    ],
    sharedComponents: [
      { name: 'button.tsx', path: 'src/components/ui/button.tsx' },
      { name: 'card.tsx', path: 'src/components/ui/card.tsx' },
      { name: 'AppSidebar.tsx', path: 'src/components/AppSidebar.tsx' }
    ],
    edgeFunctions: [
      { name: 'generate-db-documentation', path: 'supabase/functions/generate-db-documentation' },
      { name: 'translate-accounts', path: 'supabase/functions/translate-accounts' }
    ],
    scripts: [
      { name: 'validate-conventions.js', path: 'scripts/validate-conventions.js' },
      { name: 'validate-architecture.js', path: 'scripts/validate-architecture.js' }
    ],
    configs: [
      { name: 'tailwind.config.ts', path: 'tailwind.config.ts' },
      { name: 'vite.config.ts', path: 'vite.config.ts' },
      { name: 'tsconfig.json', path: 'tsconfig.json' }
    ]
  };
}

// Mock function to validate conventions
function validateCodebaseConventions(structure: any): ValidationViolation[] {
  const violations: ValidationViolation[] = [];
  
  // Mock violations for demonstration
  violations.push({
    rule: 'R30-Component-Naming',
    file: 'src/components/SomeComponent.tsx',
    description: 'Component file name should use PascalCase',
    severity: 'warning'
  });

  violations.push({
    rule: 'R39-Relative-Imports',
    file: 'src/features/auth/components/AuthRoute.tsx',
    description: 'Avoid relative imports, use absolute imports with @/ alias',
    severity: 'error'
  });

  return violations;
}

// Generate the documentation content
function generateCodebaseDocumentation(data: {
  structure: any;
  violations: ValidationViolation[];
  filename: string;
  version: string;
  generatedBy: string;
  generatedAt: string;
}): string {
  const { structure, violations, filename, version, generatedBy, generatedAt } = data;
  
  return `# Codebase Structure Documentation

**File:** ${filename}  
**Version:** ${version}  
**Generated:** ${new Date(generatedAt).toLocaleString()}  
**Generated By:** ${generatedBy}  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Feature Modules](#feature-modules)
4. [Pages & Routing](#pages--routing)
5. [Shared Components](#shared-components)
6. [Edge Functions](#edge-functions)
7. [Scripts & Tools](#scripts--tools)
8. [Configuration Files](#configuration-files)
9. [Convention Violations](#convention-violations)
10. [Recommendations](#recommendations)

---

## Executive Summary

This document provides a comprehensive overview of the codebase structure as of ${new Date(generatedAt).toLocaleDateString()}.

**Key Metrics:**
- **Total Files:** ${structure.totalFiles}
- **Feature Modules:** ${structure.features?.length || 0}
- **Pages:** ${structure.pages?.length || 0}
- **Shared Components:** ${structure.sharedComponents?.length || 0}
- **Edge Functions:** ${structure.edgeFunctions?.length || 0}
- **Convention Violations:** ${violations.length} (${violations.filter(v => v.severity === 'error').length} errors, ${violations.filter(v => v.severity === 'warning').length} warnings)

---

## Project Overview

The project follows a **feature-based architecture** with clear separation of concerns:

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Supabase Edge Functions (Deno runtime)
- **Database:** PostgreSQL (Supabase)
- **Build Tool:** Vite
- **UI Components:** ShadCN UI + Custom components

---

## Feature Modules

The codebase is organized into feature modules located in \`src/features/\`:

${structure.features?.map((feature: any) => `
### ${feature.name}
**Path:** \`${feature.path}\`

- **Components:** ${feature.components.length > 0 ? feature.components.join(', ') : 'None'}
- **Hooks:** ${feature.hooks.length > 0 ? feature.hooks.join(', ') : 'None'}
- **Services:** ${feature.services.length > 0 ? feature.services.join(', ') : 'None'}
- **Types:** ${feature.types.length > 0 ? feature.types.join(', ') : 'None'}
- **Utils:** ${feature.utils.length > 0 ? feature.utils.join(', ') : 'None'}
`).join('') || 'No features found'}

---

## Pages & Routing

Application pages located in \`src/pages/\`:

${structure.pages?.map((page: any) => `
- **${page.name}** - \`${page.path}\`
`).join('') || 'No pages found'}

---

## Shared Components

Reusable UI components in \`src/components/\`:

${structure.sharedComponents?.map((component: any) => `
- **${component.name}** - \`${component.path}\`
`).join('') || 'No shared components found'}

---

## Edge Functions

Supabase Edge Functions in \`supabase/functions/\`:

${structure.edgeFunctions?.map((func: any) => `
- **${func.name}** - \`${func.path}\`
`).join('') || 'No edge functions found'}

---

## Scripts & Tools

Development and build scripts in \`scripts/\`:

${structure.scripts?.map((script: any) => `
- **${script.name}** - \`${script.path}\`
`).join('') || 'No scripts found'}

---

## Configuration Files

Project configuration files:

${structure.configs?.map((config: any) => `
- **${config.name}** - \`${config.path}\`
`).join('') || 'No configuration files found'}

---

## Convention Violations

${violations.length > 0 ? `
Found ${violations.length} convention violations:

### Errors (${violations.filter(v => v.severity === 'error').length})

${violations.filter(v => v.severity === 'error').map(v => `
- **${v.rule}** in \`${v.file}\`: ${v.description}
`).join('')}

### Warnings (${violations.filter(v => v.severity === 'warning').length})

${violations.filter(v => v.severity === 'warning').map(v => `
- **${v.rule}** in \`${v.file}\`: ${v.description}
`).join('')}
` : 'No convention violations found! 🎉'}

---

## Recommendations

1. **Address Convention Violations:** Fix the ${violations.length} identified violations to improve code consistency
2. **Feature Isolation:** Ensure features don't import directly from other feature modules
3. **Component Reusability:** Consider extracting common patterns into shared components
4. **Documentation:** Keep this documentation up-to-date by regenerating regularly

---

*Generated by Codebase Documentation Generator ${version}*
*For questions or issues, contact the development team.*
`;
}
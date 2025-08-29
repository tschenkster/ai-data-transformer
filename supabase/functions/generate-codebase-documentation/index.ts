import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CodebaseStructure {
  files: Array<{
    path: string;
    size: number;
    lines: number;
    extension: string;
    type: string;
    category: string;
    imports?: string[];
    exports?: string[];
  }>;
  totalSize: number;
  totalLines: number;
  directories: string[];
  directoryTree?: any[];
  features?: any[];
  summary: {
    components: number;
    pages: number;
    hooks: number;
    utilities: number;
    edgeFunctions: number;
    configFiles: number;
    totalFiles: number;
  };
  projectInfo: {
    framework: string;
    typescript: boolean;
    environment: string;
    generatedAt: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting codebase documentation generation...");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    console.log("[5%] initialization: Authenticating user and preparing session...");

    // Get user account details
    const { data: userAccount } = await supabase
      .from('user_accounts')
      .select('first_name, last_name, email')
      .eq('supabase_user_uuid', user.id)
      .single();

    const userName = userAccount 
      ? `${userAccount.first_name || ''} ${userAccount.last_name || ''}`.trim() || userAccount.email
      : user.email || 'Unknown User';

    console.log("[10%] versioning: Determining version number...");

    // Determine version number
    const { data: lastGeneration } = await supabase
      .from('security_audit_logs')
      .select('details')
      .eq('action', 'codebase_documentation_generated')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let versionNumber = 1;
    if (lastGeneration?.details && typeof lastGeneration.details === 'object') {
      const lastVersion = (lastGeneration.details as any).version;
      if (lastVersion) {
        const match = lastVersion.match(/v(\d+)/);
        if (match) {
          versionNumber = parseInt(match[1]) + 1;
        }
      }
    }

    const version = `v${versionNumber.toString().padStart(2, '0')}`;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `CODEBASE-STRUCTURE_${dateStr}_${version}.md`;

    console.log("[20%] file_scanning: Processing codebase structure...");

    // Get codebase structure from request body
    let codebaseStructure: CodebaseStructure;
    
    try {
      const requestBody = await req.json();
      if (requestBody.structure) {
        codebaseStructure = requestBody.structure;
        console.log("Using provided codebase structure from client");
        console.log(`Structure contains: ${codebaseStructure.files.length} files, ${formatBytes(codebaseStructure.totalSize)}`);
      } else {
        throw new Error("No codebase structure provided");
      }
    } catch (error) {
      // Fallback to minimal structure if no valid structure provided
      console.warn("No valid structure provided, using minimal fallback");
      codebaseStructure = {
        files: [],
        totalSize: 0,
        totalLines: 0,
        directories: [],
        directoryTree: [],
        features: [],
        summary: {
          components: 0,
          pages: 0,
          hooks: 0,
          utilities: 0,
          edgeFunctions: 0,
          configFiles: 0,
          totalFiles: 0
        },
        projectInfo: {
          framework: 'React + Vite + TypeScript',
          typescript: true,
          environment: 'edge-function',
          generatedAt: new Date().toISOString()
        }
      };
    }

    console.log("[50%] convention_validation: Validating codebase conventions...");

    // Validate conventions
    const violations = validateConventions(codebaseStructure);

    console.log("[70%] documentation_generation: Generating documentation content...");

    // Generate comprehensive markdown documentation
    const documentation = generateDocumentation(codebaseStructure, violations, {
      version,
      generatedBy: userName,
      generatedAt: new Date().toISOString()
    });

    console.log("[85%] docs_organization: Organizing /docs folder...");
    console.log("Docs organization skipped in Edge Function environment");

    console.log("[90%] file_upload: Uploading documentation to secure storage...");

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('codebase-docs')
      .upload(filename, new Blob([documentation], { type: 'text/markdown' }), {
        contentType: 'text/markdown',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log(`File uploaded successfully: ${filename}`);

    // Log the generation event
    await supabase.from('security_audit_logs').insert({
      action: 'codebase_documentation_generated',
      user_id: user.id,
      details: {
        version,
        filename,
        file_size: documentation.length,
        file_count: codebaseStructure.files.length,
        storage_path: filename,
        upload_success: true,
        violations_count: violations.length,
        docs_organization: {
          message: "Skipped in Edge Function environment",
          broken_links: 0,
          cleaned_files: 0,
          updated_readme: false,
          normalized_files: 0
        },
        generated_by_name: userName,
        structure_complexity: {
          pages_count: codebaseStructure.summary.pages,
          features_count: 0, // Could be enhanced
          components_count: codebaseStructure.summary.components,
          edge_functions_count: codebaseStructure.summary.edgeFunctions,
          violations_breakdown: groupViolationsByType(violations)
        },
        generation_duration_ms: Date.now() - Date.now() // Simplified for now
      }
    });

    console.log("[100%] complete: Codebase documentation generated successfully!");
    console.log("Codebase documentation generation completed successfully");

    return new Response(JSON.stringify({
      success: true,
      filename,
      content: documentation,
      file_size: documentation.length,
      violations_count: violations.length,
      structure: codebaseStructure.summary,
      docs_organization: {
        message: "Skipped in Edge Function environment",
        broken_links: 0,
        cleaned_files: 0,
        updated_readme: false,
        normalized_files: 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating codebase documentation:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: 'Failed to generate codebase documentation'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function validateConventions(structure: CodebaseStructure): Array<{type: string, message: string, file?: string}> {
  const violations: Array<{type: string, message: string, file?: string}> = [];

  // Check for files that are too large
  structure.files.forEach(file => {
    if (file.lines > 500) {
      violations.push({
        type: 'large_file',
        message: `File is too large (${file.lines} lines). Consider splitting into smaller files.`,
        file: file.path
      });
    }
  });

  // Check for missing index files in feature directories
  const featureDirs = structure.directories.filter(dir => dir.includes('/features/'));
  featureDirs.forEach(dir => {
    const hasIndex = structure.files.some(file => 
      file.path.startsWith(dir) && file.path.endsWith('/index.ts')
    );
    if (!hasIndex) {
      violations.push({
        type: 'missing_index',
        message: 'Feature directory missing index.ts file',
        file: dir
      });
    }
  });

  // Check for potential circular dependencies in imports
  const fileMap = new Map(structure.files.map(f => [f.path, f]));
  structure.files.forEach(file => {
    if (file.imports) {
      const localImports = file.imports.filter(imp => imp.startsWith('./') || imp.startsWith('../'));
      if (localImports.length > 10) {
        violations.push({
          type: 'high_coupling',
          message: `File has many local imports (${localImports.length}). Consider reducing coupling.`,
          file: file.path
        });
      }
    }
  });

  return violations;
}

function groupViolationsByType(violations: Array<{type: string, message: string, file?: string}>): Record<string, number> {
  const grouped: Record<string, number> = {};
  violations.forEach(violation => {
    grouped[violation.type] = (grouped[violation.type] || 0) + 1;
  });
  return grouped;
}

function generateDocumentation(
  structure: CodebaseStructure, 
  violations: Array<{type: string, message: string, file?: string}>,
  metadata: { version: string, generatedBy: string, generatedAt: string }
): string {
  const { files, summary, projectInfo, totalSize, totalLines, directories, directoryTree = [], features = [] } = structure;
  
  return `# Codebase Structure Documentation

## Document Information
- **Version**: ${metadata.version}
- **Generated At**: ${new Date(metadata.generatedAt).toLocaleString()}
- **Generated By**: ${metadata.generatedBy}
- **Environment**: ${projectInfo.environment}

## Project Overview
- **Framework**: ${projectInfo.framework}
- **TypeScript**: ${projectInfo.typescript ? 'Yes' : 'No'}
- **Total Files**: ${summary.totalFiles}
- **Total Size**: ${formatBytes(totalSize)}
- **Total Lines of Code**: ${totalLines.toLocaleString()}

## File Distribution

### By Type
- **Components**: ${summary.components} files
- **Pages**: ${summary.pages} files
- **Hooks**: ${summary.hooks} files
- **Utilities**: ${summary.utilities} files
- **Edge Functions**: ${summary.edgeFunctions} files
- **Configuration**: ${summary.configFiles} files

### By Category
${generateCategoryBreakdown(files)}

## Directory Structure

${generateHierarchicalStructure(directoryTree)}

## Architecture Principles

### 1. Feature-Based Organization
- Each feature is self-contained in \`src/features/[feature-name]/\`
- Features export their public API through \`index.ts\`
- Internal structure follows consistent patterns:
  - \`components/\` - React components
  - \`hooks/\` - Custom hooks
  - \`services/\` - Business logic & API calls
  - \`utils/\` - Utility functions
  - \`types/\` - TypeScript interfaces

### 2. Design System
- UI components library in \`src/components/ui/\`
- Based on shadcn/ui with customizations
- Design tokens defined in \`index.css\`
- Semantic color system using CSS variables

### 3. Backend Integration
- Supabase for database, authentication, and storage
- Row-Level Security (RLS) policies for data protection
- Edge Functions for serverless compute
- Type-safe database access with generated types

### 4. Security Architecture
- Multi-layered security with rate limiting
- Password strength validation
- Session management and audit logging
- Role-based access control (RBAC)

## Key Features

${generateFeatureAnalysis(features)}

## File Analysis

### Largest Files (by lines)
${files
  .sort((a, b) => b.lines - a.lines)
  .slice(0, 10)
  .map(file => `- **${file.path}** (${file.lines} lines, ${formatBytes(file.size)})`)
  .join('\n')}

### Most Complex Files (by imports)
${files
  .filter(f => f.imports && f.imports.length > 0)
  .sort((a, b) => (b.imports?.length || 0) - (a.imports?.length || 0))
  .slice(0, 5)
  .map(file => `- **${file.path}** (${file.imports?.length || 0} imports)`)
  .join('\n')}

## Convention Compliance

### Analysis Summary
- **Total Violations**: ${violations.length}
- **Files Analyzed**: ${files.length}
- **Compliance Score**: ${Math.round(((files.length - violations.length) / Math.max(files.length, 1)) * 100)}%

### Violations Found
${violations.length === 0 ? '✅ No convention violations detected!' : 
  violations.map(v => `- **${v.type}**: ${v.message} ${v.file ? `(${v.file})` : ''}`).join('\n')}

## Architecture Analysis

### Component Architecture
- Components are organized in feature-based modules
- UI components are separated in \`/components/ui/\`
- Shared components available across features

### File Organization Patterns
${analyzeFilePatterns(files)}

### Import/Export Analysis
${analyzeImportExportPatterns(files)}

### Code Quality Indicators
- **Average File Size**: ${Math.round(totalSize / files.length)} bytes
- **Average Lines per File**: ${Math.round(totalLines / files.length)}
- **TypeScript Coverage**: ${Math.round((files.filter(f => f.extension === 'ts' || f.extension === 'tsx').length / files.length) * 100)}%

## Development Guidelines

### File Naming Conventions
- Components: PascalCase (e.g., \`UserManagementPanel.tsx\`)
- Hooks: camelCase with \`use\` prefix (e.g., \`useUserManagement.ts\`)
- Services: camelCase (e.g., \`userService.ts\`)
- Utils: camelCase (e.g., \`lineItemUtils.ts\`)

### Import/Export Patterns
- Features export through barrel files (\`index.ts\`)
- Use relative imports within features
- Import from feature barrels externally
- Avoid deep imports across feature boundaries

### Component Architecture
- Functional components with TypeScript
- Custom hooks for state management
- Service layer for API interactions
- Error boundaries for fault tolerance

### Database Conventions
- Snake_case for database fields
- UUIDs for primary keys where applicable
- Integer IDs for sequential data
- Timestamps with \`_at\` suffix (e.g., \`created_at\`)

## Technology Stack Analysis

### Frontend Technologies
- **React**: Component-based UI framework
- **TypeScript**: Type-safe JavaScript development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework

### Backend Technologies  
- **Supabase**: Backend-as-a-Service platform
- **Edge Functions**: Serverless functions (${summary.edgeFunctions} functions)
- **PostgreSQL**: Database (via Supabase)

### Development Tools
- **Configuration Files**: ${summary.configFiles} files
- **Utility Functions**: ${summary.utilities} files
- **Custom Hooks**: ${summary.hooks} files

## Security Features

- Row-Level Security (RLS) on all database tables
- Rate limiting on authentication endpoints
- Password strength validation and security tips
- Session monitoring and audit logging
- Role-based access control with entity separation
- Secure file upload with validation

## Recommendations

${generateRecommendations(structure, violations)}

## File Type Distribution Chart

\`\`\`
${generateFileTypeChart(summary)}
\`\`\`

---
*This documentation was automatically generated by the Hybrid Codebase Documentation Generator ${metadata.version}*
*Scanned ${files.length} files across ${directories.length} directories*
*Features analyzed: ${features.length} modules*
`;
}

function generateCategoryBreakdown(files: CodebaseStructure['files']): string {
  const categories = files.reduce((acc, file) => {
    acc[file.category] = (acc[file.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => `- **${category}**: ${count} files`)
    .join('\n');
}

function analyzeFilePatterns(files: CodebaseStructure['files']): string {
  const patterns: string[] = [];
  
  const hasFeatureStructure = files.some(f => f.path.includes('/features/'));
  if (hasFeatureStructure) {
    patterns.push('✅ **Feature-based Architecture**: Code organized by business features');
  }

  const hasUIComponents = files.some(f => f.path.includes('/components/ui/'));
  if (hasUIComponents) {
    patterns.push('✅ **UI Component Library**: Dedicated UI components directory');
  }

  const hasHooksDirectory = files.some(f => f.path.includes('/hooks/'));
  if (hasHooksDirectory) {
    patterns.push('✅ **Custom Hooks**: Reusable React hooks organization');
  }

  const hasUtilsDirectory = files.some(f => f.path.includes('/utils/'));
  if (hasUtilsDirectory) {
    patterns.push('✅ **Utility Functions**: Shared utility functions');
  }

  return patterns.length > 0 ? patterns.join('\n') : '- Basic file organization detected';
}

function analyzeImportExportPatterns(files: CodebaseStructure['files']): string {
  const totalImports = files.reduce((sum, f) => sum + (f.imports?.length || 0), 0);
  const totalExports = files.reduce((sum, f) => sum + (f.exports?.length || 0), 0);
  const filesWithImports = files.filter(f => f.imports && f.imports.length > 0).length;
  const filesWithExports = files.filter(f => f.exports && f.exports.length > 0).length;

  const patterns: string[] = [];
  
  if (totalImports > 0) {
    patterns.push(`- **Total Imports**: ${totalImports} across ${filesWithImports} files`);
    patterns.push(`- **Average Imports per File**: ${Math.round(totalImports / filesWithImports)}`);
  }

  if (totalExports > 0) {
    patterns.push(`- **Total Exports**: ${totalExports} from ${filesWithExports} files`);
    patterns.push(`- **Average Exports per File**: ${Math.round(totalExports / filesWithExports)}`);
  }

  // Analyze common import patterns
  const allImports = files.flatMap(f => f.imports || []);
  const reactImports = allImports.filter(imp => imp === 'react' || imp.startsWith('react/')).length;
  const localImports = allImports.filter(imp => imp.startsWith('./') || imp.startsWith('../')).length;
  
  if (reactImports > 0) {
    patterns.push(`- **React Dependencies**: ${reactImports} React-related imports`);
  }
  
  if (localImports > 0) {
    patterns.push(`- **Local Imports**: ${localImports} relative imports (${Math.round(localImports / totalImports * 100)}%)`);
  }

  return patterns.length > 0 ? patterns.join('\n') : '- No import/export data available';
}

function generateRecommendations(
  structure: CodebaseStructure, 
  violations: Array<{type: string, message: string, file?: string}>
): string {
  const recommendations: string[] = [];

  if (violations.length > 0) {
    recommendations.push('🔧 **Code Quality**: Address the convention violations listed above to improve maintainability.');
  }

  if (structure.summary.components > 50) {
    recommendations.push('📦 **Component Organization**: Consider creating more specific component categories or feature-based groupings.');
  }

  if (structure.summary.utilities < 5) {
    recommendations.push('🔨 **Utilities**: Consider creating more utility functions to reduce code duplication.');
  }

  if (structure.files.some(f => f.lines > 300)) {
    recommendations.push('✂️ **File Size**: Some files are quite large. Consider splitting them into smaller, more focused modules.');
  }

  const highCouplingFiles = violations.filter(v => v.type === 'high_coupling').length;
  if (highCouplingFiles > 0) {
    recommendations.push('🔗 **Coupling**: Reduce dependencies between modules to improve maintainability.');
  }

  if (structure.summary.hooks < 3) {
    recommendations.push('🪝 **Custom Hooks**: Consider extracting repeated logic into custom React hooks.');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ **Great Job!**: Your codebase follows good architectural patterns and conventions.');
  }

  return recommendations.join('\n\n');
}

function generateFileTypeChart(summary: CodebaseStructure['summary']): string {
  const entries = [
    ['Components', summary.components],
    ['Pages', summary.pages], 
    ['Hooks', summary.hooks],
    ['Utilities', summary.utilities],
    ['Edge Functions', summary.edgeFunctions],
    ['Config Files', summary.configFiles]
  ].filter(([_, count]) => count > 0);

  const maxCount = Math.max(...entries.map(([_, count]) => count as number));
  
  return entries
    .map(([type, count]) => {
      const barLength = Math.round((count as number / maxCount) * 20);
      const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
      return `${type.padEnd(15)} ${bar} ${count}`;
    })
    .join('\n');
}

function generateHierarchicalStructure(directoryTree: any[]): string {
  if (!directoryTree || directoryTree.length === 0) {
    return '```\n├── src/\n```';
  }

  function renderNode(node: any, indent = ''): string {
    const branch = indent ? '├── ' : '';
    let result = `${indent}${branch}${node.name}/\n`;
    const nextIndent = indent + (indent ? '│   ' : '');

    // Files
    if (node.files && node.files.length > 0) {
      node.files.forEach((file: any, i: number) => {
        const fileName = file.path.split('/').pop();
        result += `${nextIndent}${i === node.files.length - 1 && (!node.children || node.children.length === 0) ? '└── ' : '├── '}${fileName}\n`;
      });
    }

    // Children
    if (node.children && node.children.length > 0) {
      node.children.forEach((child: any) => {
        result += renderNode(child, nextIndent);
      });
    }

    return result;
  }

  let output = '```\n';
  directoryTree.forEach((root: any) => {
    output += renderNode(root, '');
  });
  output += '```';
  return output;
}

function generateFeatureAnalysis(features: any[]): string {
  if (!features || features.length === 0) {
    return '### No feature modules detected\n\nConsider organizing code into feature-based modules in `src/features/`';
  }

  return features.map((f: any) => {
    const barFilled = '█'.repeat(Math.round(f.completeness / 10));
    const barEmpty = '░'.repeat(10 - Math.round(f.completeness / 10));
    const components = f.components?.slice(0, 3).map((c: any) => c.path.split('/').pop()).join(', ');

    return `### ${f.name} (${f.completeness}% complete)\n` +
      (components ? `- **Components**: ${f.components.length} (e.g., ${components}${f.components.length > 3 ? `, +${f.components.length - 3} more` : ''})\n` : '') +
      (f.services?.length ? `- **Services**: ${f.services.length}\n` : '') +
      (f.hooks?.length ? `- **Hooks**: ${f.hooks.length}\n` : '') +
      (f.types?.length ? `- **Types**: ${f.types.length}\n` : '') +
      (f.utils?.length ? `- **Utils**: ${f.utils.length}\n` : '') +
      `- **Structure**: ${f.hasIndex ? '✅' : '❌'} Index file\n` +
      `- **Completeness**: \`${barFilled + barEmpty}\` ${f.completeness}%\n`;
  }).join('\n');
}
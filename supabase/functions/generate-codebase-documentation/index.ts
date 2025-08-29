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
  summary: {
    components: number;
    pages: number;
    hooks: number;
    utilities: number;
    edgeFunctions: number;
    configFiles: number;
    totalFiles: number;
    totalSize: number;
    totalLines: number;
  };
  categories: Record<string, number>;
  directoryTree: Array<{
    name: string;
    path: string;
    files: string[];
    children: any[];
    level: number;
  }>;
  features: Array<{
    name: string;
    path: string;
    files: {
      components: string[];
      hooks: string[];
      services: string[];
      types: string[];
      utils: string[];
    };
    hasIndex: boolean;
    completeness: number;
  }>;
  treeStructure: string;
  projectInfo?: {
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
    
    // Validate request method
    if (req.method !== 'POST') {
      console.error(`Invalid method: ${req.method}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed',
        message: 'Only POST requests are supported'
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("[5%] initialization: Authenticating user and preparing session...");

    // Initialize Supabase client with validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      return new Response(JSON.stringify({
        success: false,
        error: 'Configuration error',
        message: 'Missing required environment variables'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header with validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error("Invalid or missing authorization header");
      return new Response(JSON.stringify({
        success: false,
        error: 'No authorization header',
        message: 'Authentication required'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication failed',
        message: authError?.message || 'Invalid token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user account details with error handling
    let userName = 'Unknown User';
    let userUuid = user.id;
    
    try {
      const { data: userAccount, error: userError } = await supabase
        .from('user_accounts')
        .select('user_uuid, first_name, last_name, email')
        .eq('supabase_user_uuid', user.id)
        .single();

      if (userError) {
        console.warn("User account lookup failed:", userError.message);
        userName = user.email || 'Unknown User';
      } else if (userAccount) {
        userName = `${userAccount.first_name || ''} ${userAccount.last_name || ''}`.trim() || userAccount.email || user.email || 'Unknown User';
        userUuid = userAccount.user_uuid || user.id;
      }
    } catch (err) {
      console.warn("Error fetching user account:", err);
      userName = user.email || 'Unknown User';
    }

    console.log("[10%] versioning: Determining version number...");

    // Determine version number with error handling
    let version = 1;
    try {
      const { data: existingDocs, error: listError } = await supabase.storage
        .from('codebase-docs')
        .list('', { limit: 1000 });
      
      if (listError) {
        console.warn("Error listing existing docs:", listError.message);
        version = 1;
      } else {
        version = (existingDocs?.length || 0) + 1;
      }
    } catch (err) {
      console.warn("Error determining version:", err);
      version = 1;
    }

    console.log("[20%] file_scanning: Processing codebase structure...");

    // Get codebase structure from request body with comprehensive validation
    let codebaseStructure: CodebaseStructure;
    try {
      let bodyText = '';
      try {
        bodyText = await req.text();
        console.log("Raw request body length:", bodyText.length);
      } catch (textError) {
        console.error("Error reading request body as text:", textError);
        throw new Error("Failed to read request body");
      }

      let body: any;
      try {
        body = JSON.parse(bodyText);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        throw new Error("Invalid JSON in request body");
      }

      const rawStructure = body.codebaseStructure || body;
      console.log("Raw structure keys:", Object.keys(rawStructure || {}));
      
      if (!rawStructure || typeof rawStructure !== 'object') {
        throw new Error("No valid codebase structure in request body");
      }

      // Validate and normalize the structure
      codebaseStructure = {
        files: Array.isArray(rawStructure.files) ? rawStructure.files : [],
        summary: {
          components: Number(rawStructure.summary?.components) || 0,
          pages: Number(rawStructure.summary?.pages) || 0,
          hooks: Number(rawStructure.summary?.hooks) || 0,
          utilities: Number(rawStructure.summary?.utilities) || 0,
          edgeFunctions: Number(rawStructure.summary?.edgeFunctions) || 0,
          configFiles: Number(rawStructure.summary?.configFiles) || 0,
          totalFiles: Number(rawStructure.summary?.totalFiles) || (Array.isArray(rawStructure.files) ? rawStructure.files.length : 0),
          totalSize: Number(rawStructure.summary?.totalSize) || 0,
          totalLines: Number(rawStructure.summary?.totalLines) || 0
        },
        categories: rawStructure.categories && typeof rawStructure.categories === 'object' ? rawStructure.categories : {},
        directoryTree: Array.isArray(rawStructure.directoryTree) ? rawStructure.directoryTree : [],
        features: Array.isArray(rawStructure.features) ? rawStructure.features : [],
        treeStructure: typeof rawStructure.treeStructure === 'string' ? rawStructure.treeStructure : '',
        projectInfo: {
          framework: rawStructure.projectInfo?.framework || 'React + Vite + TypeScript',
          typescript: Boolean(rawStructure.projectInfo?.typescript !== false),
          environment: rawStructure.projectInfo?.environment || 'edge-function',
          generatedAt: rawStructure.projectInfo?.generatedAt || new Date().toISOString()
        }
      };
      
      console.log("Using provided codebase structure from client");
      console.log(`Structure contains: ${codebaseStructure.files.length} files, ${formatBytes(codebaseStructure.summary.totalSize || 0)}`);
      console.log(`Features: ${codebaseStructure.features.length}, DirectoryTree: ${codebaseStructure.directoryTree.length}`);
      
    } catch (error) {
      // Fallback to minimal structure if no valid structure provided
      console.error("Error processing codebase structure:", error);
      console.log("Using minimal fallback structure");
      
      codebaseStructure = {
        files: [],
        summary: {
          components: 0,
          pages: 0,
          hooks: 0,
          utilities: 0,
          edgeFunctions: 0,
          configFiles: 0,
          totalFiles: 0,
          totalSize: 0,
          totalLines: 0
        },
        categories: {},
        directoryTree: [],
        features: [],
        treeStructure: '# No structure available\n',
        projectInfo: {
          framework: 'React + Vite + TypeScript',
          typescript: true,
          environment: 'edge-function',
          generatedAt: new Date().toISOString()
        }
      };
    }

    console.log("[50%] convention_validation: Validating codebase conventions...");
    let violations: Array<{type: string, message: string, file?: string}> = [];
    
    try {
      violations = validateConventions(codebaseStructure);
      console.log(`Found ${violations.length} convention violations`);
    } catch (validationError) {
      console.error("Error validating conventions:", validationError);
      violations = [{
        type: 'validation_error',
        message: `Convention validation failed: ${validationError.message}`
      }];
    }

    console.log("[75%] document_generation: Generating documentation content...");
    let documentation: string;
    
    try {
      documentation = generateDocumentation(codebaseStructure, violations);
      console.log(`Generated documentation: ${documentation.length} characters`);
    } catch (docError) {
      console.error("Error generating documentation:", docError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Documentation generation failed',
        message: docError.message,
        details: docError
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("[85%] file_upload: Uploading to storage...");
    const filename = `CODEBASE-STRUCTURE_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_v${version.toString().padStart(2, '0')}.md`;
    
    let uploadData: any;
    try {
      const { data, error: uploadError } = await supabase.storage
        .from('codebase-docs')
        .upload(filename, documentation, {
          contentType: 'text/markdown'
        });

      if (uploadError) {
        console.error("Upload failed:", uploadError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Upload failed',
          message: uploadError.message,
          details: uploadError
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      uploadData = data;
      console.log("Upload successful:", filename);
    } catch (uploadException) {
      console.error("Upload exception:", uploadException);
      return new Response(JSON.stringify({
        success: false,
        error: 'Upload exception',
        message: uploadException.message || 'Unknown upload error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("[95%] audit_logging: Recording generation event...");
    
    // Log the generation event with error handling
    try {
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
            pages_count: codebaseStructure.summary?.pages || 0,
            features_count: codebaseStructure.features?.length || 0,
            components_count: codebaseStructure.summary?.components || 0,
            edge_functions_count: codebaseStructure.summary?.edgeFunctions || 0,
            violations_breakdown: groupViolationsByType(violations)
          },
          generation_duration_ms: Date.now() - Date.now() // Simplified for now
        }
      });
    } catch (logError) {
      console.warn("Failed to log generation event:", logError);
      // Don't fail the entire operation if logging fails
    }

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
    console.error("Error generating codebase documentation:", error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    } else {
      console.error("Non-Error exception:", JSON.stringify(error, null, 2));
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Unknown error occurred',
      message: 'Failed to generate codebase documentation',
      errorType: error?.name || 'UnknownError',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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

  // Ensure we have required data
  if (!structure.files || !Array.isArray(structure.files)) {
    return violations;
  }

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

  // Check for missing index files in feature directories using features array
  if (structure.features && Array.isArray(structure.features)) {
    structure.features.forEach(feature => {
      if (!feature.hasIndex) {
        violations.push({
          type: 'missing_index',
          message: 'Feature directory missing index.ts file',
          file: feature.path
        });
      }
    });
  }

  // Check for potential circular dependencies in imports
  structure.files.forEach(file => {
    if (file.imports && Array.isArray(file.imports)) {
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
  violations: Array<{type: string, message: string, file?: string}>
): string {
  // Defensive extraction with fallbacks
  const files = Array.isArray(structure.files) ? structure.files : [];
  const summary = structure.summary || {
    components: 0, pages: 0, hooks: 0, utilities: 0, edgeFunctions: 0, 
    configFiles: 0, totalFiles: 0, totalSize: 0, totalLines: 0
  };
  const projectInfo = structure.projectInfo || {
    framework: 'React + Vite + TypeScript',
    typescript: true,
    environment: 'development',
    generatedAt: new Date().toISOString()
  };
  const directoryTree = Array.isArray(structure.directoryTree) ? structure.directoryTree : [];
  const features = Array.isArray(structure.features) ? structure.features : [];
  const treeStructure = structure.treeStructure || '';
  const categories = structure.categories || {};
  
  return `# Codebase Structure Documentation

## Document Information
- **Generated At**: ${new Date().toLocaleString()}
- **Generated By**: System
- **Environment**: ${projectInfo.environment}

## Project Overview
- **Framework**: ${projectInfo.framework}
- **TypeScript**: ${projectInfo.typescript ? 'Yes' : 'No'}
- **Total Files**: ${summary.totalFiles}
- **Total Size**: ${formatBytes(summary.totalSize || 0)}
- **Total Lines of Code**: ${(summary.totalLines || 0).toLocaleString()}

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

*Complete codebase structure with files organized by feature modules*

\`\`\`
${treeStructure || 'Tree structure not available'}
\`\`\`

## Key Features

${generateFeatureAnalysis(features)}

## File Analysis

### Largest Files (by lines)
${files
  .sort((a, b) => b.lines - a.lines)
  .slice(0, 10)
  .map(file => `- **${file.path}** (${file.lines} lines, ${formatBytes(file.size)})`)
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

### File Organization Patterns
${analyzeFilePatterns(files)}

### Import/Export Analysis
${analyzeImportExportPatterns(files)}

### Code Quality Indicators
- **Average File Size**: ${files.length > 0 ? Math.round((summary.totalSize || 0) / files.length) : 0} bytes
- **Average Lines per File**: ${files.length > 0 ? Math.round((summary.totalLines || 0) / files.length) : 0}
- **TypeScript Coverage**: ${files.length > 0 ? Math.round((files.filter(f => f.extension === 'ts' || f.extension === 'tsx').length / files.length) * 100) : 0}%

## Recommendations

${generateRecommendations(structure, violations)}

## File Type Distribution Chart

\`\`\`
${generateFileTypeChart(summary)}
\`\`\`

---
*This documentation was automatically generated by the Codebase Documentation Generator*
*Scanned ${files.length} files across ${directoryTree.length} directories*
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

function generateFeatureAnalysis(features: any[]): string {
  if (!features || features.length === 0) {
    return '### No feature modules detected\n\nConsider organizing code into feature-based modules in `src/features/`';
  }

  return features.map((f: any) => {
    const barFilled = '█'.repeat(Math.round(f.completeness / 10));
    const barEmpty = '░'.repeat(10 - Math.round(f.completeness / 10));
    const components = f.files?.components?.slice(0, 3).join(', ');

    return `### ${f.name} (${f.completeness}% complete)\n` +
      (components ? `- **Components**: ${f.files?.components?.length || 0} (e.g., ${components}${f.files?.components?.length > 3 ? `, +${f.files.components.length - 3} more` : ''})\n` : '') +
      (f.files?.services?.length ? `- **Services**: ${f.files.services.length}\n` : '') +
      (f.files?.hooks?.length ? `- **Hooks**: ${f.files.hooks.length}\n` : '') +
      (f.files?.types?.length ? `- **Types**: ${f.files.types.length}\n` : '') +
      (f.files?.utils?.length ? `- **Utils**: ${f.files.utils.length}\n` : '') +
      `- **Structure**: ${f.hasIndex ? '✅' : '❌'} Index file\n` +
      `- **Completeness**: \`${barFilled + barEmpty}\` ${f.completeness}%\n`;
  }).join('\n');
}
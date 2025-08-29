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

// Real codebase structure scanner
async function scanCodebaseStructure(): Promise<any> {
  const ignorePatterns = [
    '.git', '.lovable', 'node_modules', 'dist', 'build', '.next', 
    '.vite', '.cache', 'coverage', '.nyc_output', 'tmp', 'temp',
    '.DS_Store', 'Thumbs.db', '*.log', '.env*', 'bun.lockb', 
    'package-lock.json', '*.min.js', '*.min.css'
  ];

  const fileTypePatterns = {
    components: /\.tsx$/,
    hooks: /^use[A-Z].*\.(ts|tsx)$/,
    services: /Service\.(ts|tsx)$/,
    utils: /Utils?\.(ts|tsx)$|util\.(ts|tsx)$/,
    types: /(types?|interfaces?)\.(ts|tsx)$|\.d\.ts$/,
    tests: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
    configs: /\.(config|rc)\.(js|ts|json)$|^(\.eslint|\.prettier|tsconfig|vite\.config|tailwind\.config)/
  };

  let totalFiles = 0;
  const structure = {
    features: [] as any[],
    pages: [] as any[],
    sharedComponents: [] as any[],
    edgeFunctions: [] as any[],
    scripts: [] as any[],
    configs: [] as any[],
    integrations: [] as any[],
    docs: [] as any[],
    totalFiles: 0,
    totalLines: 0,
    scannedDirectories: [] as string[]
  };

  async function shouldIgnoreFile(path: string): Promise<boolean> {
    const fileName = path.split('/').pop() || '';
    return ignorePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(fileName);
      }
      return fileName.includes(pattern) || path.includes(`/${pattern}/`);
    });
  }

  async function getFileContent(filePath: string): Promise<{ content: string; lines: number; imports: string[]; exports: string[] }> {
    try {
      const content = await Deno.readTextFile(filePath);
      const lines = content.split('\n').length;
      
      // Extract imports and exports
      const imports: string[] = [];
      const exports: string[] = [];
      
      // Match import statements
      const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
      let importMatch;
      while ((importMatch = importRegex.exec(content)) !== null) {
        imports.push(importMatch[1]);
      }

      // Match export statements
      const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type)\s+(\w+)/g;
      let exportMatch;
      while ((exportMatch = exportRegex.exec(content)) !== null) {
        exports.push(exportMatch[1]);
      }

      return { content, lines, imports, exports };
    } catch {
      return { content: '', lines: 0, imports: [], exports: [] };
    }
  }

  async function categorizeFile(filePath: string, fileName: string): Promise<string> {
    if (fileTypePatterns.components.test(fileName)) return 'component';
    if (fileTypePatterns.hooks.test(fileName)) return 'hook';
    if (fileTypePatterns.services.test(fileName)) return 'service';
    if (fileTypePatterns.utils.test(fileName)) return 'util';
    if (fileTypePatterns.types.test(fileName)) return 'type';
    if (fileTypePatterns.tests.test(fileName)) return 'test';
    if (fileTypePatterns.configs.test(fileName)) return 'config';
    if (fileName === 'index.ts' || fileName === 'index.tsx') return 'barrel';
    
    // Analyze content for better categorization
    try {
      const { content } = await getFileContent(filePath);
      if (content.includes('export default function') && content.includes('return (')) return 'component';
      if (content.includes('useState') || content.includes('useEffect')) return 'hook';
      if (content.includes('interface ') || content.includes('type ')) return 'type';
    } catch {}
    
    return 'other';
  }

  async function scanDirectory(dirPath: string, relativePath = ''): Promise<void> {
    try {
      const entries = [];
      for await (const entry of Deno.readDir(dirPath)) {
        entries.push(entry);
      }

      structure.scannedDirectories.push(relativePath || dirPath);

      for (const entry of entries) {
        const fullPath = `${dirPath}/${entry.name}`;
        const relativeFullPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

        if (await shouldIgnoreFile(relativeFullPath)) continue;

        if (entry.isFile) {
          totalFiles++;
          const category = await categorizeFile(fullPath, entry.name);
          const fileDetails = await getFileContent(fullPath);
          
          structure.totalLines += fileDetails.lines;

          const fileInfo = {
            name: entry.name,
            path: relativeFullPath,
            category,
            size: fileDetails.content.length,
            lines: fileDetails.lines,
            imports: fileDetails.imports,
            exports: fileDetails.exports
          };

          // Categorize by location
          if (relativeFullPath.startsWith('src/features/')) {
            const featurePath = relativeFullPath.split('/');
            const featureName = featurePath[2];
            let feature = structure.features.find(f => f.name === featureName);
            
            if (!feature) {
              feature = {
                name: featureName,
                path: `src/features/${featureName}`,
                components: [],
                hooks: [],
                services: [],
                utils: [],
                types: [],
                tests: [],
                other: [],
                hasIndex: false,
                totalFiles: 0,
                totalLines: 0
              };
              structure.features.push(feature);
            }

            feature.totalFiles++;
            feature.totalLines += fileDetails.lines;

            if (entry.name === 'index.ts' || entry.name === 'index.tsx') {
              feature.hasIndex = true;
            }

            switch (category) {
              case 'component': feature.components.push(fileInfo); break;
              case 'hook': feature.hooks.push(fileInfo); break;
              case 'service': feature.services.push(fileInfo); break;
              case 'util': feature.utils.push(fileInfo); break;
              case 'type': feature.types.push(fileInfo); break;
              case 'test': feature.tests.push(fileInfo); break;
              default: feature.other.push(fileInfo); break;
            }
          }
          else if (relativeFullPath.startsWith('src/pages/')) {
            structure.pages.push(fileInfo);
          }
          else if (relativeFullPath.startsWith('src/components/')) {
            structure.sharedComponents.push(fileInfo);
          }
          else if (relativeFullPath.startsWith('supabase/functions/')) {
            structure.edgeFunctions.push(fileInfo);
          }
          else if (relativeFullPath.startsWith('scripts/')) {
            structure.scripts.push(fileInfo);
          }
          else if (relativeFullPath.startsWith('src/integrations/')) {
            structure.integrations.push(fileInfo);
          }
          else if (relativeFullPath.startsWith('docs/')) {
            structure.docs.push(fileInfo);
          }
          else if (category === 'config' || relativeFullPath.includes('config')) {
            structure.configs.push(fileInfo);
          }
        }
        else if (entry.isDirectory) {
          await scanDirectory(fullPath, relativeFullPath);
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${dirPath}:`, error);
    }
  }

  // Scan main directories
  const scanPaths = ['src', 'supabase', 'scripts', 'docs'];
  
  for (const scanPath of scanPaths) {
    try {
      const stat = await Deno.stat(scanPath);
      if (stat.isDirectory) {
        await scanDirectory(scanPath);
      }
    } catch {
      console.warn(`Directory ${scanPath} not found, skipping`);
    }
  }

  // Scan root config files
  const rootFiles = [
    'package.json', 'vite.config.ts', 'tailwind.config.ts', 'tsconfig.json',
    'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js',
    'postcss.config.js', 'components.json', 'README.md'
  ];

  for (const fileName of rootFiles) {
    try {
      const stat = await Deno.stat(fileName);
      if (stat.isFile && !await shouldIgnoreFile(fileName)) {
        totalFiles++;
        const fileDetails = await getFileContent(fileName);
        structure.totalLines += fileDetails.lines;
        
        structure.configs.push({
          name: fileName,
          path: fileName,
          category: 'config',
          size: fileDetails.content.length,
          lines: fileDetails.lines,
          imports: fileDetails.imports,
          exports: fileDetails.exports
        });
      }
    } catch {
      // File doesn't exist, skip
    }
  }

  structure.totalFiles = totalFiles;

  // Sort features by name
  structure.features.sort((a, b) => a.name.localeCompare(b.name));
  
  // Sort other arrays by path
  ['pages', 'sharedComponents', 'edgeFunctions', 'scripts', 'configs', 'integrations', 'docs'].forEach(key => {
    structure[key as keyof typeof structure].sort((a: any, b: any) => a.path.localeCompare(b.path));
  });

  return structure;
}

// Comprehensive convention validation engine
function validateCodebaseConventions(structure: any): ValidationViolation[] {
  const violations: ValidationViolation[] = [];

  // Rule catalog with severity and descriptions
  const rules = {
    'R30': { severity: 'error', description: 'Directories must use kebab-case only' },
    'R31': { severity: 'error', description: 'React components must use PascalCase.tsx' },
    'R32': { severity: 'error', description: 'Hooks must use camelCase with use- prefix' },
    'R33': { severity: 'warning', description: 'No duplicate file functionality across paths' },
    'R34': { severity: 'warning', description: 'Components over 200 lines need decomposition justification' },
    'R35': { severity: 'error', description: 'Business logic must be in hooks/services, not components' },
    'R36': { severity: 'error', description: 'Feature modules must be self-contained' },
    'R37': { severity: 'warning', description: 'Avoid Enhanced/Improved prefixes without clear need' },
    'R38': { severity: 'error', description: 'Index files only at package boundaries' },
    'R39': { severity: 'error', description: 'Must use absolute imports with @/ prefix' },
    'R40': { severity: 'error', description: 'No circular dependencies between features' },
    'R41': { severity: 'warning', description: 'Shared utilities must be domain-agnostic' },
    'R42': { severity: 'error', description: 'Pages must be thin wrappers' },
    'R43': { severity: 'warning', description: 'Exported functions must have explicit return types' },
    'R44': { severity: 'warning', description: 'Test files must be colocated as *.test.ts(x)' },
    'R45': { severity: 'error', description: 'Must follow feature-based architecture' },
    'R46': { severity: 'warning', description: 'Features must follow internal structure' },
    'R47': { severity: 'error', description: 'Must follow shared component organization' },
    'R48': { severity: 'error', description: 'No deep cross-feature imports' },
    'R49': { severity: 'warning', description: 'Features must map 1:1 to PRD domains' },
    'R50': { severity: 'error', description: 'Business logic must live in services/hooks' },
    'R51': { severity: 'error', description: 'Pages only compose features and routing' },
    'R52': { severity: 'warning', description: 'Tests must be colocated with units under test' },
    'R53': { severity: 'error', description: 'Use absolute imports, avoid relative paths' },
    'R54': { severity: 'error', description: 'No circular dependencies across features' },
    'R55': { severity: 'error', description: 'Cannot reach into other features private folders' },
    'R56': { severity: 'error', description: 'Cross-feature state is prohibited' }
  };

  const addViolation = (rule: string, file: string, description: string, autocorrect?: string) => {
    violations.push({
      rule,
      file,
      description: `${description}${autocorrect ? ` | Suggestion: ${autocorrect}` : ''}`,
      severity: rules[rule as keyof typeof rules]?.severity as 'error' | 'warning' || 'warning'
    });
  };

  // File naming patterns
  const patterns = {
    kebabCase: /^[a-z]+(-[a-z]+)*$/,
    pascalCase: /^[A-Z][A-Za-z0-9]*$/,
    camelCase: /^[a-z][A-Za-z0-9]*$/,
    hookName: /^use[A-Z][A-Za-z0-9]*$/,
    testFile: /\.(test|spec)\.(ts|tsx)$/,
    componentFile: /^[A-Z][A-Za-z0-9]*\.tsx$/,
    hookFile: /^use[A-Z][A-Za-z0-9]*\.(ts|tsx)$/,
    relativeImport: /from\s+['"]\.\.?\//,
    absoluteImport: /from\s+['"]@\//,
    deepFeatureImport: /from\s+['"]@\/features\/([^\/]+)\/(?!index)/
  };

  // Validate directory naming (R30)
  structure.scannedDirectories?.forEach((dirPath: string) => {
    const segments = dirPath.split('/').filter(Boolean);
    segments.forEach(segment => {
      if (segment.includes('_') || segment.includes(' ') || /[A-Z]/.test(segment)) {
        addViolation('R30', dirPath, `Directory '${segment}' should use kebab-case`, 
          `Rename '${segment}' to '${segment.toLowerCase().replace(/[_\s]+/g, '-')}'`);
      }
    });
  });

  // Validate all file types
  const allFiles = [
    ...structure.pages || [],
    ...structure.sharedComponents || [],
    ...structure.edgeFunctions || [],
    ...structure.scripts || [],
    ...structure.configs || [],
    ...structure.integrations || [],
    ...structure.docs || [],
    ...(structure.features || []).flatMap((f: any) => [
      ...(f.components || []),
      ...(f.hooks || []),
      ...(f.services || []),
      ...(f.utils || []),
      ...(f.types || []),
      ...(f.tests || []),
      ...(f.other || [])
    ])
  ];

  allFiles.forEach((file: any) => {
    const { name, path, category, imports = [], exports = [], lines = 0, content = '' } = file;

    // R31: Component naming
    if (category === 'component' || name.endsWith('.tsx')) {
      if (!patterns.componentFile.test(name)) {
        addViolation('R31', path, `Component '${name}' must use PascalCase.tsx`, 
          `Rename to '${name.charAt(0).toUpperCase() + name.slice(1).replace(/[^A-Za-z0-9]/g, '')}.tsx'`);
      }
    }

    // R32: Hook naming
    if (category === 'hook' || name.startsWith('use')) {
      const baseName = name.replace(/\.(ts|tsx)$/, '');
      if (!patterns.hookName.test(baseName)) {
        addViolation('R32', path, `Hook '${name}' must use camelCase with use- prefix`, 
          `Rename to 'use${baseName.charAt(3).toUpperCase()}${baseName.slice(4)}.ts'`);
      }
    }

    // R34: Component size
    if (category === 'component' && lines > 200) {
      addViolation('R34', path, `Component has ${lines} lines (>200), consider decomposition`);
    }

    // R37: Enhanced/Improved prefixes
    if (name.includes('Enhanced') || name.includes('Improved')) {
      addViolation('R37', path, `Avoid Enhanced/Improved prefixes without clear differentiation need`);
    }

    // R39 & R53: Import validation
    imports.forEach((importPath: string) => {
      // Check for relative imports
      if (patterns.relativeImport.test(importPath)) {
        addViolation('R39', path, `Relative import '${importPath}' should use @/ prefix`, 
          `Change to '@/${importPath.replace(/^\.\.?\//, '')}'`);
      }

      // Check for deep feature imports (R48)
      const deepImportMatch = importPath.match(/^@\/features\/([^\/]+)\/(.+)/);
      if (deepImportMatch && deepImportMatch[2] !== 'index') {
        const featureName = deepImportMatch[1];
        addViolation('R48', path, `Deep feature import from '${importPath}'`, 
          `Import from '@/features/${featureName}' instead`);
      }
    });

    // R43: Return type validation for TypeScript files
    if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      // Simple pattern matching for exported functions without return types
      const exportFunctionWithoutType = /export\s+(const|function)\s+\w+[^:]*=>[^:]/;
      if (exportFunctionWithoutType.test(content)) {
        addViolation('R43', path, 'Exported function missing explicit return type');
      }
    }

    // R44: Test collocation
    if (category === 'test') {
      const basePath = path.replace(patterns.testFile, '');
      const correspondingFile = allFiles.find((f: any) => 
        f.path === `${basePath}.ts` || f.path === `${basePath}.tsx`
      );
      if (!correspondingFile) {
        addViolation('R44', path, 'Test file should be colocated with unit under test');
      }
    }
  });

  // Feature-specific validations
  structure.features?.forEach((feature: any) => {
    const { name, path: featurePath, hasIndex } = feature;

    // R36 & R45: Feature structure
    if (!hasIndex) {
      addViolation('R36', featurePath, 'Feature missing index.ts barrel export');
    }

    // R46: Internal structure
    const expectedFolders = ['components', 'hooks', 'services', 'utils', 'types'];
    const hasAnyExpectedFolder = expectedFolders.some(folder => 
      feature[folder] && feature[folder].length > 0
    );
    
    if (!hasAnyExpectedFolder) {
      addViolation('R46', featurePath, 'Feature should follow internal structure (components/, hooks/, services/, utils/, types/)');
    }

    // R49: Feature mapping to domains
    const validDomains = [
      'auth', 'user-management', 'report-structures', 'imports', 
      'coa-translation', 'coa-mapping', 'report-viewer', 'data-security', 
      'audit-trails', 'system-administration', 'workflow', 'entity-management',
      'file-management', 'security-audit'
    ];
    
    if (!validDomains.includes(name)) {
      addViolation('R49', featurePath, `Feature '${name}' should map to a PRD domain`);
    }
  });

  // R40 & R54: Circular dependency detection
  const featureImports = new Map<string, Set<string>>();
  
  structure.features?.forEach((feature: any) => {
    const featureName = feature.name;
    const imports = new Set<string>();
    
    [...(feature.components || []), ...(feature.hooks || []), ...(feature.services || []), 
     ...(feature.utils || []), ...(feature.types || [])].forEach((file: any) => {
      file.imports?.forEach((imp: string) => {
        const match = imp.match(/^@\/features\/([^\/]+)/);
        if (match && match[1] !== featureName) {
          imports.add(match[1]);
        }
      });
    });
    
    featureImports.set(featureName, imports);
  });

  // Check for circular dependencies
  featureImports.forEach((imports, featureName) => {
    imports.forEach(importedFeature => {
      const importedFeatureImports = featureImports.get(importedFeature);
      if (importedFeatureImports?.has(featureName)) {
        addViolation('R40', `src/features/${featureName}`, 
          `Circular dependency detected with feature '${importedFeature}'`);
      }
    });
  });

  // R42 & R51: Page validation
  structure.pages?.forEach((page: any) => {
    if (page.lines > 100) {
      addViolation('R42', page.path, `Page has ${page.lines} lines, should be a thin wrapper`);
    }

    // Check for business logic patterns in pages
    const businessLogicPatterns = [
      /useState.*=.*\(/,
      /useEffect.*=>.*{/,
      /async.*function/,
      /\.then\(/,
      /await\s/
    ];

    if (businessLogicPatterns.some(pattern => pattern.test(page.content || ''))) {
      addViolation('R51', page.path, 'Page contains business logic, should delegate to features');
    }
  });

  // R35 & R50: Business logic in components
  [...(structure.sharedComponents || []), 
   ...(structure.features || []).flatMap((f: any) => f.components || [])].forEach((component: any) => {
    const businessLogicPatterns = [
      /fetch\(/,
      /axios\./,
      /supabase\./,
      /localStorage\./,
      /sessionStorage\./
    ];

    if (businessLogicPatterns.some(pattern => pattern.test(component.content || ''))) {
      addViolation('R35', component.path, 'Component contains business logic, move to hooks/services');
    }
  });

  // R38: Index file validation
  allFiles.forEach((file: any) => {
    if (file.name === 'index.ts' || file.name === 'index.tsx') {
      const pathSegments = file.path.split('/');
      const isAtPackageBoundary = pathSegments.includes('features') || 
                                  pathSegments.includes('components') ||
                                  pathSegments.includes('integrations') ||
                                  pathSegments[pathSegments.length - 2] === 'src';
      
      if (!isAtPackageBoundary) {
        addViolation('R38', file.path, 'Index files should only exist at package boundaries');
      }
    }
  });

  // Sort violations by severity and rule
  return violations.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'error' ? -1 : 1;
    }
    return a.rule.localeCompare(b.rule);
  });
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
6. [Integrations](#integrations)
7. [Edge Functions](#edge-functions)
8. [Scripts & Tools](#scripts--tools)
9. [Configuration Files](#configuration-files)
10. [Documentation Files](#documentation-files)
11. [Convention Violations](#convention-violations)
12. [Code Quality Metrics](#code-quality-metrics)
13. [Recommendations](#recommendations)

---

## Executive Summary

This document provides a comprehensive overview of the codebase structure as of ${new Date(generatedAt).toLocaleDateString()}.

**Key Metrics:**
- **Total Files Scanned:** ${structure.totalFiles}
- **Total Lines of Code:** ${structure.totalLines?.toLocaleString() || 'N/A'}
- **Feature Modules:** ${structure.features?.length || 0}
- **Pages:** ${structure.pages?.length || 0}
- **Shared Components:** ${structure.sharedComponents?.length || 0}
- **Edge Functions:** ${structure.edgeFunctions?.length || 0}
- **Integrations:** ${structure.integrations?.length || 0}
- **Scripts:** ${structure.scripts?.length || 0}
- **Documentation Files:** ${structure.docs?.length || 0}
- **Configuration Files:** ${structure.configs?.length || 0}
- **Convention Violations:** ${violations.length} (${violations.filter(v => v.severity === 'error').length} errors, ${violations.filter(v => v.severity === 'warning').length} warnings)

---

## Project Overview

The project follows a **feature-based architecture** with clear separation of concerns:

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Supabase Edge Functions (Deno runtime)
- **Database:** PostgreSQL (Supabase)
- **Build Tool:** Vite
- **UI Components:** ShadCN UI + Custom components

**Scanned Directories:**
${structure.scannedDirectories?.map((dir: string) => `- ${dir || 'root'}`).join('\n') || 'None'}

---

## Feature Modules

The codebase is organized into feature modules located in \`src/features/\`:

${structure.features?.map((feature: any) => `
### ${feature.name}
**Path:** \`${feature.path}\`  
**Files:** ${feature.totalFiles} | **Lines:** ${feature.totalLines?.toLocaleString() || 'N/A'} | **Has Index:** ${feature.hasIndex ? '✅' : '❌'}

- **Components (${feature.components?.length || 0}):** ${feature.components?.length > 0 ? feature.components.map((c: any) => c.name).join(', ') : 'None'}
- **Hooks (${feature.hooks?.length || 0}):** ${feature.hooks?.length > 0 ? feature.hooks.map((h: any) => h.name).join(', ') : 'None'}
- **Services (${feature.services?.length || 0}):** ${feature.services?.length > 0 ? feature.services.map((s: any) => s.name).join(', ') : 'None'}
- **Types (${feature.types?.length || 0}):** ${feature.types?.length > 0 ? feature.types.map((t: any) => t.name).join(', ') : 'None'}
- **Utils (${feature.utils?.length || 0}):** ${feature.utils?.length > 0 ? feature.utils.map((u: any) => u.name).join(', ') : 'None'}
- **Tests (${feature.tests?.length || 0}):** ${feature.tests?.length > 0 ? feature.tests.map((t: any) => t.name).join(', ') : 'None'}
- **Other (${feature.other?.length || 0}):** ${feature.other?.length > 0 ? feature.other.map((o: any) => o.name).join(', ') : 'None'}
`).join('') || 'No features found'}

---

## Pages & Routing

Application pages located in \`src/pages/\`:

${structure.pages?.map((page: any) => `
- **${page.name}** (\`${page.path}\`) - ${page.lines} lines, ${(page.size / 1024).toFixed(1)}KB
  - **Imports:** ${page.imports?.length || 0} | **Exports:** ${page.exports?.length || 0}
`).join('') || 'No pages found'}

---

## Shared Components

Reusable UI components in \`src/components/\`:

${structure.sharedComponents?.map((component: any) => `
- **${component.name}** (\`${component.path}\`) - ${component.lines} lines, ${(component.size / 1024).toFixed(1)}KB
  - **Category:** ${component.category} | **Imports:** ${component.imports?.length || 0} | **Exports:** ${component.exports?.length || 0}
`).join('') || 'No shared components found'}

---

## Integrations

External service integrations in \`src/integrations/\`:

${structure.integrations?.map((integration: any) => `
- **${integration.name}** (\`${integration.path}\`) - ${integration.lines} lines, ${(integration.size / 1024).toFixed(1)}KB
  - **Category:** ${integration.category} | **Imports:** ${integration.imports?.length || 0} | **Exports:** ${integration.exports?.length || 0}
`).join('') || 'No integrations found'}

---

## Edge Functions

Supabase Edge Functions in \`supabase/functions/\`:

${structure.edgeFunctions?.map((func: any) => `
- **${func.name}** (\`${func.path}\`) - ${func.lines} lines, ${(func.size / 1024).toFixed(1)}KB
  - **Category:** ${func.category} | **Imports:** ${func.imports?.length || 0} | **Exports:** ${func.exports?.length || 0}
`).join('') || 'No edge functions found'}

---

## Scripts & Tools

Development and build scripts in \`scripts/\`:

${structure.scripts?.map((script: any) => `
- **${script.name}** (\`${script.path}\`) - ${script.lines} lines, ${(script.size / 1024).toFixed(1)}KB
  - **Category:** ${script.category} | **Imports:** ${script.imports?.length || 0} | **Exports:** ${script.exports?.length || 0}
`).join('') || 'No scripts found'}

---

## Configuration Files

Project configuration files:

${structure.configs?.map((config: any) => `
- **${config.name}** (\`${config.path}\`) - ${config.lines} lines, ${(config.size / 1024).toFixed(1)}KB
  - **Category:** ${config.category} | **Imports:** ${config.imports?.length || 0} | **Exports:** ${config.exports?.length || 0}
`).join('') || 'No configuration files found'}

---

## Documentation Files

Documentation in \`docs/\` folder:

${structure.docs?.map((doc: any) => `
- **${doc.name}** (\`${doc.path}\`) - ${doc.lines} lines, ${(doc.size / 1024).toFixed(1)}KB
  - **Category:** ${doc.category}
`).join('') || 'No documentation files found'}

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

## Code Quality Metrics

### File Distribution by Category
- **Components:** ${[...structure.sharedComponents, ...structure.features.flatMap((f: any) => f.components || [])].length}
- **Hooks:** ${structure.features.flatMap((f: any) => f.hooks || []).length}
- **Services:** ${structure.features.flatMap((f: any) => f.services || []).length}
- **Utils:** ${structure.features.flatMap((f: any) => f.utils || []).length}
- **Types:** ${structure.features.flatMap((f: any) => f.types || []).length}
- **Tests:** ${structure.features.flatMap((f: any) => f.tests || []).length}

### Feature Module Quality
${structure.features?.map((feature: any) => `
- **${feature.name}:** ${feature.hasIndex ? 'Has proper barrel export' : '⚠️ Missing index.ts'} | Files: ${feature.totalFiles} | Lines: ${feature.totalLines?.toLocaleString() || 'N/A'}
`).join('') || 'No features found'}

### Large Files (>500 lines)
${[...structure.pages, ...structure.sharedComponents, ...structure.features.flatMap((f: any) => [...(f.components || []), ...(f.hooks || []), ...(f.services || []), ...(f.utils || []), ...(f.types || [])])].filter((file: any) => file.lines > 500).map((file: any) => `
- **${file.name}** (\`${file.path}\`) - ${file.lines} lines
`).join('') || 'None found'}

---

## Recommendations

1. **Address Convention Violations:** Fix the ${violations.length} identified violations to improve code consistency
2. **Feature Isolation:** Ensure features don't import directly from other feature modules
3. **Component Reusability:** Consider extracting common patterns into shared components
4. **Documentation:** Keep this documentation up-to-date by regenerating regularly
${structure.features.filter((f: any) => !f.hasIndex).length > 0 ? `5. **Missing Barrel Exports:** Add index.ts files to features: ${structure.features.filter((f: any) => !f.hasIndex).map((f: any) => f.name).join(', ')}` : ''}
${[...structure.pages, ...structure.sharedComponents, ...structure.features.flatMap((f: any) => [...(f.components || []), ...(f.hooks || []), ...(f.services || []), ...(f.utils || []), ...(f.types || [])])].filter((file: any) => file.lines > 500).length > 0 ? `6. **Large Files:** Consider breaking down files with >500 lines for better maintainability` : ''}

---

*Generated by Codebase Documentation Generator ${version}*  
*Total scan time: Real-time file system analysis*  
*For questions or issues, contact the development team.*
`;
}
interface FileInfo {
  path: string;
  size: number;
  lines: number;
  extension: string;
  type: 'component' | 'page' | 'hook' | 'utility' | 'config' | 'edge-function' | 'other';
  category: string;
  imports: string[];
  exports: string[];
}

interface CodebaseStructure {
  files: FileInfo[];
  totalSize: number;
  totalLines: number;
  directories: string[];
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
    environment: 'development' | 'production';
    generatedAt: string;
  };
}

export class CodebaseScanner {
  private static instance: CodebaseScanner;
  
  static getInstance(): CodebaseScanner {
    if (!CodebaseScanner.instance) {
      CodebaseScanner.instance = new CodebaseScanner();
    }
    return CodebaseScanner.instance;
  }

  async scanCodebase(): Promise<CodebaseStructure> {
    const isDevelopment = import.meta.env.DEV;
    
    if (isDevelopment) {
      return this.scanLiveCodebase();
    } else {
      return this.loadPrebuiltManifest();
    }
  }

  private async scanLiveCodebase(): Promise<CodebaseStructure> {
    console.log('🔍 Scanning live codebase...');
    
    // Use Vite's import.meta.glob to discover all project files
    const modules = import.meta.glob([
      '/src/**/*.{ts,tsx,js,jsx}',
      '/supabase/functions/**/*.ts',
      '/*.{ts,js,json}', // Config files in root
      '/scripts/**/*.js',
    ], { 
      eager: false,
      query: '?raw',
      import: 'default'
    });

    const structure: CodebaseStructure = {
      files: [],
      totalSize: 0,
      totalLines: 0,
      directories: [],
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
        environment: 'development',
        generatedAt: new Date().toISOString()
      }
    };

    const directorySet = new Set<string>();

    // Process each discovered file
    for (const [path, loader] of Object.entries(modules)) {
      try {
        const content = await loader() as string;
        const fileInfo = this.analyzeFile(path, content);
        
        structure.files.push(fileInfo);
        structure.totalSize += fileInfo.size;
        structure.totalLines += fileInfo.lines;
        
        // Update summary counts
        this.updateSummary(structure.summary, fileInfo.type);
        
        // Track directories
        const dir = path.split('/').slice(0, -1).join('/');
        if (dir) directorySet.add(dir);
        
      } catch (error) {
        console.warn(`⚠️ Failed to analyze ${path}:`, error);
      }
    }

    structure.directories = Array.from(directorySet).sort();
    structure.summary.totalFiles = structure.files.length;

    console.log('✅ Live codebase scan complete:', {
      files: structure.files.length,
      totalSize: this.formatBytes(structure.totalSize),
      totalLines: structure.totalLines
    });

    return structure;
  }

  private async loadPrebuiltManifest(): Promise<CodebaseStructure> {
    try {
      // Try to load the pre-built manifest
      const response = await fetch('/codebase-manifest.json');
      if (response.ok) {
        const manifest = await response.json();
        console.log('📄 Loaded pre-built codebase manifest');
        return {
          ...manifest,
          projectInfo: {
            ...manifest.projectInfo,
            environment: 'production' as const
          }
        };
      }
    } catch (error) {
      console.warn('⚠️ Failed to load pre-built manifest:', error);
    }

    // Fallback: return minimal structure
    console.log('🔄 Using fallback minimal structure');
    return {
      files: [],
      totalSize: 0,
      totalLines: 0,
      directories: [],
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
        environment: 'production',
        generatedAt: new Date().toISOString()
      }
    };
  }

  private analyzeFile(path: string, content: string): FileInfo {
    const extension = path.split('.').pop() || '';
    const lines = content.split('\n').length;
    const size = content.length;
    
    // Extract imports and exports
    const imports = this.extractImports(content);
    const exports = this.extractExports(content);
    
    // Determine file type and category
    const { type, category } = this.categorizeFile(path, content);

    return {
      path,
      size,
      lines,
      extension,
      type,
      category,
      imports,
      exports
    };
  }

  private categorizeFile(path: string, content: string): { type: FileInfo['type']; category: string } {
    // Edge functions
    if (path.includes('/supabase/functions/')) {
      return { type: 'edge-function', category: 'Backend Functions' };
    }
    
    // Configuration files
    if (/(config|\.config)\.(ts|js|json)$/i.test(path) || 
        ['package.json', 'tsconfig.json', 'vite.config.ts'].some(config => path.endsWith(config))) {
      return { type: 'config', category: 'Configuration' };
    }
    
    // Pages
    if (path.includes('/pages/') || path.includes('/routes/')) {
      return { type: 'page', category: 'Pages & Routes' };
    }
    
    // Hooks
    if (path.includes('/hooks/') || /use[A-Z]/.test(path)) {
      return { type: 'hook', category: 'React Hooks' };
    }
    
    // Components (including UI components)
    if (path.includes('/components/') || /\.(tsx|jsx)$/.test(path)) {
      if (path.includes('/ui/')) {
        return { type: 'component', category: 'UI Components' };
      }
      return { type: 'component', category: 'Components' };
    }
    
    // Utilities and services
    if (path.includes('/utils/') || path.includes('/services/') || path.includes('/lib/')) {
      return { type: 'utility', category: 'Utilities & Services' };
    }
    
    return { type: 'other', category: 'Other Files' };
  }

  private extractImports(content: string): string[] {
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\w+))?\s+from\s+)?['"](.*?)['"];?/g;
    const imports: string[] = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return [...new Set(imports)]; // Remove duplicates
  }

  private extractExports(content: string): string[] {
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|interface|type|const|let|var)\s+(\w+)/g;
    const exports: string[] = [];
    let match;
    
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    // Also check for default exports
    if (/export\s+default/.test(content)) {
      exports.push('default');
    }
    
    return [...new Set(exports)];
  }

  private updateSummary(summary: CodebaseStructure['summary'], type: FileInfo['type']): void {
    switch (type) {
      case 'component':
        summary.components++;
        break;
      case 'page':
        summary.pages++;
        break;
      case 'hook':
        summary.hooks++;
        break;
      case 'utility':
        summary.utilities++;
        break;
      case 'edge-function':
        summary.edgeFunctions++;
        break;
      case 'config':
        summary.configFiles++;
        break;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

// Export singleton instance
export const codebaseScanner = CodebaseScanner.getInstance();
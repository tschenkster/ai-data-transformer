export interface FeatureModule {
  name: string;
  path: string;
  components: FileInfo[];
  hooks: FileInfo[];
  services: FileInfo[];
  types: FileInfo[];
  utils: FileInfo[];
  hasIndex: boolean;
  completeness: number; // 0-100 score
}

export interface DirectoryNode {
  name: string;
  path: string;
  files: FileInfo[];
  children: DirectoryNode[];
  level: number;
}

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
  summary: {
    totalFiles: number;
    totalSize: number;
    totalLines: number;
    components: number;
    pages: number;
    hooks: number;
    utilities: number;
    edgeFunctions: number;
    configFiles: number;
    framework: string;
    typescript: boolean;
  };
  files: FileInfo[];
  categories: { [key: string]: number };
  directoryTree: DirectoryNode[];
  features: FeatureModule[];
  treeStructure: string;
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
      // Try to load prebuilt manifest first
      const manifestStructure = await this.loadPrebuiltManifest();
      
      // If manifest is empty (no files found), fall back to live scanning
      if (manifestStructure.files.length === 0) {
        console.log('📄 Manifest empty, falling back to live scanning...');
        return this.scanLiveCodebase();
      }
      
      return manifestStructure;
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

    const summary = {
      totalFiles: 0,
      totalSize: 0,
      totalLines: 0,
      components: 0,
      pages: 0,
      hooks: 0,
      utilities: 0,
      edgeFunctions: 0,
      configFiles: 0,
      framework: 'React + Vite + TypeScript',
      typescript: true
    };

    const files: FileInfo[] = [];
    const categories: { [key: string]: number } = {};

    // Process each discovered file
    for (const [path, loader] of Object.entries(modules)) {
      try {
        const content = await loader() as string;
        const fileInfo = this.analyzeFile(path, content);
        
        files.push(fileInfo);
        summary.totalSize += fileInfo.size;
        summary.totalLines += fileInfo.lines;
        
        // Update summary counts
        this.updateSummary(summary, fileInfo.type);
        
        // Update categories
        categories[fileInfo.category] = (categories[fileInfo.category] || 0) + 1;
        
      } catch (error) {
        console.warn(`⚠️ Failed to analyze ${path}:`, error);
      }
    }

    summary.totalFiles = files.length;

    // Generate hierarchical directory structure and tree
    const directoryTree = this.generateDirectoryTree(files);
    const features = this.analyzeFeatureModules(files);
    const treeStructure = this.generateCodebaseTree(files);

    return {
      summary,
      files,
      categories,
      directoryTree,
      features,
      treeStructure
    };
  }

  private async loadPrebuiltManifest(): Promise<CodebaseStructure> {
    try {
      // Try to load the pre-built manifest
      const response = await fetch('/codebase-manifest.json');
      if (response.ok) {
        const manifest = await response.json();
        console.log('📄 Loaded pre-built codebase manifest');
        return manifest;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load pre-built manifest:', error);
    }

    // Fallback: return minimal structure
    console.log('🔄 Using fallback minimal structure');
    return {
      summary: {
        totalFiles: 0,
        totalSize: 0,
        totalLines: 0,
        components: 0,
        pages: 0,
        hooks: 0,
        utilities: 0,
        edgeFunctions: 0,
        configFiles: 0,
        framework: 'React + Vite + TypeScript',
        typescript: true
      },
      files: [],
      categories: {},
      directoryTree: [],
      features: [],
      treeStructure: ''
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

  private generateDirectoryTree(files: FileInfo[]): DirectoryNode[] {
    const rootNodes: DirectoryNode[] = [];
    const nodeMap = new Map<string, DirectoryNode>();
    
    // Create all directory nodes
    const allDirs = new Set<string>();
    files.forEach(file => {
      const parts = file.path.split('/').filter(p => p);
      for (let i = 1; i <= parts.length; i++) {
        const dirPath = '/' + parts.slice(0, i - 1).join('/');
        if (dirPath !== '/') allDirs.add(dirPath);
      }
    });
    
    // Sort directories by depth and create nodes
    const sortedDirs = Array.from(allDirs).sort((a, b) => {
      const depthA = a.split('/').length;
      const depthB = b.split('/').length;
      return depthA - depthB;
    });
    
    sortedDirs.forEach(dirPath => {
      const parts = dirPath.split('/').filter(p => p);
      const name = parts[parts.length - 1] || 'root';
      const level = parts.length;
      
      const node: DirectoryNode = {
        name,
        path: dirPath,
        files: files.filter(f => f.path.startsWith(dirPath + '/') && 
          f.path.substring(dirPath.length + 1).indexOf('/') === -1),
        children: [],
        level
      };
      
      nodeMap.set(dirPath, node);
      
      // Find parent and add as child
      if (parts.length > 1) {
        const parentPath = '/' + parts.slice(0, -1).join('/');
        const parent = nodeMap.get(parentPath);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });
    
    return rootNodes.sort((a, b) => a.name.localeCompare(b.name));
  }

  private generateCodebaseTree(files: FileInfo[]): string {
    // Exclude common build/dependency directories
    const excludedDirs = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage'];
    const filteredFiles = files.filter(file => {
      return !excludedDirs.some(excluded => file.path.includes(`/${excluded}/`));
    });

    // Build directory structure
    const structure: { [key: string]: any } = {};
    
    filteredFiles.forEach(file => {
      const parts = file.path.split('/').filter(p => p);
      let current = structure;
      
      // Build nested structure
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // This is a file
          if (!current._files) current._files = [];
          current._files.push({
            name: part,
            path: file.path,
            type: file.type,
            description: this.getFileDescription(file.path, file.type)
          });
        } else {
          // This is a directory
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
      });
    });

    // Generate tree string
    let treeOutput = '';
    
    const generateTreeRecursive = (obj: any, prefix: string = '', isLast: boolean = true, depth: number = 0): void => {
      const entries = Object.entries(obj);
      const directories = entries.filter(([key]) => key !== '_files');
      const files = obj._files || [];
      
      // Sort directories and files alphabetically
      directories.sort(([a], [b]) => a.localeCompare(b));
      files.sort((a: any, b: any) => a.name.localeCompare(b.name));
      
      // Render directories first
      directories.forEach(([dirName, dirContent], index) => {
        const isLastDir = index === directories.length - 1 && files.length === 0;
        const connector = isLastDir ? '└─' : '├─';
        const nextPrefix = prefix + (isLastDir ? '    ' : '│   ');
        
        const description = this.getDirectoryDescription(dirName);
        const displayName = `${dirName}/` + (description ? `                    ${description}` : '');
        
        treeOutput += `${prefix}${connector} ${displayName}\n`;
        generateTreeRecursive(dirContent, nextPrefix, isLastDir, depth + 1);
      });
      
      // Then render files
      files.forEach((file: any, index: number) => {
        const isLastFile = index === files.length - 1;
        const connector = isLastFile ? '└─' : '├─';
        
        const description = file.description ? ` ${file.description}` : '';
        treeOutput += `${prefix}${connector} ${file.name}${description}\n`;
      });
    };

    // Start with root level
    const rootEntries = Object.entries(structure);
    const rootDirs = rootEntries.filter(([key]) => key !== '_files');
    const rootFiles = structure._files || [];
    
    // Sort root level
    rootDirs.sort(([a], [b]) => a.localeCompare(b));
    rootFiles.sort((a: any, b: any) => a.name.localeCompare(b.name));
    
    // Generate root directories
    rootDirs.forEach(([dirName, dirContent], index) => {
      const isLast = index === rootDirs.length - 1 && rootFiles.length === 0;
      const connector = isLast ? '└─' : '├─';
      const nextPrefix = isLast ? '    ' : '│   ';
      
      const description = this.getDirectoryDescription(dirName);
      const displayName = `${dirName}/` + (description ? `                      ${description}` : '');
      
      treeOutput += `${connector} ${displayName}\n`;
      generateTreeRecursive(dirContent, nextPrefix, isLast, 1);
    });
    
    // Generate root files
    rootFiles.forEach((file: any, index: number) => {
      const isLast = index === rootFiles.length - 1;
      const connector = isLast ? '└─' : '├─';
      
      const description = file.description ? ` ${file.description}` : '';
      treeOutput += `${connector} ${file.name}${description}\n`;
    });

    return treeOutput;
  }

  private getDirectoryDescription(dirName: string): string {
    const descriptions: { [key: string]: string } = {
      'src': '# Source code',
      'features': '# Feature modules (business logic)',
      'auth': '# Authentication & Security',
      'components': '# Components',
      'services': '# Business logic',
      'utils': '# Utilities',
      'hooks': '# React hooks',
      'types': '# Type definitions',
      'constants': '# Constants',
      'user-management': '# User Administration',
      'report-structures': '# Report Building & Management',
      'coa-translation': '# Chart of Accounts Translation',
      'data-security': '# Security & Access Control',
      'imports': '# Data Import Pipeline',
      'shared-pipeline': '# Reusable import infrastructure',
      'report-viewer': '# Report Visualization',
      'system-administration': '# System Admin Functions',
      'entity-management': '# Multi-entity Management',
      'file-management': '# File Handling',
      'workflow': '# Workflow Management',
      'audit-trails': '# Audit & Change Tracking',
      'security-audit': '# Security Monitoring',
      'ui': '# Design system components (shadcn/ui)',
      'pages': '# Route components',
      'shared': '# Shared utilities',
      'integrations': '# External service integrations',
      'supabase': '# Supabase integration',
      'lib': '# Library utilities',
      'app': '# App routing',
      'routes': '# Route definitions',
      'functions': '# Edge Functions',
      'scripts': '# Build & development scripts',
      'public': '# Static assets'
    };
    
    return descriptions[dirName] || '';
  }

  private getFileDescription(filePath: string, fileType: string): string {
    const fileName = filePath.split('/').pop() || '';
    
    // Special file descriptions
    const specialFiles: { [key: string]: string } = {
      'AppSidebar.tsx': '# Main navigation sidebar',
      'ErrorBoundary.tsx': '# Error handling wrapper',
      'Footer.tsx': '# Application footer',
      'LanguageSelector.tsx': '# Language selection component',
      'use-auth.tsx': '# Authentication state',
      'use-mobile.tsx': '# Mobile detection',
      'use-sidebar-state.tsx': '# Sidebar state management',
      'use-toast.ts': '# Toast notifications',
      'client.ts': '# Supabase client configuration',
      'types.ts': '# Generated database types',
      'utils.ts': '# Common utilities (cn, slugify)',
      'app-routes.tsx': '# Route definitions',
      'index.css': '# Global styles & design tokens',
      'main.tsx': '# App entry point',
      'App.tsx': '# Root component',
      'config.toml': '# Supabase configuration',
      'tailwind.config.ts': '# Tailwind CSS configuration',
      'vite.config.ts': '# Vite build configuration',
      'package.json': '# Dependencies & scripts',
      'tsconfig.json': '# TypeScript configuration',
      'eslint.config.js': '# ESLint rules'
    };
    
    return specialFiles[fileName] || '';
  }

  private analyzeFeatureModules(files: FileInfo[]): FeatureModule[] {
    const featureFiles = files.filter(f => f.path.includes('/src/features/'));
    const featureMap = new Map<string, FileInfo[]>();
    
    // Group files by feature
    featureFiles.forEach(file => {
      const match = file.path.match(/\/src\/features\/([^/]+)/);
      if (match) {
        const featureName = match[1];
        if (!featureMap.has(featureName)) {
          featureMap.set(featureName, []);
        }
        featureMap.get(featureName)!.push(file);
      }
    });
    
    // Analyze each feature
    return Array.from(featureMap.entries()).map(([name, files]) => {
      const featurePath = `/src/features/${name}`;
      const components = files.filter(f => f.path.includes('/components/'));
      const hooks = files.filter(f => f.path.includes('/hooks/') || f.path.includes('use-'));
      const services = files.filter(f => f.path.includes('/services/'));
      const types = files.filter(f => f.path.includes('/types/'));
      const utils = files.filter(f => f.path.includes('/utils/'));
      const hasIndex = files.some(f => f.path.endsWith('/index.ts') || f.path.endsWith('/index.tsx'));
      
      // Calculate completeness score
      let completeness = 0;
      if (components.length > 0) completeness += 30;
      if (hasIndex) completeness += 20;
      if (services.length > 0) completeness += 20;
      if (hooks.length > 0) completeness += 15;
      if (types.length > 0) completeness += 10;
      if (utils.length > 0) completeness += 5;
      
      return {
        name,
        path: featurePath,
        components,
        hooks,
        services,
        types,
        utils,
        hasIndex,
        completeness
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
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
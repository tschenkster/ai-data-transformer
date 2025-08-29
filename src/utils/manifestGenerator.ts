/**
 * Build-Time Manifest Generator
 * 
 * This utility generates a static manifest of the project structure
 * during build time for production deployments.
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { glob } from 'glob';
import { readFile } from 'fs/promises';
import { join } from 'path';

interface ManifestFile {
  path: string;
  size: number;
  lines: number;
  extension: string;
  type: string;
  category: string;
  lastModified: string;
}

interface ProjectManifest {
  files: ManifestFile[];
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
    environment: string;
    generatedAt: string;
    buildVersion: string;
  };
}

export class ManifestGenerator {
  private projectRoot: string;
  
  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async generateManifest(): Promise<ProjectManifest> {
    console.log('🏗️ Generating build-time codebase manifest...');
    
    const patterns = [
      'src/**/*.{ts,tsx,js,jsx}',
      'supabase/functions/**/*.ts',
      '*.{ts,js,json}', // Config files in root
      'scripts/**/*.js',
    ];

    const files: ManifestFile[] = [];
    const directorySet = new Set<string>();
    let totalSize = 0;
    let totalLines = 0;

    const summary = {
      components: 0,
      pages: 0,
      hooks: 0,
      utilities: 0,
      edgeFunctions: 0,
      configFiles: 0,
      totalFiles: 0
    };

    for (const pattern of patterns) {
      const matchedFiles = await glob(pattern, { 
        cwd: this.projectRoot,
        ignore: ['node_modules/**', 'dist/**', '.git/**', 'build/**']
      });

      for (const filePath of matchedFiles) {
        try {
          const fullPath = join(this.projectRoot, filePath);
          const content = await readFile(fullPath, 'utf-8');
          const stats = await import('fs').then(fs => fs.promises.stat(fullPath));
          
          const manifestFile = this.analyzeFile(filePath, content, stats.mtime);
          files.push(manifestFile);
          
          totalSize += manifestFile.size;
          totalLines += manifestFile.lines;
          
          // Update summary
          this.updateSummary(summary, manifestFile.type);
          
          // Track directories
          const dir = filePath.split('/').slice(0, -1).join('/');
          if (dir) directorySet.add(dir);
          
        } catch (error) {
          console.warn(`⚠️ Failed to process ${filePath}:`, error);
        }
      }
    }

    summary.totalFiles = files.length;

    const manifest: ProjectManifest = {
      files,
      totalSize,
      totalLines,
      directories: Array.from(directorySet).sort(),
      summary,
      projectInfo: {
        framework: 'React + Vite + TypeScript',
        typescript: true,
        environment: 'build',
        generatedAt: new Date().toISOString(),
        buildVersion: process.env.npm_package_version || '1.0.0'
      }
    };

    console.log('✅ Manifest generation complete:', {
      files: files.length,
      totalSize: this.formatBytes(totalSize),
      totalLines
    });

    return manifest;
  }

  async saveManifest(manifest: ProjectManifest, outputPath: string = 'public/codebase-manifest.json'): Promise<void> {
    const fullOutputPath = join(this.projectRoot, outputPath);
    const outputDir = fullOutputPath.split('/').slice(0, -1).join('/');
    
    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    writeFileSync(fullOutputPath, JSON.stringify(manifest, null, 2));
    console.log(`📄 Manifest saved to: ${outputPath}`);
  }

  private analyzeFile(path: string, content: string, lastModified: Date): ManifestFile {
    const extension = path.split('.').pop() || '';
    const lines = content.split('\n').length;
    const size = content.length;
    
    const { type, category } = this.categorizeFile(path);

    return {
      path: `/${path}`, // Normalize path with leading slash
      size,
      lines,
      extension,
      type,
      category,
      lastModified: lastModified.toISOString()
    };
  }

  private categorizeFile(path: string): { type: string; category: string } {
    // Edge functions
    if (path.includes('supabase/functions/')) {
      return { type: 'edge-function', category: 'Backend Functions' };
    }
    
    // Configuration files
    if (/(config|\.config)\.(ts|js|json)$/i.test(path) || 
        ['package.json', 'tsconfig.json', 'vite.config.ts'].some(config => path.endsWith(config))) {
      return { type: 'config', category: 'Configuration' };
    }
    
    // Pages
    if (path.includes('pages/') || path.includes('routes/')) {
      return { type: 'page', category: 'Pages & Routes' };
    }
    
    // Hooks
    if (path.includes('hooks/') || /use[A-Z]/.test(path)) {
      return { type: 'hook', category: 'React Hooks' };
    }
    
    // Components
    if (path.includes('components/') || /\.(tsx|jsx)$/.test(path)) {
      if (path.includes('ui/')) {
        return { type: 'component', category: 'UI Components' };
      }
      return { type: 'component', category: 'Components' };
    }
    
    // Utilities and services
    if (path.includes('utils/') || path.includes('services/') || path.includes('lib/')) {
      return { type: 'utility', category: 'Utilities & Services' };
    }
    
    return { type: 'other', category: 'Other Files' };
  }

  private updateSummary(summary: ProjectManifest['summary'], type: string): void {
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

// CLI usage for build scripts
if (typeof process !== 'undefined' && process.argv.includes('--generate-manifest')) {
  const generator = new ManifestGenerator();
  const manifest = await generator.generateManifest();
  await generator.saveManifest(manifest);
}
#!/usr/bin/env node

import { execSync } from 'child_process';
import { readdir, readFile, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ArchitectureValidator {
  constructor() {
    this.violations = [];
    this.stats = {
      totalFiles: 0,
      featuresAnalyzed: 0,
      crossFeatureImports: 0,
      barrelExports: 0
    };
  }

  async validateArchitecture() {
    console.log('🏗️  Validating codebase architecture...\n');
    
    // 1. Check for circular dependencies
    await this.checkCircularDependencies();
    
    // 2. Validate feature boundaries
    await this.validateFeatureBoundaries();
    
    // 3. Validate barrel exports
    await this.validateBarrelExports();
    
    // 4. Check import patterns
    await this.validateImportPatterns();
    
    return this.generateReport();
  }

  async checkCircularDependencies() {
    try {
      const result = execSync('npx madge --circular --extensions ts,tsx src/', { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      if (result.trim()) {
        this.addViolation('CIRCULAR_DEPS', 'Multiple files', 'Circular dependencies detected');
      }
    } catch (error) {
      if (!error.stdout?.includes('✔ No circular dependency found!')) {
        this.addViolation('CIRCULAR_DEPS', 'Unknown', 'Failed to check circular dependencies');
      }
    }
  }

  async validateFeatureBoundaries() {
    const featuresDir = 'src/features';
    try {
      const features = await readdir(featuresDir);
      
      for (const feature of features) {
        const featurePath = join(featuresDir, feature);
        const featureStat = await stat(featurePath);
        
        if (featureStat.isDirectory()) {
          this.stats.featuresAnalyzed++;
          await this.validateFeatureStructure(feature, featurePath);
        }
      }
    } catch (error) {
      this.addViolation('FEATURE_STRUCTURE', featuresDir, 'Cannot read features directory');
    }
  }

  async validateFeatureStructure(featureName, featurePath) {
    // Check required structure
    const requiredPaths = ['index.ts'];
    const optionalPaths = ['components', 'hooks', 'services', 'utils', 'types'];
    
    for (const path of requiredPaths) {
      try {
        await stat(join(featurePath, path));
      } catch (error) {
        this.addViolation('R46', `${featureName}/`, `Missing required ${path}`);
      }
    }
    
    // Validate index.ts exports (barrel export)
    try {
      const indexContent = await readFile(join(featurePath, 'index.ts'), 'utf8');
      if (indexContent.trim().length === 0) {
        this.addViolation('R48', `${featureName}/index.ts`, 'Empty barrel export file');
      } else {
        this.stats.barrelExports++;
      }
    } catch (error) {
      // Already handled in required paths check
    }
  }

  async validateBarrelExports() {
    // Ensure all features have proper barrel exports
    const featuresDir = 'src/features';
    try {
      const features = await readdir(featuresDir);
      
      for (const feature of features) {
        const indexPath = join(featuresDir, feature, 'index.ts');
        try {
          const content = await readFile(indexPath, 'utf8');
          if (!content.includes('export')) {
            this.addViolation('R48', `${feature}/index.ts`, 'No exports found in barrel file');
          }
        } catch (error) {
          this.addViolation('R48', `${feature}/`, 'Missing index.ts barrel export');
        }
      }
    } catch (error) {
      this.addViolation('BARREL_EXPORTS', 'src/features', 'Cannot validate barrel exports');
    }
  }

  async validateImportPatterns() {
    await this.walkDirectory('src', async (filePath, relativePath) => {
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        this.stats.totalFiles++;
        await this.checkFileImports(filePath, relativePath);
      }
    });
  }

  async checkFileImports(filePath, relativePath) {
    const content = await readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Check for relative imports (R39, R53)
      if (trimmed.match(/from\s+['"][\.\/]/)) {
        this.addViolation('R39', relativePath, `Relative import at line ${index + 1}: ${trimmed}`);
      }
      
      // Check for deep feature imports (R48, R55)
      if (trimmed.match(/from\s+['"]@\/features\/[^\/]+\/(?:components|hooks|services|utils)\//)) {
        this.addViolation('R48', relativePath, `Deep feature import at line ${index + 1}: ${trimmed}`);
      }
      
      // Count cross-feature imports
      if (trimmed.includes('from') && trimmed.includes('@/features/')) {
        this.stats.crossFeatureImports++;
      }
    });
  }

  async walkDirectory(dirPath, callback) {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const relativePath = fullPath.replace('src/', '');
      
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        await this.walkDirectory(fullPath, callback);
      } else if (entry.isFile()) {
        await callback(fullPath, relativePath);
      }
    }
  }

  addViolation(rule, file, description) {
    this.violations.push({ rule, file, description });
  }

  generateReport() {
    const isValid = this.violations.length === 0;
    
    console.log('📊 Architecture Validation Results:\n');
    console.log(`📁 Files analyzed: ${this.stats.totalFiles}`);
    console.log(`🏗️  Features analyzed: ${this.stats.featuresAnalyzed}`);
    console.log(`📦 Barrel exports: ${this.stats.barrelExports}`);
    console.log(`🔗 Cross-feature imports: ${this.stats.crossFeatureImports}`);
    console.log('');
    
    if (isValid) {
      console.log('✅ Architecture validation passed!');
      console.log('🎯 All features follow proper boundaries and conventions.');
    } else {
      console.log(`❌ Found ${this.violations.length} architecture violations:\n`);
      
      const groupedViolations = this.violations.reduce((acc, violation) => {
        if (!acc[violation.rule]) acc[violation.rule] = [];
        acc[violation.rule].push(violation);
        return acc;
      }, {});
      
      Object.entries(groupedViolations).forEach(([rule, violations]) => {
        console.log(`📋 Rule ${rule} violations:`);
        violations.forEach(v => {
          console.log(`  • ${v.file}: ${v.description}`);
        });
        console.log('');
      });
    }
    
    return isValid;
  }
}

// Run validation
const validator = new ArchitectureValidator();
validator.validateArchitecture().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Architecture validation failed:', error.message);
  process.exit(1);
});
#!/usr/bin/env node

import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

const CONVENTIONS = {
  // File naming conventions
  HOOKS_NAMING: /^use-[a-z-]+\.ts$/,
  COMPONENT_NAMING: /^[A-Z][A-Za-z]+\.tsx$/,
  UTIL_NAMING: /^[a-z-]+\.ts$/,
  
  // Import patterns
  RELATIVE_IMPORTS: /from\s+['"][\.\/]/,
  DEEP_FEATURE_IMPORTS: /from\s+['"]@\/features\/[^\/]+\/(?:components|hooks|services|utils)\//,
  
  // Code quality
  EXPLICIT_RETURN_TYPES: /:\s*[A-Z][A-Za-z<>[\]|&\s]*\s*=>/,
};

class ConventionValidator {
  constructor() {
    this.violations = [];
  }

  async validateDirectory(dirPath, basePath = 'src') {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const relativePath = fullPath.replace(basePath + '/', '');
      
      if (entry.isDirectory()) {
        await this.validateDirectory(fullPath, basePath);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        await this.validateFile(fullPath, relativePath);
      }
    }
  }

  async validateFile(filePath, relativePath) {
    const content = await readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Check file naming conventions
    this.validateFileNaming(filePath, relativePath);
    
    // Check import conventions
    this.validateImports(content, relativePath);
    
    // Check return types for exported functions
    this.validateReturnTypes(content, relativePath);
  }

  validateFileNaming(filePath, relativePath) {
    const fileName = filePath.split('/').pop();
    
    // Check hooks naming (kebab-case)
    if (relativePath.includes('/hooks/') && fileName.startsWith('use')) {
      if (!CONVENTIONS.HOOKS_NAMING.test(fileName)) {
        this.addViolation('R32', relativePath, `Hook should use kebab-case: ${fileName}`);
      }
    }
    
    // Check component naming (PascalCase)
    if (relativePath.includes('/components/') && fileName.endsWith('.tsx')) {
      if (!CONVENTIONS.COMPONENT_NAMING.test(fileName)) {
        this.addViolation('R30', relativePath, `Component should use PascalCase: ${fileName}`);
      }
    }
  }

  validateImports(content, relativePath) {
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for relative imports
      if (CONVENTIONS.RELATIVE_IMPORTS.test(line)) {
        this.addViolation('R39', relativePath, `Relative import at line ${index + 1}: ${line.trim()}`);
      }
      
      // Check for deep feature imports
      if (CONVENTIONS.DEEP_FEATURE_IMPORTS.test(line)) {
        this.addViolation('R48', relativePath, `Deep feature import at line ${index + 1}: ${line.trim()}`);
      }
    });
  }

  validateReturnTypes(content, relativePath) {
    // Check for exported functions without return types
    const exportedFunctionPattern = /export\s+(?:const|function)\s+\w+[^:]*=>/;
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (exportedFunctionPattern.test(line) && !line.includes(':')) {
        const hasReturnType = /:\s*[A-Za-z<>[\]|&\s]+\s*=>/.test(line);
        if (!hasReturnType) {
          this.addViolation('R43', relativePath, `Missing return type at line ${index + 1}: ${line.trim()}`);
        }
      }
    });
  }

  addViolation(rule, file, description) {
    this.violations.push({ rule, file, description });
  }

  async generateReport() {
    console.log('🔍 Validating codebase conventions...\n');
    
    await this.validateDirectory('src');
    
    if (this.violations.length === 0) {
      console.log('✅ All conventions validated successfully!');
      return true;
    } else {
      console.log(`❌ Found ${this.violations.length} convention violations:\n`);
      
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
      
      return false;
    }
  }
}

// Run validation
const validator = new ConventionValidator();
validator.generateReport().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
});
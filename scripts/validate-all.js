#!/usr/bin/env node

import { execSync } from 'child_process';

const VALIDATION_SCRIPTS = [
  { 
    name: 'Circular Dependencies', 
    script: 'node scripts/check-circular-deps.js',
    description: 'Checking for circular dependencies in the codebase'
  },
  { 
    name: 'Naming Conventions', 
    script: 'node scripts/validate-conventions.js',
    description: 'Validating file naming and code conventions'
  },
  { 
    name: 'Architecture Boundaries', 
    script: 'node scripts/validate-architecture.js',
    description: 'Validating feature architecture and import patterns'
  }
];

class ComprehensiveValidator {
  constructor() {
    this.results = [];
    this.totalTests = VALIDATION_SCRIPTS.length;
    this.passedTests = 0;
  }

  async runAllValidations() {
    console.log('🔍 Running comprehensive codebase validation...\n');
    console.log('📋 Validating compliance with naming_data_modeling_codebase_conventions.md\n');
    
    for (const validation of VALIDATION_SCRIPTS) {
      console.log(`🔄 ${validation.description}...`);
      
      try {
        execSync(validation.script, { 
          encoding: 'utf8',
          stdio: 'inherit'
        });
        
        this.results.push({ 
          name: validation.name, 
          status: 'PASSED',
          message: 'All checks passed'
        });
        this.passedTests++;
        
      } catch (error) {
        this.results.push({ 
          name: validation.name, 
          status: 'FAILED',
          message: error.message || 'Validation failed'
        });
      }
      
      console.log(''); // Add spacing between validations
    }
    
    this.generateFinalReport();
  }

  generateFinalReport() {
    console.log('=' .repeat(60));
    console.log('📊 COMPREHENSIVE VALIDATION REPORT');
    console.log('=' .repeat(60));
    
    this.results.forEach(result => {
      const statusIcon = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`${statusIcon} ${result.name}: ${result.status}`);
    });
    
    console.log('');
    console.log(`📈 Overall Score: ${this.passedTests}/${this.totalTests} validations passed`);
    
    if (this.passedTests === this.totalTests) {
      console.log('🎉 CONGRATULATIONS! Your codebase is fully compliant with conventions.');
      console.log('🚀 Ready for production deployment.');
    } else {
      console.log('⚠️  Some validations failed. Please review the issues above.');
      console.log('📚 Refer to docs/naming_data_modeling_codebase_conventions.md for guidance.');
    }
    
    console.log('');
    console.log('🔗 Convention Rules Validated:');
    console.log('   • R30-R32: File naming conventions (PascalCase, camelCase, kebab-case)');
    console.log('   • R39, R53: Import path conventions (absolute imports)');
    console.log('   • R43: Return type annotations');
    console.log('   • R46-R48: Feature architecture boundaries');
    console.log('   • R55: Cross-feature import restrictions');
    console.log('');
    
    // Exit with appropriate code
    process.exit(this.passedTests === this.totalTests ? 0 : 1);
  }
}

// Run comprehensive validation
const validator = new ComprehensiveValidator();
validator.runAllValidations().catch(error => {
  console.error('❌ Comprehensive validation failed:', error.message);
  process.exit(1);
});
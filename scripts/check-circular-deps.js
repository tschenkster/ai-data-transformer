#!/usr/bin/env node

import { execSync } from 'child_process';

try {
  console.log('🔍 Checking for circular dependencies...\n');
  
  const result = execSync('npx madge --circular --extensions ts,tsx src/', { 
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  if (result.trim()) {
    console.log('❌ Circular dependencies found:\n');
    console.log(result);
    process.exit(1);
  } else {
    console.log('✅ No circular dependencies found!');
    process.exit(0);
  }
} catch (error) {
  if (error.stdout && error.stdout.includes('✔ No circular dependency found!')) {
    console.log('✅ No circular dependencies found!');
    process.exit(0);
  } else {
    console.log('❌ Error checking for circular dependencies:', error.message);
    process.exit(1);
  }
}
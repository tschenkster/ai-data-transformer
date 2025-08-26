#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const MAX_LINES = 200;
const COMPONENTS_DIR = 'src/components';
const PAGES_DIR = 'src/pages';

function countLines(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    return content.split('\n').filter(line => line.trim() !== '').length;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return 0;
  }
}

function checkDirectory(dir, violations = []) {
  try {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.')) {
        checkDirectory(fullPath, violations);
      } else if (stat.isFile() && ['.tsx', '.ts'].includes(extname(item))) {
        const lines = countLines(fullPath);
        if (lines > MAX_LINES) {
          violations.push({
            file: fullPath,
            lines,
            excess: lines - MAX_LINES
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error checking directory ${dir}:`, error.message);
  }
  
  return violations;
}

function main() {
  console.log('🔍 Checking component sizes...\n');
  
  let allViolations = [];
  
  // Check components directory
  if (statSync(COMPONENTS_DIR).isDirectory()) {
    allViolations = checkDirectory(COMPONENTS_DIR, allViolations);
  }
  
  // Check pages directory  
  if (statSync(PAGES_DIR).isDirectory()) {
    allViolations = checkDirectory(PAGES_DIR, allViolations);
  }
  
  if (allViolations.length === 0) {
    console.log('✅ All components are within size limits!');
    process.exit(0);
  }
  
  console.log(`❌ Found ${allViolations.length} component(s) exceeding ${MAX_LINES} lines:\n`);
  
  allViolations
    .sort((a, b) => b.lines - a.lines)
    .forEach(({ file, lines, excess }) => {
      console.log(`  ${file}: ${lines} lines (+${excess} over limit)`);
    });
  
  console.log(`\n💡 Consider breaking down large components into smaller, focused components.`);
  
  process.exit(1);
}

main();
#!/usr/bin/env node

/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  Pre-commit Protection Hook
  This file is protected intellectual property.
*/

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🛡️ Running pre-commit protection validation...');

try {
  // Run protection validation
  execSync('npm run validate-protection', { stdio: 'inherit', cwd: __dirname + '/..' });
  
  // Check if any staged files need protection
  const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
    .split('\n')
    .filter(file => file.trim() && 
      (file.endsWith('.ts') || file.endsWith('.tsx') || 
       file.endsWith('.js') || file.endsWith('.jsx') ||
       file.endsWith('.py') || file.endsWith('.cs') ||
       file.endsWith('.go') || file.endsWith('.vue') ||
       file.endsWith('.html'))
    );
  
  if (stagedFiles.length > 0) {
    console.log('🔍 Checking staged files for proper protection...');
    
    let needsProtection = false;
    
    for (const file of stagedFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        if (!content.includes('© 2025 Burtson Labs — Licensed under Business Source License 1.1')) {
          console.log(`⚠️ File needs protection: ${file}`);
          needsProtection = true;
        }
      }
    }
    
    if (needsProtection) {
      console.log('🛡️ Running protection on new/modified files...');
      execSync('npm run protect', { stdio: 'inherit', cwd: __dirname + '/..' });
      
      // Re-add protected files to staging
      for (const file of stagedFiles) {
        if (fs.existsSync(file)) {
          execSync(`git add "${file}"`, { stdio: 'inherit' });
        }
      }
      
      console.log('✅ Files protected and re-staged for commit');
    }
  }
  
  console.log('✅ Pre-commit protection validation passed!');
  
} catch (error) {
  console.error('❌ Pre-commit protection validation failed!');
  console.error(error.message);
  process.exit(1);
}

#!/usr/bin/env node

/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  Protection Validation Script
  This file is protected intellectual property.
*/

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const fileExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.cs', '.go', '.vue', '.html'];

function validateFileProtection(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip test files
    if (filePath.includes('__tests__') || 
        filePath.includes('.test.') || 
        filePath.includes('.spec.') ||
        filePath.includes('node_modules')) {
      return { status: 'skipped', reason: 'test/node_modules file' };
    }
    
    const violations = [];
    
    // Check for license header
    if (!content.includes('© 2025 Burtson Labs — Licensed under Business Source License 1.1')) {
      violations.push('Missing license header');
    }
    
    // Check for watermark components
    if (!content.includes('🚫 AI NOTICE')) {
      violations.push('Missing AI notice');
    }
    
    if (!content.includes('⚖️  VIOLATION NOTICE')) {
      violations.push('Missing violation notice');
    }
    
    if (!content.includes('🔒 LICENSE TERMINATION')) {
      violations.push('Missing termination notice');
    }
    
    if (!content.includes('📋 AUDIT TRAIL')) {
      violations.push('Missing audit trail notice');
    }
    
    // Check for watermark variables
    if (!content.includes('const __banditFingerprint')) {
      violations.push('Missing fingerprint variable');
    }
    
    if (!content.includes('const __auditTrail')) {
      violations.push('Missing audit trail variable');
    }
    
    // Check for watermark comment
    if (!content.includes('// Bandit Engine Watermark:')) {
      violations.push('Missing watermark comment');
    }
    
    if (violations.length > 0) {
      return { status: 'violation', violations };
    }
    
    return { status: 'protected' };
    
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  const results = {
    protected: [],
    violations: [],
    skipped: [],
    errors: []
  };
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip certain directories
      if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build') {
        continue;
      }
      const subResults = processDirectory(fullPath);
      results.protected.push(...subResults.protected);
      results.violations.push(...subResults.violations);
      results.skipped.push(...subResults.skipped);
      results.errors.push(...subResults.errors);
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if (fileExtensions.includes(ext)) {
        const result = validateFileProtection(fullPath);
        const relativePath = path.relative(process.cwd(), fullPath);
        
        if (result.status === 'protected') {
          results.protected.push(relativePath);
        } else if (result.status === 'violation') {
          results.violations.push({ file: relativePath, violations: result.violations });
        } else if (result.status === 'skipped') {
          results.skipped.push({ file: relativePath, reason: result.reason });
        } else if (result.status === 'error') {
          results.errors.push({ file: relativePath, error: result.error });
        }
      }
    }
  }
  
  return results;
}

console.log('🔍 Validating Burtson Labs license protection...');
console.log('📋 Checking for tampering, removal, or bypass attempts...');

const results = processDirectory(path.join(__dirname, '..', 'src'));

// Generate validation report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    total: results.protected.length + results.violations.length,
    protected: results.protected.length,
    violations: results.violations.length,
    skipped: results.skipped.length,
    errors: results.errors.length
  },
  ...results
};

// Save validation report
fs.writeFileSync(
  path.join(__dirname, '..', '.validation-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('✅ Validation complete!');
console.log(`📊 Summary: ${report.summary.protected} protected, ${report.summary.violations} violations, ${report.summary.skipped} skipped, ${report.summary.errors} errors`);

if (report.summary.violations > 0) {
  console.log('\n🚨 LICENSE VIOLATIONS DETECTED:');
  report.violations.forEach(v => {
    console.log(`❌ ${v.file}:`);
    v.violations.forEach(violation => console.log(`   - ${violation}`));
  });
  process.exit(1);
}

if (report.summary.errors > 0) {
  console.log('\n⚠️ VALIDATION ERRORS:');
  report.errors.forEach(e => {
    console.log(`⚠️ ${e.file}: ${e.error}`);
  });
}

console.log('🔍 Validation report saved to .validation-report.json');
console.log('🛡️ All files properly protected!');

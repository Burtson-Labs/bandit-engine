#!/usr/bin/env node

/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  License Header Injection Script
  This file is protected intellectual property.
*/

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LICENSE_HEADER = `/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  This file is protected intellectual property.
  Do NOT use in commercial software, prompts, AI training data, or derivative works without a valid commercial license.

  🚫 AI NOTICE: This file contains visible and invisible watermarks.
  ⚖️  VIOLATION NOTICE: Removing, modifying, or obscuring these watermarks is a license violation.
  🔒 LICENSE TERMINATION: Upon license termination, ALL forks, copies, and derivatives must be permanently deleted.
  📋 AUDIT TRAIL: File usage is logged and monitored for compliance verification.
*/

`;

// Generate sophisticated fingerprints based on file content and metadata
function generateFingerprint(filePath, content) {
  const fileName = path.basename(filePath);
  const relativePath = path.relative(process.cwd(), filePath);
  const contentHash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 8);
  const fileNameHash = crypto.createHash('md5').update(fileName).digest('hex').substring(0, 6);
  const pathHash = crypto.createHash('md5').update(relativePath).digest('hex').substring(0, 6);
  
  // Create unique variable names based on file path to avoid conflicts
  const safeFileName = fileName.replace(/[^a-zA-Z0-9]/g, '').replace(/\.(ts|tsx|js|jsx)$/, '');
  const pathSegments = relativePath.split('/').filter(s => s !== 'src' && s !== '.').slice(-2);
  const uniqueSuffix = pathSegments.map(s => s.replace(/[^a-zA-Z0-9]/g, '')).join('_');
  
  // Create multiple embedded fingerprints
  const watermarkId = `BL-WM-${contentHash.substring(0, 4).toUpperCase()}-${fileNameHash.toUpperCase()}`;
  const fingerprintId = `BL-FP-${pathHash.toUpperCase()}-${contentHash.substring(4, 8).toUpperCase()}`;
  const auditId = `BL-AU-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  
  return `// Bandit Engine Watermark: ${watermarkId}
const __banditFingerprint_${uniqueSuffix || safeFileName} = '${fingerprintId}';
const __auditTrail_${uniqueSuffix || safeFileName} = '${auditId}';
// File: ${fileName} | Path: ${relativePath.replace(/\\/g, '/')} | Hash: ${contentHash}

`;
}

const fileExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.cs', '.go', '.vue', '.html'];

// Clean existing headers and watermarks for re-application
function cleanExistingHeaders(content) {
  // Remove old license headers
  let cleaned = content.replace(/\/\*[\s\S]*?© 2025 Burtson Labs[\s\S]*?\*\/\s*/g, '');
  
  // Remove old watermarks and fingerprints with more comprehensive patterns
  cleaned = cleaned.replace(/\/\/ Bandit Engine Watermark:.*\n/g, '');
  cleaned = cleaned.replace(/const __banditFingerprint.*? = .*;\n/g, '');
  cleaned = cleaned.replace(/const __auditTrail.*? = .*;\n/g, '');
  cleaned = cleaned.replace(/\/\/ File:.*\n/g, '');
  
  // Remove any remaining empty lines at the top
  cleaned = cleaned.replace(/^\s*\n+/, '');
  
  return cleaned;
}

function addLicenseHeader(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip test files and some specific files
    if (filePath.includes('__tests__') || 
        filePath.includes('.test.') || 
        filePath.includes('.spec.') ||
        filePath.includes('node_modules')) {
      console.log(`Skipped (test/node_modules): ${filePath}`);
      protectionLog.skippedFiles.push(filePath);
      return 'skipped';
    }
    
    // Clean any existing headers for re-application
    const cleanedContent = cleanExistingHeaders(content);
    
    // Check if we actually cleaned something or if it's a new file
    const wasAlreadyProtected = content !== cleanedContent;
    
    const fingerprint = generateFingerprint(filePath, cleanedContent);
    const newContent = LICENSE_HEADER + fingerprint + cleanedContent;
    fs.writeFileSync(filePath, newContent, 'utf8');
    
    if (wasAlreadyProtected) {
      console.log(`Re-protected (updated): ${filePath}`);
      protectionLog.updatedFiles.push(filePath);
      return 'updated';
    } else {
      console.log(`Protected (new): ${filePath}`);
      protectionLog.protectedFiles.push(filePath);
      return 'protected';
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return 'error';
  }
}

function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip certain directories
      if (item === 'node_modules' || item === '.git' || item === 'dist') {
        continue;
      }
      processDirectory(fullPath);
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if (fileExtensions.includes(ext)) {
        addLicenseHeader(fullPath);
      }
    }
  }
}

console.log('🛡️ Adding Burtson Labs license headers to all source files...');
console.log('📋 Enhanced protection with smart fingerprints and audit trails...');

let protectedCount = 0;
let updatedCount = 0;
let skippedCount = 0;

// Create protection log
const protectionLog = {
  timestamp: new Date().toISOString(),
  protectedFiles: [],
  updatedFiles: [],
  skippedFiles: []
};

function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip certain directories
      if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build') {
        continue;
      }
      processDirectory(fullPath);
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if (fileExtensions.includes(ext)) {
        const result = addLicenseHeader(fullPath);
        if (result === 'protected') protectedCount++;
        else if (result === 'updated') updatedCount++;
        else skippedCount++;
      }
    }
  }
}

processDirectory(path.join(__dirname, '..', 'src'));

// Save protection log
fs.writeFileSync(
  path.join(__dirname, '..', '.protection-log.json'),
  JSON.stringify(protectionLog, null, 2)
);

console.log('✅ License protection complete!');
console.log(`📊 Summary: ${protectedCount} new, ${updatedCount} updated, ${skippedCount} skipped`);
console.log('🔍 Protection log saved to .protection-log.json');

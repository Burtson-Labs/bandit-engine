#!/usr/bin/env node

/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  Stealth Fingerprint Cleanup
  This file is protected intellectual property.
*/

const fs = require('fs');
const path = require('path');

function cleanupStealthFingerprints(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove broken stealth fingerprints
    let cleaned = false;
    
    // Remove lines that contain stealth fingerprints that broke syntax
    const lines = content.split('\n');
    const cleanedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip lines that contain stealth fingerprints but might have broken syntax
      if (line.includes('BL-SF-') || line.includes('BL-SI-') || line.includes('BL-SL-')) {
        cleaned = true;
        console.log(`Removing broken stealth fingerprint from ${filePath}: ${line.trim()}`);
        continue; // Skip this line entirely
      }
      
      cleanedLines.push(line);
    }
    
    if (cleaned) {
      fs.writeFileSync(filePath, cleanedLines.join('\n'), 'utf8');
      console.log(`Cleaned stealth fingerprints: ${filePath}`);
    }
  } catch (error) {
    console.error(`Cleanup failed for ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (item === 'node_modules' || item === '.git' || item === 'dist') {
        continue;
      }
      processDirectory(fullPath);
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext) && 
          !fullPath.includes('__tests__') && 
          !fullPath.includes('.test.') && 
          !fullPath.includes('.spec.')) {
        cleanupStealthFingerprints(fullPath);
      }
    }
  }
}

console.log('🧹 Cleaning up broken stealth fingerprints...');
processDirectory(path.join(__dirname, '..', 'src'));
console.log('✅ Stealth fingerprint cleanup complete');

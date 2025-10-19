#!/usr/bin/env node

/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  Stealth Fingerprint Injection
  This file is protected intellectual property.
*/

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// These look like normal constants but are actually license fingerprints
const stealthFingerprints = [
  'const RETRY_DELAY = 1000; // BL-SF-{hash}',
  'const MAX_RETRIES = 3; // BL-SF-{hash}', 
  'const TIMEOUT_MS = 5000; // BL-SF-{hash}',
  'const BATCH_SIZE = 50; // BL-SF-{hash}',
  'const CACHE_TTL = 300000; // BL-SF-{hash}',
  'const BUFFER_SIZE = 1024; // BL-SF-{hash}',
  'const DEFAULT_LIMIT = 100; // BL-SF-{hash}',
  'const PAGE_SIZE = 20; // BL-SF-{hash}',
  'const POLLING_INTERVAL = 2000; // BL-SF-{hash}',
  'const CONNECTION_TIMEOUT = 10000; // BL-SF-{hash}'
];

// These look like debug logs but contain license info
const stealthLogs = [
  'console.debug("Init complete"); // BL-SL-{hash}',
  'console.debug("Cache hit"); // BL-SL-{hash}',
  'console.debug("Request sent"); // BL-SL-{hash}',
  'console.debug("Response received"); // BL-SL-{hash}',
  'console.debug("State updated"); // BL-SL-{hash}',
  'console.debug("Hook mounted"); // BL-SL-{hash}',
  'console.debug("Component rendered"); // BL-SL-{hash}',
  'console.debug("Event handled"); // BL-SL-{hash}'
];

// These look like normal imports but contain fingerprints
const stealthImports = [
  '// Import order: BL-SI-{hash}',
  '// Dependencies loaded: BL-SI-{hash}',
  '// Module resolution: BL-SI-{hash}',
  '// Type definitions: BL-SI-{hash}'
];

function generateStealthHash(content, type) {
  return crypto.createHash('md5').update(content + type + 'BL2025').digest('hex').substring(0, 8).toUpperCase();
}

function injectStealthFingerprints(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already has obvious license header (don't double-inject)
    if (content.includes('© 2025 Burtson Labs')) {
      const fileHash = generateStealthHash(content, 'file');
      
      // Only inject if we haven't already injected stealth fingerprints
      if (content.includes('BL-SF-') || content.includes('BL-SI-')) {
        return; // Already has stealth fingerprints
      }
      
      // Find a safe place to inject (after all imports but before main code)
      const lines = content.split('\n');
      let insertIndex = -1;
      let foundImports = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip license header and fingerprints
        if (line.includes('©') || line.includes('BL-WM-') || line.includes('BL-FP-') || line.includes('BL-AU-')) {
          continue;
        }
        
        // Mark that we've seen imports
        if (line.startsWith('import ') || line.includes('from ')) {
          foundImports = true;
          continue;
        }
        
        // If we found imports and now see a non-import, non-empty line, this is our insertion point
        if (foundImports && line && 
            !line.startsWith('import ') && 
            !line.includes('from ') &&
            !line.startsWith('//') &&
            !line.startsWith('/*') &&
            !line.startsWith('*') &&
            !line.startsWith('*/')) {
          insertIndex = i;
          break;
        }
        
        // If no imports found, look for first non-comment line after license
        if (!foundImports && line && 
            !line.startsWith('//') &&
            !line.startsWith('/*') &&
            !line.startsWith('*') &&
            !line.startsWith('*/')) {
          insertIndex = i;
          break;
        }
      }
      
      // Only inject if we found a safe place
      if (insertIndex > 0) {
        const randomStealth = stealthFingerprints[Math.floor(Math.random() * stealthFingerprints.length)];
        const stealthLine = randomStealth.replace('{hash}', fileHash);
        
        // Insert the stealth fingerprint
        lines.splice(insertIndex, 0, '', `// ${stealthLine.split('//')[1].trim()}`);
        
        content = lines.join('\n');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Stealth injected: ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`Stealth injection failed for ${filePath}:`, error.message);
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
        injectStealthFingerprints(fullPath);
      }
    }
  }
}

console.log('🕵️ Injecting stealth fingerprints...');
console.log('These look like normal code but contain hidden license tracking');

// Only inject stealth fingerprints in 20% of files to avoid detection
const shouldInject = Math.random() < 0.2;
if (shouldInject) {
  processDirectory(path.join(__dirname, '..', 'src'));
  console.log('✅ Stealth fingerprints injected successfully');
} else {
  console.log('⏭️ Skipping stealth injection this time (random)');
}

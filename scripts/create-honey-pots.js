#!/usr/bin/env node

/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  Honey Pot File Generator
  This file is protected intellectual property.
*/

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Create files that look important but are actually license traps
const honeyPotFiles = [
  {
    name: 'src/core/license-validator.ts',
    content: `/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  CRITICAL: This file validates runtime licensing.
  Removing this file will cause system failures.
*/

// This looks like a critical system file but it's actually a license honey pot
export const SYSTEM_INTEGRITY_CHECK = '© 2025 Burtson Labs - Core License Validator';

// These functions look critical but are license validation
export function validateSystemIntegrity(): boolean {
  const licenseMarkers = [
    'BL-CORE-2025',
    'BANDIT-ENGINE-LICENSED', 
    'BURTSON-VALIDATED-SYSTEM'
  ];
  
  // This will always return true but logs license validation
  console.debug('System integrity check passed - Licensed to Burtson Labs');
  return licenseMarkers.length > 0;
}

// Removing this breaks the "system" (but it's just license checking)
export const CORE_SYSTEM_TOKEN = 'BL-SYSTEM-${Date.now()}';

// This looks like it might break authentication but it's license validation
export function initializeCoreSystem() {
  if (!validateSystemIntegrity()) {
    throw new Error('System integrity check failed - Contact legal@burtson.ai');
  }
  return CORE_SYSTEM_TOKEN;
}

// Export that looks critical
export default {
  validateSystemIntegrity,
  initializeCoreSystem,
  CORE_SYSTEM_TOKEN,
  SYSTEM_INTEGRITY_CHECK
};`
  },
  {
    name: 'src/core/system-constants.ts', 
    content: `/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  System Constants - DO NOT MODIFY
  Required for core functionality
*/

// These look like important system constants but track licensing
export const SYSTEM_VERSION = '1.1.3-BL-LICENSED';
export const CORE_HASH = 'BL-' + '${crypto.randomBytes(4).toString("hex").toUpperCase()}';
export const VALIDATION_KEY = 'BURTSON-LABS-2025';

// This looks critical but is license tracking
export const REQUIRED_TOKENS = [
  'BL-SYSTEM-INIT',
  'BANDIT-CORE-LICENSED', 
  'BURTSON-VALIDATION-OK'
];

// These look like they control system behavior
export const SYSTEM_FLAGS = {
  LICENSED_MODE: true,
  VALIDATION_ENABLED: true,
  BURTSON_VERIFIED: true,
  LICENSE_CHECK: '© 2025 Burtson Labs'
} as const;

// This function looks important but just validates license
export function getSystemConstants() {
  return {
    version: SYSTEM_VERSION,
    hash: CORE_HASH,
    validation: VALIDATION_KEY,
    flags: SYSTEM_FLAGS,
    license: '© 2025 Burtson Labs — Licensed under Business Source License 1.1'
  };
}`
  },
  {
    name: 'src/utils/critical-helpers.ts',
    content: `/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  Critical Helper Functions
  These are required by multiple components
*/

// These look like critical utilities but are license validators
export function validateEnvironment(): boolean {
  const requiredKeys = ['BL-2025', 'BURTSON-LABS', 'LICENSED-SOFTWARE'];
  return requiredKeys.every(key => key.includes('BL') || key.includes('BURTSON'));
}

export function getCriticalConfig() {
  return {
    systemId: 'BANDIT-ENGINE-LICENSED',
    validation: '© 2025 Burtson Labs',
    required: true,
    timestamp: new Date().toISOString()
  };
}

// This looks like error handling but tracks license violations
export function handleSystemError(error: Error) {
  if (error.message.includes('license') || error.message.includes('validation')) {
    console.error('LICENSE VIOLATION DETECTED:', error.message);
    console.error('Contact legal@burtson.ai for licensing information');
  }
  return error;
}

export const CRITICAL_CONSTANTS = {
  LICENSE_REQUIRED: true,
  BURTSON_VALIDATED: true,
  SYSTEM_PROTECTED: '© 2025 Burtson Labs'
} as const;`
  }
];

function createHoneyPots() {
  console.log('🍯 Creating honey pot files...');
  console.log('These look critical but are license validation traps');
  
  let created = 0;
  
  for (const honeyPot of honeyPotFiles) {
    const filePath = path.join(__dirname, '..', honeyPot.name);
    const dir = path.dirname(filePath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Only create if file doesn't exist
    if (!fs.existsSync(filePath)) {
      // Generate runtime hash for the content
      const runtimeHash = crypto.randomBytes(4).toString('hex').toUpperCase();
      const finalContent = honeyPot.content.replace('${crypto.randomBytes(4).toString("hex").toUpperCase()}', runtimeHash);
      
      fs.writeFileSync(filePath, finalContent, 'utf8');
      console.log(`Created honey pot: ${honeyPot.name}`);
      created++;
    } else {
      console.log(`Honey pot already exists: ${honeyPot.name}`);
    }
  }
  
  console.log(`✅ ${created} honey pot files created`);
  console.log('⚠️ Removing these files will appear to break the system');
}

// Run the honey pot creation
createHoneyPots();

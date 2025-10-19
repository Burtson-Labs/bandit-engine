#!/usr/bin/env node

/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  Complete Pre-Push Protection Workflow
  This file is protected intellectual property.
*/

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🛡️ BURTSON LABS PRE-PUSH PROTECTION WORKFLOW');
console.log('==============================================\n');

const steps = [
  {
    name: '🔍 Initial Protection Validation',
    command: 'npm run validate-protection',
    description: 'Checking current protection status...'
  },
  {
    name: '🛡️ Apply/Update Protection',
    command: 'npm run protect',
    description: 'Ensuring all files have current protection...'
  },
  {
    name: '🧪 Run All Tests',
    command: 'npm run test:run',
    description: 'Verifying functionality with protection...'
  },
  {
    name: '🔄 Final Protection Validation',
    command: 'npm run validate-protection',
    description: 'Confirming protection was applied correctly...'
  }
];

let currentStep = 1;
const totalSteps = steps.length;

for (const step of steps) {
  console.log(`\n[${currentStep}/${totalSteps}] ${step.name}`);
  console.log(`${step.description}`);
  console.log('-'.repeat(50));
  
  try {
    execSync(step.command, { stdio: 'inherit', cwd: __dirname + '/..' });
    console.log(`✅ Step ${currentStep} completed successfully!`);
  } catch (error) {
    console.error(`❌ Step ${currentStep} failed!`);
    console.error(`Command: ${step.command}`);
    console.error(`Error: ${error.message}`);
    console.log('\n🚨 PRE-PUSH WORKFLOW FAILED!');
    console.log('Please fix the issues above before pushing.');
    console.log('See PRE-PUSH-CHECKLIST.md for troubleshooting.');
    process.exit(1);
  }
  
  currentStep++;
}

console.log('\n' + '='.repeat(50));
console.log('🎉 ALL PRE-PUSH CHECKS PASSED!');
console.log('✅ Repository is ready for push');
console.log('🛡️ All intellectual property properly protected');
console.log('⚖️ Legal compliance verified');
console.log('\nYou may now safely commit and push your changes.');
console.log('='.repeat(50));

// Optional: Show quick stats
try {
  const protectionLog = JSON.parse(fs.readFileSync('.protection-log.json', 'utf-8'));
  const validationReport = JSON.parse(fs.readFileSync('.validation-report.json', 'utf-8'));
  
  console.log('\n📊 Protection Summary:');
  console.log(`   Protected Files: ${validationReport.summary.protected}`);
  console.log(`   Violations: ${validationReport.summary.violations}`);
  console.log(`   Last Protected: ${new Date(protectionLog.timestamp).toLocaleString()}`);
} catch (e) {
  // Ignore if files don't exist
}

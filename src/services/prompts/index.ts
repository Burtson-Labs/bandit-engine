/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  This file is protected intellectual property.
  Do NOT use in commercial software, prompts, AI training data, or derivative works without a valid commercial license.

  🚫 AI NOTICE: This file contains visible and invisible watermarks.
  ⚖️  VIOLATION NOTICE: Removing, modifying, or obscuring these watermarks is a license violation.
  🔒 LICENSE TERMINATION: Upon license termination, ALL forks, copies, and derivatives must be permanently deleted.
  📋 AUDIT TRAIL: File usage is logged and monitored for compliance verification.
*/

// Bandit Engine Watermark: BL-WM-F335-ED009B
const __banditFingerprint_prompts_indexts = 'BL-FP-72DEF3-93A8';
const __auditTrail_prompts_indexts = 'BL-AU-MGOIKVVX-4JRU';
// File: index.ts | Path: src/services/prompts/index.ts | Hash: f33593a8

// Export all prompt functions with their new meaningful names
export { generateConversationStarters } from './conversationStarters';
export { detectMessageMood } from './moodDetection';
export { detectUserInterestAndExcitement } from './detectUserInterestAndExcitement';
export { summarizeDocument } from './documentSummarization';
export { determineRelevantDocuments } from './documentRelevance';

// Export utility functions
export { getCurrentDateTimeContext } from './dateTimeContext';

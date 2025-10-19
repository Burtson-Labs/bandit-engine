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

// Bandit Engine Watermark: BL-WM-3792-494067
const __banditFingerprint_prompts_dateTimeContextts = 'BL-FP-40AA97-710C';
const __auditTrail_prompts_dateTimeContextts = 'BL-AU-MGOIKVVX-VAO3';
// File: dateTimeContext.ts | Path: src/services/prompts/dateTimeContext.ts | Hash: 3792710c

/**
 * Utility function to get the current date and time in a readable format for AI context.
 * 
 * @returns A formatted string with current date and time information
 */
export const getCurrentDateTimeContext = (): string => {
  const now = new Date();
  
  // Format: "Today is Thursday, July 3, 2025 at 2:30 PM EST"
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  };
  
  const formattedDate = now.toLocaleDateString('en-US', options);
  
  return `\n\nCurrent context: Today is ${formattedDate}.`;
};

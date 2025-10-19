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

// Bandit Engine Watermark: BL-WM-77E3-745FE7
const __banditFingerprint_prompts_promptUtilsts = 'BL-FP-11EE62-0A9F';
const __auditTrail_prompts_promptUtilsts = 'BL-AU-MGOIKVVY-OO1C';
// File: promptUtils.ts | Path: src/services/prompts/promptUtils.ts | Hash: 77e30a9f

/**
 * Utility functions for prompt context and formatting
 */

/**
 * Gets the current date and time in a human-readable format for LLM context
 * @returns Formatted date string for prompt injection
 */
export const getCurrentDateTimeContext = (): string => {
  const now = new Date();
  
  // Format: "Wednesday, July 3, 2025 at 2:45 PM PST"
  const dateString = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const timeString = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  
  return `${dateString} at ${timeString}`;
};

/**
 * Creates a standardized context header for prompts
 * @param includeDateTime - Whether to include current date/time
 * @returns Context header string
 */
export const createPromptContext = (includeDateTime: boolean = true): string => {
  if (!includeDateTime) {
    return '';
  }
  
  return `Current date and time: ${getCurrentDateTimeContext()}\n\n`;
};

/**
 * Wraps a prompt with standard context information
 * @param prompt - The main prompt content
 * @param includeDateTime - Whether to include current date/time context
 * @returns Enhanced prompt with context
 */
export const enhancePromptWithContext = (prompt: string, includeDateTime: boolean = true): string => {
  const context = createPromptContext(includeDateTime);
  return `${context}${prompt}`;
};

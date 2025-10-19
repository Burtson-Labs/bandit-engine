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

// Bandit Engine Watermark: BL-WM-A756-0BD249
const __banditFingerprint_types_configts = 'BL-FP-858EA4-7849';
const __auditTrail_types_configts = 'BL-AU-MGOIKVW9-CHTQ';
// File: config.ts | Path: src/types/config.ts | Hash: a7567849

export interface StoredBrandingConfig {
  brandingText?: string;
  logoBase64?: string | null;
  theme?: string;
  hasTransparentLogo?: boolean;
  userSaved?: boolean;
  [key: string]: unknown;
}

export interface StoredModelConfig {
  name?: string;
  tagline?: string;
  systemPrompt?: string;
  selectedModel?: string;
  [key: string]: unknown;
}

export interface StoredBanditConfigRecord {
  id: string;
  branding?: StoredBrandingConfig;
  model?: StoredModelConfig;
  name?: string;
  tagline?: string;
  systemPrompt?: string;
  selectedModel?: string;
  avatarBase64?: string;
  commands?: unknown;
  [key: string]: unknown;
}

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

// Bandit Engine Watermark: BL-WM-8D83-ED009B
const __banditFingerprint_aiprovider_indexts = 'BL-FP-0392D7-6D15';
const __auditTrail_aiprovider_indexts = 'BL-AU-MGOIKVVP-AL5U';
// File: index.ts | Path: src/services/ai-provider/index.ts | Hash: 8d836d15

// Types
export * from './types/common.types';

// Interfaces
export * from './interfaces/ai-provider.interface';

// Providers
export * from './providers/ollama.provider';
export * from './providers/openai.provider';
export * from './providers/azure-openai.provider';
export * from './providers/anthropic.provider';
export * from './providers/xai.provider';
export * from './providers/bandit-ai.provider';
export * from './providers/gateway.provider';

// Deprecation utilities
export * from './providers/deprecated';

// Factory
export * from './ai-provider.factory';

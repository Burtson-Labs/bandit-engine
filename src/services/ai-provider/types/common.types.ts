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

// Bandit Engine Watermark: BL-WM-C0F4-A852E5
const __banditFingerprint_types_commontypests = 'BL-FP-DF0035-B29D';
const __auditTrail_types_commontypests = 'BL-AU-MGOIKVVR-SFSG';
// File: common.types.ts | Path: src/services/ai-provider/types/common.types.ts | Hash: c0f4b29d

/**
 * Common types used across all AI providers
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIChatRequest {
  model: string;
  messages: AIMessage[];
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  images?: string[];
  options?: Record<string, unknown>;
}

export interface AIChatResponse {
  message: {
    content: string;
    role: 'assistant';
  };
  done?: boolean;
}

export interface AIGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: Record<string, unknown>;
}

export interface AIGenerateResponse {
  response: string;
  done?: boolean;
}

export interface AIModel {
  name: string;
  size?: number;
  details?: {
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
  digest?: string;
  modified_at?: string;
}

export interface AIProviderConfig {
  type: 'ollama' | 'openai' | 'azure-openai' | 'anthropic' | 'xai' | 'bandit' | 'gateway' | 'playground';
  baseUrl?: string;
  apiKey?: string;
  apiVersion?: string; // For Azure
  deploymentName?: string; // For Azure
  defaultModel?: string; // Preferred chat model when using direct providers
  anthropicVersion?: string;
  anthropicMaxTokens?: number;
  gatewayUrl?: string; // For gateway-based providers
  provider?: 'openai' | 'azure-openai' | 'anthropic' | 'ollama' | 'xai' | 'bandit'; // Which backend provider to use via gateway
  tokenFactory?: () => string | null;
}

export enum AIProviderType {
  OLLAMA = 'ollama',
  OPENAI = 'openai',
  AZURE_OPENAI = 'azure-openai',
  ANTHROPIC = 'anthropic',
  XAI = 'xai',
  BANDIT = 'bandit',
  GATEWAY = 'gateway',
  PLAYGROUND = 'playground'
}

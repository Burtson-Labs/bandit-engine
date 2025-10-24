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

// Bandit Engine Watermark: BL-WM-7AC0-E602AF
const __banditFingerprint_gateway_interfacests = 'BL-FP-2D6DA8-4E2D';
const __auditTrail_gateway_interfacests = 'BL-AU-MGOIKVVT-UF3R';
// File: interfaces.ts | Path: src/services/gateway/interfaces.ts | Hash: 7ac04e2d

export interface GatewayMessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

export interface GatewayMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | GatewayMessageContent[];
  name?: string;
  images?: string[]; // For Ollama's native format
}

export interface GatewayChatRequest {
  model: string;
  messages: GatewayMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  provider?: 'openai' | 'azure-openai' | 'anthropic' | 'ollama' | 'xai';
  stop?: string | string[];
  images?: string[]; // Base64 images for Ollama-style providers
}

export interface GatewayChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta?: {
      role?: string;
      content?: string;
    };
    message?: {
      role: string;
      content: string;
    };
    finish_reason?: string | null;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GatewayGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  provider?: 'openai' | 'azure-openai' | 'anthropic' | 'ollama' | 'xai';
  stop?: string | string[];
}

export interface GatewayGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface GatewayModel {
  id: string;
  name: string;
  provider: string;
  created: number;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface GatewayModelsResponse {
  models: GatewayModel[];
}

export interface GatewayHealthResponse {
  status: 'healthy' | 'unhealthy';
  version: string;
  providers: {
    name: string;
    status: 'available' | 'unavailable';
    models_count: number;
  }[];
  uptime: number;
}

export interface GatewayMemoryRecord {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface GatewayMemoryResponse {
  records: GatewayMemoryRecord[];
  total: number;
  nextCursor?: string | null;
}

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

// Bandit Engine Watermark: BL-WM-BF62-E26961
const __banditFingerprint_interfaces_aiproviderinterfacets = 'BL-FP-07195C-B78C';
const __auditTrail_interfaces_aiproviderinterfacets = 'BL-AU-MGOIKVVP-Z857';
// File: ai-provider.interface.ts | Path: src/services/ai-provider/interfaces/ai-provider.interface.ts | Hash: bf62b78c

import { Observable } from 'rxjs';
import {
  AIChatRequest,
  AIChatResponse,
  AIGenerateRequest,
  AIGenerateResponse,
  AIModel,
  AIProviderConfig
} from '../types/common.types';

/**
 * Abstract interface that all AI providers must implement
 */
export interface IAIProvider {
  /**
   * Send a chat request and receive streaming responses
   */
  chat(request: AIChatRequest): Observable<AIChatResponse>;

  /**
   * Generate a response from a prompt
   */
  generate(request: AIGenerateRequest): Observable<AIGenerateResponse>;

  /**
   * List available models
   */
  listModels(): Observable<AIModel[]>;

  /**
   * Validate if the service is available
   */
  validateServiceAvailability(args: { 
    fallbackUrl?: string; 
    timeoutMs: number; 
  }): Promise<{ url: string; isAvailable: boolean }>;

  /**
   * Get the provider type
   */
  getProviderType(): string;

  /**
   * Get the current configuration
   */
  getConfig(): AIProviderConfig;
}
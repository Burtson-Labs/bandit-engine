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

// Bandit Engine Watermark: BL-WM-76E6-8DEDE6
const __banditFingerprint_gateway_ollamagatewayservicets = 'BL-FP-124FB6-97C7';
const __auditTrail_gateway_ollamagatewayservicets = 'BL-AU-MGOIKVVU-PU6T';
// File: ollama-gateway.service.ts | Path: src/services/gateway/ollama-gateway.service.ts | Hash: 76e697c7

import { GatewayService } from './gateway.service';
import { GatewayChatRequest, GatewayChatResponse, GatewayGenerateRequest, GatewayGenerateResponse, GatewayModel } from './interfaces';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { debugLogger } from '../logging/debugLogger';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[]; // Ollama supports image inputs
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  options?: Record<string, unknown>;
  images?: string[];
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  images?: string[];
  options?: Record<string, unknown>;
}

export class OllamaGatewayService {
  private _gatewayService: GatewayService;

  constructor(
    gatewayUrl: string,
    tokenFactory: () => string | null
  ) {
    this._gatewayService = new GatewayService(gatewayUrl, tokenFactory);
    debugLogger.info('OllamaGatewayService initialized', { gatewayUrl });
  }

  /**
   * Validates the availability of the gateway service for Ollama
   */
  async validateServiceAvailability(args: { fallbackUrl?: string; timeoutMs: number; }): Promise<{ url: string, isAvailable: boolean }> {
    return this._gatewayService.validateServiceAvailability(args);
  }

  /**
   * Chat completion using Ollama through the gateway
   */
  chat(request: OllamaChatRequest): Observable<GatewayChatResponse> {
    const gatewayRequest: GatewayChatRequest = {
      ...request,
      provider: 'ollama'
    };

    debugLogger.debug('Ollama Gateway chat request', { 
      model: request.model, 
      messageCount: request.messages.length,
      stream: request.stream,
      hasImages: !!(request.images && request.images.length > 0)
    });

    return this._gatewayService.chat(gatewayRequest);
  }

  /**
   * Text generation using Ollama through the gateway
   */
  generate(request: OllamaGenerateRequest): Observable<GatewayGenerateResponse> {
    const gatewayRequest: GatewayGenerateRequest = {
      ...request,
      provider: 'ollama'
    };

    debugLogger.debug('Ollama Gateway generate request', { 
      model: request.model, 
      promptLength: request.prompt.length,
      stream: request.stream,
      hasImages: !!(request.images && request.images.length > 0)
    });

    return this._gatewayService.generate(gatewayRequest);
  }

  /**
   * List available Ollama models through the gateway
   */
  listModels(): Observable<GatewayModel[]> {
    debugLogger.debug('Fetching Ollama models through gateway');
    return this._gatewayService.listModelsByProvider('ollama');
  }

  /**
   * Get gateway health with Ollama provider status
   */
  getHealth() {
    return this._gatewayService.getHealth().pipe(
      map(health => ({
        ...health,
        ollama_status: health.providers.find(p => p.name === 'ollama')?.status || 'unavailable'
      }))
    );
  }
}

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

// Bandit Engine Watermark: BL-WM-1D46-424011
const __banditFingerprint_gateway_openaigatewayservicets = 'BL-FP-DEEDDF-C675';
const __auditTrail_gateway_openaigatewayservicets = 'BL-AU-MGOIKVVU-ZD2R';
// File: openai-gateway.service.ts | Path: src/services/gateway/openai-gateway.service.ts | Hash: 1d46c675

import { GatewayService } from './gateway.service';
import { GatewayChatRequest, GatewayChatResponse, GatewayGenerateRequest, GatewayGenerateResponse, GatewayModel } from './interfaces';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { debugLogger } from '../logging/debugLogger';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface OpenAIChatRequest {
  model: string;
  messages: OpenAIMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
}

export class OpenAIGatewayService {
  private _gatewayService: GatewayService;

  constructor(
    gatewayUrl: string,
    tokenFactory: () => string | null
  ) {
    this._gatewayService = new GatewayService(gatewayUrl, tokenFactory);
    debugLogger.info('OpenAIGatewayService initialized', { gatewayUrl });
  }

  /**
   * Validates the availability of the gateway service for OpenAI
   */
  async validateServiceAvailability(args: { fallbackUrl?: string; timeoutMs: number; }): Promise<{ url: string, isAvailable: boolean }> {
    return this._gatewayService.validateServiceAvailability(args);
  }

  /**
   * Chat completion using OpenAI through the gateway
   */
  chat(request: OpenAIChatRequest): Observable<GatewayChatResponse> {
    const gatewayRequest: GatewayChatRequest = {
      ...request,
      provider: 'openai'
    };

    debugLogger.debug('OpenAI Gateway chat request', { 
      model: request.model, 
      messageCount: request.messages.length,
      stream: request.stream 
    });

    return this._gatewayService.chat(gatewayRequest);
  }

  /**
   * Text completion using OpenAI through the gateway
   */
  complete(prompt: string, options: {
    model: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    stop?: string | string[];
  }): Observable<GatewayGenerateResponse> {
    const gatewayRequest: GatewayGenerateRequest = {
      model: options.model,
      prompt,
      temperature: options.temperature,
      max_tokens: options.max_tokens,
      stream: options.stream,
      stop: options.stop,
      provider: 'openai'
    };

    debugLogger.debug('OpenAI Gateway completion request', { 
      model: options.model, 
      promptLength: prompt.length,
      stream: options.stream 
    });

    return this._gatewayService.generate(gatewayRequest);
  }

  /**
   * List available OpenAI models through the gateway
   */
  listModels(): Observable<GatewayModel[]> {
    debugLogger.debug('Fetching OpenAI models through gateway');
    return this._gatewayService.listModelsByProvider('openai');
  }

  /**
   * Get gateway health with OpenAI provider status
   */
  getHealth() {
    return this._gatewayService.getHealth().pipe(
      map(health => ({
        ...health,
        openai_status: health.providers.find(p => p.name === 'openai')?.status || 'unavailable'
      }))
    );
  }
}

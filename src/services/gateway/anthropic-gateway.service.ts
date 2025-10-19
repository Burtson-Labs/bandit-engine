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

// Bandit Engine Watermark: BL-WM-8264-DAEB3A
const __banditFingerprint_gateway_anthropicgatewayservicets = 'BL-FP-CA4EB6-817C';
const __auditTrail_gateway_anthropicgatewayservicets = 'BL-AU-MGOIKVVS-X7J4';
// File: anthropic-gateway.service.ts | Path: src/services/gateway/anthropic-gateway.service.ts | Hash: 8264817c

import { GatewayService } from './gateway.service';
import { GatewayChatRequest, GatewayChatResponse, GatewayGenerateRequest, GatewayGenerateResponse, GatewayModel } from './interfaces';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { debugLogger } from '../logging/debugLogger';

export interface AnthropicMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface AnthropicChatRequest {
  model: string;
  messages: AnthropicMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stop_sequences?: string[];
  system?: string; // Anthropic uses separate system parameter
}

export class AnthropicGatewayService {
  private _gatewayService: GatewayService;

  constructor(
    gatewayUrl: string,
    tokenFactory: () => string | null
  ) {
    this._gatewayService = new GatewayService(gatewayUrl, tokenFactory);
    debugLogger.info('AnthropicGatewayService initialized', { gatewayUrl });
  }

  /**
   * Validates the availability of the gateway service for Anthropic
   */
  async validateServiceAvailability(args: { fallbackUrl?: string; timeoutMs: number; }): Promise<{ url: string, isAvailable: boolean }> {
    return this._gatewayService.validateServiceAvailability(args);
  }

  /**
   * Chat completion using Anthropic through the gateway
   */
  chat(request: AnthropicChatRequest): Observable<GatewayChatResponse> {
    // Convert Anthropic-specific request to gateway format
    const gatewayRequest: GatewayChatRequest = {
      model: request.model,
      messages: request.messages,
      stream: request.stream,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
      stop: request.stop_sequences,
      provider: 'anthropic'
    };

    debugLogger.debug('Anthropic Gateway chat request', { 
      model: request.model, 
      messageCount: request.messages.length,
      stream: request.stream,
      hasSystem: !!request.system
    });

    return this._gatewayService.chat(gatewayRequest);
  }

  /**
   * Text completion using Anthropic through the gateway
   */
  complete(prompt: string, options: {
    model: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    stop_sequences?: string[];
    system?: string;
  }): Observable<GatewayGenerateResponse> {
    const gatewayRequest: GatewayGenerateRequest = {
      model: options.model,
      prompt,
      temperature: options.temperature,
      max_tokens: options.max_tokens,
      stream: options.stream,
      stop: options.stop_sequences,
      provider: 'anthropic'
    };

    debugLogger.debug('Anthropic Gateway completion request', { 
      model: options.model, 
      promptLength: prompt.length,
      stream: options.stream,
      hasSystem: !!options.system
    });

    return this._gatewayService.generate(gatewayRequest);
  }

  /**
   * List available Anthropic models through the gateway
   */
  listModels(): Observable<GatewayModel[]> {
    debugLogger.debug('Fetching Anthropic models through gateway');
    return this._gatewayService.listModelsByProvider('anthropic');
  }

  /**
   * Get gateway health with Anthropic provider status
   */
  getHealth() {
    return this._gatewayService.getHealth().pipe(
      map(health => ({
        ...health,
        anthropic_status: health.providers.find(p => p.name === 'anthropic')?.status || 'unavailable'
      }))
    );
  }

  /**
   * Helper method to convert system message to Anthropic format
   * Anthropic treats system messages differently - they can be separate from messages
   */
  private extractSystemMessage(messages: AnthropicMessage[]): { messages: AnthropicMessage[], system?: string } {
    const systemMessage = messages.find(msg => msg.role === 'system');
    const userMessages = messages.filter(msg => msg.role !== 'system');
    
    return {
      messages: userMessages,
      system: systemMessage?.content
    };
  }

  /**
   * Enhanced chat method that handles Anthropic's system message format
   */
  chatWithSystem(request: AnthropicChatRequest): Observable<GatewayChatResponse> {
    const { messages, system } = this.extractSystemMessage(request.messages);
    
    const enhancedRequest: AnthropicChatRequest = {
      ...request,
      messages,
      system: system || request.system
    };

    return this.chat(enhancedRequest);
  }
}

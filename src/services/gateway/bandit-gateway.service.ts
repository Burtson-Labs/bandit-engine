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

// Bandit Engine Watermark: BL-WM-5C48-8D1103
const __banditFingerprint_gateway_banditgatewayservicets = 'BL-FP-37A8F1-0E5B';
const __auditTrail_gateway_banditgatewayservicets = 'BL-AU-MGOIKVVS-DH4W';
// File: bandit-gateway.service.ts | Path: src/services/gateway/bandit-gateway.service.ts | Hash: 5c488d11

import { GatewayService } from './gateway.service';
import {
  GatewayChatRequest,
  GatewayChatResponse,
  GatewayGenerateRequest,
  GatewayGenerateResponse,
  GatewayMessage,
  GatewayMessageContent,
  GatewayModel
} from './interfaces';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { debugLogger } from '../logging/debugLogger';

export interface BanditAIChatRequest {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: unknown }>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stop?: string | string[];
}

const normalizeBanditModel = (model: string | undefined): string => {
  if (typeof model !== 'string' || model.trim() === '') {
    return 'bandit-core-1';
  }
  const normalized = model.replace(/^bandit:/, '').trim();
  return normalized === '' ? 'bandit-core-1' : normalized;
};

const isGatewayMessageContent = (value: unknown): value is GatewayMessageContent => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as GatewayMessageContent;
  if (candidate.type !== 'text' && candidate.type !== 'image_url') {
    return false;
  }
  if (candidate.type === 'text') {
    return typeof candidate.text === 'string';
  }
  if (candidate.type === 'image_url') {
    return !!candidate.image_url && typeof candidate.image_url.url === 'string';
  }
  return false;
};

const normalizeBanditMessages = (
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: unknown }>
): GatewayMessage[] =>
  messages.map((message) => {
    const content = message.content;
    if (typeof content === 'string') {
      return { role: message.role, content };
    }
    if (Array.isArray(content)) {
      const filtered = content.filter(isGatewayMessageContent);
      if (filtered.length === 0) {
        return { role: message.role, content: JSON.stringify(content) };
      }
      return {
        role: message.role,
        content: filtered
      };
    }
    return { role: message.role, content: content != null ? String(content) : '' };
  });

export class BanditAIGatewayService {
  private _gatewayService: GatewayService;

  constructor(
    gatewayUrl: string,
    tokenFactory: () => string | null
  ) {
    this._gatewayService = new GatewayService(gatewayUrl, tokenFactory);
    debugLogger.info('BanditAIGatewayService initialized', { gatewayUrl });
  }

  async validateServiceAvailability(args: { fallbackUrl?: string; timeoutMs: number; }): Promise<{ url: string; isAvailable: boolean }> {
    return this._gatewayService.validateServiceAvailability(args);
  }

  chat(request: BanditAIChatRequest): Observable<GatewayChatResponse> {
    const model = normalizeBanditModel(request.model);
    const messages = normalizeBanditMessages(request.messages);
    const gatewayRequest: GatewayChatRequest = {
      ...request,
      messages,
      model,
      provider: 'bandit',
      stream: request.stream
    };

    debugLogger.debug('Bandit Gateway chat request', {
      model,
      messageCount: request.messages.length,
      stream: request.stream
    });

    return this._gatewayService.chat(gatewayRequest);
  }

  complete(prompt: string, options: {
    model: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    stop?: string | string[];
  }): Observable<GatewayGenerateResponse> {
    const model = normalizeBanditModel(options.model);
    const gatewayRequest: GatewayGenerateRequest = {
      model,
      prompt,
      temperature: options.temperature,
      max_tokens: options.max_tokens,
      stream: options.stream,
      stop: options.stop,
      provider: 'bandit'
    };

    debugLogger.debug('Bandit Gateway generate request', {
      model,
      promptLength: prompt.length,
      stream: options.stream
    });

    return this._gatewayService.generate(gatewayRequest);
  }

  listModels(): Observable<GatewayModel[]> {
    debugLogger.debug('Fetching Bandit models through gateway');
    return this._gatewayService.listModelsByProvider('bandit');
  }

  getHealth() {
    return this._gatewayService.getHealth().pipe(
      map(health => ({
        ...health,
        bandit_status: health.providers.find(p => p.name === 'bandit')?.status || 'unavailable'
      }))
    );
  }
}

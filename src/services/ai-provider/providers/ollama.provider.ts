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

// Bandit Engine Watermark: BL-WM-A59E-4B6F9C
const __banditFingerprint_providers_ollamaproviderts = 'BL-FP-89E894-7B5E';
const __auditTrail_providers_ollamaproviderts = 'BL-AU-MGOIKVVQ-QJIU';
// File: ollama.provider.ts | Path: src/services/ai-provider/providers/ollama.provider.ts | Hash: a59e7b5e

import { Observable, map } from 'rxjs';
import { OllamaService } from '../../ollama/ollama.service';
import { IAIProvider } from '../interfaces/ai-provider.interface';
import {
  AIChatRequest,
  AIChatResponse,
  AIGenerateRequest,
  AIGenerateResponse,
  AIModel,
  AIProviderConfig,
  AIProviderType
} from '../types/common.types';
import { debugLogger } from '../../logging/debugLogger';
import { deprecatedOllamaProvider } from './deprecated';

/**
 * Ollama provider implementation that wraps the existing OllamaService
 */
export class OllamaProvider implements IAIProvider {
  private ollamaService: OllamaService;
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    deprecatedOllamaProvider(); // Show info about gateway option for production
    this.config = config;
    const baseUrl = config.baseUrl || 'http://localhost:11434';
    debugLogger.info("OllamaProvider: Constructor", { 
      configBaseUrl: config.baseUrl,
      finalBaseUrl: baseUrl,
      hasTokenFactory: !!config.tokenFactory 
    });
    this.ollamaService = new OllamaService(
      baseUrl,
      config.tokenFactory || (() => null)
    );
  }

  chat(request: AIChatRequest): Observable<AIChatResponse> {
    // Transform common request to Ollama-specific format
    const ollamaRequest = {
      model: request.model,
      messages: request.messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      })),
      stream: request.stream,
      options: request.options,
      images: request.images
    };

    return this.ollamaService.chat(ollamaRequest).pipe(
      map(response => ({
        message: {
          content: response.message.content,
          role: 'assistant' as const
        },
        done: response.done
      }))
    );
  }

  generate(request: AIGenerateRequest): Observable<AIGenerateResponse> {
    // Transform common request to Ollama-specific format
    const ollamaRequest = {
      model: request.model,
      prompt: request.prompt,
      stream: request.stream,
      options: request.options
    };

    return this.ollamaService.generate(ollamaRequest).pipe(
      map(response => ({
        response: response.response,
        done: response.done
      }))
    );
  }

  listModels(): Observable<AIModel[]> {
    return this.ollamaService.listModels().pipe(
      map(models => models.map(model => ({
        name: model.name,
        size: model.size,
        details: model.details,
        digest: model.digest,
        modified_at: model.modified_at
      })))
    );
  }

  async validateServiceAvailability(args: { 
    fallbackUrl?: string; 
    timeoutMs: number; 
  }): Promise<{ url: string; isAvailable: boolean }> {
    return this.ollamaService.validateServiceAvailability({
      fallbackUrl: args.fallbackUrl || '',
      timeoutMs: args.timeoutMs
    });
  }

  getProviderType(): string {
    return AIProviderType.OLLAMA;
  }

  getConfig(): AIProviderConfig {
    return this.config;
  }
}
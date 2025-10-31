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

// Bandit Engine Watermark: BL-WM-0C91-217979
const __banditFingerprint_providers_gatewayproviderts = 'BL-FP-4F2F4F-2A21';
const __auditTrail_providers_gatewayproviderts = 'BL-AU-MGOIKVVQ-MHFK';
// File: gateway.provider.ts | Path: src/services/ai-provider/providers/gateway.provider.ts | Hash: 0c912a21

import { Observable, map } from 'rxjs';
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
import { GatewayService } from '../../gateway/gateway.service';
import { OpenAIGatewayService } from '../../gateway/openai-gateway.service';
import { AzureOpenAIGatewayService } from '../../gateway/azure-openai-gateway.service';
import { AnthropicGatewayService } from '../../gateway/anthropic-gateway.service';
import { OllamaGatewayService } from '../../gateway/ollama-gateway.service';
import { BanditAIGatewayService } from '../../gateway/bandit-gateway.service';
import { 
  GatewayChatRequest,
  GatewayMessage,
  GatewayMessageContent
} from '../../gateway/interfaces';

/**
 * Gateway provider implementation that routes requests through the .NET gateway API
 * This consolidates all AI provider logic behind a single gateway endpoint
 */
export class GatewayProvider implements IAIProvider {
  private config: AIProviderConfig;
  private gatewayService: GatewayService;
  private providerSpecificService: OpenAIGatewayService | AzureOpenAIGatewayService | AnthropicGatewayService | OllamaGatewayService | BanditAIGatewayService | null = null;

  constructor(config: AIProviderConfig) {
    this.config = config;
    
    if (!config.gatewayUrl) {
      throw new Error('Gateway provider requires gatewayUrl in config');
    }
    
    if (!config.provider) {
      throw new Error('Gateway provider requires provider field to specify backend (openai, azure-openai, anthropic, ollama)');
    }

    const tokenFactory = config.tokenFactory || (() => null);
    this.gatewayService = new GatewayService(config.gatewayUrl, tokenFactory);

    // Create provider-specific service for enhanced functionality
    this.createProviderSpecificService(config.gatewayUrl, tokenFactory);

    debugLogger.info('GatewayProvider initialized', { 
      gatewayUrl: config.gatewayUrl,
      backendProvider: config.provider
    });
  }

  private createProviderSpecificService(gatewayUrl: string, tokenFactory: () => string | null) {
    switch (this.config.provider) {
      case 'openai':
        this.providerSpecificService = new OpenAIGatewayService(gatewayUrl, tokenFactory);
        break;
      case 'azure-openai':
        if (!this.config.deploymentName || !this.config.apiVersion) {
          throw new Error('Azure OpenAI gateway provider requires deploymentName and apiVersion');
        }
        this.providerSpecificService = new AzureOpenAIGatewayService(
          gatewayUrl, 
          tokenFactory,
          {
            deploymentName: this.config.deploymentName,
            apiVersion: this.config.apiVersion
          }
        );
        break;
      case 'anthropic':
        this.providerSpecificService = new AnthropicGatewayService(gatewayUrl, tokenFactory);
        break;
      case 'bandit':
        this.providerSpecificService = new BanditAIGatewayService(gatewayUrl, tokenFactory);
        break;
      case 'ollama':
        this.providerSpecificService = new OllamaGatewayService(gatewayUrl, tokenFactory);
        break;
      default:
        debugLogger.warn('Unknown provider for gateway, using generic gateway service', { 
          provider: this.config.provider 
        });
    }
  }

  chat(request: AIChatRequest): Observable<AIChatResponse> {
    // Convert AI request to standardized gateway request format
    // The gateway API will handle provider-specific transformations
    
    const messages: GatewayMessage[] = request.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Handle images based on provider type
    const normalizeImageUrl = (value: string) => {
      if (!value) {
        return value;
      }
      const trimmed = value.trim();
      if (/^data:/i.test(trimmed) || /^https?:\/\//i.test(trimmed)) {
        return trimmed;
      }
      return `data:image/jpeg;base64,${trimmed}`;
    };

    if (request.images && request.images.length > 0) {
      const lastUserMessageIndex = messages.map(m => m.role).lastIndexOf('user');

      if (this.config.provider === 'ollama') {
        // Ollama: attach images directly to the last user message
        if (lastUserMessageIndex !== -1) {
          messages[lastUserMessageIndex] = {
            ...messages[lastUserMessageIndex],
            images: request.images
          };
        }
      } else if (['openai', 'azure-openai', 'anthropic', 'bandit'].includes(this.config.provider || '')) {
        // OpenAI/Azure/Anthropic: convert to structured content format
        if (lastUserMessageIndex !== -1) {
          const currentMessage = messages[lastUserMessageIndex];
          const contentArray: GatewayMessageContent[] = [
            {
              type: 'text',
              text: currentMessage.content as string
            }
          ];

          // Add images as image_url content
          request.images.forEach(imageRef => {
            contentArray.push({
              type: 'image_url',
              image_url: {
                url: normalizeImageUrl(imageRef),
                detail: 'auto'
              }
            });
          });

          messages[lastUserMessageIndex] = {
            ...messages[lastUserMessageIndex],
            content: contentArray
          };
          debugLogger.debug('Gateway provider injected image attachments', {
            provider: this.config.provider,
            imageCount: request.images.length,
            messageIndex: lastUserMessageIndex
          });
        }
      }
    }
    
    const gatewayRequest: GatewayChatRequest = {
      model: request.model,
      messages,
      stream: request.stream,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      provider: this.config.provider,
      // Only include top-level images for Ollama (fallback)
      images: this.config.provider === 'ollama' ? request.images : undefined
    };

    debugLogger.debug('Gateway provider chat request', { 
      model: request.model,
      provider: this.config.provider,
      messageCount: request.messages.length,
      stream: request.stream,
      hasImages: !!(request.images && request.images.length > 0),
      imageCount: request.images?.length || 0,
      imageStrategy: this.config.provider === 'ollama' 
        ? 'message-level-array' 
        : ['openai', 'azure-openai', 'anthropic'].includes(this.config.provider || '')
          ? 'structured-content'
          : 'top-level-fallback',
      finalMessages: messages.map(m => ({ 
        role: m.role, 
        hasImages: Array.isArray(m.images) && m.images.length > 0,
        contentType: Array.isArray(m.content) ? 'structured' : 'text'
      }))
    });

    return this.gatewayService.chat(gatewayRequest).pipe(
      map(response => ({
        message: {
          content: response.choices?.[0]?.message?.content || 
                   response.choices?.[0]?.delta?.content || '',
          role: 'assistant' as const
        },
        done: response.choices?.[0]?.finish_reason === 'stop' || response.choices?.[0]?.finish_reason === 'length'
      }))
    );
  }

  generate(request: AIGenerateRequest): Observable<AIGenerateResponse> {
    const gatewayRequest = {
      model: request.model,
      prompt: request.prompt,
      stream: request.stream,
      provider: this.config.provider
    };

    debugLogger.debug('Gateway provider generate request', { 
      model: request.model,
      provider: this.config.provider,
      promptLength: request.prompt.length,
      stream: request.stream 
    });

    return this.gatewayService.generate(gatewayRequest).pipe(
      map(response => ({
        response: response.response || '',
        done: response.done || false
      }))
    );
  }

  listModels(): Observable<AIModel[]> {
    debugLogger.debug('Gateway provider listing models', { provider: this.config.provider });
    
    if (this.config.provider) {
      return this.gatewayService.listModelsByProvider(this.config.provider).pipe(
        map(models => models.map(model => ({
          name: model.id || model.name,
          size: model.size,
          details: model.details,
          digest: model.digest,
          modified_at: model.modified_at
        })))
      );
    } else {
      // List all models from all providers
      return this.gatewayService.listModels().pipe(
        map(models => models.map(model => ({
          name: model.id || model.name,
          size: model.size,
          details: model.details,
          digest: model.digest,
          modified_at: model.modified_at
        })))
      );
    }
  }

  async validateServiceAvailability(args: { 
    fallbackUrl?: string; 
    timeoutMs: number; 
  }): Promise<{ url: string; isAvailable: boolean }> {
    debugLogger.debug('Gateway provider validating service availability');
    return this.gatewayService.validateServiceAvailability(args);
  }

  getProviderType(): string {
    return AIProviderType.GATEWAY;
  }

  getConfig(): AIProviderConfig {
    return this.config;
  }

  /**
   * Get the backend provider type
   */
  getBackendProvider(): string | undefined {
    return this.config.provider;
  }

  /**
   * Get gateway health including backend provider status
   */
  getHealth() {
    return this.gatewayService.getHealth().pipe(
      map(health => ({
        ...health,
        backend_provider: this.config.provider,
        backend_provider_status: health.providers.find(p => p.name === this.config.provider)?.status || 'unavailable'
      }))
    );
  }

  /**
   * Use provider-specific service if available for enhanced functionality
   */
  getProviderSpecificService(): OpenAIGatewayService | AzureOpenAIGatewayService | AnthropicGatewayService | OllamaGatewayService | BanditAIGatewayService | null {
    return this.providerSpecificService;
  }
}

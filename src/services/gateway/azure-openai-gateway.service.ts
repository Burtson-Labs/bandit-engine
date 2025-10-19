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

// Bandit Engine Watermark: BL-WM-9B34-38B0E8
const __banditFingerprint_gateway_azureopenaigatewayservicets = 'BL-FP-4A759E-00DC';
const __auditTrail_gateway_azureopenaigatewayservicets = 'BL-AU-MGOIKVVT-GARS';
// File: azure-openai-gateway.service.ts | Path: src/services/gateway/azure-openai-gateway.service.ts | Hash: 9b3400dc

import { GatewayService } from './gateway.service';
import { GatewayChatRequest, GatewayChatResponse, GatewayGenerateRequest, GatewayGenerateResponse, GatewayModel } from './interfaces';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { debugLogger } from '../logging/debugLogger';

export interface AzureOpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface AzureOpenAIChatRequest {
  model: string; // This will be the deployment name for Azure
  messages: AzureOpenAIMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
}

export interface AzureOpenAIConfig {
  deploymentName: string;
  apiVersion: string;
  resourceName?: string; // For endpoint construction if needed
}

export class AzureOpenAIGatewayService {
  private _gatewayService: GatewayService;
  private _azureConfig: AzureOpenAIConfig;

  constructor(
    gatewayUrl: string,
    tokenFactory: () => string | null,
    azureConfig: AzureOpenAIConfig
  ) {
    this._gatewayService = new GatewayService(gatewayUrl, tokenFactory);
    this._azureConfig = azureConfig;
    debugLogger.info('AzureOpenAIGatewayService initialized', { 
      gatewayUrl, 
      deploymentName: azureConfig.deploymentName,
      apiVersion: azureConfig.apiVersion 
    });
  }

  /**
   * Validates the availability of the gateway service for Azure OpenAI
   */
  async validateServiceAvailability(args: { fallbackUrl?: string; timeoutMs: number; }): Promise<{ url: string, isAvailable: boolean }> {
    return this._gatewayService.validateServiceAvailability(args);
  }

  /**
   * Chat completion using Azure OpenAI through the gateway
   */
  chat(request: AzureOpenAIChatRequest): Observable<GatewayChatResponse> {
    const gatewayRequest: GatewayChatRequest = {
      ...request,
      model: this._azureConfig.deploymentName, // Use deployment name as model
      provider: 'azure-openai'
    };

    debugLogger.debug('Azure OpenAI Gateway chat request', { 
      deploymentName: this._azureConfig.deploymentName,
      apiVersion: this._azureConfig.apiVersion,
      messageCount: request.messages.length,
      stream: request.stream 
    });

    return this._gatewayService.chat(gatewayRequest);
  }

  /**
   * Text completion using Azure OpenAI through the gateway
   */
  complete(prompt: string, options: {
    model?: string; // Optional override for deployment name
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    stop?: string | string[];
  }): Observable<GatewayGenerateResponse> {
    const gatewayRequest: GatewayGenerateRequest = {
      model: options.model || this._azureConfig.deploymentName,
      prompt,
      temperature: options.temperature,
      max_tokens: options.max_tokens,
      stream: options.stream,
      stop: options.stop,
      provider: 'azure-openai'
    };

    debugLogger.debug('Azure OpenAI Gateway completion request', { 
      deploymentName: options.model || this._azureConfig.deploymentName,
      promptLength: prompt.length,
      stream: options.stream 
    });

    return this._gatewayService.generate(gatewayRequest);
  }

  /**
   * List available Azure OpenAI models through the gateway
   */
  listModels(): Observable<GatewayModel[]> {
    debugLogger.debug('Fetching Azure OpenAI models through gateway');
    return this._gatewayService.listModelsByProvider('azure-openai');
  }

  /**
   * Get gateway health with Azure OpenAI provider status
   */
  getHealth() {
    return this._gatewayService.getHealth().pipe(
      map(health => ({
        ...health,
        azure_openai_status: health.providers.find(p => p.name === 'azure-openai')?.status || 'unavailable',
        azure_config: {
          deploymentName: this._azureConfig.deploymentName,
          apiVersion: this._azureConfig.apiVersion
        }
      }))
    );
  }

  /**
   * Update Azure configuration
   */
  updateAzureConfig(newConfig: Partial<AzureOpenAIConfig>) {
    this._azureConfig = { ...this._azureConfig, ...newConfig };
    debugLogger.info('Azure OpenAI configuration updated', this._azureConfig);
  }

  /**
   * Get current Azure configuration
   */
  getAzureConfig(): AzureOpenAIConfig {
    return { ...this._azureConfig };
  }
}

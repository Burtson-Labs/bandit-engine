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

// Bandit Engine Watermark: BL-WM-AED4-661A13
const __banditFingerprint_aiprovider_aiproviderfactoryts = 'BL-FP-C75FF8-443D';
const __auditTrail_aiprovider_aiproviderfactoryts = 'BL-AU-MGOIKVVP-DXHW';
// File: ai-provider.factory.ts | Path: src/services/ai-provider/ai-provider.factory.ts | Hash: aed4443d

import { IAIProvider } from './interfaces/ai-provider.interface';
import { AIProviderConfig, AIProviderType } from './types/common.types';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { AzureOpenAIProvider } from './providers/azure-openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GatewayProvider } from './providers/gateway.provider';
import { PlaygroundProvider } from './providers/playground.provider';

/**
 * Factory for creating AI provider instances
 */
export class AIProviderFactory {
  static createProvider(config: AIProviderConfig): IAIProvider {
    switch (config.type) {
      case AIProviderType.OLLAMA:
        return new OllamaProvider(config);
      
      case AIProviderType.OPENAI:
        return new OpenAIProvider(config);
      
      case AIProviderType.AZURE_OPENAI:
        return new AzureOpenAIProvider(config);
      
      case AIProviderType.ANTHROPIC:
        return new AnthropicProvider(config);
      
      case AIProviderType.GATEWAY:
        return new GatewayProvider(config);

      case AIProviderType.PLAYGROUND:
        return new PlaygroundProvider(config);
      
      default:
        throw new Error(`Unsupported AI provider type: ${config.type}`);
    }
  }

  static getSupportedProviders(): AIProviderType[] {
    return [
      AIProviderType.OLLAMA,
      AIProviderType.OPENAI,
      AIProviderType.AZURE_OPENAI,
      AIProviderType.ANTHROPIC,
      AIProviderType.GATEWAY,
      AIProviderType.PLAYGROUND
    ];
  }

  static validateConfig(config: AIProviderConfig): boolean {
    switch (config.type) {
      case AIProviderType.OLLAMA:
        return true; // Ollama only needs baseUrl which has defaults
      
      case AIProviderType.OPENAI:
        return !!config.apiKey;
      
      case AIProviderType.AZURE_OPENAI:
        return !!(config.baseUrl && config.apiKey && config.apiVersion && config.deploymentName);
      
      case AIProviderType.ANTHROPIC:
        return !!config.apiKey;
      
      case AIProviderType.GATEWAY:
        return !!(config.gatewayUrl && config.provider);

      case AIProviderType.PLAYGROUND:
        return true;
      
      default:
        return false;
    }
  }
}

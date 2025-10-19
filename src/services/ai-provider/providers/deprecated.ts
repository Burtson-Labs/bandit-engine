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

// Bandit Engine Watermark: BL-WM-22FF-7E873B
const __banditFingerprint_providers_deprecatedts = 'BL-FP-DA6749-9B2A';
const __auditTrail_providers_deprecatedts = 'BL-AU-MGOIKVVQ-2ZKO';
// File: deprecated.ts | Path: src/services/ai-provider/providers/deprecated.ts | Hash: 22ff9b2a

import { debugLogger } from '../../logging/debugLogger';
import { AIProviderConfig } from '../types/common.types';

/**
 * Deprecation notices for direct provider implementations
 * 
 * MIGRATION NOTICE: Direct provider implementations are being phased out in favor 
 * of the new unified gateway architecture. Please migrate to gateway-based providers
 * for enhanced security, performance, and centralized management.
 * 
 * See GATEWAY_MIGRATION_GUIDE.md for migration instructions.
 */

/**
 * @deprecated Use GatewayProvider with provider: 'openai' instead
 * 
 * Migration example:
 * ```typescript
 * // Old (deprecated)
 * const config = { type: 'openai', apiKey: 'sk-...', baseUrl: '...' };
 * 
 * // New (recommended)
 * const config = { 
 *   type: 'gateway', 
 *   gatewayUrl: 'https://your-gateway.com',
 *   provider: 'openai',
 *   tokenFactory: () => localStorage.getItem('authToken')
 * };
 * ```
 */
export function deprecatedOpenAIProvider() {
  debugLogger.warn('⚠️  DEPRECATION WARNING: Direct OpenAI provider is deprecated. Please migrate to GatewayProvider with provider: "openai". See GATEWAY_MIGRATION_GUIDE.md for details.');
}

/**
 * @deprecated Use GatewayProvider with provider: 'azure-openai' instead
 * 
 * Migration example:
 * ```typescript
 * // Old (deprecated)
 * const config = { 
 *   type: 'azure-openai', 
 *   baseUrl: 'https://your-resource.openai.azure.com',
 *   apiKey: 'your-key',
 *   apiVersion: '2024-02-15-preview',
 *   deploymentName: 'gpt-4'
 * };
 * 
 * // New (recommended)
 * const config = { 
 *   type: 'gateway', 
 *   gatewayUrl: 'https://your-gateway.com',
 *   provider: 'azure-openai',
 *   deploymentName: 'gpt-4',
 *   apiVersion: '2024-02-15-preview',
 *   tokenFactory: () => localStorage.getItem('authToken')
 * };
 * ```
 */
export function deprecatedAzureOpenAIProvider() {
  debugLogger.warn('⚠️  DEPRECATION WARNING: Direct Azure OpenAI provider is deprecated. Please migrate to GatewayProvider with provider: "azure-openai". See GATEWAY_MIGRATION_GUIDE.md for details.');
}

/**
 * @deprecated Use GatewayProvider with provider: 'anthropic' instead
 * 
 * Migration example:
 * ```typescript
 * // Old (deprecated)
 * const config = { type: 'anthropic', apiKey: 'sk-ant-...', baseUrl: '...' };
 * 
 * // New (recommended)
 * const config = { 
 *   type: 'gateway', 
 *   gatewayUrl: 'https://your-gateway.com',
 *   provider: 'anthropic',
 *   tokenFactory: () => localStorage.getItem('authToken')
 * };
 * ```
 */
export function deprecatedAnthropicProvider() {
  debugLogger.warn('⚠️  DEPRECATION WARNING: Direct Anthropic provider is deprecated. Please migrate to GatewayProvider with provider: "anthropic". See GATEWAY_MIGRATION_GUIDE.md for details.');
}

/**
 * @deprecated Use GatewayProvider with provider: 'ollama' instead for production environments
 * 
 * Note: The direct Ollama provider will remain available for local development,
 * but for production deployments, use the gateway for better management.
 * 
 * Migration example:
 * ```typescript
 * // Development (still supported)
 * const config = { type: 'ollama', baseUrl: 'http://localhost:11434' };
 * 
 * // Production (recommended)
 * const config = { 
 *   type: 'gateway', 
 *   gatewayUrl: 'https://your-gateway.com',
 *   provider: 'ollama',
 *   tokenFactory: () => localStorage.getItem('authToken')
 * };
 * ```
 */
export function deprecatedOllamaProvider() {
  debugLogger.info('ℹ️  INFO: Direct Ollama provider is available for local development. For production environments, consider using GatewayProvider with provider: "ollama" for enhanced management. See GATEWAY_MIGRATION_GUIDE.md for details.');
}

/**
 * Display deprecation summary
 */
export function showDeprecationSummary() {
  debugLogger.warn(`
🏗️  BANDIT ENGINE PROVIDER ARCHITECTURE UPDATE

The Bandit Engine is transitioning to a unified gateway architecture for enhanced:
• Security (centralized API key management)
• Performance (connection pooling, caching)
• Monitoring (unified logging, health checks)
• Scaling (load balancing, failover)

MIGRATION REQUIRED:
• OpenAI Provider → GatewayProvider (provider: 'openai')
• Azure OpenAI Provider → GatewayProvider (provider: 'azure-openai')  
• Anthropic Provider → GatewayProvider (provider: 'anthropic')

MIGRATION RECOMMENDED:
• Ollama Provider → GatewayProvider (provider: 'ollama') for production

📖 Full migration guide: GATEWAY_MIGRATION_GUIDE.md
🆘 Need help? Check the troubleshooting section in the migration guide
  `);
}

/**
 * Check if provider config is using deprecated direct provider
 */
export function isDeprecatedProvider(config: AIProviderConfig | undefined): boolean {
  const deprecatedTypes = ['openai', 'azure-openai', 'anthropic'];
  return deprecatedTypes.includes(config?.type);
}

/**
 * Suggest gateway migration for deprecated config
 */
export function suggestGatewayMigration(config: AIProviderConfig): AIProviderConfig {
  if (!isDeprecatedProvider(config)) {
    return config; // No migration needed
  }

  const gatewayConfig: AIProviderConfig = {
    type: 'gateway',
    gatewayUrl: '${GATEWAY_URL}', // Replace with your gateway URL
    provider: config.type as 'openai' | 'azure-openai' | 'anthropic' | 'ollama',
    tokenFactory: () => localStorage.getItem('authToken')
  };

  // Preserve Azure-specific config
  if (config.type === 'azure-openai') {
    gatewayConfig.deploymentName = config.deploymentName;
    gatewayConfig.apiVersion = config.apiVersion;
  }

  debugLogger.info('🔄 Suggested gateway migration:', {
    from: config,
    to: gatewayConfig
  });

  return gatewayConfig;
}

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

// Bandit Engine Watermark: BL-WM-BFD5-C74863
const __banditFingerprint_services_aiproviderinitservicets = 'BL-FP-DDF978-53AF';
const __auditTrail_services_aiproviderinitservicets = 'BL-AU-MGOIKVVR-WP87';
// File: ai-provider-init.service.ts | Path: src/services/ai-provider-init.service.ts | Hash: bfd553af

import { useAIProviderStore } from "../store/aiProviderStore";
import { usePackageSettingsStore } from "../store/packageSettingsStore";
import { AIProviderConfig, AIProviderType } from "./ai-provider/types/common.types";
import { authenticationService } from "./auth/authenticationService";
import { debugLogger } from "./logging/debugLogger";
import indexedDBService from "./indexedDB/indexedDBService";

type StoredAIProviderConfig = AIProviderConfig & { id?: string };

/**
 * Service to initialize AI providers based on package settings
 */
export class AIProviderInitService {
  private static instance: AIProviderInitService;

  private constructor() {}

  static getInstance(): AIProviderInitService {
    if (!AIProviderInitService.instance) {
      AIProviderInitService.instance = new AIProviderInitService();
    }
    return AIProviderInitService.instance;
  }

  /**
   * Initialize AI provider from package settings
   * Provides backward compatibility with existing Ollama settings
   */
  async initializeFromSettings(): Promise<void> {
    const settings = usePackageSettingsStore.getState().settings;
    if (!settings) {
      debugLogger.warn("No package settings found, cannot initialize AI provider");
      return;
    }

    let providerConfig: AIProviderConfig;

    debugLogger.info("AI Provider Init: Starting initialization", { 
      hasSettings: !!settings,
      hasAiProvider: !!settings.aiProvider,
      ollamaUrl: settings.ollamaUrl
    });

    const isPlaygroundEnvironment =
      settings.playgroundMode === true ||
      settings.aiProvider?.type === AIProviderType.PLAYGROUND ||
      (settings.gatewayApiUrl?.toLowerCase()?.startsWith("playground://") ?? false) ||
      (typeof window !== "undefined" && window.location.pathname.includes("/playground"));

    // First, try to load provider configuration from IndexedDB
    if (isPlaygroundEnvironment) {
      debugLogger.info("AI Provider Init: Playground environment detected, bypassing saved provider config");
    } else {
      try {
        const savedConfig = await indexedDBService.get<StoredAIProviderConfig>(
          'banditConfig', 
          1, 
          'config', 
          'aiProvider',
          [{ name: 'config', keyPath: 'id' }]
        );
        
        if (savedConfig) {
          debugLogger.info('AI Provider Init: Found saved config in IndexedDB', { type: savedConfig.type });
          
          // Filter out the 'id' property that was added for IndexedDB storage
          const { id: _id, ...configWithoutId } = savedConfig;
          providerConfig = { ...configWithoutId };
          
          // Ensure tokenFactory is present for providers that need it
          if ((providerConfig.type === AIProviderType.OLLAMA || providerConfig.type === AIProviderType.GATEWAY) && !providerConfig.tokenFactory) {
            providerConfig.tokenFactory = () => {
              // Try multiple sources for the token
              let token = authenticationService.getToken();
              
              // If the bandit-engine's service doesn't have a token, try direct localStorage access
              if (!token) {
                token = localStorage.getItem("authToken");
              }
              
              // Also try the authentication store if available
              if (!token) {
                try {
                  const { useAuthenticationStore } = require("../../store/authenticationStore");
                  const authStore = useAuthenticationStore.getState();
                  token = authStore.token;
                } catch (e) {
                  // Store might not be available, that's ok
                }
              }
              
              debugLogger.info("AI Provider Init: IndexedDB config token factory", { 
                hasToken: !!token
              });
              return token;
            };
          }
          
          // Initialize the provider with saved config
          try {
            const { createProvider } = useAIProviderStore.getState();
            createProvider(providerConfig);
            
            const provider = useAIProviderStore.getState().provider;
            if (provider) {
              try {
                await provider.validateServiceAvailability({ timeoutMs: 5000 });
                debugLogger.info(`AI Provider initialized and validated from IndexedDB: ${providerConfig.type}`);
              } catch (validationError) {
                debugLogger.warn(`AI Provider created but validation failed`, { error: validationError });
              }
            }
            return; // Successfully initialized from IndexedDB
          } catch (error) {
            debugLogger.error("Failed to initialize saved provider config, falling back to package settings", { error });
          }
        }
        
        debugLogger.info('AI Provider Init: No saved config found, using package settings');
      } catch (error) {
        debugLogger.warn('AI Provider Init: Failed to load from IndexedDB, using package settings', { error });
      }
    }

    // Fallback to package settings if no saved config found
    if (settings.aiProvider) {
      providerConfig = { ...settings.aiProvider };
      
      // Ensure tokenFactory is present for Ollama providers
      if (providerConfig.type === AIProviderType.OLLAMA && !providerConfig.tokenFactory) {
        providerConfig.tokenFactory = () => {
          // Try multiple sources for the token
          let token = authenticationService.getToken();
          
          // If the bandit-engine's service doesn't have a token, try direct localStorage access
          if (!token) {
            token = localStorage.getItem("authToken");
          }
          
          // Also try the authentication store if available
          if (!token) {
            try {
              const { useAuthenticationStore } = require("../../store/authenticationStore");
              const authStore = useAuthenticationStore.getState();
              token = authStore.token;
            } catch (e) {
              // Store might not be available, that's ok
            }
          }
          
          debugLogger.info("AIProviderInit: Explicit config tokenFactory", { 
            hasToken: !!token,
            localStorage: !!localStorage.getItem("authToken")
          });
          return token;
        };
      }
      
      debugLogger.info("Using explicit AI provider config", providerConfig);
    } else {
      // Fall back to legacy Ollama settings for backward compatibility
      providerConfig = {
        type: AIProviderType.OLLAMA,
        baseUrl: settings.ollamaUrl,
        tokenFactory: () => {
          // Try multiple sources for the token
          let token = authenticationService.getToken();
          
          // If the bandit-engine's service doesn't have a token, try direct localStorage access
          if (!token) {
            token = localStorage.getItem("authToken");
          }
          
          // Also try the authentication store if available
          if (!token) {
            try {
              const { useAuthenticationStore } = require("../../store/authenticationStore");
              const authStore = useAuthenticationStore.getState();
              token = authStore.token;
            } catch (e) {
              // Store might not be available, that's ok
            }
          }
          
          debugLogger.info("AIProviderInit: Token factory called", { 
            hasToken: !!token,
            localStorage: !!localStorage.getItem("authToken")
          });
          return token;
        }
      };
      debugLogger.info("Using legacy Ollama config", providerConfig);
    }

    try {
      // First validate if the service is available
      const { createProvider } = useAIProviderStore.getState();
      
      // Try to create and validate the provider
      createProvider(providerConfig);
      
      // Test provider availability
      const provider = useAIProviderStore.getState().provider;
      if (provider) {
        try {
          await provider.validateServiceAvailability({ timeoutMs: 5000 });
          debugLogger.info(`AI Provider initialized and validated: ${providerConfig.type}`);
        } catch (validationError) {
          debugLogger.warn(`AI Provider created but validation failed:`, { error: validationError });
          // Provider is created but may not be fully available - this is ok for offline scenarios
        }
      }
    } catch (error) {
      debugLogger.error("Failed to initialize AI provider:", { error });
      
      // Try to fall back to default Ollama if initial provider fails
      if (providerConfig.type !== AIProviderType.OLLAMA) {
        try {
          const fallbackConfig: AIProviderConfig = {
            type: AIProviderType.OLLAMA,
            baseUrl: settings.ollamaUrl || 'http://localhost:11434',
            tokenFactory: () => {
              // Try multiple sources for the token
              let token = authenticationService.getToken();
              
              // If the bandit-engine's service doesn't have a token, try direct localStorage access
              if (!token) {
                token = localStorage.getItem("authToken");
              }
              
              // Also try the authentication store if available
              if (!token) {
                try {
                  const { useAuthenticationStore } = require("../../store/authenticationStore");
                  const authStore = useAuthenticationStore.getState();
                  token = authStore.token;
                } catch (e) {
                  // Store might not be available, that's ok
                }
              }
              
              debugLogger.info("AIProviderInit: Fallback tokenFactory", { 
                hasToken: !!token,
                localStorage: !!localStorage.getItem("authToken")
              });
              return token;
            }
          };
          const { createProvider } = useAIProviderStore.getState();
          createProvider(fallbackConfig);
          debugLogger.info("Fallback to Ollama provider successful");
        } catch (fallbackError) {
          debugLogger.error("Failed to initialize fallback Ollama provider:", { error: fallbackError });
        }
      } else {
        // If Ollama provider fails, try localhost as ultimate fallback
        try {
          const localFallbackConfig: AIProviderConfig = {
            type: AIProviderType.OLLAMA,
            baseUrl: 'http://localhost:11434',
            tokenFactory: () => {
              // Try multiple sources for the token
              let token = authenticationService.getToken();
              
              // If the bandit-engine's service doesn't have a token, try direct localStorage access
              if (!token) {
                token = localStorage.getItem("authToken");
              }
              
              // Also try the authentication store if available
              if (!token) {
                try {
                  const { useAuthenticationStore } = require("../../store/authenticationStore");
                  const authStore = useAuthenticationStore.getState();
                  token = authStore.token;
                } catch (e) {
                  // Store might not be available, that's ok
                }
              }
              
              debugLogger.info("AIProviderInit: Local fallback tokenFactory", { 
                hasToken: !!token,
                localStorage: !!localStorage.getItem("authToken")
              });
              return token;
            }
          };
          const { createProvider } = useAIProviderStore.getState();
          createProvider(localFallbackConfig);
          debugLogger.info("Fallback to localhost Ollama provider successful");
        } catch (localFallbackError) {
          debugLogger.error("All provider initialization attempts failed:", { error: localFallbackError });
        }
      }
    }
  }

  /**
   * Switch to a different AI provider
   */
  switchProvider(config: AIProviderConfig): void {
    try {
      const { switchProvider } = useAIProviderStore.getState();
      switchProvider(config);
      debugLogger.info(`Switched to AI provider: ${config.type}`);
    } catch (error) {
      debugLogger.error("Failed to switch AI provider:", { error });
      throw error;
    }
  }

  /**
   * Get the current provider type
   */
  getCurrentProviderType(): string | null {
    const provider = useAIProviderStore.getState().provider;
    return provider ? provider.getProviderType() : null;
  }

  /**
   * Check if a provider is initialized
   */
  isProviderInitialized(): boolean {
    return useAIProviderStore.getState().provider !== null;
  }
}

export const aiProviderInitService = AIProviderInitService.getInstance();

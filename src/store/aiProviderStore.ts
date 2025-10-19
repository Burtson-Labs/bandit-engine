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

// Bandit Engine Watermark: BL-WM-A223-4FC2FA
const __banditFingerprint_store_aiProviderStorets = 'BL-FP-9F95DD-6297';
const __auditTrail_store_aiProviderStorets = 'BL-AU-MGOIKVW3-JR0V';
// File: aiProviderStore.ts | Path: src/store/aiProviderStore.ts | Hash: a2236297

import { create, StoreApi, UseBoundStore } from "zustand";
import { IAIProvider } from "../services/ai-provider/interfaces/ai-provider.interface";
import { AIProviderConfig } from "../services/ai-provider/types/common.types";
import { AIProviderFactory } from "../services/ai-provider/ai-provider.factory";
import { debugLogger } from "../services/logging/debugLogger";

export interface AIProviderStore {
    /**
     * The current AI provider instance.
     * @type {IAIProvider}
     * @default null
     * @description The provider instance used to interact with AI services.
     *  
     * @example
     * const provider = useAIProviderStore((state) => state.provider);
     * const setProvider = useAIProviderStore((state) => state.setProvider);
     * 
     * // Create and set an Ollama provider
     * const ollamaConfig = { type: 'ollama', baseUrl: 'http://localhost:11434' };
     * const ollamaProvider = AIProviderFactory.createProvider(ollamaConfig);
     * setProvider(ollamaProvider);
     *  
     * @returns {IAIProvider | null} The current AI provider instance.
     */
    provider: IAIProvider | null;
    
    /**
     * The current provider configuration
     */
    config: AIProviderConfig | null;
    
    /**
     * Set the provider and config
     */
    setProvider: (provider: IAIProvider | null, config?: AIProviderConfig | null) => void;
    
    /**
     * Create a new provider from config
     */
    createProvider: (config: AIProviderConfig) => void;
    
    /**
     * Switch to a different provider
     */
    switchProvider: (config: AIProviderConfig) => void;
}

/**
 * Use for initializing the AI provider.
 * This is a private interface that extends the AIProviderStore interface.
 * This prevents the singleton service from being initialized multiple times.
 */
export interface AIProviderStoreInit extends AIProviderStore {
    // Additional methods could be added here if needed for internal initialization
}

export const useAIProviderStore = create<AIProviderStore>((set, get) => ({
    provider: null,
    config: null,
    
    setProvider: (provider, config) => set({ provider, config }),
    
    createProvider: (config) => {
        try {
            const provider = AIProviderFactory.createProvider(config);
            set({ provider, config });
        } catch (error) {
            debugLogger.error('Failed to create AI provider:', { error });
            throw error;
        }
    },
    
    switchProvider: (config) => {
        const currentProvider = get().provider;
        try {
            const newProvider = AIProviderFactory.createProvider(config);
            set({ provider: newProvider, config });
        } catch (error) {
            debugLogger.error('Failed to switch AI provider:', { error });
            // Keep the current provider if switching fails
            throw error;
        }
    }
})) as UseBoundStore<StoreApi<AIProviderStore>>;
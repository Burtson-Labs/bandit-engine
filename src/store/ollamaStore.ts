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

// Bandit Engine Watermark: BL-WM-C1F6-BD6AC4
const __banditFingerprint_store_ollamaStorets = 'BL-FP-1D76E1-AB00';
const __auditTrail_store_ollamaStorets = 'BL-AU-MGOIKVW5-UAOX';
// File: ollamaStore.ts | Path: src/store/ollamaStore.ts | Hash: c1f6ab00

import { create, StoreApi, UseBoundStore } from "zustand";
import { OllamaService } from "../services/ollama/ollama.service";
import { useAIProviderStore } from "./aiProviderStore";
import { OllamaProvider } from "../services/ai-provider/providers/ollama.provider";
import { debugLogger } from "../services/logging/debugLogger";

export interface OllamaStore {
    /**
     * The OllamaService client instance.
     * @type {OllamaService}
     * @default null
     * @description The client instance used to interact with the Ollama API.
     *  
     * @example
     * const client = useOllamaStore((state) => state.client);
     * const setClient = useOllamaStore((state) => state.setClient);
     * setClient(new OllamaService("https://new-ollama-gateway.com"));
     *  
     * @returns {OllamaService | null} The current OllamaService client instance.
     */
    client: OllamaService;
}

/**
 * Use for initializing the OllamaService client.
 * This is a private interface that extends the OllamaStore interface.
 * This is prevent the singleton service from being initialized multiple times.
 */
export interface OllamaStoreInit {
    client: OllamaService | null;
    setClient: (client: OllamaService | null) => void;
}

/**
 * Legacy Ollama store with backward compatibility layer.
 * 
 * This store maintains compatibility with existing code while delegating
 * to the new AI provider system when possible.
 * 
 * @deprecated This store is deprecated and will be removed in a future version.
 * Please use the new useAIProviderStore instead, which provides unified provider management.
 * 
 * The new AI provider system automatically handles:
 * - Provider initialization and switching
 * - Authentication tokens
 * - Fallback mechanisms
 * - Multiple provider types (Ollama, OpenAI, etc.)
 * 
 * Migration guide:
 * - Replace useOllamaStore with useAIProviderStore
 * - Use aiProviderInitService for initialization
 * - All provider interactions now go through the unified IAIProvider interface
 */
export const useOllamaStore = create<OllamaStoreInit>((set, get) => ({
    client: null,
    
    setClient: (client) => {
        set({ client });
        
        // If setting an Ollama client, also update the AI provider store
        if (client) {
            try {
                const aiProviderStore = useAIProviderStore.getState();
                const currentProvider = aiProviderStore.provider;
                
                // Only update if there's no provider or it's not already an Ollama provider
                if (!currentProvider || !(currentProvider instanceof OllamaProvider)) {
                    const config = {
                        type: 'ollama' as const,
                        baseUrl: client['_baseUrl'], // Access private property
                        tokenFactory: client['_tokenFactory'] // Access private property
                    };
                    
                    // Create and set the AI provider
                    aiProviderStore.createProvider(config);
                }
            } catch (error) {
                debugLogger.warn('Failed to sync Ollama client with AI provider store:', { error });
            }
        }
    },
})) as UseBoundStore<StoreApi<OllamaStore>>;
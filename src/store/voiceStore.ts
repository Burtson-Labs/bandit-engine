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

// Bandit Engine Watermark: BL-WM-6EA5-62113F
const __banditFingerprint_store_voiceStorets = 'BL-FP-BD24FF-7D8B';
const __auditTrail_store_voiceStorets = 'BL-AU-MGOIKVW6-SCLC';
// File: voiceStore.ts | Path: src/store/voiceStore.ts | Hash: 6ea57d8b

import { create } from "zustand";
import { voiceService, VoiceModelsResponse } from "../services/tts/voiceService";
import { debugLogger } from "../services/logging/debugLogger";
import { stopTTS } from "../services/tts/streaming-tts";

// Auto-initialize voice loading when store is created
let autoInitialized = false;

export interface VoiceState {
    availableVoices: string[];
    selectedVoice: string;
    defaultVoice: string;
    fallbackVoice: string;
    isLoading: boolean;
    isServiceAvailable: boolean;
    initialized: boolean;
    setSelectedVoice: (voice: string) => void;
    loadVoicesFromAPI: () => Promise<void>;
    refreshVoices: () => Promise<void>;
    forceInitialize: () => Promise<void>;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
    availableVoices: [],
    selectedVoice: "",
    defaultVoice: "", 
    fallbackVoice: "",
    isLoading: false,
    isServiceAvailable: false,
    initialized: false,
    
    setSelectedVoice: (voice) => {
        const currentVoice = get().selectedVoice;
        debugLogger.debug('Setting selected voice', { 
            previousVoice: currentVoice, 
            newVoice: voice,
            isChange: currentVoice !== voice
        });
        
        // If voice is actually changing, immediately stop current TTS
        if (currentVoice && currentVoice !== voice) {
            debugLogger.debug('🔄 Voice changing in store - stopping TTS immediately', {
                from: currentVoice,
                to: voice
            });
            stopTTS();
        }
        
        set({ selectedVoice: voice });
    },
    
    loadVoicesFromAPI: async () => {
        const state = get();
        if (state.isLoading) return; // Prevent concurrent requests
        
        set({ isLoading: true, initialized: true });
        
        try {
            const voiceData: VoiceModelsResponse = await voiceService.fetchAvailableVoices();
            
            const hasVoices = voiceData.models.length > 0;
            let finalSelectedVoice = state.selectedVoice;
            
            if (hasVoices) {
                // Validate and set selected voice
                if (finalSelectedVoice && voiceData.models.includes(finalSelectedVoice)) {
                    // Keep current selection if it's still available
                } else {
                    finalSelectedVoice = voiceData.defaultModel;
                }
                
                set({
                    isServiceAvailable: true,
                    availableVoices: voiceData.models,
                    defaultVoice: voiceData.defaultModel,
                    fallbackVoice: voiceData.fallbackModel,
                    selectedVoice: finalSelectedVoice,
                    isLoading: false
                });
            } else {
                set({
                    isServiceAvailable: false,
                    isLoading: false
                });
            }
        } catch (error) {
            debugLogger.error('Failed to load voice models', { 
                error: error instanceof Error ? error.message : String(error)
            });
            set({
                isServiceAvailable: false,
                isLoading: false
            });
        }
    },
    
    refreshVoices: async () => {
        const currentSelection = get().selectedVoice;
        voiceService.clearCache();
        await get().loadVoicesFromAPI();
        // Restore selection if it's still valid
        const { availableVoices } = get();
        if (currentSelection && availableVoices.includes(currentSelection)) {
            set({ selectedVoice: currentSelection });
        }
    },
    
    forceInitialize: async () => {
        const state = get();
        if (!state.initialized || state.availableVoices.length === 0) {
            debugLogger.debug('Force initializing voice store...');
            await state.loadVoicesFromAPI();
        }
    }
}));

// Trigger auto-initialization with a slight delay to ensure package settings are ready
if (!autoInitialized) {
    autoInitialized = true;
    setTimeout(() => {
        debugLogger.debug('Auto-initializing voice store...');
        useVoiceStore.getState().forceInitialize().catch((error) => {
            debugLogger.warn('Auto-initialization failed:', error);
        });
    }, 1000); // 1 second delay to ensure gateway URL is available
}

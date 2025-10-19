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

// Bandit Engine Watermark: BL-WM-F855-34891E
const __banditFingerprint_store_preferencesStorets = 'BL-FP-F9B13A-2C61';
const __auditTrail_store_preferencesStorets = 'BL-AU-MGOIKVW5-UNSN';
// File: preferencesStore.ts | Path: src/store/preferencesStore.ts | Hash: f8552c61

import { create } from "zustand";
import indexedDBService from "../services/indexedDB/indexedDBService";
import { debugLogger } from "../services/logging/debugLogger";

export interface UserPreferences {
  memoryEnabled: boolean;
  knowledgeDocsEnabled: boolean;
  moodEnabled: boolean;
  chatSuggestionsEnabled: boolean;
  ttsEnabled: boolean;
  sttEnabled: boolean;
  banditModelsEnabled: boolean;
  feedbackEnabled: boolean;
  homeUrl?: string;
}

interface PreferencesStore {
  preferences: UserPreferences;
  isLoaded: boolean;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  loadPreferences: () => Promise<void>;
  savePreferences: () => Promise<void>;
  exportPreferences: () => string;
  importPreferences: (jsonString: string) => Promise<boolean>;
  resetToDefaults: () => Promise<void>;
}

const defaultPreferences: UserPreferences = {
  memoryEnabled: true,
  knowledgeDocsEnabled: true,
  moodEnabled: true,
  chatSuggestionsEnabled: true,
  ttsEnabled: true,
  sttEnabled: true,
  banditModelsEnabled: true,
  feedbackEnabled: true,
  homeUrl: "",
};

const sanitizePreferences = (
  preferences: Partial<UserPreferences> & Record<string, unknown>
): Partial<UserPreferences> => {
  const {
    advancedFeaturesEnabled: _deprecatedAdvanced,
    advancedSearchEnabled: _deprecatedSearch,
    advancedMemoriesEnabled: _deprecatedMemories,
    ...rest
  } = preferences;
  return rest;
};

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
  preferences: defaultPreferences,
  isLoaded: false,
  
  setPreferences: (newPreferences) => {
    const sanitized = sanitizePreferences(newPreferences as Partial<UserPreferences> & Record<string, unknown>);

    set((state) => ({
      preferences: { ...state.preferences, ...sanitized },
    }));
    // Auto-save after setting preferences
    get().savePreferences();
  },
  
  updatePreference: (key, value) => {
    const prevValue = get().preferences[key];
    const updates: Partial<UserPreferences> = { [key]: value };
    
    set((state) => ({
      preferences: { ...state.preferences, ...updates },
    }));
    // Auto-save after updating preference
    get().savePreferences();
    
    // If banditModelsEnabled changed, reload models
    if (key === 'banditModelsEnabled' && prevValue !== value) {
      // Import dynamically to avoid circular dependency
      import('./modelStore').then(({ useModelStore }) => {
        useModelStore.getState().handleBanditPersonalitiesPreferenceChange(value as boolean);
      });
    }
  },
  
  loadPreferences: async () => {
    try {
      const storeConfigs = [{ name: "config", keyPath: "id" }];
      const data = await indexedDBService.get("banditConfig", 1, "config", "preferences", storeConfigs);
      
      if (data?.preferences) {
        const sanitized = sanitizePreferences(data.preferences as Partial<UserPreferences> & Record<string, unknown>);
        set({ 
          preferences: { ...defaultPreferences, ...sanitized },
          isLoaded: true 
        });
        debugLogger.info("Preferences loaded from IndexedDB");
      } else {
        // First time, save defaults
        set({ isLoaded: true });
        await get().savePreferences();
        debugLogger.info("Default preferences initialized");
      }
    } catch (error) {
      debugLogger.error("Failed to load preferences from IndexedDB", { error });
      set({ isLoaded: true }); // Mark as loaded even if failed, so UI can render
    }
  },
  
  savePreferences: async () => {
    try {
      const { preferences } = get();
      const storeConfigs = [{ name: "config", keyPath: "id" }];
      
      await indexedDBService.put("banditConfig", 1, "config", {
        id: "preferences",
        preferences,
      }, storeConfigs);
      
      debugLogger.debug("Preferences saved to IndexedDB");
    } catch (error) {
      debugLogger.error("Failed to save preferences to IndexedDB", { error });
    }
  },

  exportPreferences: () => {
    const { preferences } = get();
    const exportData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      preferences,
    };
    return JSON.stringify(exportData, null, 2);
  },

  importPreferences: async (jsonString: string) => {
    try {
      const importData = JSON.parse(jsonString);
      
      // Validate the structure
      if (!importData.preferences || typeof importData.preferences !== 'object') {
        debugLogger.error("Invalid preferences format");
        return false;
      }

      // Backwards compatibility: merge with defaults to ensure all required fields exist
      const mergedPreferences: UserPreferences = {
        ...defaultPreferences,
        ...sanitizePreferences(importData.preferences as Record<string, unknown>),
      };

      // Validate each preference field
      const validatedPreferences: UserPreferences = {
        memoryEnabled: typeof mergedPreferences.memoryEnabled === 'boolean' ? mergedPreferences.memoryEnabled : defaultPreferences.memoryEnabled,
        knowledgeDocsEnabled: typeof mergedPreferences.knowledgeDocsEnabled === 'boolean' ? mergedPreferences.knowledgeDocsEnabled : defaultPreferences.knowledgeDocsEnabled,
        moodEnabled: typeof mergedPreferences.moodEnabled === 'boolean' ? mergedPreferences.moodEnabled : defaultPreferences.moodEnabled,
        chatSuggestionsEnabled: typeof mergedPreferences.chatSuggestionsEnabled === 'boolean' ? mergedPreferences.chatSuggestionsEnabled : defaultPreferences.chatSuggestionsEnabled,
        ttsEnabled: typeof mergedPreferences.ttsEnabled === 'boolean' ? mergedPreferences.ttsEnabled : defaultPreferences.ttsEnabled,
        sttEnabled: typeof mergedPreferences.sttEnabled === 'boolean' ? mergedPreferences.sttEnabled : defaultPreferences.sttEnabled,
        banditModelsEnabled: typeof mergedPreferences.banditModelsEnabled === 'boolean' ? mergedPreferences.banditModelsEnabled : defaultPreferences.banditModelsEnabled,
        feedbackEnabled: typeof mergedPreferences.feedbackEnabled === 'boolean' ? mergedPreferences.feedbackEnabled : defaultPreferences.feedbackEnabled,
        homeUrl: typeof mergedPreferences.homeUrl === 'string' ? mergedPreferences.homeUrl : defaultPreferences.homeUrl,
      };

      set({ preferences: validatedPreferences });
      await get().savePreferences();
      
      debugLogger.info("Preferences imported successfully", { version: importData.version });
      return true;
    } catch (error) {
      debugLogger.error("Failed to import preferences", { error });
      return false;
    }
  },

  resetToDefaults: async () => {
    set({ preferences: { ...defaultPreferences } });
    await get().savePreferences();
    debugLogger.info("Preferences reset to defaults");
  },
}));

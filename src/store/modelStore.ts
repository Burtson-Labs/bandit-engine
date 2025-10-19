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

// Bandit Engine Watermark: BL-WM-205A-DDC90F
const __banditFingerprint_store_modelStorets = 'BL-FP-C71D64-A364';
const __auditTrail_store_modelStorets = 'BL-AU-MGOIKVW5-X6L2';
// File: modelStore.ts | Path: src/store/modelStore.ts | Hash: 205aa364

interface BrandingConfig {
  branding?: {
    logoBase64?: string;
    brandingText?: string;
    theme?: string;
    hasTransparentLogo?: boolean;
  };
  models?: BanditPersonality[];
}
import { create } from "zustand";
import { models as defaultModels } from "../models/models";
import indexedDBService from "../services/indexedDB/indexedDBService";
import { usePackageSettingsStore } from "../store/packageSettingsStore";
import { usePreferencesStore } from "../store/preferencesStore";
import { debugLogger } from "../services/logging/debugLogger";

export interface BanditPersonality {
  name: string;
  tagline: string;
  systemPrompt: string;
  commands: string[];
  avatarBase64?: string;
  avatarPreset?: string;
}

interface ModelState {
  name: string;
  tagline: string;
  systemPrompt: string;
  commands: string[];
  avatarBase64: string | null;
  setModelName: (name: string) => void;
  setTagline: (tagline: string) => void;
  setSystemPrompt: (prompt: string) => void;
  addCommand: (command: string) => void;
  availableModels: BanditPersonality[];
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  saveModel: () => void;
  resetModel: () => void;
  getCurrentModel: () => BanditPersonality | null;
  initModels: () => Promise<void>;
  hasTransparentLogo: boolean;
  setHasTransparentLogo: (value: boolean) => void;
  restoreDefaultModels: () => Promise<void>;
  restoreDeletedBanditModels: () => Promise<{ restored: string[]; hadNothingToRestore: boolean }>;
  handleBanditPersonalitiesPreferenceChange: (enabled: boolean) => Promise<void>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isInitializing: boolean;
  setIsInitializing: (initializing: boolean) => void;
  setAvatarBase64: (value: string | null) => void;
}

export const useModelStore = create<ModelState>((set, get) => ({
  name: "",
  tagline: "",
  systemPrompt: "",
  commands: [],
  avatarBase64: null,
  availableModels: [],
  selectedModel: "",
  hasTransparentLogo: true,
  isLoading: true,
  isInitializing: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsInitializing: (initializing) => set({ isInitializing: initializing }),
  setModelName: (name) => set({ name: name }),
  setTagline: (tagline) => set({ tagline }),
  setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
  setAvatarBase64: (value) => set({ avatarBase64: value }),
  addCommand: (command) => set((state) => ({ commands: [...state.commands, command] })),
  setSelectedModel: (modelName) => {
    const selected = get().availableModels.find((m) => m.name === modelName);
    if (selected) {
      set({
        selectedModel: modelName,
        name: selected.name,
        tagline: selected.tagline,
        systemPrompt: selected.systemPrompt,
        commands: selected.commands,
        avatarBase64: selected.avatarBase64 ?? null,
      });
    } else {
      // Auto-select first available model if the requested model doesn't exist
      const availableModels = get().availableModels;
      const firstModel = availableModels.length > 0 ? availableModels[0] : null;
      if (firstModel) {
        set({
          selectedModel: firstModel.name,
          name: firstModel.name,
          tagline: firstModel.tagline,
          systemPrompt: firstModel.systemPrompt,
          commands: firstModel.commands,
          avatarBase64: firstModel.avatarBase64 ?? null,
        });
      }
    }
  },
  saveModel: async () => {
    const state = get();
    const storeConfigs = [{ name: "config", keyPath: "id" }];

    const newModel: BanditPersonality = {
      name: state.name,
      tagline: state.tagline,
      systemPrompt: state.systemPrompt,
      commands: state.commands,
      avatarBase64: state.avatarBase64 ?? undefined,
    };

    // Update IndexedDB under id = model name
    await indexedDBService.put("banditConfig", 1, "config", { id: newModel.name, model: newModel }, storeConfigs);

    // Update Zustand store
    const exists = state.availableModels.find((m) => m.name === newModel.name);
    if (!exists) {
      set((prevState) => ({
        availableModels: [...prevState.availableModels, newModel],
      }));
    } else {
      set((prevState) => ({
        availableModels: prevState.availableModels.map((m) =>
          m.name === newModel.name ? newModel : m
        ),
      }));
    }
  },
  resetModel: () => set({ name: "", tagline: "", systemPrompt: "", commands: [] }),
  getCurrentModel: () =>
    get().availableModels.find((m) => m.name === get().selectedModel) || null,
  initModels: async () => {
    const currentState = get();
    
    // Prevent concurrent initialization
    if (currentState.isInitializing) {
      debugLogger.warn("initModels: Already initializing, skipping concurrent call");
      return;
    }
    
    debugLogger.info("initModels: starting initialization");
    set({ isLoading: true, isInitializing: true });
    
    const storeConfigs = [{ name: "config", keyPath: "id" }];
    const entries = await indexedDBService.getAll("banditConfig", 1, "config", storeConfigs);

    const mainEntry = entries.find(entry => entry.id === "main");
    const modelEntries = entries.filter(entry => entry.id !== "main" && entry.id !== "deletedModels");

    const deletedEntry = await indexedDBService.get("banditConfig", 1, "config", "deletedModels", storeConfigs);
    const deletedModelNames = deletedEntry?.deleted ?? [];

    let allModels: BanditPersonality[] = [];
    let selectedModel = "";

    // STEP 1: Try to load from IndexedDB first
    if (modelEntries.length > 0) {
      debugLogger.info("Loading models from IndexedDB");
      allModels = modelEntries.map(entry => {
        const modelData = entry.model?.name ? entry.model : entry;
        return {
          name: modelData.name,
          tagline: modelData.tagline || "",
          systemPrompt: modelData.systemPrompt || "",
          commands: modelData.commands ?? [],
          avatarBase64: modelData.avatarBase64 ?? null,
        };
      }).filter(m => m.name && !deletedModelNames.includes(m.name));

      // Filter out Bandit personalities if banditModelsEnabled is false
      const preferences = usePreferencesStore.getState().preferences;
      if (!preferences.banditModelsEnabled) {
        const banditModelNames = defaultModels.map(m => m.name);
        allModels = allModels.filter(model => !banditModelNames.includes(model.name));
        debugLogger.info("Filtered out Bandit personalities (preference disabled)", { 
          filteredModels: banditModelNames 
        });
      }

      selectedModel = mainEntry?.model?.selectedModel || (allModels.length > 0 ? allModels[0].name : "");
      debugLogger.info("Loaded models from IndexedDB:", { models: allModels.map(m => m.name), selectedModel });
      
      // If no models remain after filtering deleted ones, try CDN
      if (allModels.length === 0) {
        debugLogger.info("No personalities remain after filtering deleted models, checking CDN config");
      }
    } 
    
    // STEP 2: If no models in IndexedDB OR no personalities remain after filtering, try CDN config
    if (modelEntries.length === 0 || allModels.length === 0) {
      debugLogger.info("No models in IndexedDB, checking CDN config");
      const packageSettings = usePackageSettingsStore.getState().getSettings();
      let configModels: BrandingConfig | null = null;

      if (packageSettings?.brandingConfigUrl) {
        try {
          const response = await fetch(packageSettings.brandingConfigUrl);
          configModels = await response.json();
        } catch (err) {
          debugLogger.warn("Failed to load CDN config:", { error: err });
        }
      }

      if (configModels?.models?.length) {
        debugLogger.info("Loading models from CDN config");
        allModels = configModels.models.filter(m => !deletedModelNames.includes(m.name));
        
        // Check if Bandit personalities should be included
        const preferences = usePreferencesStore.getState().preferences;
        if (preferences.banditModelsEnabled) {
          // Add Bandit default personalities if they're not already present
          const cdnModelNames = allModels.map(m => m.name);
          const banditModelsToAdd = defaultModels.filter(banditModel => 
            !cdnModelNames.includes(banditModel.name) && !deletedModelNames.includes(banditModel.name)
          );
          allModels = [...allModels, ...banditModelsToAdd];
          debugLogger.info("Added Bandit default personalities to CDN models", { 
            banditModels: banditModelsToAdd.map(m => m.name) 
          });
        } else {
          // Filter out any Bandit personalities that might be in the CDN config
          const banditModelNames = defaultModels.map(m => m.name);
          allModels = allModels.filter(model => !banditModelNames.includes(model.name));
          debugLogger.info("Filtered out Bandit personalities from CDN config (preference disabled)", {
            banditModels: banditModelNames
          });
        }
        
        selectedModel = allModels.length > 0 ? allModels[0].name : "";
        
        // Only set hasTransparentLogo from CDN if no user branding exists
        const existingConfig = await indexedDBService.get("banditConfig", 1, "config", "main", storeConfigs);
        const hasUserBranding = existingConfig?.branding?.userSaved;
        if (!hasUserBranding) {
          set({ hasTransparentLogo: configModels?.branding?.hasTransparentLogo ?? true });
          debugLogger.info("Set hasTransparentLogo from CDN config (no user branding)");
        } else {
          debugLogger.info("Preserved user hasTransparentLogo setting (user branding exists)");
        }
        
        // Save CDN models to IndexedDB for future use
        for (const model of allModels) {
          await indexedDBService.put("banditConfig", 1, "config", { id: model.name, model }, storeConfigs);
        }
        
        debugLogger.info("Loaded and saved models from CDN config:", { models: allModels.map(m => m.name) });
      } 
      // STEP 3: Fall back to Bandit defaults (only if banditModelsEnabled is true)
      else {
        const preferences = usePreferencesStore.getState().preferences;
        if (preferences.banditModelsEnabled) {
          debugLogger.info("No CDN config available, loading Bandit defaults");
          await get().restoreDefaultModels();
          set({ isLoading: false, isInitializing: false });
          return;
        } else {
          debugLogger.info("No CDN config available and Bandit personalities disabled, loading empty model list");
          allModels = [];
          selectedModel = "";
        }
      }
    }

    // Set the models and selected model
    set({ availableModels: allModels });
    debugLogger.info("Setting selected model:", { selectedModel });
    get().setSelectedModel(selectedModel);

    debugLogger.info("Model initialization complete");
    set({ isLoading: false, isInitializing: false });
  },
  setHasTransparentLogo: (value) => set({ hasTransparentLogo: value }),
  restoreDefaultModels: async () => {
    debugLogger.debug("🧪 Restoring default models...");
    set({ isLoading: true });
    
    const storeConfigs = [{ name: "config", keyPath: "id" }];
    
    // Clear existing models from state
    set({ availableModels: [] });
    
    // Clear deletedModels entry in IndexedDB
    try {
      await indexedDBService.delete("banditConfig", 1, "config", "deletedModels", storeConfigs);
      debugLogger.info("restoreDefaultModels: Cleared deletedModels entry in IndexedDB");
    } catch (err) {
      debugLogger.warn("restoreDefaultModels: Failed to clear deletedModels entry in IndexedDB", { error: err });
    }
    
    let allModels: BanditPersonality[] = [];
    let selectedModel = "";
    
    // STEP 1: Try to load from CDN config first
    const packageSettings = usePackageSettingsStore.getState().getSettings();
    let configModels: BrandingConfig | null = null;
    
    if (packageSettings?.brandingConfigUrl) {
      debugLogger.debug("🔗 Attempting to load default models from CDN config...");
      try {
        const response = await fetch(packageSettings.brandingConfigUrl);
        configModels = await response.json();
      } catch (err) {
        debugLogger.warn("Failed to load CDN config:", { error: err });
      }
    }
    
    if (configModels?.models?.length) {
      // Use models from CDN config
      allModels = configModels.models;
      
      // Check if Bandit personalities should be included
      const preferences = usePreferencesStore.getState().preferences;
      if (preferences.banditModelsEnabled) {
        // Add Bandit default personalities if they're not already present
        const cdnModelNames = allModels.map(m => m.name);
        const banditModelsToAdd = defaultModels.filter(banditModel => 
          !cdnModelNames.includes(banditModel.name)
        );
        allModels = [...allModels, ...banditModelsToAdd];
        debugLogger.info("restoreDefaultModels: Added Bandit personalities to CDN config", { 
          banditModels: banditModelsToAdd.map(m => m.name) 
        });
      } else {
        // Filter out any Bandit personalities that might be in the CDN config
        const banditModelNames = defaultModels.map(m => m.name);
        allModels = allModels.filter(model => !banditModelNames.includes(model.name));
        debugLogger.info("restoreDefaultModels: Filtered out Bandit personalities (preference disabled)", {
          banditModels: banditModelNames
        });
      }
      
      selectedModel = allModels.length > 0 ? allModels[0].name : "";
      
      // Only set hasTransparentLogo from CDN if no user branding exists
      try {
        const existingConfig = await indexedDBService.get("banditConfig", 1, "config", "main", storeConfigs);
        const hasUserBranding = existingConfig?.branding?.userSaved;
        if (!hasUserBranding) {
          set({ hasTransparentLogo: configModels?.branding?.hasTransparentLogo ?? true });
          debugLogger.info("restoreDefaultModels: Set hasTransparentLogo from CDN config (no user branding)");
        } else {
          debugLogger.info("restoreDefaultModels: Preserved user hasTransparentLogo setting (user branding exists)");
        }
      } catch (err) {
        // Fallback to CDN setting if we can't check IndexedDB
        set({ hasTransparentLogo: configModels?.branding?.hasTransparentLogo ?? true });
        debugLogger.warn("restoreDefaultModels: Using CDN hasTransparentLogo as fallback", { error: err });
      }
      
      debugLogger.info("✅ Using default models from CDN config:", { models: allModels.map(m => m.name) });
    } else {
      // STEP 2: Fall back to built-in Bandit defaults (only if enabled)
      const preferences = usePreferencesStore.getState().preferences;
      if (preferences.banditModelsEnabled) {
        allModels = defaultModels;
        selectedModel = allModels.length > 0 ? allModels[0].name : "";
        debugLogger.info("✅ Using built-in default Bandit personalities:", { models: allModels.map(m => m.name) });
      } else {
        allModels = [];
        selectedModel = "";
        debugLogger.info("✅ Bandit personalities disabled, using empty model list");
      }
    }
    
    // Persist each model to IndexedDB
    for (const model of allModels) {
      await indexedDBService.put("banditConfig", 1, "config", {
        id: model.name,
        model,
      }, storeConfigs);
    }
    
    // Update Zustand state
    set({ availableModels: allModels });
    
    debugLogger.debug("🎯 Setting default selected model:", { model: selectedModel });
    get().setSelectedModel(selectedModel);
    
    debugLogger.debug("✅ Default models restored and persisted to IndexedDB");
    set({ isLoading: false });
  },
  restoreDeletedBanditModels: async () => {
    debugLogger.debug("🔄 Restoring deleted Bandit personalities...");
    set({ isLoading: true });
    
    const storeConfigs = [{ name: "config", keyPath: "id" }];
    
    try {
      // Get current deleted models list
      const deletedEntry = await indexedDBService.get("banditConfig", 1, "config", "deletedModels", storeConfigs);
      const deletedModelNames = deletedEntry?.deleted ?? [];
      
      debugLogger.info("Current deleted models:", { deletedModelNames });
      
      // Find which Bandit personalities are deleted
      const deletedBanditModels = defaultModels.filter(banditModel => 
        deletedModelNames.includes(banditModel.name)
      );
      
      debugLogger.info("Deleted Bandit personalities found:", { 
        deletedBanditModels: deletedBanditModels.map(m => m.name) 
      });
      
      if (deletedBanditModels.length === 0) {
        debugLogger.info("No deleted Bandit personalities to restore");
        set({ isLoading: false });
        return { restored: [], hadNothingToRestore: true };
      }
      
      // Remove Bandit personality names from deleted list
      const updatedDeletedNames = deletedModelNames.filter((name: string) => 
        !defaultModels.some(banditModel => banditModel.name === name)
      );
      
      debugLogger.info("Updated deleted list after removing Bandit personalities:", { 
        updatedDeletedNames 
      });
      
      // Update deleted models list in IndexedDB
      if (updatedDeletedNames.length > 0) {
        await indexedDBService.put("banditConfig", 1, "config", {
          id: "deletedModels",
          deleted: updatedDeletedNames,
        }, storeConfigs);
        debugLogger.info("Updated deletedModels in IndexedDB");
      } else {
        // If no models left in deleted list, remove the entry
        await indexedDBService.delete("banditConfig", 1, "config", "deletedModels", storeConfigs);
        debugLogger.info("Removed deletedModels entry from IndexedDB (empty list)");
      }
      
      // Check if Bandit personalities preference is enabled
      const preferences = usePreferencesStore.getState().preferences;
      debugLogger.info("Bandit personalities preference enabled:", { enabled: preferences.banditModelsEnabled });
      
      if (!preferences.banditModelsEnabled) {
        debugLogger.info("⚠️ Bandit personalities preference is disabled. Personalities restored from deleted list but not added to available models until preference is enabled.");
        set({ isLoading: false });
        return { restored: deletedBanditModels.map(m => m.name), hadNothingToRestore: false };
      }
      
      // Add restored Bandit personalities to current available models
      const currentModels = get().availableModels;
      debugLogger.info("Current available models:", { 
        currentModels: currentModels.map(m => m.name) 
      });
      
      const restoredModels = deletedBanditModels.filter(banditModel => 
        !currentModels.some(current => current.name === banditModel.name)
      );
      
      debugLogger.info("Models to restore:", { 
        restoredModels: restoredModels.map(m => m.name) 
      });
      
      if (restoredModels.length === 0) {
        debugLogger.info("No new models to add (all restored models already present)");
        set({ isLoading: false });
        return { restored: [], hadNothingToRestore: true };
      }
      
      // Persist restored models to IndexedDB
      for (const model of restoredModels) {
        await indexedDBService.put("banditConfig", 1, "config", {
          id: model.name,
          model,
        }, storeConfigs);
        debugLogger.info("Persisted restored model to IndexedDB:", { modelName: model.name });
      }
      
      // Update Zustand state
      const updatedAvailableModels = [...currentModels, ...restoredModels];
      set({ availableModels: updatedAvailableModels });
      
      debugLogger.info("✅ Restored deleted Bandit personalities:", { 
        restoredModels: restoredModels.map(m => m.name),
        totalModels: updatedAvailableModels.length
      });
      
      // If no model is currently selected and we have models now, select the first restored one
      const currentSelectedModel = get().selectedModel;
      if (!currentSelectedModel && updatedAvailableModels.length > 0) {
        const modelToSelect = restoredModels[0] || updatedAvailableModels[0];
        get().setSelectedModel(modelToSelect.name);
        debugLogger.info("Auto-selected model after restore:", { modelName: modelToSelect.name });
      }
      
      return { restored: restoredModels.map(m => m.name), hadNothingToRestore: false };
      
    } catch (error) {
      debugLogger.error("Failed to restore deleted Bandit personalities", { error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  handleBanditPersonalitiesPreferenceChange: async (enabled: boolean) => {
    debugLogger.info("🔄 Handling Bandit personalities preference change", { enabled });
    
    const currentModels = get().availableModels;
    const banditModelNames = defaultModels.map(m => m.name);
    
    if (enabled) {
      // Add Bandit personalities that aren't already present
      const storeConfigs = [{ name: "config", keyPath: "id" }];
      
      // Get deleted models to avoid adding them back
      const deletedEntry = await indexedDBService.get("banditConfig", 1, "config", "deletedModels", storeConfigs);
      const deletedModelNames = deletedEntry?.deleted ?? [];
      
      const modelsToAdd = defaultModels.filter(banditModel => 
        !currentModels.some(current => current.name === banditModel.name) &&
        !deletedModelNames.includes(banditModel.name)
      );
      
      if (modelsToAdd.length > 0) {
        // Persist added models to IndexedDB
        for (const model of modelsToAdd) {
          await indexedDBService.put("banditConfig", 1, "config", {
            id: model.name,
            model,
          }, storeConfigs);
        }
        
        const updatedModels = [...currentModels, ...modelsToAdd];
        set({ availableModels: updatedModels });
        
        debugLogger.info("✅ Added Bandit personalities", { 
          addedModels: modelsToAdd.map(m => m.name) 
        });
        
        // If no model is selected and we added models, select the first one
        const currentSelectedModel = get().selectedModel;
        if (!currentSelectedModel && updatedModels.length > 0) {
          get().setSelectedModel(updatedModels[0].name);
        }
      }
    } else {
      // Remove Bandit personalities from current list
      const filteredModels = currentModels.filter(model => !banditModelNames.includes(model.name));
      set({ availableModels: filteredModels });
      
      debugLogger.info("✅ Removed Bandit personalities", { 
        removedModels: banditModelNames.filter(name => 
          currentModels.some(model => model.name === name)
        )
      });
      
      // If the currently selected model was a Bandit model, select a different one
      const currentSelectedModel = get().selectedModel;
      if (currentSelectedModel && banditModelNames.includes(currentSelectedModel)) {
        const newSelectedModel = filteredModels.length > 0 ? filteredModels[0].name : "";
        get().setSelectedModel(newSelectedModel);
        debugLogger.info("🔄 Changed selected model after removing Bandit personalities", { 
          oldModel: currentSelectedModel, 
          newModel: newSelectedModel 
        });
      }
    }
  },
}));

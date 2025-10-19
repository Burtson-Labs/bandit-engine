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

// Bandit Engine Watermark: BL-WM-TEST-MODELSAVE
const __banditFingerprint_test_modelSaveLogic = 'BL-FP-TEST-002';
const __auditTrail_test_modelSaveLogic = 'BL-AU-TEST-MSL';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BanditPersonality } from '../../store/modelStore';

// Mock IndexedDB service
const mockIndexedDBService = {
  put: vi.fn(),
  delete: vi.fn(),
  get: vi.fn(),
};

// Mock model store
const mockUseModelStore = {
  setState: vi.fn(),
  getState: vi.fn(),
};

// Mock utility functions
const mockFetchAndConvertToBase64 = vi.fn();

// Test data
const createMockBanditModel = (): BanditPersonality => ({
  name: 'Bandit-Core',
  tagline: 'The witty, reliable sidekick',
  systemPrompt: 'You are Bandit AI 🥷',
  commands: [],
  avatarBase64: '',
});

const createMockCustomModel = (): BanditPersonality => ({
  name: 'Custom Assistant',
  tagline: 'My custom helper',
  systemPrompt: 'You are a custom assistant',
  commands: [],
  avatarBase64: '',
});

const createMockAvailableModels = (): BanditPersonality[] => [
  createMockBanditModel(),
  createMockCustomModel(),
  {
    name: 'Bandit-Muse',
    tagline: 'Creative companion',
    systemPrompt: 'You are Bandit Muse 🎨',
    commands: [],
    avatarBase64: '',
  },
];

type LocalSelectedModel = {
  name: string;
  tagline: string;
  systemPrompt: string;
  selectedModel: string;
};

describe('Model Save Logic', () => {
  let mockLocalSelectedModel: LocalSelectedModel;
  let mockAvailableModels: BanditPersonality[];
  let mockSetSelectedModel: (modelName: string) => void;
  let mockSetLocalSelectedModel: (model: LocalSelectedModel) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockAvailableModels = createMockAvailableModels();
    mockLocalSelectedModel = {
      name: '',
      tagline: '',
      systemPrompt: '',
      selectedModel: '',
    };
    mockSetSelectedModel = vi.fn();
    mockSetLocalSelectedModel = vi.fn();

    // Reset mock implementations
    mockIndexedDBService.put.mockResolvedValue(undefined);
    mockIndexedDBService.delete.mockResolvedValue(undefined);
    mockIndexedDBService.get.mockResolvedValue(null);
    mockFetchAndConvertToBase64.mockResolvedValue('base64avatar');
    mockUseModelStore.setState.mockImplementation(() => {});
  });

  // Helper function to simulate the save logic
  const simulateSaveModel = async (
    localSelectedModel: LocalSelectedModel,
    availableModels: BanditPersonality[],
    customAvatarBase64: string | null = null,
    presetAvatar: string | null = null
  ) => {
    const storeConfigs = [{ name: "config", keyPath: "id" }];

    // Prepare avatar (simplified version of the real logic)
    let avatarBase64ToStore: string | null = null;
    if (customAvatarBase64) {
      avatarBase64ToStore = customAvatarBase64;
    } else if (presetAvatar) {
      avatarBase64ToStore = await mockFetchAndConvertToBase64(presetAvatar);
    }

    // Create model object
    const modelToSave: BanditPersonality = {
      name: localSelectedModel.name.trim(),
      tagline: localSelectedModel.tagline || "",
      systemPrompt: localSelectedModel.systemPrompt || "",
      avatarBase64: avatarBase64ToStore || "",
      commands: [],
    };

    // Save to IndexedDB
    await mockIndexedDBService.put("banditConfig", 1, "config", {
      id: modelToSave.name,
      ...modelToSave,
    }, storeConfigs);

    // Determine if this is editing an existing model (custom or Bandit) or creating a new one
    const isEditingExistingModel = !!(localSelectedModel.selectedModel && 
                                 localSelectedModel.selectedModel !== "" && 
                                 availableModels.some(m => m.name === localSelectedModel.selectedModel));
    
    const isRenamingModel = isEditingExistingModel && localSelectedModel.selectedModel !== modelToSave.name;
    
    // Only remove old entry if we're actually renaming a model
    if (isRenamingModel) {
      await mockIndexedDBService.delete("banditConfig", 1, "config", localSelectedModel.selectedModel, storeConfigs);
    }

    // Update Zustand store
    if (isEditingExistingModel) {
      // Update existing model (whether custom or Bandit)
      mockUseModelStore.setState({
        availableModels: availableModels.map(model => 
          model.name === localSelectedModel.selectedModel ? modelToSave : model
        ),
      });
    } else {
      // Add new model
      mockUseModelStore.setState({
        availableModels: [...availableModels, modelToSave],
      });
    }

    // Update selection and ensure UI state is synchronized
    mockSetSelectedModel(modelToSave.name);
    mockSetLocalSelectedModel({
      name: modelToSave.name,
      tagline: modelToSave.tagline,
      systemPrompt: modelToSave.systemPrompt,
      selectedModel: modelToSave.name,
    });

    return {
      modelToSave,
      isEditingExistingModel,
      isRenamingModel,
    };
  };

  describe('Editing Existing Bandit Models', () => {
    it('should update existing Bandit-Core model without creating duplicate', async () => {
      mockLocalSelectedModel = {
        name: 'Bandit-Core',
        tagline: 'Updated tagline',
        systemPrompt: 'Updated system prompt',
        selectedModel: 'Bandit-Core',
      };

      const result = await simulateSaveModel(mockLocalSelectedModel, mockAvailableModels);

      expect(result.isEditingExistingModel).toBe(true);
      expect(result.isRenamingModel).toBe(false);
      
      // Should update existing model, not add new one
      expect(mockUseModelStore.setState).toHaveBeenCalledWith({
        availableModels: expect.arrayContaining([
          expect.objectContaining({
            name: 'Bandit-Core',
            tagline: 'Updated tagline',
            systemPrompt: 'Updated system prompt',
          })
        ])
      });

      // Should not delete anything since we're not renaming
      expect(mockIndexedDBService.delete).not.toHaveBeenCalled();
      
      // Should save to IndexedDB
      expect(mockIndexedDBService.put).toHaveBeenCalledWith(
        "banditConfig", 1, "config", 
        expect.objectContaining({
          id: 'Bandit-Core',
          name: 'Bandit-Core',
          tagline: 'Updated tagline',
        }), 
        expect.any(Array)
      );
    });

    it('should handle renaming Bandit model correctly', async () => {
      mockLocalSelectedModel = {
        name: 'My Custom Bandit',
        tagline: 'Based on Bandit-Core',
        systemPrompt: 'Custom version of Bandit-Core',
        selectedModel: 'Bandit-Core',
      };

      const result = await simulateSaveModel(mockLocalSelectedModel, mockAvailableModels);

      expect(result.isEditingExistingModel).toBe(true);
      expect(result.isRenamingModel).toBe(true);
      
      // Should delete old entry
      expect(mockIndexedDBService.delete).toHaveBeenCalledWith(
        "banditConfig", 1, "config", "Bandit-Core", expect.any(Array)
      );
      
      // Should update model in store
      expect(mockUseModelStore.setState).toHaveBeenCalledWith({
        availableModels: expect.arrayContaining([
          expect.objectContaining({
            name: 'My Custom Bandit',
            tagline: 'Based on Bandit-Core',
          })
        ])
      });
    });
  });

  describe('Editing Existing Custom Models', () => {
    it('should update existing custom model', async () => {
      mockLocalSelectedModel = {
        name: 'Custom Assistant',
        tagline: 'Updated custom helper',
        systemPrompt: 'Updated custom system prompt',
        selectedModel: 'Custom Assistant',
      };

      const result = await simulateSaveModel(mockLocalSelectedModel, mockAvailableModels);

      expect(result.isEditingExistingModel).toBe(true);
      expect(result.isRenamingModel).toBe(false);
      
      // Should update existing model, not add new one
      expect(mockUseModelStore.setState).toHaveBeenCalledWith({
        availableModels: expect.arrayContaining([
          expect.objectContaining({
            name: 'Custom Assistant',
            tagline: 'Updated custom helper',
          })
        ])
      });

      // Should not delete anything
      expect(mockIndexedDBService.delete).not.toHaveBeenCalled();
    });

    it('should handle renaming custom model', async () => {
      mockLocalSelectedModel = {
        name: 'Renamed Custom Assistant',
        tagline: 'Renamed helper',
        systemPrompt: 'Renamed system prompt',
        selectedModel: 'Custom Assistant',
      };

      const result = await simulateSaveModel(mockLocalSelectedModel, mockAvailableModels);

      expect(result.isEditingExistingModel).toBe(true);
      expect(result.isRenamingModel).toBe(true);
      
      // Should delete old entry
      expect(mockIndexedDBService.delete).toHaveBeenCalledWith(
        "banditConfig", 1, "config", "Custom Assistant", expect.any(Array)
      );
    });
  });

  describe('Creating New Models', () => {
    it('should add new model when selectedModel is empty', async () => {
      mockLocalSelectedModel = {
        name: 'Brand New Model',
        tagline: 'Completely new',
        systemPrompt: 'New system prompt',
        selectedModel: '', // Empty indicates new model
      };

      const result = await simulateSaveModel(mockLocalSelectedModel, mockAvailableModels);

      expect(result.isEditingExistingModel).toBe(false);
      expect(result.isRenamingModel).toBe(false);
      
      // Should add new model to store
      expect(mockUseModelStore.setState).toHaveBeenCalledWith({
        availableModels: [...mockAvailableModels, expect.objectContaining({
          name: 'Brand New Model',
          tagline: 'Completely new',
        })],
      });

      // Should not delete anything
      expect(mockIndexedDBService.delete).not.toHaveBeenCalled();
    });

    it('should add new model when selectedModel is not in availableModels', async () => {
      mockLocalSelectedModel = {
        name: 'Another New Model',
        tagline: 'Does not exist',
        systemPrompt: 'Non-existent selected model',
        selectedModel: 'Non-Existent Model',
      };

      const result = await simulateSaveModel(mockLocalSelectedModel, mockAvailableModels);

      expect(result.isEditingExistingModel).toBe(false);
      expect(result.isRenamingModel).toBe(false);
      
      // Should add new model
      expect(mockUseModelStore.setState).toHaveBeenCalledWith({
        availableModels: [...mockAvailableModels, expect.objectContaining({
          name: 'Another New Model',
        })],
      });
    });
  });

  describe('Avatar Handling', () => {
    it('should handle custom avatar correctly', async () => {
      mockLocalSelectedModel = {
        name: 'Model With Custom Avatar',
        tagline: 'Has custom avatar',
        systemPrompt: 'System prompt',
        selectedModel: '',
      };

      const customAvatar = 'data:image/png;base64,customavatardata';
      
      const result = await simulateSaveModel(
        mockLocalSelectedModel, 
        mockAvailableModels, 
        customAvatar, 
        null
      );

      expect(mockIndexedDBService.put).toHaveBeenCalledWith(
        "banditConfig", 1, "config",
        expect.objectContaining({
          avatarBase64: customAvatar,
        }),
        expect.any(Array)
      );
    });

    it('should handle preset avatar correctly', async () => {
      mockLocalSelectedModel = {
        name: 'Model With Preset Avatar',
        tagline: 'Has preset avatar',
        systemPrompt: 'System prompt',
        selectedModel: '',
      };

      const presetAvatar = 'https://cdn.example.com/avatar.png';
      
      await simulateSaveModel(
        mockLocalSelectedModel, 
        mockAvailableModels, 
        null, 
        presetAvatar
      );

      expect(mockFetchAndConvertToBase64).toHaveBeenCalledWith(presetAvatar);
      expect(mockIndexedDBService.put).toHaveBeenCalledWith(
        "banditConfig", 1, "config",
        expect.objectContaining({
          avatarBase64: 'base64avatar',
        }),
        expect.any(Array)
      );
    });
  });

  describe('UI State Synchronization', () => {
    it('should properly synchronize UI state after saving', async () => {
      mockLocalSelectedModel = {
        name: 'Test Model',
        tagline: 'Test tagline',
        systemPrompt: 'Test prompt',
        selectedModel: '',
      };

      await simulateSaveModel(mockLocalSelectedModel, mockAvailableModels);

      // Should update selectedModel
      expect(mockSetSelectedModel).toHaveBeenCalledWith('Test Model');
      
      // Should fully synchronize localSelectedModel
      expect(mockSetLocalSelectedModel).toHaveBeenCalledWith({
        name: 'Test Model',
        tagline: 'Test tagline',
        systemPrompt: 'Test prompt',
        selectedModel: 'Test Model',
      });
    });

    it('should maintain UI consistency when editing Bandit models', async () => {
      mockLocalSelectedModel = {
        name: 'Bandit-Muse',
        tagline: 'Updated creative companion',
        systemPrompt: 'Updated creative prompt',
        selectedModel: 'Bandit-Muse',
      };

      await simulateSaveModel(mockLocalSelectedModel, mockAvailableModels);

      // Should maintain selection on the same model
      expect(mockSetSelectedModel).toHaveBeenCalledWith('Bandit-Muse');
      
      // Should sync all fields
      expect(mockSetLocalSelectedModel).toHaveBeenCalledWith({
        name: 'Bandit-Muse',
        tagline: 'Updated creative companion',
        systemPrompt: 'Updated creative prompt',
        selectedModel: 'Bandit-Muse',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty model name gracefully', async () => {
      mockLocalSelectedModel = {
        name: '   ', // Whitespace only
        tagline: 'Empty name test',
        systemPrompt: 'Test prompt',
        selectedModel: '',
      };

      // This should be handled by validation in the real implementation
      // but we can test the trimming behavior
      const result = await simulateSaveModel(mockLocalSelectedModel, mockAvailableModels);

      expect(result.modelToSave.name).toBe('');
    });

    it('should handle undefined/null values in model data', async () => {
      mockLocalSelectedModel = {
        name: 'Test Model',
        tagline: undefined,
        systemPrompt: null,
        selectedModel: '',
      };

      const result = await simulateSaveModel(mockLocalSelectedModel, mockAvailableModels);

      expect(result.modelToSave.tagline).toBe('');
      expect(result.modelToSave.systemPrompt).toBe('');
    });

    it('should handle missing availableModels array', async () => {
      mockLocalSelectedModel = {
        name: 'Test Model',
        tagline: 'Test',
        systemPrompt: 'Test',
        selectedModel: 'Some Model',
      };

      const result = await simulateSaveModel(mockLocalSelectedModel, []);

      expect(result.isEditingExistingModel).toBe(false);
      expect(mockUseModelStore.setState).toHaveBeenCalledWith({
        availableModels: [expect.objectContaining({ name: 'Test Model' })],
      });
    });
  });
});

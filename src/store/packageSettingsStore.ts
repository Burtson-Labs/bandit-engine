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

// Bandit Engine Watermark: BL-WM-56BD-746DE7
const __banditFingerprint_store_packageSettingsStorets = 'BL-FP-668E99-4306';
const __auditTrail_store_packageSettingsStorets = 'BL-AU-MGOIKVW5-K7IK';
// File: packageSettingsStore.ts | Path: src/store/packageSettingsStore.ts | Hash: 56bd4306

import { create } from 'zustand';
import { AIProviderConfig } from '../services/ai-provider/types/common.types';
import { FeatureFlagConfig } from '../types/featureFlags';

export interface PackageSettings {
  // Legacy Ollama settings (for backward compatibility)
  ollamaUrl?: string;
  defaultModel: string;
  fallbackModel?: string;
  
  aiProvider?: AIProviderConfig;
  
  // Gateway API handles all services (TTS, STT, AI, etc.)
  gatewayApiUrl: string;

  fileStorageApiUrl?: string;
  
  // Content and branding
  brandingConfigUrl: string;
  homeUrl?: string | null;
  playgroundMode?: boolean;
  playgroundBypassAuth?: boolean;
  
  // Feedback settings
  feedbackEmail?: string;
  
  // Feature flag configuration
  featureFlags?: FeatureFlagConfig;
}

interface PackageSettingsState {
  settings: PackageSettings | null;
  setSettings: (settings: PackageSettings) => void;
  getSettings: () => PackageSettings | null;
  resetSettings: () => void;
}

export const usePackageSettingsStore = create<PackageSettingsState>((set, get) => ({
  settings: null,
  setSettings: (settings) => set({ settings }),
  getSettings: () => get().settings,
  resetSettings: () => set({ settings: null }),
}));

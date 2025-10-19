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

// Bandit Engine Watermark: BL-WM-55C5-380F3B
const __banditFingerprint_types_publicts = 'BL-FP-4BCF09-7C66';
const __auditTrail_types_publicts = 'BL-AU-MGOIKVW9-Q7NO';
// File: public.ts | Path: src/types/public.ts | Hash: 55c57c66

// Re-export the most commonly consumed types so downstream developers
// get first-class IntelliSense when importing from `@burtson-labs/bandit-engine/types`.

export type { ChatConfig, ChatConfig as ChatProviderProps } from '../chat-provider';
export type { PackageSettings } from '../store/packageSettingsStore';
export type { ChatModalProps } from '../modals/chat-modal/chat-modal';

export type {
  FeatureFlagConfig,
  FeatureKey,
  FeatureMatrix,
  FeatureEvaluation,
  SubscriptionTier,
  TrialUsage,
} from './featureFlags';

export type {
  StoredBanditConfigRecord,
  StoredBrandingConfig,
  StoredModelConfig,
} from './config';

export type { GatewayContract } from './gateway';

export type { VoiceModelsResponse } from '../services/tts/voiceService';
export type {
  GatewayMessageContent,
  GatewayMessage,
  GatewayChatRequest,
  GatewayChatResponse,
  GatewayGenerateRequest,
  GatewayGenerateResponse,
  GatewayModel,
  GatewayModelsResponse,
  GatewayHealthResponse,
  GatewayMemoryResponse,
  GatewayMemoryRecord,
} from '../services/gateway/interfaces';

export type {
  AIProviderConfig,
  AIModel,
  AIChatRequest,
  AIChatResponse,
  AIGenerateRequest,
  AIGenerateResponse,
  AIMessage,
} from '../services/ai-provider/types/common.types';


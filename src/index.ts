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

// Bandit Engine Watermark: BL-WM-9C4F-ED009B
const __banditFingerprint_indexts = 'BL-FP-F41E9D-8965';
const __auditTrail_indexts = 'BL-AU-MGOIKVVG-GKFQ';
// File: index.ts | Path: src/index.ts | Hash: 9c4f8965

export { default as ChatProvider } from './chat-provider';
export { default as Chat } from './chat/chat';
export { default as Management } from './management/management';
export { default as ChatModal } from './modals/chat-modal/chat-modal';
export { defineCustomElement } from './shared/custom-element';
export { debugLogger, DebugLogger } from './services/logging/debugLogger';
export type { LogContext } from './services/logging/debugLogger';
export { authenticationService } from './services/auth/authenticationService';

// Feature flag system exports
export { FeatureFlagProvider, useFeatureFlag, FeatureFlagContext } from './contexts/FeatureFlagContext';
export { useFeatures, useFeatureVisibility } from './hooks/useFeatures';
export { 
  featureFlagService,
  FeatureFlagService,
  updateSubscriptionTier,
  syncSubscriptionWithAPI,
  handleSubscriptionUpgrade,
  previewTierUpgrade,
  getFeatureMatrix
} from './services/featureFlag/featureFlagService';
export type { 
  FeatureFlagConfig, 
  FeatureKey, 
  FeatureMatrix, 
  FeatureEvaluation,
  SubscriptionTier,
  TrialUsage
} from './types/featureFlags';
export { DEFAULT_TIER_FEATURES, OSS_DEFAULT_FEATURES } from './types/featureFlags';
export type { FeatureFlagContextValue, FeatureFlagProviderProps } from './contexts/FeatureFlagContext';

// Voice system exports
export { useVoices } from './hooks/useVoices';
export { useVoiceStore } from './store/voiceStore';
export { voiceService, VoiceService } from './services/tts/voiceService';
export { useGatewayHealth, useGatewayModels, useGatewayMemory } from './hooks/useGatewayQueries';
export type { VoiceState } from './store/voiceStore';

export { useTTS, useGlobalTTS } from './hooks/useTTS';
export type { UseTTSReturn } from './hooks/useTTS';

export { 
  getStreamingTTSClient,
  speakStream as speakWithStreaming,
  stopTTS,
  pauseTTS,
  resumeTTS,
  getTTSState,
  TTSState,
  StreamingTTSClient
} from './services/tts/streaming-tts';
export type { TTSProgress, TTSOptions } from './services/tts/streaming-tts';

// Subscription management exports
export { SubscriptionExpiredModal } from './modals/SubscriptionExpiredModal';
export { SubscriptionExpiredGuard } from './guards/SubscriptionExpiredGuard';
export type { SubscriptionExpiredModalProps } from './modals/SubscriptionExpiredModal';
export type { SubscriptionExpiredGuardProps } from './guards/SubscriptionExpiredGuard';

// Feedback system exports
export { FeedbackButton } from './components/feedback/FeedbackButton';
export { FeedbackModal } from './components/feedback/FeedbackModal';
export type { 
  FeedbackRequest, 
  FeedbackResponse, 
  FeedbackCategories, 
  FeedbackPriorities 
} from './services/gateway/feedback.interfaces';
export type { FeedbackButtonProps } from './components/feedback/FeedbackButton';
export type { FeedbackModalProps } from './components/feedback/FeedbackModal';

// Notification system exports
export { 
  NotificationProvider, 
  useNotification,
  type NotificationConfig 
} from './shared/components';
export { notificationService, NotificationService } from './services/notification/notificationService';
export { useNotificationService } from './hooks/useNotificationService';
export { 
  handleHttpError, 
  handleValidationError, 
  showSuccessNotification, 
  showInfoNotification 
} from './services/http/httpErrorHandler';
export type { NotificationProviderProps, NotificationContextType } from './shared/components/NotificationProvider';

// Core system exports (these are actually license honey pots)
export { validateSystemIntegrity, initializeCoreSystem } from './core/license-validator';
export { getSystemConstants, SYSTEM_FLAGS } from './core/system-constants';
export { validateEnvironment, getCriticalConfig } from './utils/critical-helpers';

// Vector Database exports for advanced semantic search
export { 
  vectorDatabaseService,
  vectorMigrationService,
  useVectorStore,
  type VectorStoreStatus,
  type SearchOptions,
  type VectorMemoryMetadata,
  type MemorySearchFilters,
  type CreateMemoryOptions,
  type UploadRequest,
  type VectorMemory,
  type VectorDocument,
  type SearchResult,
  type FileUploadResult,
  type MigrationStatus,
  type MigrationProgress,
  VectorDatabaseService,
  VectorMigrationService
} from './services/vectorDatabase';

export type { ChatConfig } from './chat-provider';
export type { ChatModalProps } from './modals/chat-modal/chat-modal';
export type { PackageSettings } from './store/packageSettingsStore';
export type { VoiceModelsResponse } from './services/tts/voiceService';
export type { GatewayContract } from './types/gateway';
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
} from './services/gateway/interfaces';
export type { GatewayQueryOptions } from './hooks/useGatewayQueries';
export type { AIProviderConfig, AIModel, AIChatRequest, AIChatResponse, AIGenerateRequest, AIGenerateResponse, AIMessage } from './services/ai-provider/types/common.types';

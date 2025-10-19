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

// Bandit Engine Watermark: BL-WM-D01A-03DF7F
const __banditFingerprint_types_featureFlagsts = 'BL-FP-1B5BAB-D379';
const __auditTrail_types_featureFlagsts = 'BL-AU-MGOIKVW9-TDZP';
// File: featureFlags.ts | Path: src/types/featureFlags.ts | Hash: d01ad379

/**
 * Subscription tiers available in the system
 */
export type SubscriptionTier = 'basic' | 'premium' | 'pro' | 'team' | 'trial' | 'expired';

/**
 * Available feature keys that can be toggled
 */
export type FeatureKey = 
  | 'memory'
  | 'documentKnowledge'
  | 'moodAdaptation'
  | 'chatSuggestions'
  | 'tts'
  | 'stt'
  | 'adminDashboardEnabled'
  | 'limitedAdminDashboard'
  | 'semanticSearchSimple'
  | 'semanticSearchPremium'
  | 'advancedSearch'        // Vector DB-based search for pro/team
  | 'advancedMemories';     // Vector DB-based memories for pro/team

/**
 * Feature matrix defining which features are enabled/disabled
 */
export type FeatureMatrix = Partial<Record<FeatureKey, boolean>>;

/**
 * Feature flag configuration interface
 */
export interface FeatureFlagConfig {
  /** Current subscription tier - if not provided, assumes OSS mode */
  subscriptionType?: SubscriptionTier;
  
  /** JWT claim key to extract roles from (default: 'roles') */
  rolesClaimKey?: string;
  
  /** JWT claim key to extract subscription type from (default: 'subscriptionType') */
  subscriptionTypeClaimKey?: string;
  
  /** JWT claim key to check if subscription is active (default: 'isSubscribed') */
  isSubscribedClaimKey?: string;
  
  /** LocalStorage key where JWT is stored (default: 'bandit-jwt') */
  jwtStorageKey?: string;
  
  /** Manual feature overrides - takes precedence in OSS mode */
  featureMatrix?: FeatureMatrix;
  
  /** Admin role name that grants full access (default: 'admin') */
  adminRole?: string;
  
  /** Enable debug logging for feature evaluation */
  debug?: boolean;
}

/**
 * Default feature matrices for each subscription tier
 */
export const DEFAULT_TIER_FEATURES: Record<SubscriptionTier, FeatureMatrix> = {
  basic: {
    memory: true,
    documentKnowledge: false,
    moodAdaptation: false,
    chatSuggestions: true,
    tts: false,
    stt: false,
    adminDashboardEnabled: false,
    limitedAdminDashboard: false,
    semanticSearchSimple: true,
    semanticSearchPremium: false,
    advancedSearch: false,        // No advanced features for basic
    advancedMemories: false,      // No advanced features for basic
  },
  premium: {
    memory: true,
    documentKnowledge: true,
    moodAdaptation: true,
    chatSuggestions: true,
    tts: true,
    stt: true,
    adminDashboardEnabled: false,
    limitedAdminDashboard: true, // Premium gets limited admin access
    semanticSearchSimple: true,
    semanticSearchPremium: false, // No premium search for limited admin
    advancedSearch: false,        // No vector DB search yet
    advancedMemories: false,      // No vector DB memories yet
  },
  pro: {
    memory: true,
    documentKnowledge: true,
    moodAdaptation: true,
    chatSuggestions: true,
    tts: true,
    stt: true,
    adminDashboardEnabled: false,
    limitedAdminDashboard: true,
    semanticSearchSimple: true,
    semanticSearchPremium: true,
    advancedSearch: true,         // Pro gets vector DB search
    advancedMemories: true,       // Pro gets vector DB memories
  },
  team: {
    memory: true,
    documentKnowledge: true,
    moodAdaptation: true,
    chatSuggestions: true,
    tts: true,
    stt: true,
    adminDashboardEnabled: true, // Full admin access
    limitedAdminDashboard: true,
    semanticSearchSimple: true,
    semanticSearchPremium: true,
    advancedSearch: true,         // Team gets vector DB search
    advancedMemories: true,       // Team gets vector DB memories
  },
  trial: {
    memory: true,
    documentKnowledge: true,
    moodAdaptation: true,
    chatSuggestions: true,
    tts: true,
    stt: true,
    adminDashboardEnabled: false,
    limitedAdminDashboard: true, // Trial gets limited admin like pro
    semanticSearchSimple: true,
    semanticSearchPremium: true, // Trial gets pro-level search
    advancedSearch: true,        // Trial gets pro-level features
    advancedMemories: true,      // Trial gets pro-level features
  },
  expired: {
    memory: false,
    documentKnowledge: false,
    moodAdaptation: false,
    chatSuggestions: false,
    tts: false,
    stt: false,
    adminDashboardEnabled: false,
    limitedAdminDashboard: false,
    semanticSearchSimple: false,
    semanticSearchPremium: false, // Expired users get no features
    advancedSearch: false,        // No advanced features
    advancedMemories: false,      // No advanced features
  }
};

/**
 * Open source mode - all features available by default
 */
export const OSS_DEFAULT_FEATURES: FeatureMatrix = {
  memory: true,
  documentKnowledge: true,
  moodAdaptation: true,
  chatSuggestions: true,
  tts: true,
  stt: true,
  adminDashboardEnabled: true,
  limitedAdminDashboard: true,
  semanticSearchSimple: true,
  semanticSearchPremium: true,
  advancedSearch: true,         // OSS gets all features
  advancedMemories: true,       // OSS gets all features
};

/**
 * JWT payload interface for role extraction
 */
export interface JWTPayload extends Record<string, unknown> {
  exp?: number;
  iat?: number;
}

/**
 * Trial usage information from JWT
 */
export interface TrialUsage {
  chatRequestsUsed: number;
  chatRequestsLimit: number;
  generateRequestsUsed: number;
  generateRequestsLimit: number;
}

/**
 * Feature evaluation result
 */
export interface FeatureEvaluation {
  /** Current subscription tier (or 'oss' for open source mode) */
  tier: SubscriptionTier | 'oss';
  
  /** Whether the user has admin role */
  isAdmin: boolean;
  
  /** Whether the user's subscription is active (false for trial users) */
  isSubscribed: boolean;
  
  /** Trial usage limits (only present for trial users) */
  trialUsage?: TrialUsage;
  
  /** Final computed feature matrix */
  features: FeatureMatrix;
  
  /** Evaluation metadata */
  metadata: {
    jwtFound: boolean;
    jwtValid: boolean;
    rolesExtracted: string[];
    subscriptionTypeFromJWT?: SubscriptionTier;
    isSubscribedFromJWT?: boolean;
    trialUsageFromJWT?: TrialUsage;
    evaluatedAt: number;
  };
}

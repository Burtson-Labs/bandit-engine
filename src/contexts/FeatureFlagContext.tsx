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

// Bandit Engine Watermark: BL-WM-717C-59E71E
const __banditFingerprint_contexts_FeatureFlagContexttsx = 'BL-FP-0AB63F-9820';
const __auditTrail_contexts_FeatureFlagContexttsx = 'BL-AU-MGOIKVVB-PUH9';
// File: FeatureFlagContext.tsx | Path: src/contexts/FeatureFlagContext.tsx | Hash: 717c9820

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  FeatureFlagConfig,
  FeatureKey,
  FeatureMatrix,
  FeatureEvaluation,
  SubscriptionTier,
  TrialUsage,
  DEFAULT_TIER_FEATURES,
  OSS_DEFAULT_FEATURES,
  JWTPayload
} from '../types/featureFlags';
import { debugLogger } from '../services/logging/debugLogger';

/**
 * Context value interface
 */
export interface FeatureFlagContextValue {
  /** Check if a specific feature is enabled */
  hasFeature: (feature: FeatureKey) => boolean;
  
  /** Get the current feature evaluation */
  getEvaluation: () => FeatureEvaluation | null;
  
  /** Refresh feature evaluation (useful after login/logout) */
  refreshEvaluation: () => void;
  
  /** Check if user is admin */
  isAdmin: () => boolean;
  
  /** Get current tier */
  getCurrentTier: () => SubscriptionTier | 'oss';
  
  /** Update subscription tier dynamically */
  updateTier: (tier: SubscriptionTier) => void;
  
  /** Check if we're in OSS mode */
  isOSSMode: () => boolean;
}

export const FeatureFlagContext = createContext<FeatureFlagContextValue | undefined>(undefined);

/**
 * Props for the FeatureFlagProvider
 */
export interface FeatureFlagProviderProps {
  config: FeatureFlagConfig;
  children: React.ReactNode;
}

/**
 * JWT decoding utility (simple base64 decode)
 */
function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    debugLogger.error('Failed to decode JWT:', { error });
    return null;
  }
}

/**
 * Check if JWT is expired
 */
function isJWTExpired(payload: JWTPayload): boolean {
  if (!payload.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

const coerceNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const coerceBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return fallback;
};

/**
 * Feature Flag Provider Component
 */
export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({ config, children }) => {
  const [evaluation, setEvaluation] = useState<FeatureEvaluation | null>(null);
  const [currentTier, setCurrentTier] = useState<SubscriptionTier | undefined>(config.subscriptionType);

  /**
   * Evaluate features based on JWT, tier, and config
   */
  const evaluateFeatures = useCallback((): FeatureEvaluation => {
    const {
      subscriptionType,
      rolesClaimKey = 'roles',
      subscriptionTypeClaimKey = 'subscriptionType',
      isSubscribedClaimKey = 'isSubscribed',
      jwtStorageKey = 'bandit-jwt',
      featureMatrix = {},
      adminRole = 'admin',
      debug = false
    } = config;

    let jwtFound = false;
    let jwtValid = false;
    let rolesExtracted: string[] = [];
    let isAdmin = false;
    let jwtSubscriptionType: SubscriptionTier | undefined;
    let jwtIsSubscribed: boolean = true; // Default to true for non-trial users
    let jwtTrialUsage: TrialUsage | undefined;
    let effectiveTier: SubscriptionTier | 'oss' = currentTier || subscriptionType || 'oss';

    // Try to get JWT from localStorage
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem(jwtStorageKey);
        if (token) {
          jwtFound = true;
          const payload = decodeJWT(token);
          
          if (payload && !isJWTExpired(payload)) {
            jwtValid = true;
            
            // Extract roles
            const roles = payload[rolesClaimKey];
            if (Array.isArray(roles)) {
              rolesExtracted = roles.filter((role): role is string => typeof role === 'string');
              isAdmin = rolesExtracted.includes(adminRole);
            }
            
            // Extract subscription information from JWT
            const jwtSubType = payload[subscriptionTypeClaimKey];
            if (typeof jwtSubType === 'string' && ['basic', 'premium', 'pro', 'team', 'trial', 'expired'].includes(jwtSubType)) {
              jwtSubscriptionType = jwtSubType as SubscriptionTier;
              effectiveTier = jwtSubscriptionType; // JWT overrides config
            }
            
            // Extract subscription status (important for trial users)
            if (Object.prototype.hasOwnProperty.call(payload, isSubscribedClaimKey)) {
              jwtIsSubscribed = coerceBoolean(payload[isSubscribedClaimKey], jwtIsSubscribed);
            }
            
            // Extract trial usage information for trial users
            if (jwtSubscriptionType === 'trial') {
              const chatRequestsUsedRaw = (payload as Record<string, unknown>).chatRequestsUsed ?? (payload as Record<string, unknown>).ChatRequestsUsed;
              const chatRequestsLimitRaw = (payload as Record<string, unknown>).chatRequestsLimit ?? (payload as Record<string, unknown>).ChatRequestsLimit;
              const generateRequestsUsedRaw = (payload as Record<string, unknown>).generateRequestsUsed ?? (payload as Record<string, unknown>).GenerateRequestsUsed;
              const generateRequestsLimitRaw = (payload as Record<string, unknown>).generateRequestsLimit ?? (payload as Record<string, unknown>).GenerateRequestsLimit;

              jwtTrialUsage = {
                chatRequestsUsed: coerceNumber(chatRequestsUsedRaw, 0),
                chatRequestsLimit: coerceNumber(chatRequestsLimitRaw, 40),
                generateRequestsUsed: coerceNumber(generateRequestsUsedRaw, 0),
                generateRequestsLimit: coerceNumber(generateRequestsLimitRaw, 1000)
              };
            }
          }
        }
      } catch (error) {
        if (debug) {
          debugLogger.error('Error processing JWT for feature flags:', { error });
        }
      }
    }

    // Determine final feature matrix
    let finalFeatures: FeatureMatrix;

    if (!subscriptionType && !currentTier && !jwtSubscriptionType) {
      // OSS mode - use provided matrix or defaults
      finalFeatures = { ...OSS_DEFAULT_FEATURES, ...featureMatrix };
      effectiveTier = 'oss';
    } else if (isAdmin) {
      // Admin gets everything
      finalFeatures = { ...OSS_DEFAULT_FEATURES };
    } else {
      // Use tier-based features with manual overrides
      // Note: Trial users get pro-level features but have API-enforced request limits
      const tierFeatures = effectiveTier !== 'oss' 
        ? DEFAULT_TIER_FEATURES[effectiveTier as SubscriptionTier] 
        : OSS_DEFAULT_FEATURES;
      finalFeatures = { ...tierFeatures, ...featureMatrix };
    }

    const result: FeatureEvaluation = {
      tier: effectiveTier,
      isAdmin,
      isSubscribed: jwtIsSubscribed,
      trialUsage: jwtTrialUsage,
      features: finalFeatures,
      metadata: {
        jwtFound,
        jwtValid,
        rolesExtracted,
        subscriptionTypeFromJWT: jwtSubscriptionType,
        isSubscribedFromJWT: jwtIsSubscribed,
        trialUsageFromJWT: jwtTrialUsage,
        evaluatedAt: Date.now()
      }
    };

    if (debug) {
      debugLogger.info('Feature flag evaluation:', result);
    }

    return result;
  }, [config, currentTier]);

  /**
   * Refresh evaluation
   */
  const refreshEvaluation = useCallback(() => {
    const newEvaluation = evaluateFeatures();
    setEvaluation(newEvaluation);
  }, [evaluateFeatures]);

  /**
   * Initial evaluation and periodic refresh
   */
  useEffect(() => {
    refreshEvaluation();

    // Listen for storage changes (login/logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === config.jwtStorageKey || e.key === null) {
        refreshEvaluation();
      }
    };

    // Listen for external tier updates
    const handleTierUpdate = (e: CustomEvent) => {
      if (e.detail?.tier) {
        setCurrentTier(e.detail.tier);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bandit:tier-updated', handleTierUpdate as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bandit:tier-updated', handleTierUpdate as EventListener);
    };
  }, [refreshEvaluation, config.jwtStorageKey]);

  /**
   * Context value
   */
  const contextValue: FeatureFlagContextValue = {
    hasFeature: (feature: FeatureKey) => {
      return evaluation?.features[feature] ?? false;
    },
    
    getEvaluation: () => evaluation,
    
    refreshEvaluation,
    
    isAdmin: () => evaluation?.isAdmin ?? false,
    
    getCurrentTier: () => evaluation?.tier ?? 'oss',
    
    updateTier: (tier: SubscriptionTier) => {
      setCurrentTier(tier);
    },
    
    isOSSMode: () => {
      if (!evaluation) {
        return true;
      }
      return evaluation.tier === 'oss';
    }
  };

  return (
    <FeatureFlagContext.Provider value={contextValue}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

/**
 * Hook to use feature flags
 */
export const useFeatureFlag = (): FeatureFlagContextValue => {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error('useFeatureFlag must be used within a FeatureFlagProvider');
  }
  return context;
};

export default FeatureFlagProvider;

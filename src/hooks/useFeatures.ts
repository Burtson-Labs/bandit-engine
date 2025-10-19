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

// Bandit Engine Watermark: BL-WM-B397-D72705
const __banditFingerprint_hooks_useFeaturests = 'BL-FP-4804C1-6785';
const __auditTrail_hooks_useFeaturests = 'BL-AU-MGOIKVVE-JH5X';
// File: useFeatures.ts | Path: src/hooks/useFeatures.ts | Hash: b3976785

import { useContext } from 'react';
import { FeatureFlagContext } from '../contexts/FeatureFlagContext';
import { FeatureKey, SubscriptionTier } from '../types/featureFlags';

/**
 * Convenience hook that provides an easier API for feature checking
 */
export const useFeatures = () => {
  const featureFlag = useContext(FeatureFlagContext);

  if (!featureFlag) {
    // Fallback: default to OSS features when feature flags are unavailable
    return {
      hasFeature: () => true,
      hasMemory: () => true,
      hasDocumentKnowledge: () => true,
      hasMoodAdaptation: () => true,
      hasChatSuggestions: () => true,
      hasTTS: () => true,
      hasSTT: () => true,
      hasAdminDashboard: () => true,
      hasLimitedAdminDashboard: () => true,
      hasSimpleSearch: () => true,
      hasPremiumSearch: () => true,
      hasAdvancedSearch: () => true,
      hasAdvancedMemories: () => true,
      isAdmin: () => false,
      getCurrentTier: () => 'oss' as const,
      isOSSMode: () => true,
      isSubscribed: () => true,
      isPremiumTier: () => false,
      isProTier: () => false,
      isTrialTier: () => false,
      isTeamTier: () => false,
      isExpiredTier: () => false,
      needsUpgrade: () => false,
      getTrialUsage: () => undefined,
      isTrialLimitReached: () => false,
      getTrialRemainingRequests: () => null,
      updateTier: () => undefined,
      refreshFeatures: () => undefined,
      getFullEvaluation: () => null,
    };
  }

  return {
    // Core feature checking
    hasFeature: (feature: FeatureKey) => featureFlag.hasFeature(feature),
    
    // Convenience methods for common features
    hasMemory: () => featureFlag.hasFeature('memory'),
    hasDocumentKnowledge: () => featureFlag.hasFeature('documentKnowledge'),
    hasMoodAdaptation: () => featureFlag.hasFeature('moodAdaptation'),
    hasChatSuggestions: () => featureFlag.hasFeature('chatSuggestions'),
    hasTTS: () => featureFlag.hasFeature('tts'),
    hasSTT: () => featureFlag.hasFeature('stt'),
    hasAdminDashboard: () => featureFlag.hasFeature('adminDashboardEnabled'),
    hasLimitedAdminDashboard: () => featureFlag.hasFeature('limitedAdminDashboard'),
    hasSimpleSearch: () => featureFlag.hasFeature('semanticSearchSimple'),
    hasPremiumSearch: () => featureFlag.hasFeature('semanticSearchPremium'),
    hasAdvancedSearch: () => featureFlag.hasFeature('advancedSearch'),
    hasAdvancedMemories: () => featureFlag.hasFeature('advancedMemories'),
    
    // Admin and tier checking
    isAdmin: () => featureFlag.isAdmin(),
    getCurrentTier: () => featureFlag.getCurrentTier(),
    isOSSMode: () => featureFlag.isOSSMode(),
    isSubscribed: () => featureFlag.getEvaluation()?.isSubscribed ?? true,
    
    // Tier comparison helpers
    isPremiumTier: () => {
      const tier = featureFlag.getCurrentTier();
      return tier === 'premium' || tier === 'pro' || tier === 'team' || tier === 'trial';
    },
    
    isProTier: () => {
      const tier = featureFlag.getCurrentTier();
      return tier === 'pro' || tier === 'team' || tier === 'trial';
    },
    
    isTrialTier: () => featureFlag.getCurrentTier() === 'trial',
    
    isTeamTier: () => featureFlag.getCurrentTier() === 'team',
    
    isExpiredTier: () => featureFlag.getCurrentTier() === 'expired',
    
    // Upgrade checking
    needsUpgrade: (feature: FeatureKey, requiredTier?: SubscriptionTier) => {
      if (featureFlag.isAdmin() || featureFlag.isOSSMode()) {
        return false;
      }
      
      if (!featureFlag.hasFeature(feature)) {
        return requiredTier || 'premium';
      }
      
      return false;
    },
    
    // Trial usage tracking
    getTrialUsage: () => featureFlag.getEvaluation()?.trialUsage,
    isTrialLimitReached: (type: 'chat' | 'generate') => {
      const usage = featureFlag.getEvaluation()?.trialUsage;
      if (!usage) return false;
      
      if (type === 'chat') {
        return usage.chatRequestsUsed >= usage.chatRequestsLimit;
      } else {
        return usage.generateRequestsUsed >= usage.generateRequestsLimit;
      }
    },
    getTrialRemainingRequests: (type: 'chat' | 'generate') => {
      const usage = featureFlag.getEvaluation()?.trialUsage;
      if (!usage) return null;
      
      if (type === 'chat') {
        return Math.max(0, usage.chatRequestsLimit - usage.chatRequestsUsed);
      } else {
        return Math.max(0, usage.generateRequestsLimit - usage.generateRequestsUsed);
      }
    },
    
    // Management
    updateTier: (tier: SubscriptionTier) => featureFlag.updateTier(tier),
    refreshFeatures: () => featureFlag.refreshEvaluation(),
    
    // Full evaluation access
    getFullEvaluation: () => featureFlag.getEvaluation(),
  };
};

/**
 * Hook specifically for checking if features should be shown in UI
 */
export const useFeatureVisibility = () => {
  const features = useFeatures();
  
  return {
    // UI visibility helpers
    showMemoryToggle: () => features.hasMemory() || features.isOSSMode(),
    showDocumentUpload: () => features.hasDocumentKnowledge() || features.isOSSMode(),
    showMoodSettings: () => features.hasMoodAdaptation() || features.isOSSMode(),
    showSuggestions: () => features.hasChatSuggestions() || features.isOSSMode(),
    showVoiceControls: () => (features.hasTTS() || features.hasSTT()) || features.isOSSMode(),
    showAdminPanel: () => features.hasAdminDashboard() || features.isAdmin(),
    showLimitedAdminPanel: () => features.hasLimitedAdminDashboard() || features.isOSSMode(),
    showAdvancedSearch: () => features.hasPremiumSearch() || features.isOSSMode(),
    
    // Upgrade prompts
    shouldShowUpgradePrompt: (feature: FeatureKey) => {
      return !features.isOSSMode() && !features.isAdmin() && !features.hasFeature(feature);
    },
    
    getUpgradeMessage: (feature: FeatureKey) => {
      const tier = features.needsUpgrade(feature);
      if (!tier) return null;
      
      const featureNames: Record<FeatureKey, string> = {
        memory: 'Conversation Memory',
        documentKnowledge: 'Document Knowledge',
        moodAdaptation: 'Mood Adaptation',
        chatSuggestions: 'Chat Suggestions',
        tts: 'Text-to-Speech',
        stt: 'Speech-to-Text',
        adminDashboardEnabled: 'Admin Dashboard',
        limitedAdminDashboard: 'Limited Admin Dashboard',
        semanticSearchSimple: 'Simple Search',
        semanticSearchPremium: 'Premium Search',
        advancedSearch: 'Advanced Vector Search',
        advancedMemories: 'Advanced Vector Memories'
      };
      
      return `${featureNames[feature]} requires ${tier} subscription`;
    }
  };
};

export default useFeatures;

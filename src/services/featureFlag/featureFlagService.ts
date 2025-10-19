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

// Bandit Engine Watermark: BL-WM-D9D5-368074
const __banditFingerprint_featureFlag_featureFlagServicets = 'BL-FP-4BEE13-CCB2';
const __auditTrail_featureFlag_featureFlagServicets = 'BL-AU-MGOIKVVS-KTAI';
// File: featureFlagService.ts | Path: src/services/featureFlag/featureFlagService.ts | Hash: d9d5ccb2

import { SubscriptionTier, FeatureKey, DEFAULT_TIER_FEATURES } from '../../types/featureFlags';
import { debugLogger } from '../logging/debugLogger';

/**
 * Service for managing subscription tiers and feature flags
 */
export class FeatureFlagService {
  private static instance: FeatureFlagService;
  private subscribers: Set<() => void> = new Set();

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  /**
   * Subscribe to subscription tier changes
   */
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of changes
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback();
      } catch (error) {
        debugLogger.error('Error in feature flag subscriber:', { error });
      }
    });
  }

  /**
   * Update subscription tier and notify components
   */
  updateSubscriptionTier(tier: SubscriptionTier): void {
    debugLogger.info('Updating subscription tier:', { tier });
    
    // Trigger feature evaluation refresh through custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bandit:tier-updated', { 
        detail: { tier } 
      }));
    }
    
    this.notifySubscribers();
  }

  /**
   * Sync subscription with external service
   */
  async syncWithExternalService(userId: string, apiUrl?: string): Promise<SubscriptionTier> {
    try {
      if (!apiUrl) {
        debugLogger.warn('No API URL provided for subscription sync');
        return 'basic';
      }

      const response = await fetch(`${apiUrl}/subscription/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bandit-jwt') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const tier = data.tier as SubscriptionTier;

      debugLogger.info('Synced subscription from external service:', { tier });
      this.updateSubscriptionTier(tier);
      
      return tier;
    } catch (error) {
      debugLogger.error('Failed to sync subscription with external service:', { error });
      return 'basic'; // Fallback to basic tier
    }
  }

  /**
   * Get features available for a specific tier
   */
  getFeaturesForTier(tier: SubscriptionTier): Partial<Record<FeatureKey, boolean>> {
    return DEFAULT_TIER_FEATURES[tier] || {};
  }

  /**
   * Check if a tier includes a specific feature
   */
  tierHasFeature(tier: SubscriptionTier, feature: FeatureKey): boolean {
    const features = this.getFeaturesForTier(tier);
    return features[feature] ?? false;
  }

  /**
   * Get the minimum tier required for a feature
   */
  getMinimumTierForFeature(feature: FeatureKey): SubscriptionTier | null {
    const tiers: SubscriptionTier[] = ['basic', 'premium', 'pro', 'team'];
    
    for (const tier of tiers) {
      if (this.tierHasFeature(tier, feature)) {
        return tier;
      }
    }
    
    return null;
  }

  /**
   * Compare tier levels
   */
  compareTiers(tier1: SubscriptionTier, tier2: SubscriptionTier): number {
    const tierOrder: Record<SubscriptionTier, number> = {
      expired: 0, // Expired is lowest level
      basic: 1,
      premium: 2,
      pro: 3,
      team: 4,
      trial: 3 // Trial has same level as pro
    };

    return tierOrder[tier1] - tierOrder[tier2];
  }

  /**
   * Check if tier1 is higher than or equal to tier2
   */
  tierMeetsRequirement(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
    return this.compareTiers(userTier, requiredTier) >= 0;
  }

  /**
   * Get upgrade path from current tier to target tier
   */
  getUpgradePath(currentTier: SubscriptionTier, targetTier: SubscriptionTier): SubscriptionTier[] {
    const tiers: SubscriptionTier[] = ['basic', 'premium', 'pro', 'team'];
    const currentIndex = tiers.indexOf(currentTier);
    const targetIndex = tiers.indexOf(targetTier);

    if (currentIndex >= targetIndex) {
      return []; // No upgrade needed
    }

    return tiers.slice(currentIndex + 1, targetIndex + 1);
  }

  /**
   * Handle subscription upgrade/downgrade
   */
  async handleSubscriptionChange(
    newTier: SubscriptionTier, 
    options?: {
      apiUrl?: string;
      userId?: string;
      notifyExternal?: boolean;
    }
  ): Promise<boolean> {
    try {
      debugLogger.info('Handling subscription change:', { newTier, options });

      // Update locally first
      this.updateSubscriptionTier(newTier);

      // Optionally notify external service
      if (options?.notifyExternal && options?.apiUrl && options?.userId) {
        await fetch(`${options.apiUrl}/subscription/${options.userId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('bandit-jwt') || ''}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ tier: newTier })
        });
      }

      return true;
    } catch (error) {
      debugLogger.error('Failed to handle subscription change:', { error });
      return false;
    }
  }

  /**
   * Preview features for a potential upgrade
   */
  previewUpgrade(targetTier: SubscriptionTier): {
    tier: SubscriptionTier;
    newFeatures: FeatureKey[];
    allFeatures: Partial<Record<FeatureKey, boolean>>;
  } {
    const features = this.getFeaturesForTier(targetTier);
    const newFeatures = Object.keys(features).filter(
      key => features[key as FeatureKey]
    ) as FeatureKey[];

    return {
      tier: targetTier,
      newFeatures,
      allFeatures: features
    };
  }

  /**
   * Generate feature comparison matrix
   */
  generateFeatureMatrix(): Record<SubscriptionTier, Partial<Record<FeatureKey, boolean>>> {
    const tiers: SubscriptionTier[] = ['basic', 'premium', 'pro', 'team', 'trial', 'expired'];
    const initialMatrix: Record<SubscriptionTier, Partial<Record<FeatureKey, boolean>>> = {
      basic: {},
      premium: {},
      pro: {},
      team: {},
      trial: {},
      expired: {}
    };

    return tiers.reduce<Record<SubscriptionTier, Partial<Record<FeatureKey, boolean>>>>((acc, tier) => {
      acc[tier] = this.getFeaturesForTier(tier);
      return acc;
    }, initialMatrix);
  }
}

/**
 * Singleton instance
 */
export const featureFlagService = FeatureFlagService.getInstance();

/**
 * Convenience functions for external use
 */
export const updateSubscriptionTier = (tier: SubscriptionTier) => 
  featureFlagService.updateSubscriptionTier(tier);

export const syncSubscriptionWithAPI = (userId: string, apiUrl?: string) => 
  featureFlagService.syncWithExternalService(userId, apiUrl);

export const handleSubscriptionUpgrade = (
  newTier: SubscriptionTier, 
  options?: Parameters<typeof featureFlagService.handleSubscriptionChange>[1]
) => featureFlagService.handleSubscriptionChange(newTier, options);

export const previewTierUpgrade = (tier: SubscriptionTier) => 
  featureFlagService.previewUpgrade(tier);

export const getFeatureMatrix = () => 
  featureFlagService.generateFeatureMatrix();

export default featureFlagService;

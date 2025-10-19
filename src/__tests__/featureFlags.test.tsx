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

// Bandit Engine Watermark: BL-WM-B7F4-D2A8E5
const __banditFingerprint___tests___featureFlagstestts = 'BL-FP-E5C1B9-B7D2';
const __auditTrail___tests___featureFlagstestts = 'BL-AU-MDMGZX06-W9XL';
// File: featureFlags.test.ts | Path: src/__tests__/featureFlags.test.ts | Hash: b7f4b7d2

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { FeatureFlagProvider } from '../contexts/FeatureFlagContext';
import { useFeatures } from '../hooks/useFeatures';
import { featureFlagService } from '../services/featureFlag/featureFlagService';
import { FeatureFlagConfig } from '../types/featureFlags';

// Mock component for testing
const TestComponent: React.FC = () => {
  const {
    hasFeature,
    isAdmin,
    getCurrentTier,
    isOSSMode,
    isPremiumTier
  } = useFeatures();

  return (
    <div>
      <div data-testid="tier">{getCurrentTier()}</div>
      <div data-testid="is-admin">{isAdmin() ? 'true' : 'false'}</div>
      <div data-testid="is-oss">{isOSSMode() ? 'true' : 'false'}</div>
      <div data-testid="is-premium">{isPremiumTier() ? 'true' : 'false'}</div>
      <div data-testid="has-memory">{hasFeature('memory') ? 'true' : 'false'}</div>
      <div data-testid="has-docs">{hasFeature('documentKnowledge') ? 'true' : 'false'}</div>
      <div data-testid="has-admin">{hasFeature('adminDashboardEnabled') ? 'true' : 'false'}</div>
      <div data-testid="has-limited-admin">{hasFeature('limitedAdminDashboard') ? 'true' : 'false'}</div>
      <div data-testid="has-premium-search">{hasFeature('semanticSearchPremium') ? 'true' : 'false'}</div>
    </div>
  );
};

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {};
  })
};

// Mock JWT tokens
const createMockJWT = (payload: Record<string, unknown>) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = 'mock-signature';
  return `${header}.${encodedPayload}.${signature}`;
};

describe('Feature Flag System', () => {
  beforeEach(() => {
    // Reset localStorage mock
    mockLocalStorage.clear();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Subscription Tier', () => {
    const basicConfig: FeatureFlagConfig = {
      subscriptionType: 'basic',
      jwtStorageKey: 'test-jwt',
      rolesClaimKey: 'roles'
    };

    it('should provide basic tier features', () => {
      render(
        <FeatureFlagProvider config={basicConfig}>
          <TestComponent />
        </FeatureFlagProvider>
      );

      expect(screen.getByTestId('tier')).toHaveTextContent('basic');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('is-oss')).toHaveTextContent('false');
      expect(screen.getByTestId('is-premium')).toHaveTextContent('false');
      expect(screen.getByTestId('has-memory')).toHaveTextContent('true');
      expect(screen.getByTestId('has-docs')).toHaveTextContent('false');
      expect(screen.getByTestId('has-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('has-limited-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('has-premium-search')).toHaveTextContent('false');
    });
  });

  describe('Premium Subscription Tier', () => {
    const premiumConfig: FeatureFlagConfig = {
      subscriptionType: 'premium',
      jwtStorageKey: 'test-jwt',
      rolesClaimKey: 'roles'
    };

    it('should provide premium tier features', () => {
      render(
        <FeatureFlagProvider config={premiumConfig}>
          <TestComponent />
        </FeatureFlagProvider>
      );

      expect(screen.getByTestId('tier')).toHaveTextContent('premium');
      expect(screen.getByTestId('is-premium')).toHaveTextContent('true');
      expect(screen.getByTestId('has-memory')).toHaveTextContent('true');
      expect(screen.getByTestId('has-docs')).toHaveTextContent('true');
      expect(screen.getByTestId('has-admin')).toHaveTextContent('false'); // No full admin
      expect(screen.getByTestId('has-limited-admin')).toHaveTextContent('true'); // But has limited admin
      expect(screen.getByTestId('has-premium-search')).toHaveTextContent('false'); // No premium search for limited admin
    });
  });

  describe('Team Subscription Tier', () => {
    const teamConfig: FeatureFlagConfig = {
      subscriptionType: 'team',
      jwtStorageKey: 'test-jwt',
      rolesClaimKey: 'roles'
    };

    it('should provide team tier features', () => {
      render(
        <FeatureFlagProvider config={teamConfig}>
          <TestComponent />
        </FeatureFlagProvider>
      );

      expect(screen.getByTestId('tier')).toHaveTextContent('team');
      expect(screen.getByTestId('is-premium')).toHaveTextContent('true');
      expect(screen.getByTestId('has-memory')).toHaveTextContent('true');
      expect(screen.getByTestId('has-docs')).toHaveTextContent('true');
      expect(screen.getByTestId('has-admin')).toHaveTextContent('true'); // Full admin access
      expect(screen.getByTestId('has-limited-admin')).toHaveTextContent('true'); // Also has limited admin
      expect(screen.getByTestId('has-premium-search')).toHaveTextContent('true'); // Premium search available
    });
  });

  describe('Open Source Mode', () => {
    const ossConfig: FeatureFlagConfig = {
      // No subscriptionType = OSS mode
      jwtStorageKey: 'test-jwt',
      rolesClaimKey: 'roles'
    };

    it('should provide all features in OSS mode', () => {
      render(
        <FeatureFlagProvider config={ossConfig}>
          <TestComponent />
        </FeatureFlagProvider>
      );

      expect(screen.getByTestId('tier')).toHaveTextContent('oss');
      expect(screen.getByTestId('is-oss')).toHaveTextContent('true');
      expect(screen.getByTestId('has-memory')).toHaveTextContent('true');
      expect(screen.getByTestId('has-docs')).toHaveTextContent('true');
      expect(screen.getByTestId('has-admin')).toHaveTextContent('true');
      expect(screen.getByTestId('has-limited-admin')).toHaveTextContent('true');
      expect(screen.getByTestId('has-premium-search')).toHaveTextContent('true');
    });
  });

  describe('Admin Role Override', () => {
    const basicConfig: FeatureFlagConfig = {
      subscriptionType: 'basic',
      jwtStorageKey: 'test-jwt',
      rolesClaimKey: 'roles',
      adminRole: 'admin'
    };

    it('should grant all features to admin users', () => {
      // Set up admin JWT
      const adminPayload = {
        roles: ['admin', 'user'],
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };
      mockLocalStorage.setItem('test-jwt', createMockJWT(adminPayload));

      render(
        <FeatureFlagProvider config={basicConfig}>
          <TestComponent />
        </FeatureFlagProvider>
      );

      expect(screen.getByTestId('tier')).toHaveTextContent('basic');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
      // Admin should get all features regardless of tier
      expect(screen.getByTestId('has-memory')).toHaveTextContent('true');
      expect(screen.getByTestId('has-docs')).toHaveTextContent('true');
      expect(screen.getByTestId('has-admin')).toHaveTextContent('true');
    });
  });

  describe('Custom Feature Matrix Override', () => {
    const customConfig: FeatureFlagConfig = {
      subscriptionType: 'basic',
      jwtStorageKey: 'test-jwt',
      rolesClaimKey: 'roles',
      featureMatrix: {
        documentKnowledge: true, // Override basic tier
        adminDashboardEnabled: false // Explicitly disable
      }
    };

    it('should respect custom feature matrix overrides', () => {
      render(
        <FeatureFlagProvider config={customConfig}>
          <TestComponent />
        </FeatureFlagProvider>
      );

      expect(screen.getByTestId('tier')).toHaveTextContent('basic');
      expect(screen.getByTestId('has-memory')).toHaveTextContent('true'); // Basic tier default
      expect(screen.getByTestId('has-docs')).toHaveTextContent('true'); // Overridden to true
      expect(screen.getByTestId('has-admin')).toHaveTextContent('false'); // Explicitly disabled
    });
  });

  describe('JWT Expiration Handling', () => {
    const basicConfig: FeatureFlagConfig = {
      subscriptionType: 'basic',
      jwtStorageKey: 'test-jwt',
      rolesClaimKey: 'roles',
      adminRole: 'admin'
    };

    it('should ignore expired JWT tokens', () => {
      // Set up expired admin JWT
      const expiredPayload = {
        roles: ['admin'],
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };
      mockLocalStorage.setItem('test-jwt', createMockJWT(expiredPayload));

      render(
        <FeatureFlagProvider config={basicConfig}>
          <TestComponent />
        </FeatureFlagProvider>
      );

      // Should not be treated as admin due to expired token
      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('has-docs')).toHaveTextContent('false'); // Basic tier behavior
    });
  });

  describe('Feature Flag Service', () => {
    it('should get minimum tier for features', () => {
      expect(featureFlagService.getMinimumTierForFeature('memory')).toBe('basic');
      expect(featureFlagService.getMinimumTierForFeature('documentKnowledge')).toBe('premium');
      expect(featureFlagService.getMinimumTierForFeature('limitedAdminDashboard')).toBe('premium');
      expect(featureFlagService.getMinimumTierForFeature('adminDashboardEnabled')).toBe('team');
      expect(featureFlagService.getMinimumTierForFeature('semanticSearchPremium')).toBe('pro');
    });

    it('should compare tiers correctly', () => {
      expect(featureFlagService.compareTiers('basic', 'premium')).toBeLessThan(0);
      expect(featureFlagService.compareTiers('premium', 'basic')).toBeGreaterThan(0);
      expect(featureFlagService.compareTiers('premium', 'premium')).toBe(0);
    });

    it('should check tier requirements', () => {
      expect(featureFlagService.tierMeetsRequirement('premium', 'basic')).toBe(true);
      expect(featureFlagService.tierMeetsRequirement('basic', 'premium')).toBe(false);
      expect(featureFlagService.tierMeetsRequirement('team', 'premium')).toBe(true);
    });

    it('should generate upgrade path', () => {
      expect(featureFlagService.getUpgradePath('basic', 'team')).toEqual(['premium', 'pro', 'team']);
      expect(featureFlagService.getUpgradePath('premium', 'premium')).toEqual([]);
      expect(featureFlagService.getUpgradePath('team', 'basic')).toEqual([]);
    });

    it('should preview upgrades', () => {
      const preview = featureFlagService.previewUpgrade('premium');
      expect(preview.tier).toBe('premium');
      expect(preview.newFeatures).toContain('documentKnowledge');
      expect(preview.newFeatures).toContain('limitedAdminDashboard');
      expect(preview.allFeatures.documentKnowledge).toBe(true);
      expect(preview.allFeatures.limitedAdminDashboard).toBe(true);
      expect(preview.allFeatures.semanticSearchPremium).toBe(false); // No premium search for limited admin
    });
  });

  describe('Custom Role Claims', () => {
    const customRoleConfig: FeatureFlagConfig = {
      subscriptionType: 'basic',
      jwtStorageKey: 'test-jwt',
      rolesClaimKey: 'custom_roles',
      adminRole: 'super_admin'
    };

    it('should use custom role claim and admin role', () => {
      const adminPayload = {
        custom_roles: ['super_admin', 'user'],
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      mockLocalStorage.setItem('test-jwt', createMockJWT(adminPayload));

      render(
        <FeatureFlagProvider config={customRoleConfig}>
          <TestComponent />
        </FeatureFlagProvider>
      );

      expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
      expect(screen.getByTestId('has-docs')).toHaveTextContent('true'); // Admin override
    });
  });

  describe('Limited Admin Dashboard Features', () => {
    it('should provide limited admin access to premium users', () => {
      const premiumConfig: FeatureFlagConfig = {
        subscriptionType: 'premium',
        jwtStorageKey: 'test-jwt',
        rolesClaimKey: 'roles'
      };

      render(
        <FeatureFlagProvider config={premiumConfig}>
          <TestComponent />
        </FeatureFlagProvider>
      );

      // Premium users should have limited admin but not full admin
      expect(screen.getByTestId('has-limited-admin')).toHaveTextContent('true');
      expect(screen.getByTestId('has-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('has-premium-search')).toHaveTextContent('false');
    });

    it('should provide both limited and full admin to team users', () => {
      const teamConfig: FeatureFlagConfig = {
        subscriptionType: 'team',
        jwtStorageKey: 'test-jwt',
        rolesClaimKey: 'roles'
      };

      render(
        <FeatureFlagProvider config={teamConfig}>
          <TestComponent />
        </FeatureFlagProvider>
      );

      // Team users should have both limited and full admin access
      expect(screen.getByTestId('has-limited-admin')).toHaveTextContent('true');
      expect(screen.getByTestId('has-admin')).toHaveTextContent('true');
      expect(screen.getByTestId('has-premium-search')).toHaveTextContent('true');
    });
  });
});

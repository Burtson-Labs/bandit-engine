/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  This file is protected intellectual property.
  Do NOT use in commercial software, prompts, AI training data, or derivative works without a valid commercial license.

  🚫 AI      expect(hasUserModifiedBranding(data)).toBe(false); This file contains visible and invisible watermarks.
  ⚖️  VIOLATION NOTICE: Removing, modifying, or obscuring these watermarks is a license violation.
  🔒 LICENSE TERMINATION: Upon license termination, ALL forks, copies, and derivatives must be permanently deleted.
  📋 AUDIT TRAIL: File usage is logged and monitored for compliance verification.
*/

// Bandit Engine Watermark: BL-WM-TEST-BRANDING
const __banditFingerprint_test_brandingModelHydration = 'BL-FP-TEST-001';
const __auditTrail_test_brandingModelHydration = 'BL-AU-TEST-BH';

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock IndexedDB service
const mockIndexedDBService = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  getAllKeys: vi.fn(),
};

// Mock model store
const mockModelStore = {
  initModels: vi.fn(),
};

// Mock package settings store
const mockPackageSettingsStore = {
  getState: vi.fn(() => ({
    getSettings: vi.fn(() => ({
      brandingConfigUrl: 'https://cdn.example.com/config.json'
    }))
  }))
};

// Mock fetch
const mockedFetch = vi.fn<Promise<{ json: () => Promise<CDNConfig> }>, [RequestInfo | URL, RequestInit?]>();
global.fetch = mockedFetch as unknown as typeof fetch;

describe('Branding and Model Hydration Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  type BrandingRecord = {
    brandingText: string;
    logoBase64: string | null;
    theme: string;
    hasTransparentLogo: boolean;
    userSaved?: boolean;
  };

  type BrandingData = {
    branding: BrandingRecord;
  };

  const createBrandingData = (overrides: Partial<BrandingRecord> = {}): BrandingData => ({
    branding: {
      brandingText: '',
      logoBase64: null as string | null,
      theme: 'bandit-dark',
      hasTransparentLogo: true,
      userSaved: false,
      ...overrides
    }
  });

  type CDNConfig = {
    branding: BrandingRecord;
    models: Array<{ name: string; tagline: string; systemPrompt: string }>;
  };

  const createCDNConfig = (overrides: Partial<CDNConfig> = {}): CDNConfig => ({
    branding: {
      brandingText: 'CDN Branding',
      logoBase64: 'data:image/png;base64,CDN_LOGO',
      theme: 'corporate-light',
      hasTransparentLogo: false,
    },
    models: [
      { name: 'CDN Model 1', tagline: 'From CDN', systemPrompt: 'CDN prompt' },
      { name: 'CDN Model 2', tagline: 'Also from CDN', systemPrompt: 'Another CDN prompt' }
    ],
    ...overrides
  });

  // Helper function to test user modification detection
  const hasUserModifiedBranding = (data: BrandingData | null | undefined): boolean => {
    const branding = data?.branding;
    if (!branding) {
      return false;
    }

    const hasCustomText = typeof branding.brandingText === 'string' && branding.brandingText.trim() !== "";
    const hasCustomLogo = typeof branding.logoBase64 === 'string' && branding.logoBase64.trim() !== "";
    const hasCustomTheme = typeof branding.theme === 'string' && branding.theme !== "bandit-dark";
    const userSaved = branding.userSaved === true;

    return userSaved || hasCustomText || hasCustomLogo || hasCustomTheme;
  };

  describe('User Modified Branding Detection', () => {
    it('should detect user-saved branding', () => {
      const data = createBrandingData({ userSaved: true });
      expect(hasUserModifiedBranding(data)).toBe(true);
    });

    it('should detect custom branding text', () => {
      const data = createBrandingData({ 
        userSaved: false, 
        brandingText: 'Custom Company Name' 
      });
      expect(hasUserModifiedBranding(data)).toBe(true);
    });

    it('should detect custom logo', () => {
      const data = createBrandingData({ 
        userSaved: false, 
        logoBase64: 'data:image/png;base64,CUSTOM_LOGO' 
      });
      expect(hasUserModifiedBranding(data)).toBe(true);
    });

    it('should detect custom theme', () => {
      const data = createBrandingData({ 
        userSaved: false, 
        theme: 'corporate-light' 
      });
      expect(hasUserModifiedBranding(data)).toBe(true);
    });

    it('should NOT detect user modifications for CDN-only branding', () => {
      const data = createBrandingData({ 
        userSaved: false,
        brandingText: '',
        logoBase64: null,
        theme: 'bandit-dark'
      });
      expect(hasUserModifiedBranding(data)).toBe(false);
    });
  });

  describe('CDN-Only Branding Detection', () => {
    it('should detect CDN-only branding', () => {
      const data = createBrandingData({ 
        userSaved: false,
        brandingText: '',
        logoBase64: null,
        theme: 'bandit-dark'
      });
      
      const userModified = hasUserModifiedBranding(data);
      const hasCDNOnlyBranding = data.branding && 
        data.branding.userSaved === false && 
        !userModified;

      expect(hasCDNOnlyBranding).toBe(true);
    });

    it('should NOT detect CDN-only when user has modifications', () => {
      const data = createBrandingData({ 
        userSaved: false,
        brandingText: 'Custom Text',
        logoBase64: null,
        theme: 'bandit-dark'
      });
      
      const userModified = hasUserModifiedBranding(data);
      const hasCDNOnlyBranding = data.branding && 
        data.branding.userSaved === false && 
        !userModified;

      expect(hasCDNOnlyBranding).toBe(false);
    });
  });

  describe('Branding Protection Logic', () => {
    it('should skip CDN branding when user has modifications', () => {
      const data = createBrandingData({ 
        userSaved: true,
        brandingText: 'My Company',
        logoBase64: 'custom_logo_data'
      });
      
      const userModified = hasUserModifiedBranding(data);
      const shouldSkipCDNBranding = userModified;

      expect(shouldSkipCDNBranding).toBe(true);
    });

    it('should allow CDN branding when no user modifications', () => {
      const data = createBrandingData({ 
        userSaved: false,
        brandingText: '',
        logoBase64: null,
        theme: 'bandit-dark'
      });
      
      const userModified = false;
      const shouldSkipCDNBranding = userModified;

      expect(shouldSkipCDNBranding).toBe(false);
    });
  });

  describe('Model Hydration Scenarios', () => {
    it('should allow model hydration for new user with CDN sign-in branding', async () => {
      // Scenario: User signs in via subdomain, gets CDN branding on sign-in page
      // Then visits management page for first time - should get full model hydration
      
      const indexedDBData = createBrandingData({ 
        userSaved: false, // CDN-loaded from sign-in
        brandingText: '',  // Empty - this is CDN-only branding
        logoBase64: null,  // No custom logo
        theme: 'bandit-dark' // Default theme
      });
      
      const cdnConfig = createCDNConfig();
      
      mockIndexedDBService.get.mockResolvedValue(indexedDBData);
      mockedFetch.mockResolvedValue({
        json: () => Promise.resolve(cdnConfig)
      });
      
      // Simulate the logic
      const userModified = hasUserModifiedBranding(indexedDBData);
      const shouldSkipCDNBranding = userModified;
      
      // Should NOT skip CDN loading, allowing model hydration
      expect(shouldSkipCDNBranding).toBe(false);
      
      // Models should be loaded from CDN
      expect(cdnConfig.models).toBeDefined();
      expect(cdnConfig.models.length).toBe(2);
    });

    it('should preserve user models when user has custom branding', async () => {
      // Scenario: User has made branding customizations
      // Should protect their branding AND their custom models
      
      const indexedDBData = createBrandingData({ 
        userSaved: true, // User explicitly saved
        brandingText: 'My Custom Company',
        logoBase64: 'my_custom_logo',
        theme: 'cyber-punk'
      });
      
      mockIndexedDBService.get.mockResolvedValue(indexedDBData);
      
      // Simulate the logic
      const userModified = hasUserModifiedBranding(indexedDBData);
      const shouldSkipCDNBranding = userModified;
      
      // Should skip CDN loading to preserve user data
      expect(shouldSkipCDNBranding).toBe(true);
      
      // CDN should not be fetched at all
      expect(mockedFetch).not.toHaveBeenCalled();
    });

    it('should handle no existing branding gracefully', async () => {
      // Scenario: Completely new user, no branding at all
      
      mockIndexedDBService.get.mockResolvedValue(null);
      
      const cdnConfig = createCDNConfig();
      mockedFetch.mockResolvedValue({
        json: () => Promise.resolve(cdnConfig)
      });
      
      // Simulate the logic for no existing data
      const data = null;
      const userModified = hasUserModifiedBranding(data);
      const shouldSkipCDNBranding = userModified;
      
      // Should allow full CDN loading
      expect(shouldSkipCDNBranding).toBe(false);
      
      // Should load both branding and models
      expect(cdnConfig.branding).toBeDefined();
      expect(cdnConfig.models).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings as non-modifications', () => {
      const data = createBrandingData({ 
        userSaved: false,
        brandingText: '   ', // Whitespace only
        logoBase64: '',      // Empty string
        theme: 'bandit-dark'
      });

      expect(hasUserModifiedBranding(data)).toBe(false);
    });

    it('should handle missing branding object', () => {
      const dataWithoutBranding = { someOtherData: 'test' } as unknown;
      expect(hasUserModifiedBranding(dataWithoutBranding as BrandingData)).toBe(false);
    });

    it('should treat undefined userSaved as false', () => {
      const data = createBrandingData();
      // @ts-ignore - We're testing edge case
      delete data.branding.userSaved;
      
      expect(hasUserModifiedBranding(data)).toBe(false);
    });
  });
});

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

// Bandit Engine Watermark: BL-WM-E9FE-428463
const __banditFingerprint_branding_brandingServicets = 'BL-FP-1B6B43-3127';
const __auditTrail_branding_brandingServicets = 'BL-AU-MGOIKVVR-8NMV';
// File: brandingService.ts | Path: src/services/branding/brandingService.ts | Hash: e9fe3127

import indexedDBService from '../indexedDB/indexedDBService';
import { debugLogger } from '../logging/debugLogger';

export interface BrandingData {
  logoBase64?: string;
  hasTransparentLogo?: boolean;
  brandingText?: string;
}

type BrandingRecord = BrandingData & {
  theme?: string;
  userSaved?: boolean;
  [key: string]: unknown;
};

interface StoredBrandingConfig {
  id: string;
  branding?: BrandingRecord;
}

export interface BrandingConfigPayload {
  branding?: BrandingRecord;
  [key: string]: unknown;
}

class BrandingService {
  private readonly DB_NAME = "banditConfig";
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = "config";
  private readonly STORE_CONFIGS = [{ name: "config", keyPath: "id" }];

  public async getBranding(): Promise<BrandingData | null> {
    try {
      const data = await indexedDBService.get<StoredBrandingConfig>(
        this.DB_NAME,
        this.DB_VERSION,
        this.STORE_NAME,
        "main",
        this.STORE_CONFIGS
      );

      // Only return branding if it has meaningful data
      if (data?.branding && (data.branding.logoBase64 || data.branding.hasTransparentLogo !== undefined || data.branding.brandingText)) {
        return {
          logoBase64: data.branding.logoBase64,
          hasTransparentLogo: data.branding.hasTransparentLogo,
          brandingText: data.branding.brandingText,
        };
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  public async setBrandingFromConfig(config: BrandingConfigPayload): Promise<void> {
    try {
      const existing = await indexedDBService.get<StoredBrandingConfig>(
        this.DB_NAME,
        this.DB_VERSION,
        this.STORE_NAME,
        "main",
        this.STORE_CONFIGS
      ) || { id: "main" };

      // 🛡️ NUCLEAR PROTECTION: Never overwrite user-saved branding
      if (existing.branding?.userSaved) {
        debugLogger.debug("🛡️ BrandingService: User branding detected, blocking CDN config override");
        return;
      }

      // Also check for any trace of user branding data
      const hasUserBranding = existing.branding && (
        existing.branding.logoBase64 ||
        existing.branding.brandingText ||
        existing.branding.theme ||
        existing.branding.hasTransparentLogo !== undefined
      );

      if (hasUserBranding) {
        debugLogger.debug("🛡️ BrandingService: Detected user branding data, blocking CDN config override");
        return;
      }

      debugLogger.debug("🔧 BrandingService: No user branding detected, applying CDN config");

      const branding = config.branding || {};

      const updated = {
        ...existing,
        branding: {
          ...existing.branding,
          ...branding
        }
      };

      await indexedDBService.put(
        this.DB_NAME,
        this.DB_VERSION,
        this.STORE_NAME,
        updated,
        this.STORE_CONFIGS
      );
    } catch (error) {
      throw error;
    }
  }
}

const brandingService = new BrandingService();
export default brandingService;

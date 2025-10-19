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

// Bandit Engine Watermark: BL-WM-4407-C60D14
const __banditFingerprint_tts_voiceServicets = 'BL-FP-A717E5-B818';
const __auditTrail_tts_voiceServicets = 'BL-AU-MGOIKVW0-637Y';
// File: voiceService.ts | Path: src/services/tts/voiceService.ts | Hash: 4407b818

import { usePackageSettingsStore } from '../../store/packageSettingsStore';
import { authenticationService } from '../auth/authenticationService';
import { debugLogger } from '../logging/debugLogger';

export interface VoiceModelsResponse {
  models: string[];
  defaultModel: string;
  fallbackModel: string;
}

export class VoiceService {
  private static instance: VoiceService;
  private cachedModels: VoiceModelsResponse | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  private getGatewayApiUrl(): string {
    return usePackageSettingsStore.getState().settings?.gatewayApiUrl || '';
  }

  private isValid(data: unknown): data is VoiceModelsResponse {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const record = data as Record<string, unknown>;
    return Array.isArray(record.models) &&
      record.models.every((item) => typeof item === 'string') &&
      typeof record.defaultModel === 'string' &&
      typeof record.fallbackModel === 'string';
  }

  private isCacheValid(): boolean {
    return this.cachedModels !== null && 
           (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  public async fetchAvailableVoices(): Promise<VoiceModelsResponse> {
    // Return cached data if valid
    if (this.isCacheValid()) {
      debugLogger.debug('Returning cached voice models');
      return this.cachedModels!;
    }

    const gatewayUrl = this.getGatewayApiUrl();
    if (!gatewayUrl) {
      debugLogger.error('Gateway API URL not configured');
      throw new Error('Gateway API URL not configured');
    }

    // Check if we have a valid JWT token before making the request
    const token = authenticationService.getToken();
    if (!token) {
      debugLogger.warn('No JWT token available - skipping voice models fetch');
      const emptyModels: VoiceModelsResponse = {
        models: [],
        defaultModel: "",
        fallbackModel: ""
      };
      return emptyModels;
    }

    // Validate token is not expired
    if (authenticationService.isTokenExpired(token)) {
      debugLogger.warn('JWT token is expired - skipping voice models fetch');
      const emptyModels: VoiceModelsResponse = {
        models: [],
        defaultModel: "",
        fallbackModel: ""
      };
      return emptyModels;
    }

    try {
      debugLogger.debug('Fetching voice models from gateway API...');
      
      const response = await fetch(`${gatewayUrl}/tts/available-models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voice models: ${response.status}`);
      }

      const data = await response.json();
      
      if (!this.isValid(data)) {
        throw new Error('Invalid voice models response format');
      }

      // Cache the response
      this.cachedModels = data;
      this.cacheTimestamp = Date.now();

      debugLogger.debug('Voice models fetched successfully', data);
      return data;

    } catch (error) {
      debugLogger.error('Error fetching voice models:', { error: error instanceof Error ? error.message : String(error) });
      
      const emptyModels: VoiceModelsResponse = {
        models: [],
        defaultModel: "",
        fallbackModel: ""
      };

      debugLogger.warn('Voice service unavailable - no models available');
      return emptyModels;
    }
  }

  public clearCache(): void {
    this.cachedModels = null;
    this.cacheTimestamp = 0;
    debugLogger.debug('Voice models cache cleared');
  }
}

export const voiceService = VoiceService.getInstance();

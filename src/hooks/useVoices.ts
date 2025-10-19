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

// Bandit Engine Watermark: BL-WM-3947-7F48B5
const __banditFingerprint_hooks_useVoicests = 'BL-FP-B1D2F9-90A5';
const __auditTrail_hooks_useVoicests = 'BL-AU-MGOIKVVG-IZ0D';
// File: useVoices.ts | Path: src/hooks/useVoices.ts | Hash: 394790a5

import { useEffect } from 'react';
import { useVoiceStore } from '../store/voiceStore';
import { usePackageSettingsStore } from '../store/packageSettingsStore';
import { useAuthenticationStore } from '../store/authenticationStore';
import { authenticationService } from '../services/auth/authenticationService';
import { debugLogger } from '../services/logging/debugLogger';

/**
 * Hook to initialize and manage voice models from the gateway API
 * Automatically loads voices when gateway API URL is available
 */
export const useVoices = () => {
  const { 
    availableVoices, 
    selectedVoice, 
    defaultVoice,
    fallbackVoice,
    isLoading,
    isServiceAvailable,
    setSelectedVoice, 
    loadVoicesFromAPI, 
    refreshVoices 
  } = useVoiceStore();
  
  const gatewayApiUrl = usePackageSettingsStore(state => state.settings?.gatewayApiUrl);
  const { token } = useAuthenticationStore();

  // Auto-load voices when both gateway URL and JWT token are available
  useEffect(() => {
    const isAuthenticated = authenticationService.isAuthenticated();
    
    if (gatewayApiUrl && token && isAuthenticated && !isServiceAvailable) {
      debugLogger.debug('Gateway API URL and JWT token available, loading voice models...');
      loadVoicesFromAPI();
    } else if (gatewayApiUrl && !token) {
      debugLogger.debug('Gateway API URL available but no JWT token - skipping voice models load');
    } else if (gatewayApiUrl && token && !isAuthenticated) {
      debugLogger.debug('Gateway API URL available but JWT token is expired - skipping voice models load');
    }
  }, [gatewayApiUrl, token, loadVoicesFromAPI, isServiceAvailable]);

  return {
    // Voice data
    availableVoices,
    selectedVoice,
    defaultVoice,
    fallbackVoice,
    isLoading,
    isServiceAvailable,
    
    // Actions
    setSelectedVoice,
    refreshVoices,
    
    // Computed
    hasVoices: availableVoices.length > 0,
    isVoiceServiceConfigured: !!gatewayApiUrl,
  };
};

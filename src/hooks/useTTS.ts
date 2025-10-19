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

// Bandit Engine Watermark: BL-WM-3660-755F00
const __banditFingerprint_hooks_useTTSts = 'BL-FP-2B6BB1-5F41';
const __auditTrail_hooks_useTTSts = 'BL-AU-MGOIKVVF-ZUAN';
// File: useTTS.ts | Path: src/hooks/useTTS.ts | Hash: 36605f41

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Subscription } from 'rxjs';
import { 
  getStreamingTTSClient, 
  TTSState, 
  TTSProgress, 
  TTSOptions,
  stopTTS
} from '../services/tts/streaming-tts';

// Re-export types for convenience
export type { TTSState, TTSProgress, TTSOptions };
import { useVoiceStore } from '../store/voiceStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { usePackageSettingsStore } from '../store/packageSettingsStore';
import { useModelStore } from '../store/modelStore';
import { debugLogger } from '../services/logging/debugLogger';

export interface UseTTSReturn {
  // State
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  error: string | null;
  progress: TTSProgress | null;
  state: TTSState;
  
  // Actions
  speak: (text: string, options?: TTSOptions) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  forcePlay: () => Promise<void>;
  
  // Utilities
  isAvailable: boolean;
  currentVoice: string;
}

/**
 * React hook for TTS with streaming support and playback controls
 */
export const useTTS = (): UseTTSReturn => {
  const [state, setState] = useState<TTSState>(TTSState.IDLE);
  const [progress, setProgress] = useState<TTSProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Store references
  const progressSubscriptionRef = useRef<Subscription | null>(null);
  const stateSubscriptionRef = useRef<Subscription | null>(null);
  const speakSubscriptionRef = useRef<Subscription | null>(null);
  const previousVoiceRef = useRef<string | null>(null);
  const previousModelRef = useRef<string | null>(null);
  const requestIdRef = useRef<number>(0); // Track request IDs to prevent out-of-order audio
  
  // Store hooks
  const { selectedVoice, isServiceAvailable } = useVoiceStore();
  const { preferences } = usePreferencesStore();
  const { settings: packageSettings } = usePackageSettingsStore();
  const { selectedModel } = useModelStore();
  
  // Check if TTS is available
  const isAvailable = !!(packageSettings?.gatewayApiUrl && preferences.ttsEnabled && isServiceAvailable);
  
  // Get TTS client
  const ttsClient = useMemo(() => getStreamingTTSClient(), []);

  // Set up subscriptions for state and progress updates
  useEffect(() => {
    // Clean up existing subscriptions
    if (progressSubscriptionRef.current) {
      progressSubscriptionRef.current.unsubscribe();
    }
    if (stateSubscriptionRef.current) {
      stateSubscriptionRef.current.unsubscribe();
    }

    // Subscribe to progress updates
    progressSubscriptionRef.current = ttsClient.getProgress().subscribe({
      next: (newProgress: TTSProgress) => {
        setProgress(newProgress);
      },
      error: (err: unknown) => {
        debugLogger.error('TTS progress subscription error', { error: err });
      }
    });

    // Subscribe to state changes
    stateSubscriptionRef.current = ttsClient.getStateChanges().subscribe({
      next: (newState: TTSState) => {
        setState(newState);
        
        // Clear error when state changes away from error
        if (newState !== TTSState.ERROR && error) {
          setError(null);
        }
      },
      error: (err: unknown) => {
        debugLogger.error('TTS state subscription error', { error: err });
      }
    });

    // Cleanup on unmount
    return () => {
      if (progressSubscriptionRef.current) {
        progressSubscriptionRef.current.unsubscribe();
      }
      if (stateSubscriptionRef.current) {
        stateSubscriptionRef.current.unsubscribe();
      }
    };
  }, [error, ttsClient]);

  // Handle voice and model changes - stop current playback when they change
  useEffect(() => {
    // Check if this is an actual voice or model change (not initial mount)
    const isVoiceChange = previousVoiceRef.current !== null && 
                         previousVoiceRef.current !== selectedVoice;
    const isModelChange = previousModelRef.current !== null && 
                         previousModelRef.current !== selectedModel;
    
    // If voice or model changed, stop current playback
    if (isVoiceChange || isModelChange) {
      // Invalidate current request to prevent any delayed audio
      requestIdRef.current++;
      
      // Clear any active subscription immediately
      if (speakSubscriptionRef.current) {
        speakSubscriptionRef.current.unsubscribe();
        speakSubscriptionRef.current = null;
      }
      
      // For model changes, do a complete reset to clear any bad state
      if (isModelChange) {
        ttsClient.reset();
      } else {
        // For voice changes, just stop
        ttsClient.stop();
      }
      
      setState(TTSState.IDLE);
      setError(null);
      
      // Update references immediately to prevent re-triggering
      previousVoiceRef.current = selectedVoice;
      previousModelRef.current = selectedModel;
      
      return; // Exit early to prevent double update
    }
    
    // Update the references for non-change cases
    if (previousVoiceRef.current === null) {
      previousVoiceRef.current = selectedVoice;
    }
    if (previousModelRef.current === null) {
      previousModelRef.current = selectedModel;
    }
  }, [selectedVoice, selectedModel, ttsClient]);

  // Speak function
  const speak = useCallback(async (text: string, options: TTSOptions = {}): Promise<void> => {
    if (!isAvailable) {
      const errorMsg = 'TTS service is not available';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    if (!text?.trim()) {
      const errorMsg = 'No text provided';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      setError(null);
      
      // Stop any current playback
      ttsClient.stop();
      
      // Also update previous voice and model references immediately
      previousVoiceRef.current = selectedVoice;
      previousModelRef.current = selectedModel;
      
      // Get the most current voice from store to avoid timing issues
      const currentVoice = useVoiceStore.getState().selectedVoice;
      const voiceToUse = currentVoice || selectedVoice;
      if (!voiceToUse) {
        throw new Error('No voice selected');
      }
      
      if (speakSubscriptionRef.current) {
        speakSubscriptionRef.current.unsubscribe();
        speakSubscriptionRef.current = null;
        
        // Add a small delay to ensure the previous audio is completely stopped
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Generate a unique request ID to ensure we only play the latest request
      const currentRequestId = ++requestIdRef.current;

      // Set loading state immediately
      setState(TTSState.LOADING);

      // Enable simple streaming
      const ttsOptions: TTSOptions = {
        useStreaming: true,
        useRealtime: true,
        ...options,
        onStateChange: (newState: TTSState) => {
          setState(newState);
          if (options.onStateChange) {
            options.onStateChange(newState);
          }
        },
        onProgress: (newProgress: TTSProgress) => {
          setProgress(newProgress);
          if (options.onProgress) {
            options.onProgress(newProgress);
          }
        }
      };

      debugLogger.debug('Starting TTS streaming');

      // Start speaking with simple streaming
      speakSubscriptionRef.current = ttsClient.speakStream(text, voiceToUse, ttsOptions).subscribe({
        next: () => {
          // Only process if this is still the latest request
          if (currentRequestId === requestIdRef.current) {
            // Audio started playing successfully
          }
        },
        error: (err: unknown) => {
          // Only process errors for the latest request
          if (currentRequestId === requestIdRef.current) {
            const errorMessage = err instanceof Error && err.message ? err.message : 'TTS playback failed';
            debugLogger.error('TTS playback failed', { error: err });
            setError(errorMessage);
            setState(TTSState.ERROR);
          }
        },
        complete: () => {
          // Only process completion for the latest request
          if (currentRequestId === requestIdRef.current) {
            setState(TTSState.IDLE);
          }
        }
      });

    } catch (err: unknown) {
      const errorMsg = err instanceof Error && err.message ? err.message : 'TTS failed to start';
      setError(errorMsg);
      setState(TTSState.ERROR);
      throw err instanceof Error ? err : new Error(errorMsg);
    }
  }, [isAvailable, selectedVoice, selectedModel, ttsClient]);

  // Stop function
  const stop = useCallback(() => {
    const currentRequestId = requestIdRef.current;
    
    // IMMEDIATELY update the hook state to IDLE for instant UI feedback
    setState(TTSState.IDLE);
    
    // Invalidate the current request to prevent any delayed audio
    requestIdRef.current++;
    
    // Unsubscribe and clear the subscription
    if (speakSubscriptionRef.current) {
      speakSubscriptionRef.current.unsubscribe();
      speakSubscriptionRef.current = null;
    }
    
    // Call the client stop method
    ttsClient.stop();
    
    // Clear any errors
    setError(null);
  }, [ttsClient]);

  // Pause function
  const pause = useCallback(() => {
    ttsClient.pause();
  }, [ttsClient]);

  // Resume function
  const resume = useCallback(() => {
    ttsClient.resume();
  }, [ttsClient]);

  // Force play function (simplified)
  const forcePlay = useCallback(async (): Promise<void> => {
    try {
      // For simple streaming, we don't need complex force play logic
      // The audio element should handle autoplay restrictions automatically
      if (ttsClient.getCurrentState() === TTSState.PAUSED) {
        ttsClient.resume();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error && err.message ? err.message : 'Failed to force play audio';
      setError(errorMsg);
      throw err instanceof Error ? err : new Error(errorMsg);
    }
  }, [ttsClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (speakSubscriptionRef.current) {
        speakSubscriptionRef.current.unsubscribe();
      }
      if (progressSubscriptionRef.current) {
        progressSubscriptionRef.current.unsubscribe();
      }
      if (stateSubscriptionRef.current) {
        stateSubscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  // Stop any playback when TTS becomes unavailable
  useEffect(() => {
    if (!isAvailable && (state === TTSState.PLAYING || state === TTSState.LOADING)) {
      stop();
    }
  }, [isAvailable, state, stop]);

  return {
    // State
    isPlaying: state === TTSState.PLAYING,
    isPaused: state === TTSState.PAUSED,
    isLoading: state === TTSState.LOADING,
    error,
    progress,
    state,
    
    // Actions
    speak,
    stop,
    pause,
    resume,
    forcePlay,
    
    // Utilities
    isAvailable,
    currentVoice: selectedVoice
  };
};

/**
 * Global TTS controls hook - useful for global stop functionality
 */
export const useGlobalTTS = () => {
  const stopAll = useCallback(() => {
    stopTTS();
  }, []);

  return {
    stopAll
  };
};

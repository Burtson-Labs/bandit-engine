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

// Bandit Engine Watermark: BL-WM-95DD-07F17E
const __banditFingerprint_tts_streamingttsts = 'BL-FP-81BC0B-12CA';
const __auditTrail_tts_streamingttsts = 'BL-AU-MGOIKVW0-6I17';
// File: streaming-tts.ts | Path: src/services/tts/streaming-tts.ts | Hash: 95dd12ca

import { Observable, BehaviorSubject, Subject } from 'rxjs';
import type { Subscriber } from 'rxjs';
import { debugLogger } from '../logging/debugLogger';
import { usePackageSettingsStore } from '../../store/packageSettingsStore';
import { getOrAppendAuthHeader } from './tts-client';

export enum TTSState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR'
}

export interface TTSProgress {
  currentTime: number;
  duration: number;
  percentage: number;
  buffered: number;
  state: TTSState;
}

export interface TTSOptions {
  useStreaming?: boolean;
  useRealtime?: boolean;
  onStateChange?: (state: TTSState) => void;
  onProgress?: (progress: TTSProgress) => void;
}

/**
 * Streaming TTS client with playback controls
 */
export class StreamingTTSClient {
  private static instance: StreamingTTSClient;
  
  private audio: HTMLAudioElement | null = null;
  private objectUrl: string | null = null;
  private controller: AbortController | null = null;
  
  // Store event handler references for proper cleanup
  private audioHandlers = new Map<string, EventListener>();
  
  // State management
  private stateSubject = new BehaviorSubject<TTSState>(TTSState.IDLE);
  private progressSubject = new Subject<TTSProgress>();
  
  private constructor() {}
  
  public static getInstance(): StreamingTTSClient {
    if (!StreamingTTSClient.instance) {
      StreamingTTSClient.instance = new StreamingTTSClient();
    }
    return StreamingTTSClient.instance;
  }
  
  /**
   * Get current state
   */
  public getCurrentState(): TTSState {
    return this.stateSubject.value;
  }
  
  /**
   * Get state changes as observable
   */
  public getStateChanges(): Observable<TTSState> {
    return this.stateSubject.asObservable();
  }
  
  /**
   * Get progress updates as observable
   */
  public getProgress(): Observable<TTSProgress> {
    return this.progressSubject.asObservable();
  }
  
  /**
   * Speak text with simple streaming
   */
  public speakStream(text: string, voice: string, options: TTSOptions = {}): Observable<void> {
    return new Observable<void>((subscriber) => {
      this.performSimpleStreaming(text, voice, options, subscriber);
    });
  }
  
    /**
   * Simple streaming implementation - no queues, just direct playback
   */
  private async performSimpleStreaming(
    text: string,
    voice: string,
    options: TTSOptions,
    subscriber: Subscriber<void>
  ): Promise<void> {
    try {
      // Clean up any previous audio completely
      this.cleanup();
      
      // Brief delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Set loading state
      this.setState(TTSState.LOADING);
      
      const gatewayUrl = usePackageSettingsStore.getState().settings?.gatewayApiUrl;
      if (!gatewayUrl) {
        throw new Error('Gateway API URL not configured');
      }
      
      // Create abort controller for this request
      this.controller = new AbortController();
      
      // Make the TTS request
      const response = await fetch(`${gatewayUrl}/tts`, {
        method: 'POST',
        headers: {
          ...getOrAppendAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Text: text,
          ModelName: voice
        }),
        signal: this.controller.signal
      });
      
      // Check if request was aborted
      if (this.controller.signal.aborted) {
        subscriber.complete();
        return;
      }
      
      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status} ${response.statusText}`);
      }
      
      // Get the audio blob
      const audioBlob = await response.blob();
      
      // Check if request was aborted after blob download
      if (this.controller.signal.aborted) {
        subscriber.complete();
        return;
      }
      
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('Received empty audio response');
      }
      
      // Create object URL and audio element
      this.objectUrl = URL.createObjectURL(audioBlob);
      this.audio = new Audio(this.objectUrl);
      
      // Set up audio element
      this.audio.autoplay = false;
      this.audio.preload = 'auto';
      
      // Set up event listeners
      this.setupAudioListeners(subscriber, options);
      
      // Check one more time if we were stopped before starting to load
      if (this.controller.signal.aborted) {
        this.cleanup();
        subscriber.complete();
        return;
      }
      
      // Start loading the audio
      this.audio.load();
      
    } catch (error) {
      // Handle abort errors gracefully
      if (error instanceof Error && error.name === 'AbortError') {
        this.setState(TTSState.IDLE);
        subscriber.complete();
        return;
      }
      
      debugLogger.error('TTS streaming failed:', { error: error instanceof Error ? error.message : String(error) });
      this.setState(TTSState.ERROR);
      subscriber.error(error);
    }
  }
  
    /**
   * Set up audio event listeners
   */
  private setupAudioListeners(subscriber: Subscriber<void>, options: TTSOptions): void {
    if (!this.audio) return;
    
    // Clear any existing handlers
    this.audioHandlers.clear();
    
    // When audio can start playing
    const canPlayThroughHandler = () => {
      // Check if we were stopped during loading
      if (!this.audio || this.getCurrentState() !== TTSState.LOADING || (this.controller && this.controller.signal.aborted)) {
        return;
      }
      
      this.setState(TTSState.PLAYING);
      this.audio.play().catch((error) => {
        debugLogger.error('Failed to start audio playback:', error);
        this.setState(TTSState.ERROR);
        subscriber.error(error);
      });
    };
    
    // When audio starts playing
    const playHandler = () => {
      this.setState(TTSState.PLAYING);
      subscriber.next();
    };
    
    // When audio is paused
    const pauseHandler = () => {
      if (this.getCurrentState() !== TTSState.IDLE) {
        this.setState(TTSState.PAUSED);
      }
    };
    
    // When audio ends
    const endedHandler = () => {
      this.setState(TTSState.IDLE);
      
      // Clear handlers to prevent memory leaks
      this.clearAudioHandlers();
      
      subscriber.complete();
    };
    
    // Progress updates
    const timeUpdateHandler = () => {
      if (this.audio && this.audio.duration) {
        const buffered = this.audio.buffered.length > 0 ? this.audio.buffered.end(0) : 0;
        const progress: TTSProgress = {
          currentTime: this.audio.currentTime,
          duration: this.audio.duration,
          percentage: (this.audio.currentTime / this.audio.duration) * 100,
          buffered,
          state: this.getCurrentState()
        };
        this.progressSubject.next(progress);
        if (options.onProgress) {
          options.onProgress(progress);
        }
      }
    };
    
    // Error handling
    const errorHandler = (event: Event) => {
      debugLogger.error('Audio playback error:', event);
      this.setState(TTSState.ERROR);
      subscriber.error(new Error('Audio playback failed'));
    };
    
    // Store handler references for cleanup
    this.audioHandlers.set('canplaythrough', canPlayThroughHandler);
    this.audioHandlers.set('play', playHandler);
    this.audioHandlers.set('pause', pauseHandler);
    this.audioHandlers.set('ended', endedHandler);
    this.audioHandlers.set('timeupdate', timeUpdateHandler);
    this.audioHandlers.set('error', errorHandler);
    
    // Add event listeners
    this.audio.addEventListener('canplaythrough', canPlayThroughHandler);
    this.audio.addEventListener('play', playHandler);
    this.audio.addEventListener('pause', pauseHandler);
    this.audio.addEventListener('ended', endedHandler);
    this.audio.addEventListener('timeupdate', timeUpdateHandler);
    this.audio.addEventListener('error', errorHandler);
  }
  
  /**
   * Stop playback
   */
  public stop(): void {
    // Abort any ongoing fetch request
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
    
    // Stop and reset audio
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      
      // Remove all event listeners to prevent any further callbacks
      this.audio.onloadstart = null;
      this.audio.oncanplaythrough = null;
      this.audio.onplay = null;
      this.audio.onpause = null;
      this.audio.onended = null;
      this.audio.ontimeupdate = null;
      this.audio.onerror = null;
    }
    
    // Set to IDLE state first, then cleanup
    this.setState(TTSState.IDLE);
    this.cleanup();
  }
  
  /**
   * Pause playback
   */
  public pause(): void {
    if (this.audio && this.getCurrentState() === TTSState.PLAYING) {
      this.audio.pause();
      this.setState(TTSState.PAUSED);
    }
  }
  
  /**
   * Resume playback
   */
  public resume(): void {
    if (this.audio && this.getCurrentState() === TTSState.PAUSED) {
      this.audio.play().catch((error) => {
        debugLogger.error('Failed to resume audio:', error);
        this.setState(TTSState.ERROR);
      });
      this.setState(TTSState.PLAYING);
    }
  }
  
  /**
   * Set state and notify observers
   */
  private setState(state: TTSState): void {
    this.stateSubject.next(state);
  }
  
  /**
   * Reset the TTS client completely - useful for model changes
   */
  public reset(): void {
    // Stop everything first
    this.stop();
    
    // Force reset all internal state
    this.audio = null;
    this.objectUrl = null;
    this.controller = null;
    
    // Reset state subjects
    this.stateSubject.next(TTSState.IDLE);
  }

  /**
   * Clear only the audio event handlers
   */
  private clearAudioHandlers(): void {
    if (this.audio) {
      // Remove all event listeners using stored handler references
      for (const [eventType, handler] of this.audioHandlers) {
        this.audio.removeEventListener(eventType, handler);
      }
    }
    this.audioHandlers.clear();
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.audio) {
      // Remove all event listeners using stored handler references
      this.clearAudioHandlers();
      
      // Stop and reset audio
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audio.src = '';
        this.audio.load();
      } catch (error) {
        // Ignore cleanup errors
      }
      
      this.audio = null;
    }
    
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }
}

// Export singleton instance
export const getStreamingTTSClient = (): StreamingTTSClient => {
  return StreamingTTSClient.getInstance();
};

// Convenience functions
export const speakStream = (text: string, voice: string, options?: TTSOptions): Observable<void> => {
  return getStreamingTTSClient().speakStream(text, voice, options);
};

export const stopTTS = (): void => {
  getStreamingTTSClient().stop();
};

export const resetTTS = (): void => {
  getStreamingTTSClient().reset();
};

export const pauseTTS = (): void => {
  getStreamingTTSClient().pause();
};

export const resumeTTS = (): void => {
  getStreamingTTSClient().resume();
};

export const getTTSState = (): TTSState => {
  return getStreamingTTSClient().getCurrentState();
};

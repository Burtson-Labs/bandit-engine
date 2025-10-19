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

// Bandit Engine Watermark: BL-WM-4A41-987E60
const __banditFingerprint_tts_ttsclientts = 'BL-FP-80ED0B-94B2';
const __auditTrail_tts_ttsclientts = 'BL-AU-MGOIKVW0-9HOM';
// File: tts-client.ts | Path: src/services/tts/tts-client.ts | Hash: 4a4194b2

import { Observable, Subscription } from 'rxjs';
import { authenticationService } from "../auth/authenticationService";
import { useVoiceStore } from '../../store/voiceStore';
import { sanitizeForTTS } from './ttsSanitizer';
import { usePackageSettingsStore } from '../../store/packageSettingsStore';
import { debugLogger } from '../logging/debugLogger';

const getGatewayApiUrl = () => usePackageSettingsStore.getState().settings?.gatewayApiUrl || '';

/**
 * An observable that emits when the generated audio has begun playing.  
 * @param text The text to be spoken
 * @param voice The voice to be used (will fallback to default if not available)
 * @returns An observable that emits when the audio has started playing
 */
export const speak = (text: string, voice: string) => {
    if (!text) {
        debugLogger.warn("No text provided to TTS");
        return new Observable<void>((subscriber) => {
            subscriber.complete();
        });
    }

    const voiceState = useVoiceStore.getState();
    const availableVoices = voiceState.availableVoices;
    
    // Check if voice service is available
    if (!voiceState.isServiceAvailable || availableVoices.length === 0) {
        debugLogger.warn("TTS service unavailable - no voices configured");
        return new Observable<void>((subscriber) => {
            subscriber.error(new Error('TTS service unavailable'));
        });
    }
    
    // Validate voice selection
    if (availableVoices.indexOf(voice) === -1) {
        if (voiceState.fallbackVoice && availableVoices.indexOf(voiceState.fallbackVoice) !== -1) {
            debugLogger.warn(`Voice model ${voice} is not available. Defaulting to '${voiceState.fallbackVoice}'`);
            voice = voiceState.fallbackVoice;
        } else {
            debugLogger.warn(`Voice model ${voice} is not available and no fallback configured`);
            return new Observable<void>((subscriber) => {
                subscriber.error(new Error(`Voice ${voice} not available`));
            });
        }
    }
    return new Observable<void>((subscriber) => {
        const controller = new AbortController();
        const signal = controller.signal;

        let audio: HTMLAudioElement | null = null;
        let objectUrl: string | null = null;

        const handleAudio = async (response: Response) => {
            if (!response.ok) throw new Error('Failed to fetch TTS');
            const blob = await response.blob();
            objectUrl = URL.createObjectURL(blob);
            audio = new Audio(objectUrl);
            audio.play();
            audio.onended = () => subscriber.complete();
            audio.onerror = (e) => subscriber.error(e);
            subscriber.next();
        };

        const handleError = (err: Error) => {
            if (signal.aborted) {
                subscriber.complete();
            } else {
                subscriber.error(err);
            }
        };

        // Use gateway API for all TTS requests
        debugLogger.debug('Fetching TTS from gateway API...');
        
        const gatewayUrl = getGatewayApiUrl();
        if (!gatewayUrl) {
            debugLogger.error('Gateway API URL not configured');
            subscriber.error(new Error('TTS service not configured'));
            return;
        }

        const requestBody = {
            Text: sanitizeForTTS(text),
            ModelName: voice
        };

        const ttsRequest: RequestInit = {
            method: 'POST',
            headers: {
                ...getOrAppendAuthHeader(),
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            body: JSON.stringify(requestBody),
            signal,
        };

        fetch(`${gatewayUrl}/tts`, ttsRequest)
            .then(handleAudio)
            .catch(handleError);

        const teardown = () => {
            controller.abort();
            if (audio) {
                audio.pause();
                audio.src = '';
                audio = null;
            }
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
                objectUrl = null;
            }
        };

        return new Subscription(() => teardown());
    });
};

export const getOrAppendAuthHeader = (existing: Record<string, string> = {}) => {
    const token = authenticationService.getToken();
    if (token) {
        existing["Authorization"] = `Bearer ${token}`;
        return existing;
    }
    debugLogger.warn("No token found, using empty string for Authorization header");
    existing["Authorization"] = "";

    return existing;
}

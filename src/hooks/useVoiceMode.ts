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

// Bandit Engine Watermark: BL-WM-667C-1D0BDF
const __banditFingerprint_hooks_useVoiceModets = 'BL-FP-AFC188-7088';
const __auditTrail_hooks_useVoiceModets = 'BL-AU-MGOIKVVG-VHRQ';
// File: useVoiceMode.ts | Path: src/hooks/useVoiceMode.ts | Hash: 667c7088

import { useEffect, useRef } from "react";
import { STTClient } from "../services/stt/stt-client";
import { debugLogger } from "../services/logging/debugLogger";
import { useVoiceModeStore } from "../store/voiceModeStore";

export interface UseVoiceModeConfig {
  onTranscription: (text: string) => void;
  onInterrupt?: () => void;
  /**
   * Optional guard to temporarily block recording (for example while another request is pending).
   * Returning true prevents a new recording session from starting.
   */
  shouldHoldRecording?: () => boolean;
  /**
   * Invoked when a transcription attempt fails. Used for surfacing friendly messaging.
   */
  onError?: (message: string) => void;
  amplitudeThreshold?: number;
  minSpeechMs?: number;
  minSilenceMs?: number;
}

interface AudioSession {
  stream: MediaStream;
  audioContext: AudioContext;
  analyser: AnalyserNode;
  dataArray: Uint8Array;
}

const RMS_BASELINE = 128;
const RMS_NORMALIZER = 128;

const computeRms = (data: Uint8Array): number => {
  let sumSquares = 0;
  for (let i = 0; i < data.length; i += 1) {
    const sample = (data[i] - RMS_BASELINE) / RMS_NORMALIZER;
    sumSquares += sample * sample;
  }
  return Math.sqrt(sumSquares / data.length);
};

/**
 * Continuous voice mode controller that toggles microphone capture, performs lightweight
 * voice-activity detection, forwards audio to STT, and coordinates interruptions with TTS/streaming.
 */
export const useVoiceMode = (config: UseVoiceModeConfig) => {
  const enabled = useVoiceModeStore((state) => state.enabled);
  const setStatus = useVoiceModeStore((state) => state.setStatus);
  const setError = useVoiceModeStore((state) => state.setError);
  const resetTransientState = useVoiceModeStore((state) => state.resetTransientState);
  const setLastTranscript = useVoiceModeStore((state) => state.setLastTranscript);

  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    if (!enabled) {
      return () => undefined;
    }

    let cancelled = false;
    let rafId: number | null = null;
    let recorder: MediaRecorder | null = null;
    let audioSession: AudioSession | null = null;
    let chunks: BlobPart[] = [];
    let speechStartAt = 0;
    let silenceStartAt = 0;
    const isRecordingRef = { current: false };
    const isProcessingRef = { current: false };

    const amplitudeThreshold = configRef.current.amplitudeThreshold ?? 0.025;
    const minSpeechMs = configRef.current.minSpeechMs ?? 180;
    const minSilenceMs = configRef.current.minSilenceMs ?? 720;

    const clearAudioSession = async () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch (err) {
          debugLogger.warn("Voice mode recorder stop failed", { error: err });
        }
      }
      recorder = null;
      chunks = [];
      if (audioSession) {
        const { stream, audioContext } = audioSession;
        stream.getTracks().forEach((track) => track.stop());
        try {
          await audioContext.close();
        } catch (err) {
          debugLogger.warn("Voice mode audio context close failed", { error: err });
        }
      }
      audioSession = null;
      speechStartAt = 0;
      silenceStartAt = 0;
      isRecordingRef.current = false;
      isProcessingRef.current = false;
    };

    const processTranscript = async (blob: Blob) => {
      isProcessingRef.current = true;
      setStatus("processing");

      try {
        const transcript = await STTClient.transcribe(blob);
        const trimmed = transcript.trim();
        setLastTranscript(trimmed || null);
        if (trimmed) {
          try {
            configRef.current.onTranscription(trimmed);
          } catch (handlerError) {
            debugLogger.error("Voice mode transcription handler failed", { error: handlerError });
          }
        }
        if (!cancelled) {
          resetTransientState();
        }
      } catch (error) {
        debugLogger.error("Voice mode transcription failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        const message = "Unable to transcribe speech. Please try again.";
        setError(message);
        configRef.current.onError?.(message);
      } finally {
        isProcessingRef.current = false;
      }
    };

    const handleRecorderStop = () => {
      recorder?.removeEventListener("stop", handleRecorderStop);
      const blobType = recorder?.mimeType || "audio/webm";
      const blob = new Blob(chunks, { type: blobType });
      chunks = [];

      if (blob.size < 1024) {
        // Treat ultra-short clips as noise.
        resetTransientState();
        return;
      }

      processTranscript(blob).catch((error) => {
        debugLogger.error("Voice mode transcript processing crashed", {
          error: error instanceof Error ? error.message : String(error),
        });
      });
    };

    const stopRecording = () => {
      if (!recorder || recorder.state === "inactive") {
        return;
      }
      isRecordingRef.current = false;
      isProcessingRef.current = true;
      setStatus("processing");
      recorder.addEventListener("stop", handleRecorderStop, { once: true });
      try {
        recorder.stop();
      } catch (error) {
        debugLogger.error("Voice mode recorder stop threw", { error });
        recorder.removeEventListener("stop", handleRecorderStop);
        resetTransientState();
        isProcessingRef.current = false;
      }
    };

    const startRecording = (stream: MediaStream) => {
      chunks = [];
      try {
        recorder = new MediaRecorder(stream);
        recorder.addEventListener("dataavailable", (event) => {
          if (event.data && event.data.size > 0) {
            chunks.push(event.data);
          }
        });
      } catch (error) {
        debugLogger.error("Voice mode recorder init failed", { error });
        setError("Microphone recorder unavailable");
        useVoiceModeStore.getState().setEnabled(false);
        return;
      }

      try {
        configRef.current.onInterrupt?.();
      } catch (handlerError) {
        debugLogger.warn("Voice mode interrupt handler threw", { error: handlerError });
      }

      setError(null);
      setStatus("recording");
      isRecordingRef.current = true;

      try {
        recorder.start();
      } catch (error) {
        debugLogger.error("Voice mode recorder start failed", { error });
        setError("Failed to start recording");
        isRecordingRef.current = false;
        useVoiceModeStore.getState().setEnabled(false);
      }
    };

    const monitorAudio = () => {
      if (cancelled || !audioSession) {
        return;
      }

      const { analyser, dataArray, stream } = audioSession;
      analyser.getByteTimeDomainData(dataArray);
      const rms = computeRms(dataArray);
      const now = performance.now();

      if (!isRecordingRef.current && !isProcessingRef.current) {
        const holdRecording = configRef.current.shouldHoldRecording?.();
        if (!holdRecording) {
          if (rms > amplitudeThreshold) {
            if (!speechStartAt) {
              speechStartAt = now;
            } else if (now - speechStartAt >= minSpeechMs) {
              startRecording(stream);
              speechStartAt = 0;
              silenceStartAt = 0;
            }
          } else {
            speechStartAt = 0;
          }
        }
      } else if (isRecordingRef.current) {
        if (rms > amplitudeThreshold * 0.6) {
          silenceStartAt = 0;
        } else {
          if (!silenceStartAt) {
            silenceStartAt = now;
          } else if (now - silenceStartAt >= minSilenceMs) {
            stopRecording();
            speechStartAt = 0;
            silenceStartAt = 0;
          }
        }
      }

      rafId = requestAnimationFrame(monitorAudio);
    };

    const initAudioSession = async () => {
      setError(null);
      setStatus("initializing");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const win = window as Window & { webkitAudioContext?: typeof AudioContext };
        const AudioContextCtor = win.AudioContext || win.webkitAudioContext;
        if (!AudioContextCtor) {
          throw new Error("AudioContext is not supported in this browser");
        }

        const audioContext = new AudioContextCtor();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        audioSession = {
          stream,
          audioContext,
          analyser,
          dataArray,
        };

        resetTransientState();
        monitorAudio();
      } catch (error) {
        debugLogger.error("Voice mode failed to initialize microphone", {
          error: error instanceof Error ? error.message : String(error),
        });
        const message =
          error instanceof DOMException && error.name === "NotAllowedError"
            ? "Microphone permission denied"
            : "Microphone unavailable";
        setError(message);
        configRef.current.onError?.(message);
        useVoiceModeStore.getState().setEnabled(false);
      }
    };

    initAudioSession();

    return () => {
      cancelled = true;
      clearAudioSession().catch((error) => {
        debugLogger.warn("Voice mode cleanup failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      });
      resetTransientState();
    };
  }, [enabled, setStatus, setError, resetTransientState, setLastTranscript]);
};

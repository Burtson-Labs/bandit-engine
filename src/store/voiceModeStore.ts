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

// Bandit Engine Watermark: BL-WM-06D6-4EC241
const __banditFingerprint_store_voiceModeStorets = 'BL-FP-590448-C812';
const __auditTrail_store_voiceModeStorets = 'BL-AU-MGOIKVW6-VU6Q';
// File: voiceModeStore.ts | Path: src/store/voiceModeStore.ts | Hash: 06d6c812

import { create } from "zustand";

export type VoiceModeStatus =
  | "idle"
  | "initializing"
  | "listening"
  | "recording"
  | "processing"
  | "error";

interface VoiceModeState {
  enabled: boolean;
  status: VoiceModeStatus;
  lastTranscript: string | null;
  error: string | null;
  toggle: () => void;
  setEnabled: (enabled: boolean) => void;
  setStatus: (status: VoiceModeStatus) => void;
  setError: (error: string | null) => void;
  setLastTranscript: (transcript: string | null) => void;
  resetTransientState: () => void;
}

export const useVoiceModeStore = create<VoiceModeState>((set) => ({
  enabled: false,
  status: "idle",
  lastTranscript: null,
  error: null,

  toggle: () =>
    set((state) => {
      const enabled = !state.enabled;
      return {
        enabled,
        status: enabled ? "initializing" : "idle",
        error: null,
        lastTranscript: enabled ? state.lastTranscript : null,
      };
    }),

  setEnabled: (enabled) =>
    set(() => ({
      enabled,
      status: enabled ? "initializing" : "idle",
      error: null,
    })),

  setStatus: (status) =>
    set((state) => ({
      status: state.error && status !== "error" ? state.status : status,
    })),

  setError: (error) =>
    set((state) => ({
      error,
      status: error ? "error" : state.enabled ? "listening" : "idle",
    })),

  setLastTranscript: (transcript) => set({ lastTranscript: transcript }),

  resetTransientState: () =>
    set((state) => ({
      status: state.enabled ? "listening" : "idle",
      error: null,
    })),
}));

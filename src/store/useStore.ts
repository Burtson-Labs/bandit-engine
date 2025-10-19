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

// Bandit Engine Watermark: BL-WM-0343-AEB88D
const __banditFingerprint_store_useStorets = 'BL-FP-12929E-1B40';
const __auditTrail_store_useStorets = 'BL-AU-MGOIKVW6-SJ5X';
// File: useStore.ts | Path: src/store/useStore.ts | Hash: 03431b40

import { create } from 'zustand';

interface State {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useStore = create<State>((set) => ({
  darkMode: true,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
}));

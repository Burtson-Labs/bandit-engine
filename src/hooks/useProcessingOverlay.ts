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

// Bandit Engine Watermark: BL-WM-2A55-B75390
const __banditFingerprint_hooks_useProcessingOverlayts = 'BL-FP-E47E99-C634';
const __auditTrail_hooks_useProcessingOverlayts = 'BL-AU-MGOIKVVF-JUZS';
// File: useProcessingOverlay.ts | Path: src/hooks/useProcessingOverlay.ts | Hash: 2a55c634

import { useState, useCallback } from 'react';

interface ProcessingState {
  isVisible: boolean;
  step: string;
  progress: number;
  title: string;
  customMessages?: string[];
}

interface UseProcessingOverlayReturn {
  showProcessing: (title?: string, messages?: string[]) => void;
  hideProcessing: () => void;
  updateProgress: (step: string, progress: number) => void;
  processingState: ProcessingState;
}

/**
 * Hook for managing processing overlay state across components
 * Provides a clean API for showing/hiding loading states with progress
 */
export const useProcessingOverlay = (): UseProcessingOverlayReturn => {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isVisible: false,
    step: 'upload',
    progress: 0,
    title: 'Processing...',
    customMessages: undefined
  });

  const showProcessing = useCallback((
    title: string = 'Processing...',
    messages?: string[]
  ) => {
    setProcessingState({
      isVisible: true,
      step: 'upload',
      progress: 0,
      title,
      customMessages: messages
    });
  }, []);

  const hideProcessing = useCallback(() => {
    setProcessingState(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  const updateProgress = useCallback((step: string, progress: number) => {
    setProcessingState(prev => ({
      ...prev,
      step,
      progress: Math.min(100, Math.max(0, progress))
    }));
  }, []);

  return {
    showProcessing,
    hideProcessing,
    updateProgress,
    processingState
  };
};

export default useProcessingOverlay;

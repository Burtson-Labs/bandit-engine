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

// Bandit Engine Watermark: BL-WM-3604-B82856
const __banditFingerprint_hooks_useNotificationServicets = 'BL-FP-2EDB4B-6C09';
const __auditTrail_hooks_useNotificationServicets = 'BL-AU-MGOIKVVF-JFD2';
// File: useNotificationService.ts | Path: src/hooks/useNotificationService.ts | Hash: 36046c09

import { useEffect } from 'react';
import { useNotification } from '../shared/components/NotificationProvider';
import { notificationService } from '../services/notification/notificationService';

/**
 * Hook to initialize and use the notification service
 * This should be called once near the root of your component tree
 */
export const useNotificationService = () => {
  const notificationContext = useNotification();

  useEffect(() => {
    // Initialize the global notification service with the context
    notificationService.setContext(notificationContext);
  }, [notificationContext]);

  return {
    ...notificationContext,
    // Also expose the service methods for direct use
    handleHttpError: notificationService.handleHttpError.bind(notificationService),
    handleNetworkError: notificationService.handleNetworkError.bind(notificationService),
    handleValidationError: notificationService.handleValidationError.bind(notificationService),
  };
};

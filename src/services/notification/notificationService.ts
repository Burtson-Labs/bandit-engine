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

// Bandit Engine Watermark: BL-WM-E089-EB279A
const __banditFingerprint_notification_notificationServicets = 'BL-FP-FFADE7-4599';
const __auditTrail_notification_notificationServicets = 'BL-AU-MGOIKVVV-ZTFN';
// File: notificationService.ts | Path: src/services/notification/notificationService.ts | Hash: e0894599

import { debugLogger } from '../logging/debugLogger';
import type { NotificationContextType } from '../../shared/components/NotificationProvider';

type HttpErrorShape = {
  response?: {
    status?: number;
    data?: Record<string, unknown>;
  };
  message?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';
const getRecordString = (record: Record<string, unknown> | undefined, key: string): string | undefined =>
  record && typeof record[key] === 'string' ? (record[key] as string) : undefined;


/**
 * Global notification handler that can be used throughout the application
 */
export class NotificationService {
  private notificationContext: NotificationContextType | null = null;

  /**
   * Set the notification context (usually called from a component that has access to useNotification)
   */
  setContext(context: NotificationContextType) {
    this.notificationContext = context;
  }

  /**
   * Show a generic notification
   */
  show(message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') {
    if (this.notificationContext) {
      this.notificationContext.showNotification({ message, severity });
    } else {
      // Fallback to console logging if notification context is not available
      debugLogger.warn('Notification context not available, falling back to console:', { message, severity });
      console.warn(`[${severity.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Show an error notification
   */
  showError(message: string) {
    this.show(message, 'error');
  }

  /**
   * Show a success notification
   */
  showSuccess(message: string) {
    this.show(message, 'success');
  }

  /**
   * Show a warning notification
   */
  showWarning(message: string) {
    this.show(message, 'warning');
  }

  /**
   * Show an info notification
   */
  showInfo(message: string) {
    this.show(message, 'info');
  }

  /**
   * Handle HTTP errors and show appropriate notifications
   */
  handleHttpError(error: unknown, customMessage?: string) {
    let message = customMessage || 'An error occurred';
    const httpError = error as HttpErrorShape;

    if (httpError?.response) {
      // HTTP error response
      const status = httpError.response?.status;
      const data = httpError.response?.data;
      
      // Extract detailed error information
      // For your API structure with nested error objects: { error: { message: "...", type: "...", code: "..." } }
      const nestedError = isRecord(data?.error) ? data.error : undefined;
      const errorMessage =
        getRecordString(nestedError, 'message') ||
        getRecordString(data, 'message') ||
        getRecordString(data, 'detail');
      const errorType =
        getRecordString(nestedError, 'type') ||
        getRecordString(data, 'type');
      const errorCode =
        getRecordString(nestedError, 'code') ||
        getRecordString(data, 'code') ||
        getRecordString(data, 'error_code') ||
        (typeof data?.error === 'string' ? data.error : undefined);
      
      // Debug logging to see what we're extracting
      debugLogger.info('Processing HTTP error response:', {
        status,
        errorMessage,
        errorType,
        errorCode,
        rawData: data
      });
      
      // Build detailed message with error code and specific message
      const buildDetailedMessage = (defaultMsg: string) => {
        // If we have a specific error message, prioritize showing that
        if (errorMessage) {
          // For detailed error messages like yours, just show the message directly
          // as it's already comprehensive and user-friendly
          return errorMessage;
        } else if (errorCode) {
          // If we only have an error code, show it with context
          return `Error: ${errorCode}`;
        } else if (errorType) {
          // If we only have an error type, show it with context
          return `Error: ${errorType}`;
        } else {
          // For 400-level errors without specific messages, include status code
          if (typeof status === 'number' && status >= 400 && status < 500) {
            return `HTTP ${status}: ${defaultMsg}`;
          }
          return defaultMsg;
        }
      };

      switch (status) {
        case 400:
          message = buildDetailedMessage('Bad request - please check your input');
          break;
        case 401:
          message = buildDetailedMessage('Authentication required - please log in');
          break;
        case 403:
          message = buildDetailedMessage('Access denied - you don\'t have permission for this action');
          break;
        case 404:
          message = buildDetailedMessage('Resource not found');
          break;
        case 422:
          message = buildDetailedMessage('Validation failed - please check your input');
          break;
        case 429:
          message = buildDetailedMessage('Too many requests - please try again later');
          break;
        case 500:
          message = buildDetailedMessage('Server error - please try again later');
          break;
        case 502:
        case 503:
        case 504:
          message = buildDetailedMessage('Service temporarily unavailable - please try again later');
          break;
        default:
          // For any other 400-level errors, show detailed info
          if (typeof status === 'number' && status >= 400 && status < 500) {
            message = buildDetailedMessage(`Client error (${typeof status === 'number' ? status : 'unknown'})`);
          } else {
            message = buildDetailedMessage(`Request failed with status ${typeof status === 'number' ? status : 'unknown'}`);
          }
      }
    } else if (httpError?.message) {
      message = httpError.message;
    }

    debugLogger.error('HTTP Error handled by notification service:', { error, message });
    this.showError(message);
  }

  /**
   * Handle network/connection errors
   */
  handleNetworkError(error: unknown, customMessage?: string) {
    const message = customMessage || 'Network error - please check your connection and try again';
    debugLogger.error('Network Error handled by notification service:', { error, message });
    this.showError(message);
  }

  /**
   * Handle validation errors
   */
  handleValidationError(errors: readonly string[] | string, customMessage?: string) {
    let message: string;
    if (typeof customMessage === 'string' && customMessage.length > 0) {
      message = customMessage;
    } else if (Array.isArray(errors)) {
      message = (errors as readonly string[]).join(', ');
    } else {
      message = errors as string;
    }
    debugLogger.warn('Validation Error handled by notification service:', { errors, message });
    this.showWarning(message);
  }
}

export const notificationService = new NotificationService();
export default notificationService;

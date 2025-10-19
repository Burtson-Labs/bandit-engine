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

// Bandit Engine Watermark: BL-WM-3E18-90F636
const __banditFingerprint_http_httpErrorHandlerts = 'BL-FP-FBC0D6-48BB';
const __auditTrail_http_httpErrorHandlerts = 'BL-AU-MGOIKVVU-MMJ8';
// File: httpErrorHandler.ts | Path: src/services/http/httpErrorHandler.ts | Hash: 3e1848bb

import { notificationService } from '../notification/notificationService';
import { debugLogger } from '../logging/debugLogger';

type ErrorRecord = Record<string, unknown>;

interface HttpErrorLike {
  response?: {
    status: number;
    data?: unknown;
  };
  config?: {
    url?: string;
    method?: string;
  };
  message?: string;
  code?: string;
}

const isRecord = (value: unknown): value is ErrorRecord =>
  typeof value === 'object' && value !== null;

const isHttpErrorLike = (error: unknown): error is HttpErrorLike => isRecord(error);

const extractString = (record: ErrorRecord, key: string): string | undefined => {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
};

const normalizeMessages = (value: unknown): string[] => {
  if (!value) {
    return [];
  }

  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(normalizeMessages);
  }

  if (isRecord(value) && typeof value.message === 'string') {
    return [value.message];
  }

  return [];
};

/**
 * Enhanced HTTP error handler that provides user-friendly notifications
 */
export const handleHttpError = (error: unknown, context?: string) => {
  const contextPrefix = context ? `[${context}] ` : '';
  
  if (isHttpErrorLike(error) && error.response) {
    const status = error.response.status;
    const data = error.response.data;
    const dataRecord = isRecord(data) ? data : {};
    
    // Extract detailed error information for logging
    const errorMessage =
      extractString(dataRecord, 'message') ||
      extractString(dataRecord, 'error') ||
      extractString(dataRecord, 'detail');
    const errorCode = extractString(dataRecord, 'code') || extractString(dataRecord, 'error_code');
    
    // Log the full error for debugging with structured data
    debugLogger.error(`${contextPrefix}HTTP Error ${status}:`, {
      status,
      url: error.config?.url,
      method: error.config?.method,
      errorMessage,
      errorCode,
      responseData: data,
      error
    });
    
    // Show user-friendly notification with detailed error info
    notificationService.handleHttpError(error, context ? `${context}: Request failed` : undefined);
    
    return {
      status,
      message: errorMessage || `HTTP ${status} Error`,
      code: errorCode,
      handled: true
    };
  }

  if (isHttpErrorLike(error) && (error.code === 'NETWORK_ERROR' || !error.response)) {
    debugLogger.error(`${contextPrefix}Network Error:`, { error });
    notificationService.handleNetworkError(error, context ? `${context}: Connection failed` : undefined);
    
    return {
      status: 0,
      message: 'Network Error',
      handled: true
    };
  }

  const fallbackMessage =
    (isHttpErrorLike(error) && error.message) ||
    (typeof error === 'string' ? error : 'Unknown error occurred');

  debugLogger.error(`${contextPrefix}Unknown Error:`, { error });
  notificationService.showError(
    context ? `${context}: ${fallbackMessage}` : fallbackMessage
  );

  return {
    status: -1,
    message: fallbackMessage,
    handled: true
  };
};

/**
 * Handle validation errors from API responses
 */
export const handleValidationError = (errors: unknown, context?: string) => {
  const contextPrefix = context ? `${context}: ` : '';
  
  if (Array.isArray(errors)) {
    const messages = errors.flatMap(normalizeMessages);
    if (messages.length > 0) {
      notificationService.handleValidationError(messages, `${contextPrefix}Please check your input`);
      return;
    }
  } else if (isRecord(errors)) {
    const collected: string[] = [];
    Object.values(errors).forEach((value) => {
      collected.push(...normalizeMessages(value));
    });

    if (collected.length > 0) {
      notificationService.handleValidationError(collected, `${contextPrefix}Please check your input`);
      return;
    }
  } else if (typeof errors === 'string') {
    notificationService.handleValidationError(errors, `${contextPrefix}Please check your input`);
    return;
  }

  notificationService.handleValidationError('Invalid input', `${contextPrefix}Please check your input`);
};

/**
 * Success notification helper
 */
export const showSuccessNotification = (message: string, context?: string) => {
  const fullMessage = context ? `${context}: ${message}` : message;
  notificationService.showSuccess(fullMessage);
  debugLogger.info(`Success: ${fullMessage}`);
};

/**
 * Info notification helper
 */
export const showInfoNotification = (message: string, context?: string) => {
  const fullMessage = context ? `${context}: ${message}` : message;
  notificationService.showInfo(fullMessage);
  debugLogger.info(`Info: ${fullMessage}`);
};

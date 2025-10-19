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

// Bandit Engine Watermark: BL-WM-6AAD-DC6374
const __banditFingerprint_logging_debugLoggerts = 'BL-FP-125466-B27A';
const __auditTrail_logging_debugLoggerts = 'BL-AU-MGOIKVVV-NPG3';
// File: debugLogger.ts | Path: src/services/logging/debugLogger.ts | Hash: 6aadb27a

/**
 * 🔍 Bandit Debug Logger Service
 * 
 * Centralized logging service that provides environment-aware debug logging.
 * 
 * Features:
 * - Production builds: Only errors and info logs are shown
 * - Development mode: All logs are shown with clear debug prefixes
 * - Consistent formatting for debugging purposes
 * - Clear indication that logs are for debugging
 * 
 * Usage:
 * ```typescript
 * import { debugLogger } from './services/logging/debugLogger';
 * 
 * debugLogger.debug('LLM processing', { prompt, response });
 * debugLogger.info('User action completed', { action });
 * debugLogger.warn('Performance warning', { timing });
 * debugLogger.error('Operation failed', { error });
 * ```
 */

export type LogContext = unknown;

class DebugLogger {
  private isDevelopment: boolean;

  constructor() {
    // Check if we're in development mode using multiple detection methods
    this.isDevelopment = this.detectDevelopmentMode();
  }

  private detectDevelopmentMode(): boolean {
    // Check if we're in a development environment
    // This uses a safe approach that works in both ESM and CJS contexts
    try {
      // For browser environments using Vite - check the build-time flag
      const globalFlags = globalThis as typeof globalThis & {
        __VITE_IS_PRODUCTION__?: boolean;
        process?: { env?: { NODE_ENV?: string } };
      };

      if (typeof window !== 'undefined' && typeof globalFlags.__VITE_IS_PRODUCTION__ !== 'undefined') {
        return !globalFlags.__VITE_IS_PRODUCTION__;
      }
      
      // For Node.js environments - use try-catch to avoid type errors
      const proc = globalFlags.process;
      if (proc && proc.env) {
        return proc.env.NODE_ENV === 'development';
      }
      
      // For runtime detection, we can also check URL patterns in browser
      if (typeof window !== 'undefined' && window.location) {
        const devHosts = ['localhost', '127.0.0.1'];
        const devPorts = ['5173', '5183']; // common Vite dev ports
        return devHosts.includes(window.location.hostname) ||
               devPorts.includes(window.location.port);
      }
    } catch (e) {
      // If any detection fails, default to development for safety in debug scenarios
    }
    
    // Default to development for safety in debug scenarios
    return true;
  }

  /**
   * Set development mode manually (useful for testing or runtime configuration)
   */
  setDevelopmentMode(isDev: boolean): void {
    this.isDevelopment = isDev;
  }

  /**
   * Debug logs - only shown in development mode
   * These are obfuscated/hidden in production builds
   * DISABLED to prevent console flooding during chat processing
   */
  debug(message: string, context?: LogContext): void {
    // Debug logging disabled to prevent console flooding
    // Can be re-enabled for specific debugging sessions by uncommenting below:
    // if (this.isDevelopment) {
    //   const prefix = '🔍 [DEBUG]';
    //   if (context) {
    //     console.log(`${prefix} ${message}`, context);
    //   } else {
    //     console.log(`${prefix} ${message}`);
    //   }
    // }
  }

  /**
   * Info logs - shown in both development and production
   * Used for important user-facing information
   */
  info(message: string, context?: LogContext): void {
    const prefix = this.isDevelopment ? 'ℹ️ [INFO]' : '[INFO]';
    if (context) {
      console.info(`${prefix} ${message}`, context);
    } else {
      console.info(`${prefix} ${message}`);
    }
  }

  /**
   * Warning logs - shown in both development and production
   * Used for non-critical issues that should be noted
   */
  warn(message: string, context?: LogContext): void {
    const prefix = this.isDevelopment ? '⚠️ [WARN]' : '[WARN]';
    if (context) {
      console.warn(`${prefix} ${message}`, context);
    } else {
      console.warn(`${prefix} ${message}`);
    }
  }

  /**
   * Error logs - always shown in both development and production
   * Used for critical errors that need attention
   */
  error(message: string, context?: LogContext): void {
    const prefix = this.isDevelopment ? '❌ [ERROR]' : '[ERROR]';
    if (context) {
      console.error(`${prefix} ${message}`, context);
    } else {
      console.error(`${prefix} ${message}`);
    }
  }

  /**
   * LLM-specific debug logging for RAG and AI features
   * DISABLED to prevent console flooding during chat processing
   */
  llmDebug(operation: string, data: LogContext): void {
    // LLM debug logging disabled to prevent console flooding
    // Can be re-enabled for specific debugging sessions
  }

  /**
   * RAG-specific debug logging for knowledge and document processing
   * DISABLED to prevent console flooding during chat processing
   */
  ragDebug(operation: string, data: LogContext): void {
    // RAG debug logging disabled to prevent console flooding
    // Can be re-enabled for specific debugging sessions
  }

  /**
   * Memory-specific debug logging for AI memory features
   * DISABLED to prevent console flooding during chat processing
   */
  memoryDebug(operation: string, data: LogContext): void {
    // Memory debug logging disabled to prevent console flooding
    // Can be re-enabled for specific debugging sessions
  }

  /**
   * Table logging for development debugging
   * DISABLED to prevent console flooding during chat processing
   */
  table(data: unknown[], message?: string): void {
    // Table logging disabled to prevent console flooding
    // Can be re-enabled for specific debugging sessions
  }
}

// Export a singleton instance
export const debugLogger = new DebugLogger();

// Export the class for testing purposes
export { DebugLogger };

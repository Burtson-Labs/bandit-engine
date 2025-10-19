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

// Bandit Engine Watermark: BL-WM-9A9C-45AD6B
const __banditFingerprint_utils_memoryUtilsts = 'BL-FP-E6A353-3010';
const __auditTrail_utils_memoryUtilsts = 'BL-AU-MGOIKVWA-JZOJ';
// File: memoryUtils.ts | Path: src/utils/memoryUtils.ts | Hash: 9a9c3010

export interface BulkMemoryResult {
  success: boolean;
  message: string;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  errors: string[];
}

export interface MemoryImportOptions {
  mode: 'append' | 'replace' | 'smartDedupe';
  clearExisting?: boolean;
  includeMetadata?: boolean;
  batchSize?: number;
}

type MemoryRecordCandidate = {
  content?: unknown;
  title?: unknown;
  tags?: unknown;
  timestamp?: unknown;
};

type BatchOperationResult = {
  summary?: {
    totalProcessed?: number;
    successCount?: number;
    failureCount?: number;
  };
  totalMemories?: number;
  successCount?: number;
  failureCount?: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const resolveTimestampLabel = (timestamp: unknown): string => {
  if (timestamp instanceof Date && !Number.isNaN(timestamp.getTime())) {
    return timestamp.toLocaleDateString();
  }

  if (typeof timestamp === 'number' && Number.isFinite(timestamp)) {
    const date = new Date(timestamp);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }
  }

  if (typeof timestamp === 'string' && timestamp.trim()) {
    const date = new Date(timestamp);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }
  }

  return new Date().toLocaleDateString();
};

/**
 * Memory Utilities for Bulk Operations
 * 
 * Provides helper functions for batch memory operations,
 * data formatting, and migration utilities.
 */
export class MemoryUtils {
  /**
   * Validate memory content before bulk operations
   */
  static validateMemories(memories: Array<{ content: string; title?: string; tags?: string[] }>): {
    valid: Array<{ content: string; title?: string; tags?: string[] }>;
    invalid: Array<{ content: string; error: string; index: number }>;
  } {
    const valid: Array<{ content: string; title?: string; tags?: string[] }> = [];
    const invalid: Array<{ content: string; error: string; index: number }> = [];

    memories.forEach((memory, index) => {
      // Check content length
      if (!memory.content || memory.content.trim().length === 0) {
        invalid.push({
          content: memory.content || '',
          error: 'Empty content',
          index
        });
        return;
      }

      // Check maximum content length (e.g., 50KB)
      if (memory.content.length > 50000) {
        invalid.push({
          content: memory.content.substring(0, 100) + '...',
          error: 'Content too long (max 50KB)',
          index
        });
        return;
      }

      // Check tags format
      if (memory.tags && (!Array.isArray(memory.tags) || memory.tags.some(tag => typeof tag !== 'string'))) {
        invalid.push({
          content: memory.content.substring(0, 100) + '...',
          error: 'Invalid tags format (must be string array)',
          index
        });
        return;
      }

      valid.push(memory);
    });

    return { valid, invalid };
  }

  /**
   * Format IndexedDB memories for vector import
   */
  static formatForVectorImport(indexedDBMemories: ReadonlyArray<unknown>): Array<{ content: string; title?: string; tags?: string[] }> {
    return indexedDBMemories.reduce<Array<{ content: string; title?: string; tags?: string[] }>>((acc, entry) => {
      if (!isRecord(entry)) {
        return acc;
      }

      const candidate = entry as MemoryRecordCandidate;
      if (typeof candidate.content !== 'string') {
        return acc;
      }

      const title = typeof candidate.title === 'string' && candidate.title.trim().length > 0
        ? candidate.title
        : `Memory from ${resolveTimestampLabel(candidate.timestamp)}`;

      const tags = isStringArray(candidate.tags) ? candidate.tags : [];

      acc.push({
        content: candidate.content,
        title,
        tags
      });
      return acc;
    }, []);
  }

  /**
   * Chunk large batch operations for better performance
   */
  static chunkMemories<T>(
    memories: T[], 
    chunkSize: number = 100
  ): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < memories.length; i += chunkSize) {
      chunks.push(memories.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Estimate batch operation time and resource usage
   */
  static estimateBatchOperation(memoryCount: number, averageContentLength: number): {
    estimatedTimeMinutes: number;
    estimatedTokens: number;
    recommendedChunkSize: number;
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    // Rough estimates based on typical embedding performance
    const embeddingsPerMinute = 100; // Conservative estimate
    const tokensPerCharacter = 0.25; // Rough estimate for token calculation
    
    const estimatedTimeMinutes = Math.ceil(memoryCount / embeddingsPerMinute);
    const estimatedTokens = Math.ceil(memoryCount * averageContentLength * tokensPerCharacter);
    
    // Recommend smaller chunks for large operations
    let recommendedChunkSize = 50;
    if (memoryCount > 1000) {
      recommendedChunkSize = 25;
      warnings.push('Large batch operation - consider running during off-peak hours');
    }
    if (averageContentLength > 2000) {
      recommendedChunkSize = Math.max(10, recommendedChunkSize / 2);
      warnings.push('Large content size - reduced chunk size recommended');
    }
    if (estimatedTimeMinutes > 30) {
      warnings.push('Long operation expected - ensure stable internet connection');
    }

    return {
      estimatedTimeMinutes,
      estimatedTokens,
      recommendedChunkSize,
      warnings
    };
  }

  /**
   * Create summary report for batch operations
   */
  static createBatchSummary(
    result: BatchOperationResult,
    operationType: 'import' | 'create' | 'migrate',
    startTime: Date
  ): {
    summary: string;
    details: {
      operation: string;
      duration: string;
      totalMemories: number;
      successful: number;
      failed: number;
      successRate: string;
      averageTimePerMemory: string;
    };
  } {
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);
    const durationSeconds = Math.floor((durationMs % 60000) / 1000);
    
    const totalMemories = result.summary?.totalProcessed ?? result.totalMemories ?? 0;
    const successful = result.summary?.successCount ?? result.successCount ?? 0;
    const failed = result.summary?.failureCount ?? result.failureCount ?? 0;
    const successRate = totalMemories > 0 ? ((successful / totalMemories) * 100).toFixed(1) : '0';
    const avgTimePerMemory = totalMemories > 0 ? (durationMs / totalMemories).toFixed(0) : '0';

    const summary = `${operationType.toUpperCase()} completed: ${successful}/${totalMemories} memories processed successfully (${successRate}% success rate) in ${durationMinutes}m ${durationSeconds}s`;

    const details = {
      operation: operationType,
      duration: `${durationMinutes}m ${durationSeconds}s`,
      totalMemories,
      successful,
      failed,
      successRate: `${successRate}%`,
      averageTimePerMemory: `${avgTimePerMemory}ms`
    };

    return { summary, details };
  }

  /**
   * Generate progress messages for UI updates
   */
  static generateProgressMessage(
    current: number, 
    total: number, 
    operation: string = 'Processing'
  ): string {
    const percentage = Math.floor((current / total) * 100);
    const remaining = total - current;
    
    if (current === 0) {
      return `Starting ${operation.toLowerCase()}...`;
    } else if (current === total) {
      return `${operation} completed!`;
    } else if (current < total / 4) {
      return `${operation} memories... (${current}/${total})`;
    } else if (current < total / 2) {
      return `${percentage}% complete... (${remaining} remaining)`;
    } else if (current < total * 0.9) {
      return `Almost done... ${percentage}% complete`;
    } else {
      return `Finishing up... ${remaining} memories left`;
    }
  }

  /**
   * Compare memory content for deduplication
   */
  static calculateSimilarity(content1: string, content2: string): number {
    // Simple similarity check - could be enhanced with more sophisticated algorithms
    const words1 = content1.toLowerCase().split(/\s+/);
    const words2 = content2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(word => set2.has(word)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Find potential duplicates in memory list
   */
  static findPotentialDuplicates(
    memories: Array<{ content: string; title?: string; tags?: string[] }>,
    similarityThreshold: number = 0.8
  ): Array<{
    memory: { content: string; title?: string; tags?: string[] };
    duplicates: Array<{
      memory: { content: string; title?: string; tags?: string[] };
      similarity: number;
      index: number;
    }>;
  }> {
    const duplicates: Array<{
      memory: { content: string; title?: string; tags?: string[] };
      duplicates: Array<{
        memory: { content: string; title?: string; tags?: string[] };
        similarity: number;
        index: number;
      }>;
    }> = [];

    for (let i = 0; i < memories.length; i++) {
      const currentMemory = memories[i];
      const potentialDuplicates: Array<{
        memory: { content: string; title?: string; tags?: string[] };
        similarity: number;
        index: number;
      }> = [];

      for (let j = i + 1; j < memories.length; j++) {
        const compareMemory = memories[j];
        const similarity = this.calculateSimilarity(currentMemory.content, compareMemory.content);
        
        if (similarity >= similarityThreshold) {
          potentialDuplicates.push({
            memory: compareMemory,
            similarity,
            index: j
          });
        }
      }

      if (potentialDuplicates.length > 0) {
        duplicates.push({
          memory: currentMemory,
          duplicates: potentialDuplicates
        });
      }
    }

    return duplicates;
  }
}

// Export utility functions for direct use
export const validateMemories = MemoryUtils.validateMemories;
export const formatForVectorImport = MemoryUtils.formatForVectorImport;
export const chunkMemories = MemoryUtils.chunkMemories;
export const estimateBatchOperation = MemoryUtils.estimateBatchOperation;
export const createBatchSummary = MemoryUtils.createBatchSummary;
export const generateProgressMessage = MemoryUtils.generateProgressMessage;
export const findPotentialDuplicates = MemoryUtils.findPotentialDuplicates;

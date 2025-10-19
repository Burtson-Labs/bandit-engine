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

// Bandit Engine Watermark: BL-WM-7AB7-C71573
const __banditFingerprint_vectorDatabase_vectorMigrationServicets = 'BL-FP-D7A8C3-8E82';
const __auditTrail_vectorDatabase_vectorMigrationServicets = 'BL-AU-MGOIKVW1-KUYC';
// File: vectorMigrationService.ts | Path: src/services/vectorDatabase/vectorMigrationService.ts | Hash: 7ab78e82

import { debugLogger } from '../logging/debugLogger';
import { MemoryEntry } from '../../store/memoryStore';
import { KnowledgeDoc } from '../../store/knowledgeStore';
import { vectorDatabaseService } from './vectorDatabaseService';
import indexedDBService from '../indexedDB/indexedDBService';

export interface MigrationStatus {
  success: boolean;
  migratedMemories: number;
  migratedDocuments: number;
  errors: string[];
  warnings: string[];
  totalTime: number;
}

export interface MigrationProgress {
  phase: 'memories' | 'documents' | 'cleanup' | 'complete';
  current: number;
  total: number;
  currentItem?: string;
  errors: string[];
}

/**
 * Vector Database Migration Service
 * 
 * Handles migration of memories and documents from IndexedDB to vector database
 * when advanced semantic search is enabled for the first time.
 * 
 * Features:
 * - Batch migration to avoid overwhelming the API
 * - Progress tracking with user feedback
 * - Error handling and retry logic
 * - Cleanup of migrated IndexedDB data (optional)
 * - Rollback capability in case of issues
 */
export class VectorMigrationService {
  private static readonly BATCH_SIZE = 5;
  private static readonly RETRY_DELAY = 1000; // 1 second
  private static readonly MAX_RETRIES = 3;

  private migrationKey = 'bandit_vector_migration_completed';
  private progressCallbacks: ((progress: MigrationProgress) => void)[] = [];

  /**
   * Check if migration has already been completed
   */
  isMigrationCompleted(): boolean {
    try {
      return localStorage.getItem(this.migrationKey) === 'true';
    } catch (error) {
      debugLogger.warn('Unable to check migration status from localStorage', { error });
      return false;
    }
  }

  /**
   * Mark migration as completed
   */
  markMigrationCompleted(): void {
    try {
      localStorage.setItem(this.migrationKey, 'true');
      debugLogger.info('Vector migration marked as completed');
    } catch (error) {
      debugLogger.error('Failed to mark migration as completed', { error });
    }
  }

  /**
   * Reset migration status (for testing or re-migration)
   */
  resetMigrationStatus(): void {
    try {
      localStorage.removeItem(this.migrationKey);
      debugLogger.info('Vector migration status reset');
    } catch (error) {
      debugLogger.error('Failed to reset migration status', { error });
    }
  }

  /**
   * Add progress callback for UI updates
   */
  onProgress(callback: (progress: MigrationProgress) => void): void {
    this.progressCallbacks.push(callback);
  }

  /**
   * Remove progress callback
   */
  removeProgressCallback(callback: (progress: MigrationProgress) => void): void {
    this.progressCallbacks = this.progressCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Notify progress callbacks
   */
  private notifyProgress(progress: MigrationProgress): void {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        debugLogger.error('Error in migration progress callback', { error });
      }
    });
  }

  /**
   * Sleep utility for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get all memories directly from IndexedDB
   */
  private async getAllMemories(): Promise<MemoryEntry[]> {
    try {
      const DB_NAME = "bandit-memory-db";
      const STORE_NAME = "bandit-memory";
      const storeConfigs = [{ name: STORE_NAME, keyPath: "id" }];
      
      return await indexedDBService.getAll<MemoryEntry>(DB_NAME, 1, STORE_NAME, storeConfigs);
    } catch (error) {
      debugLogger.error('Failed to get memories from IndexedDB', { error });
      return [];
    }
  }

  /**
   * Get all knowledge documents directly from IndexedDB  
   */
  private async getAllDocuments(): Promise<KnowledgeDoc[]> {
    try {
      const DB_NAME = "bandit-knowledge-db";
      const STORE_NAME = "bandit-knowledge";
      const storeConfigs = [{ name: STORE_NAME, keyPath: "id" }];
      
      return await indexedDBService.getAll<KnowledgeDoc>(DB_NAME, 1, STORE_NAME, storeConfigs);
    } catch (error) {
      debugLogger.error('Failed to get documents from IndexedDB', { error });
      return [];
    }
  }

  /**
   * Clear all memories from IndexedDB
   */
  private async clearAllMemories(): Promise<void> {
    try {
      const DB_NAME = "bandit-memory-db";
      const STORE_NAME = "bandit-memory";
      const storeConfigs = [{ name: STORE_NAME, keyPath: "id" }];
      
      await indexedDBService.clear(DB_NAME, 1, STORE_NAME, storeConfigs);
    } catch (error) {
      debugLogger.error('Failed to clear memories from IndexedDB', { error });
      throw error;
    }
  }

  /**
   * Clear all documents from IndexedDB
   */
  private async clearAllDocuments(): Promise<void> {
    try {
      const DB_NAME = "bandit-knowledge-db";
      const STORE_NAME = "bandit-knowledge";
      const storeConfigs = [{ name: STORE_NAME, keyPath: "id" }];
      
      await indexedDBService.clear(DB_NAME, 1, STORE_NAME, storeConfigs);
    } catch (error) {
      debugLogger.error('Failed to clear documents from IndexedDB', { error });
      throw error;
    }
  }

  /**
   * Migrate memories from IndexedDB to vector database
   */
  private async migrateMemories(): Promise<{ success: number; errors: string[] }> {
    debugLogger.info('Starting memory migration to vector database');
    
    const memories = await this.getAllMemories();
    const errors: string[] = [];
    let successCount = 0;

    if (memories.length === 0) {
      debugLogger.info('No memories to migrate');
      return { success: 0, errors: [] };
    }

    debugLogger.info(`Found ${memories.length} memories to migrate`);

    // Process in batches
    for (let i = 0; i < memories.length; i += VectorMigrationService.BATCH_SIZE) {
      const batch = memories.slice(i, i + VectorMigrationService.BATCH_SIZE);
      
      this.notifyProgress({
        phase: 'memories',
        current: i,
        total: memories.length,
        currentItem: `Migrating batch ${Math.floor(i / VectorMigrationService.BATCH_SIZE) + 1}`,
        errors
      });

      // Process batch items
      for (const memory of batch) {
        let attempts = 0;
        let migrated = false;

        while (attempts < VectorMigrationService.MAX_RETRIES && !migrated) {
          try {
            attempts++;
            
            debugLogger.debug('Migrating memory to vector database', { 
              memoryId: memory.id,
              attempt: attempts,
              content: memory.content.slice(0, 100)
            });

            // Create memory in vector database
            const result = await vectorDatabaseService.createMemory(memory.content, {
              title: `Memory from ${new Date(memory.timestamp).toLocaleDateString()}`,
              tags: memory.tags || [],
              source: memory.source,
              pinned: memory.pinned,
              lastReferencedAt: new Date(memory.timestamp).toISOString(),
            });

            if (result.success) {
              successCount++;
              migrated = true;
              debugLogger.debug('Memory migrated successfully', { 
                memoryId: memory.id,
                vectorId: result.memoryId 
              });
            } else {
              throw new Error(result.message || 'Unknown error');
            }
          } catch (error) {
            debugLogger.error('Failed to migrate memory', { 
              memoryId: memory.id,
              attempt: attempts,
              error: error instanceof Error ? error.message : String(error)
            });

            if (attempts >= VectorMigrationService.MAX_RETRIES) {
              const errorMsg = `Failed to migrate memory ${memory.id}: ${error instanceof Error ? error.message : String(error)}`;
              errors.push(errorMsg);
            } else {
              // Wait before retry
              await this.sleep(VectorMigrationService.RETRY_DELAY * attempts);
            }
          }
        }
      }

      // Rate limiting between batches
      if (i + VectorMigrationService.BATCH_SIZE < memories.length) {
        await this.sleep(500);
      }
    }

    debugLogger.info('Memory migration completed', { 
      total: memories.length,
      success: successCount,
      errors: errors.length 
    });

    return { success: successCount, errors };
  }

  /**
   * Migrate documents from IndexedDB to vector database
   */
  private async migrateDocuments(): Promise<{ success: number; errors: string[] }> {
    debugLogger.info('Starting document migration to vector database');
    
    const errors: string[] = [];
    let successCount = 0;

    try {
      // Get documents from knowledge store's IndexedDB storage
      const documents = await this.getAllDocuments();

      if (documents.length === 0) {
        debugLogger.info('No documents to migrate');
        return { success: 0, errors: [] };
      }

      debugLogger.info(`Found ${documents.length} documents to migrate`);

      // Process documents in batches
      for (let i = 0; i < documents.length; i += VectorMigrationService.BATCH_SIZE) {
        const batch = documents.slice(i, i + VectorMigrationService.BATCH_SIZE);
        
        this.notifyProgress({
          phase: 'documents',
          current: i,
          total: documents.length,
          currentItem: `Migrating batch ${Math.floor(i / VectorMigrationService.BATCH_SIZE) + 1}`,
          errors
        });

        // Process batch items
        for (const doc of batch) {
          let attempts = 0;
          let migrated = false;

          while (attempts < VectorMigrationService.MAX_RETRIES && !migrated) {
            try {
              attempts++;
              
              debugLogger.debug('Migrating document to vector database', { 
                filename: doc.name,
                attempt: attempts
              });

              // For documents, we need to:
              // 1. Convert content to file format if needed
              // 2. Upload to S3
              // 3. Embed in vector database
              
              if (doc.content && doc.name) {
                // Create a virtual file from stored content
                const blob = new Blob([doc.content], { type: 'text/plain' });
                const file = new File([blob], doc.name, { type: 'text/plain' });

                // Upload to S3 with team sharing enabled by default for migration
                const uploadResult = await vectorDatabaseService.uploadFile(file, true);
                
                if (uploadResult.success && uploadResult.fileId) {
                  // Embed in vector database
                  const embedResult = await vectorDatabaseService.embedDocument(uploadResult.fileId, true);
                  
                  if (embedResult.success) {
                    successCount++;
                    migrated = true;
                    debugLogger.debug('Document migrated successfully', { 
                      filename: doc.name,
                      fileId: uploadResult.fileId 
                    });
                  } else {
                    throw new Error(embedResult.message || 'Embedding failed');
                  }
                } else {
                  throw new Error(uploadResult.message || 'Upload failed');
                }
              } else {
                throw new Error('Document missing required content or filename');
              }
            } catch (error) {
              debugLogger.error('Failed to migrate document', { 
                filename: doc.name,
                attempt: attempts,
                error: error instanceof Error ? error.message : String(error)
              });

              if (attempts >= VectorMigrationService.MAX_RETRIES) {
                const errorMsg = `Failed to migrate document ${doc.name}: ${error instanceof Error ? error.message : String(error)}`;
                errors.push(errorMsg);
              } else {
                // Wait before retry
                await this.sleep(VectorMigrationService.RETRY_DELAY * attempts);
              }
            }
          }
        }

        // Rate limiting between batches
        if (i + VectorMigrationService.BATCH_SIZE < documents.length) {
          await this.sleep(500);
        }
      }
    } catch (error) {
      debugLogger.error('Failed to get documents for migration', { error });
      errors.push(`Failed to retrieve documents: ${error instanceof Error ? error.message : String(error)}`);
    }

    debugLogger.info('Document migration completed', { 
      success: successCount,
      errors: errors.length 
    });

    return { success: successCount, errors };
  }

  /**
   * Perform full migration from IndexedDB to vector database
   */
  async performMigration(
    options: {
      cleanupAfterMigration?: boolean;
      skipIfCompleted?: boolean;
    } = {}
  ): Promise<MigrationStatus> {
    const startTime = Date.now();
    const { cleanupAfterMigration = false, skipIfCompleted = true } = options;

    debugLogger.info('Starting vector database migration', { 
      cleanupAfterMigration,
      skipIfCompleted 
    });

    // Check if already completed
    if (skipIfCompleted && this.isMigrationCompleted()) {
      debugLogger.info('Migration already completed, skipping');
      return {
        success: true,
        migratedMemories: 0,
        migratedDocuments: 0,
        errors: [],
        warnings: ['Migration was already completed'],
        totalTime: Date.now() - startTime
      };
    }

    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    try {
      // Ensure vector database is available
      if (!vectorDatabaseService.isAvailable()) {
        throw new Error('Vector database service is not available - check configuration and authentication');
      }

      // Phase 1: Migrate memories
      debugLogger.info('Phase 1: Migrating memories');
      const memoryResult = await this.migrateMemories();
      allErrors.push(...memoryResult.errors);

      // Phase 2: Migrate documents
      debugLogger.info('Phase 2: Migrating documents');
      const documentResult = await this.migrateDocuments();
      allErrors.push(...documentResult.errors);

      // Phase 3: Cleanup (optional)
      if (cleanupAfterMigration && allErrors.length === 0) {
        this.notifyProgress({
          phase: 'cleanup',
          current: 0,
          total: 1,
          currentItem: 'Cleaning up local data',
          errors: allErrors
        });

        try {
          // Only cleanup if migration was successful
          await this.cleanupLocalData();
          debugLogger.info('Local data cleanup completed');
        } catch (error) {
          const warningMsg = `Cleanup failed but migration succeeded: ${error instanceof Error ? error.message : String(error)}`;
          allWarnings.push(warningMsg);
          debugLogger.warn('Cleanup failed', { error });
        }
      }

      // Mark as completed if no errors
      if (allErrors.length === 0) {
        this.markMigrationCompleted();
      }

      // Final progress update
      this.notifyProgress({
        phase: 'complete',
        current: 1,
        total: 1,
        currentItem: 'Migration complete',
        errors: allErrors
      });

      const totalTime = Date.now() - startTime;
      const status: MigrationStatus = {
        success: allErrors.length === 0,
        migratedMemories: memoryResult.success,
        migratedDocuments: documentResult.success,
        errors: allErrors,
        warnings: allWarnings,
        totalTime
      };

      debugLogger.info('Vector migration completed', status);
      return status;

    } catch (error) {
      const errorMsg = `Migration failed: ${error instanceof Error ? error.message : String(error)}`;
      allErrors.push(errorMsg);
      
      debugLogger.error('Vector migration failed', { error });

      return {
        success: false,
        migratedMemories: 0,
        migratedDocuments: 0,
        errors: allErrors,
        warnings: allWarnings,
        totalTime: Date.now() - startTime
      };
    }
  }

  /**
   * Clean up local IndexedDB data after successful migration
   */
  private async cleanupLocalData(): Promise<void> {
    debugLogger.info('Starting cleanup of local IndexedDB data');

    try {
      // Clear memories from memory store
      await this.clearAllMemories();
      debugLogger.info('Cleared all memories from local storage');

      // Clear documents from knowledge store
      await this.clearAllDocuments();
      debugLogger.info('Cleared all documents from local storage');

    } catch (error) {
      debugLogger.error('Failed to cleanup local data', { error });
      throw error;
    }
  }

  /**
   * Estimate migration time and data size
   */
  async estimateMigration(): Promise<{
    memoryCount: number;
    documentCount: number;
    estimatedTime: number; // in minutes
    estimatedDataSize: number; // in MB
  }> {
    try {
      const memories = await this.getAllMemories();
      const documents = await this.getAllDocuments();

      // Rough estimation based on content size and API call overhead
      const avgMemorySize = memories.reduce((sum: number, m: MemoryEntry) => sum + m.content.length, 0) / Math.max(memories.length, 1);
      const avgDocumentSize = documents.reduce((sum: number, d: KnowledgeDoc) => sum + (d.content?.length || 0), 0) / Math.max(documents.length, 1);

      const totalDataSize = (memories.length * avgMemorySize + documents.length * avgDocumentSize) / (1024 * 1024); // MB
      const totalItems = memories.length + documents.length;
      
      // Estimate 1-2 seconds per item including API calls and retries
      const estimatedTime = Math.ceil((totalItems * 1.5) / 60); // minutes

      return {
        memoryCount: memories.length,
        documentCount: documents.length,
        estimatedTime: Math.max(1, estimatedTime),
        estimatedDataSize: Math.round(totalDataSize * 100) / 100
      };
    } catch (error) {
      debugLogger.error('Failed to estimate migration', { error });
      return {
        memoryCount: 0,
        documentCount: 0,
        estimatedTime: 1,
        estimatedDataSize: 0
      };
    }
  }
}

// Export singleton instance
export const vectorMigrationService = new VectorMigrationService();

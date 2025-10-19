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

// Bandit Engine Watermark: BL-WM-3B4B-14DF77
const __banditFingerprint_hooks_useVectorStoretsx = 'BL-FP-CA5CF8-985C';
const __auditTrail_hooks_useVectorStoretsx = 'BL-AU-MGOIKVVG-347B';
// File: useVectorStore.tsx | Path: src/hooks/useVectorStore.tsx | Hash: 3b4b985c

import { useState, useEffect, useCallback } from 'react';
import { debugLogger } from '../services/logging/debugLogger';
import { vectorDatabaseService, type VectorMemoryMetadata, type VectorMemory, type MemorySearchFilters, type VectorDocument, type SearchResult } from '../services/vectorDatabase/vectorDatabaseService';
import { vectorMigrationService, MigrationStatus, MigrationProgress } from '../services/vectorDatabase/vectorMigrationService';
import { useMemoryStore } from '../store/memoryStore';
import type { MemoryEntry } from '../store/memoryStore';
import { useKnowledgeStore } from '../store/knowledgeStore';
import type { KnowledgeDoc } from '../store/knowledgeStore';
import { useAuthenticationStore } from '../store/authenticationStore';
import { usePackageSettingsStore } from '../store/packageSettingsStore';
import { useFeatures } from './useFeatures';
import { useConversationSyncStore } from '../store/conversationSyncStore';

export interface VectorStoreStatus {
  isEnabled: boolean;
  isAvailable: boolean;
  isMigrating: boolean;
  migrationRequired: boolean;
  migrationProgress?: MigrationProgress;
  lastError?: string;
}

export interface SearchOptions {
  memoryLimit?: number;
  documentLimit?: number;
  scoreThreshold?: number;
  useVector?: boolean; // Override auto-detection
  filters?: MemorySearchFilters;
}

const toIsoString = (timestamp: number | Date): string => {
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return new Date(timestamp).toISOString();
};

const memoryEntryToVectorMemory = (entry: MemoryEntry): VectorMemory => ({
  id: entry.id,
  content: entry.content,
  tags: entry.tags,
  score: undefined,
  uploadedBy: 'local',
  uploadedAt: toIsoString(entry.timestamp),
  source: entry.source,
  pinned: entry.pinned,
  lastReferencedAt: toIsoString(entry.timestamp),
  metadata: undefined,
});

const knowledgeDocToVectorDocument = (doc: KnowledgeDoc): VectorDocument => ({
  id: doc.id,
  filename: doc.name,
  content: doc.content,
  mimeType: doc.mimeType || 'application/octet-stream',
  score: undefined,
  uploadedBy: doc.uploadedBy || 'local',
  uploadedAt: doc.addedDate ? doc.addedDate.toISOString() : new Date().toISOString(),
  isUserContent: doc.isUserContent ?? true,
  isTeamContent: doc.isTeamContent ?? false,
  contentSource: doc.contentSource ?? (doc.isTeamContent ? 'team' : 'user'),
});

type RawFileRecord = Record<string, unknown>;

const rawFileRecordToVectorDocument = (record: RawFileRecord): VectorDocument | null => {
  if (!record || typeof record !== 'object') {
    return null;
  }

  const id = typeof record.id === 'string'
    ? record.id
    : typeof record.fileId === 'string'
      ? record.fileId
      : undefined;

  if (!id) {
    return null;
  }

  const filename = typeof record.filename === 'string'
    ? record.filename
    : typeof record.fileName === 'string'
      ? record.fileName
      : 'Untitled Document';

  const preview = typeof record.preview === 'string'
    ? record.preview
    : typeof record.summary === 'string'
    ? record.summary
    : typeof record.snippet === 'string'
    ? record.snippet
    : undefined;

  const content = typeof record.content === 'string' && record.content.trim().length > 0
    ? record.content
    : preview ?? '';
  const mimeType = typeof record.mimeType === 'string' ? record.mimeType : 'application/octet-stream';
  const uploadedBy = typeof record.uploadedBy === 'string' ? record.uploadedBy : 'unknown';
  const uploadedAt = typeof record.uploadedAt === 'string' ? record.uploadedAt : new Date().toISOString();
  const isUserContent = typeof record.isUserContent === 'boolean' ? record.isUserContent : true;
  const isTeamContent = typeof record.isTeamContent === 'boolean' ? record.isTeamContent : false;
  const contentSource = record.contentSource === 'team' ? 'team' : 'user';
  const score = typeof record.score === 'number' ? record.score : undefined;

  return {
    id,
    filename,
    content,
    mimeType,
    uploadedBy,
    uploadedAt,
    isUserContent,
    isTeamContent,
    contentSource,
    score
  };
};

/**
 * Advanced Vector Storage Hook
 * 
 * Manages the transition between IndexedDB and Vector Database storage
 * when advanced semantic search is enabled. Handles feature gating,
 * migration, and unified API for both storage backends.
 * 
 * Features:
 * - Automatic migration when advanced search is first enabled
 * - Unified API that works with both IndexedDB and Vector DB
 * - Feature gating based on subscription tier and admin claims
 * - Progress tracking for migration operations
 * - Fallback to IndexedDB if vector service unavailable
 */
export const useVectorStore = () => {
  const [status, setStatus] = useState<VectorStoreStatus>({
    isEnabled: false,
    isAvailable: false,
    isMigrating: false,
    migrationRequired: false
  });

  // Store access
  const memoryStore = useMemoryStore();
  const knowledgeStore = useKnowledgeStore();
  const authStore = useAuthenticationStore();
  const features = useFeatures();
  const isAdvancedVectorFeaturesEnabled = useConversationSyncStore((state) => state.isAdvancedVectorFeaturesEnabled);

  const hasAnyAdvancedFeatures = isAdvancedVectorFeaturesEnabled;
  const hasVectorAccess = features.isAdmin() || features.hasAdvancedSearch() || features.hasAdvancedMemories();

  // Check if using compatible AI provider (Ollama or Gateway with Ollama)
  const [hasCompatibleProvider, setHasCompatibleProvider] = useState(false);

  const checkProviderCompatibility = useCallback(async () => {
    try {
      const { useAIProviderStore } = await import('../store/aiProviderStore');
      const aiProviderState = useAIProviderStore.getState();
      const provider = aiProviderState.provider;
      const config = aiProviderState.config;
      
      if (!provider || !config) {
        setHasCompatibleProvider(false);
        return false;
      }

      // Check if provider type is ollama or gateway with ollama backend
      const isOllama = config.type === 'ollama';
      const isGatewayWithOllama = config.type === 'gateway' && config.provider === 'ollama';
      const isCompatible = isOllama || isGatewayWithOllama;
      
      setHasCompatibleProvider(isCompatible);
      return isCompatible;
    } catch (error) {
      debugLogger.warn('Could not check AI provider for vector compatibility', { error });
      setHasCompatibleProvider(false);
      return false;
    }
  }, []);

  // Check provider compatibility on mount and when dependencies change
  useEffect(() => {
    checkProviderCompatibility();
  }, [checkProviderCompatibility]);

  // Also check when AI provider store changes
  useEffect(() => {
    const checkOnProviderChange = async () => {
      // Add a small delay to ensure provider store is updated
      setTimeout(() => {
        checkProviderCompatibility();
      }, 100);
    };

    checkOnProviderChange();
  }, [authStore.token, checkProviderCompatibility]); // Re-check when auth token changes (which affects provider initialization)

  // Force a periodic check to catch late provider initialization
  useEffect(() => {
    const interval = setInterval(() => {
      if (!hasCompatibleProvider) {
        checkProviderCompatibility();
      }
    }, 2000); // Check every 2 seconds if not compatible

    return () => clearInterval(interval);
  }, [hasCompatibleProvider, checkProviderCompatibility]);

  /**
   * Initialize vector database service with auth token
   */
  const initializeVectorService = useCallback(async () => {
    try {
      // Get configuration from package settings instead of direct environment access
      const packageSettings = usePackageSettingsStore.getState().getSettings();
      
      if (!packageSettings) {
        debugLogger.warn('Package settings not available for vector service initialization');
        return;
      }
      
      const gatewayApiUrl = packageSettings.gatewayApiUrl;
      const fileStorageApiUrl = packageSettings.fileStorageApiUrl || packageSettings.gatewayApiUrl; // Fallback to gateway URL if file storage API not specified
      
      vectorDatabaseService.configure(gatewayApiUrl, fileStorageApiUrl);

      if (authStore.token) {
        vectorDatabaseService.setAuthToken(authStore.token);
      }

      const isAvailable = vectorDatabaseService.isAvailable();
      const enabledCondition = hasAnyAdvancedFeatures && hasVectorAccess && isAvailable && hasCompatibleProvider;
      
      setStatus(prev => ({
        ...prev,
        isAvailable,
        isEnabled: enabledCondition,
        migrationRequired: isAvailable && enabledCondition && !vectorMigrationService.isMigrationCompleted()
      }));

      debugLogger.info('Vector service initialized', {
        isAvailable,
        isAdvancedVectorFeaturesEnabled,
        hasVectorAccess,
        migrationRequired: !vectorMigrationService.isMigrationCompleted()
      });

    } catch (error) {
      debugLogger.error('Failed to initialize vector service', { error });
      setStatus(prev => ({
        ...prev,
        isAvailable: false,
        isEnabled: false,
        lastError: error instanceof Error ? error.message : String(error)
      }));
    }
  }, [authStore.token, hasAnyAdvancedFeatures, hasVectorAccess, hasCompatibleProvider, isAdvancedVectorFeaturesEnabled]);

  // Initialize vector service when dependencies change
  useEffect(() => {
    initializeVectorService();
  }, [initializeVectorService]);

  /**
   * Perform migration from IndexedDB to Vector Database
   */
  const performMigration = useCallback(async (options?: { cleanupAfterMigration?: boolean }): Promise<MigrationStatus> => {
    debugLogger.info('Starting vector database migration');
    
    setStatus(prev => ({ ...prev, isMigrating: true, lastError: undefined }));

    // Set up progress tracking
    const progressCallback = (progress: MigrationProgress) => {
      setStatus(prev => ({ ...prev, migrationProgress: progress }));
    };

    vectorMigrationService.onProgress(progressCallback);

    try {
      const result = await vectorMigrationService.performMigration(options);
      
      setStatus(prev => ({
        ...prev,
        isMigrating: false,
        migrationRequired: !result.success,
        migrationProgress: undefined,
        lastError: result.success ? undefined : result.errors.join('; ')
      }));

      if (result.success) {
        debugLogger.info('Vector migration completed successfully', result);
        // Refresh stores to ensure they're updated
        await memoryStore.hydrate();
        await knowledgeStore.loadDocs();
      } else {
        debugLogger.error('Vector migration failed', result);
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      debugLogger.error('Migration failed with exception', { error: errorMsg });
      
      setStatus(prev => ({
        ...prev,
        isMigrating: false,
        lastError: errorMsg
      }));

      return {
        success: false,
        migratedMemories: 0,
        migratedDocuments: 0,
        errors: [errorMsg],
        warnings: [],
        totalTime: 0
      };
    } finally {
      vectorMigrationService.removeProgressCallback(progressCallback);
    }
  }, [memoryStore, knowledgeStore]);

  /**
   * Add a memory using the appropriate storage backend
   */
  const addMemory = useCallback(async (
    content: string,
    tags: string[] = [],
    source: 'auto' | 'user' = 'user',
    options: {
      metadata?: VectorMemoryMetadata;
      pinned?: boolean;
      title?: string;
      lastReferencedAt?: string;
    } = {}
  ): Promise<{ success: boolean; id?: string; error?: string }> => {
    if (status.isEnabled && !status.migrationRequired) {
      // Use vector database
      try {
        const result = await vectorDatabaseService.createMemory(
          content,
          {
            title: options.title ?? `Memory from ${new Date().toLocaleDateString()}`,
            tags,
            source,
            pinned: options.pinned,
            metadata: options.metadata,
            lastReferencedAt: options.lastReferencedAt,
          }
        );
        
        if (result.success) {
          debugLogger.info('Memory added to vector database', { memoryId: result.memoryId });
          return { success: true, id: result.memoryId };
        } else {
          throw new Error(result.message || 'Unknown error');
        }
      } catch (error) {
        debugLogger.error('Failed to add memory to vector database', { error });
        return { 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        };
      }
    } else {
      // Use IndexedDB fallback
      try {
        await memoryStore.addMemory(content, tags, source);
        debugLogger.info('Memory added to IndexedDB', { content: content.slice(0, 100) });
        return { success: true };
      } catch (error) {
        debugLogger.error('Failed to add memory to IndexedDB', { error });
        return { 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        };
      }
    }
  }, [status.isEnabled, status.migrationRequired, memoryStore]);

  /**
   * Search memories using the appropriate backend
   */
  const searchMemories = useCallback(async (
    query: string,
    options: SearchOptions = {}
  ): Promise<VectorMemory[]> => {
    const { 
      memoryLimit = 10, 
      scoreThreshold = 0.6, 
      useVector = status.isEnabled && !status.migrationRequired 
    } = options;

    if (useVector) {
      // Use vector database search
      try {
  const results = await vectorDatabaseService.searchMemories(query, memoryLimit, scoreThreshold, options.filters);
        debugLogger.info('Vector memory search completed', { 
          query: query.slice(0, 50), 
          resultsCount: results.length 
        });
        return results;
      } catch (error) {
        debugLogger.error('Vector memory search failed, falling back to IndexedDB', { error });
        // Fall through to IndexedDB search
      }
    }

    // Use IndexedDB search
    const results = memoryStore.searchMemory(query);
    debugLogger.info('IndexedDB memory search completed', { 
      query: query.slice(0, 50), 
      resultsCount: results.length 
    });

    return results.slice(0, memoryLimit).map((entry) => ({
      id: entry.id,
      content: entry.content,
      title: undefined,
      tags: entry.tags,
      score: undefined,
      uploadedBy: 'local',
      uploadedAt: new Date(entry.timestamp).toISOString(),
      source: entry.source,
      pinned: entry.pinned,
      lastReferencedAt: new Date(entry.timestamp).toISOString(),
      metadata: undefined,
    }));
  }, [status.isEnabled, status.migrationRequired, memoryStore]);

  /**
   * Get user's memories with pagination
   */
  const getUserMemories = useCallback(async (
    skip = 0, 
    limit = 50
  ): Promise<VectorMemory[]> => {
    if (status.isEnabled && !status.migrationRequired) {
      // Use vector database
      try {
        const results = await vectorDatabaseService.getMyMemories(skip, limit);
        debugLogger.info('Vector memories retrieved', { count: results.length });
        return results;
      } catch (error) {
        debugLogger.error('Failed to get vector memories, falling back to IndexedDB', { error });
        // Fall through to IndexedDB
      }
    }

    // Use IndexedDB fallback
    await memoryStore.hydrate();
    const allEntries = memoryStore.entries;
    const paginatedEntries = allEntries.slice(skip, skip + limit);
    debugLogger.info('IndexedDB memories retrieved', { count: paginatedEntries.length });
    return paginatedEntries.map(memoryEntryToVectorMemory);
  }, [status.isEnabled, status.migrationRequired, memoryStore]);

  /**
   * Delete a memory
   */
  const deleteMemory = useCallback(async (
    memoryId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (status.isEnabled && !status.migrationRequired) {
      // Use vector database
      try {
        const success = await vectorDatabaseService.deleteMemory(memoryId);
        if (success) {
          debugLogger.info('Memory deleted from vector database', { memoryId });
          return { success: true };
        } else {
          throw new Error('Vector deletion failed');
        }
      } catch (error) {
        debugLogger.error('Failed to delete vector memory', { memoryId, error });
        return { 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        };
      }
    } else {
      // Use IndexedDB fallback
      try {
        await memoryStore.removeMemory(memoryId);
        debugLogger.info('Memory deleted from IndexedDB', { memoryId });
        return { success: true };
      } catch (error) {
        debugLogger.error('Failed to delete IndexedDB memory', { memoryId, error });
        return { 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        };
      }
    }
  }, [status.isEnabled, status.migrationRequired, memoryStore]);

  /**
   * Update a memory using the appropriate storage backend
   */
  const updateMemory = useCallback(async (
    memoryId: string,
    updates: { pinned?: boolean; content?: string; title?: string; tags?: string[] }
  ): Promise<{ success: boolean; error?: string }> => {
    if (status.isEnabled && !status.migrationRequired) {
      // Use vector database
      try {
        const success = await vectorDatabaseService.updateMemory(memoryId, updates);
        if (success) {
          debugLogger.info('Memory updated in vector database', { memoryId, updates });
          return { success: true };
        } else {
          throw new Error('Vector update failed');
        }
      } catch (error) {
        debugLogger.error('Failed to update vector memory', { memoryId, error });
        return { 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        };
      }
    } else {
      // Use IndexedDB fallback - for pinning
      if (updates.pinned !== undefined) {
        try {
          await memoryStore.togglePinMemory(memoryId);
          debugLogger.info('Memory pin status updated in IndexedDB', { memoryId });
          return { success: true };
        } catch (error) {
          debugLogger.error('Failed to update IndexedDB memory pin', { memoryId, error });
          return { 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
          };
        }
      }
      return { success: false, error: 'Update not supported for IndexedDB' };
    }
  }, [status.isEnabled, status.migrationRequired, memoryStore]);

  /**
   * Batch create memories using the appropriate storage backend
   */
  const batchCreateMemories = useCallback(async (
    memories: Array<{ content: string; title?: string; tags?: string[] }>,
    mode: 'append' | 'replace' | 'smartDedupe' = 'append',
    clearExisting: boolean = false
  ): Promise<{
    success: boolean;
    message: string;
    results: Array<{
      content: string;
      success: boolean;
      memoryId?: string;
      mongoId?: string;
      contentLength?: number;
      message: string;
      action: string;
    }>;
    summary: {
      mode: string;
      totalProcessed: number;
      successCount: number;
      failureCount: number;
      skippedCount: number;
      clearedExistingCount: number;
      clearedExisting: boolean;
    };
  }> => {
    if (status.isEnabled && !status.migrationRequired) {
      // Use vector database
      try {
        const result = await vectorDatabaseService.batchCreateMemories(memories, mode, clearExisting);
        debugLogger.info('Batch memories created in vector database', { 
          total: memories.length,
          successful: result.summary.successCount,
          mode 
        });
        return result;
      } catch (error) {
        debugLogger.error('Failed to batch create vector memories', { error });
        throw error;
      }
    } else {
      // Use IndexedDB fallback - simulate batch response
      const results: Array<{
        content: string;
        success: boolean;
        memoryId?: string;
        mongoId?: string;
        contentLength?: number;
        message: string;
        action: string;
      }> = [];

      let successCount = 0;
      let failureCount = 0;

      // Handle clear existing for replace mode
      if (mode === 'replace' || clearExisting) {
        try {
          await memoryStore.clearMemories();
          debugLogger.info('Cleared existing IndexedDB memories for batch replace');
        } catch (error) {
          debugLogger.error('Failed to clear existing memories', { error });
        }
      }

      // Add each memory to IndexedDB
      for (const memory of memories) {
        try {
          await memoryStore.addMemory(memory.content, memory.tags || [], 'user');
          results.push({
            content: memory.content.substring(0, 100) + '...',
            success: true,
            contentLength: memory.content.length,
            message: 'Memory added successfully to IndexedDB',
            action: 'added'
          });
          successCount++;
        } catch (error) {
          results.push({
            content: memory.content.substring(0, 100) + '...',
            success: false,
            message: error instanceof Error ? error.message : String(error),
            action: 'failed'
          });
          failureCount++;
        }
      }

      debugLogger.info('Batch memories created in IndexedDB', { 
        total: memories.length,
        successful: successCount,
        failed: failureCount,
        mode 
      });

      return {
        success: failureCount === 0,
        message: `Batch processing completed. ${successCount}/${memories.length} memories added successfully (IndexedDB fallback).`,
        results,
        summary: {
          mode: mode.charAt(0).toUpperCase() + mode.slice(1),
          totalProcessed: memories.length,
          successCount,
          failureCount,
          skippedCount: 0,
          clearedExistingCount: mode === 'replace' || clearExisting ? 1 : 0,
          clearedExisting: mode === 'replace' || clearExisting
        }
      };
    }
  }, [status.isEnabled, status.migrationRequired, memoryStore]);

  /**
   * Advanced batch create memories with progress reporting and chunking
   */
  const batchCreateMemoriesAdvanced = useCallback(async (
    memories: Array<{ content: string; title?: string; tags?: string[] }>,
    options: {
      mode?: 'append' | 'replace' | 'smartDedupe';
      clearExisting?: boolean;
      chunkSize?: number;
      onProgress?: (current: number, total: number, message: string) => void;
      validateContent?: boolean;
    } = {}
  ) => {
    if (status.isEnabled && !status.migrationRequired) {
      // Use vector database with advanced features
      return await vectorDatabaseService.batchCreateMemoriesAdvanced(memories, options);
    } else {
      // Fallback to basic batch operation for IndexedDB
      const basicResult = await batchCreateMemories(
        memories, 
        options.mode || 'append', 
        options.clearExisting || false
      );
      
      // Convert to advanced result format
      return {
        success: basicResult.success,
        message: basicResult.message,
        totalMemories: memories.length,
        successCount: basicResult.summary.successCount,
        failureCount: basicResult.summary.failureCount,
        skippedCount: basicResult.summary.skippedCount,
        errors: basicResult.results.filter(r => !r.success).map(r => r.message),
        warnings: [],
        chunks: 1,
        duration: 0
      };
    }
  }, [status.isEnabled, status.migrationRequired, batchCreateMemories]);

  /**
   * Batch import memories from local storage to vector database
   * This is useful for migrating existing IndexedDB memories to vector storage
   */
  const batchImportMemories = useCallback(async (
    fromIndexedDB: boolean = true,
    mode: 'append' | 'replace' | 'smartDedupe' = 'append'
  ): Promise<{
    success: boolean;
    message: string;
    migratedCount: number;
    totalMemories: number;
    errors: string[];
  }> => {
    if (!status.isEnabled || status.migrationRequired) {
      return {
        success: false,
        message: 'Vector database not available for import',
        migratedCount: 0,
        totalMemories: 0,
        errors: ['Vector database not enabled or migration required']
      };
    }

    if (!fromIndexedDB) {
      return {
        success: false,
        message: 'Only IndexedDB import is currently supported',
        migratedCount: 0,
        totalMemories: 0,
        errors: ['Unsupported import source']
      };
    }

    try {
      // Get all memories from IndexedDB
      await memoryStore.hydrate();
      const indexedDBMemories = memoryStore.entries;

      if (indexedDBMemories.length === 0) {
        return {
          success: true,
          message: 'No memories found in IndexedDB to import',
          migratedCount: 0,
          totalMemories: 0,
          errors: []
        };
      }

      // Convert IndexedDB format to vector format
      const memoriesToImport = indexedDBMemories.map(entry => ({
        content: entry.content,
        title: `Imported Memory - ${new Date(entry.timestamp).toLocaleDateString()}`,
        tags: entry.tags || []
      }));

      debugLogger.info('Starting batch import from IndexedDB', {
        totalMemories: memoriesToImport.length,
        mode
      });

      // Import to vector database
      const result = await vectorDatabaseService.batchCreateMemories(memoriesToImport, mode, false);

      return {
        success: result.success,
        message: `Import completed: ${result.summary.successCount}/${memoriesToImport.length} memories imported`,
        migratedCount: result.summary.successCount,
        totalMemories: memoriesToImport.length,
        errors: result.results
          .filter(r => !r.success)
          .map(r => r.message)
      };

    } catch (error) {
      debugLogger.error('Failed to import memories from IndexedDB', { error });
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        migratedCount: 0,
        totalMemories: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }, [status.isEnabled, status.migrationRequired, memoryStore]);

  /**
   * Upload and embed document
   */
  const uploadDocument = useCallback(async (
    file: File, 
    shareWithTeam = true
  ): Promise<{ success: boolean; fileId?: string; error?: string }> => {
    if (!status.isEnabled || status.migrationRequired) {
      return { 
        success: false, 
        error: 'Vector database not available - document upload requires advanced features' 
      };
    }

    try {
      // Upload file to the configured file storage service
      const uploadResult = await vectorDatabaseService.uploadFile(file, shareWithTeam);
      
      if (!uploadResult.success || !uploadResult.fileId) {
        throw new Error(uploadResult.message || 'Upload failed');
      }

      // Embed in vector database
      const embedResult = await vectorDatabaseService.embedDocument(uploadResult.fileId, shareWithTeam);
      
      if (!embedResult.success) {
        throw new Error(embedResult.message || 'Embedding failed');
      }

      debugLogger.info('Document uploaded and embedded successfully', { 
        filename: file.name,
        fileId: uploadResult.fileId 
      });

      return { success: true, fileId: uploadResult.fileId };
    } catch (error) {
      debugLogger.error('Failed to upload document', { filename: file.name, error });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }, [status.isEnabled, status.migrationRequired]);

  /**
   * Search documents using vector database
   */
  const searchDocuments = useCallback(async (
    query: string, 
    options: SearchOptions = {}
  ): Promise<VectorDocument[]> => {
    const { documentLimit = 20, scoreThreshold = 0.7 } = options;

    if (!status.isEnabled || status.migrationRequired) {
      debugLogger.warn('Vector document search not available, falling back to knowledge store');
      // Fallback to basic knowledge store search
      const docs = knowledgeStore.docs.filter(doc => 
        doc.content.toLowerCase().includes(query.toLowerCase()) ||
        doc.name.toLowerCase().includes(query.toLowerCase())
      );
      return docs.slice(0, documentLimit).map(knowledgeDocToVectorDocument);
    }

    try {
      const results = await vectorDatabaseService.searchDocuments(query, documentLimit, scoreThreshold);
      debugLogger.info('Vector document search completed', { 
        query: query.slice(0, 50), 
        resultsCount: results.length 
      });
      return results;
    } catch (error) {
      debugLogger.error('Vector document search failed', { error });
      return [];
    }
  }, [status.isEnabled, status.migrationRequired, knowledgeStore.docs]);

  /**
   * Combined search across both memories and documents
   */
  const searchAll = useCallback(async (
    query: string, 
    options: SearchOptions = {}
  ): Promise<SearchResult> => {
    if (status.isEnabled && !status.migrationRequired) {
      // Use vector database combined search
      try {
        const result = await vectorDatabaseService.searchAll(
          query,
          options.memoryLimit,
          options.documentLimit,
          options.scoreThreshold
        );
        
        debugLogger.info('Vector combined search completed', result);
        return result;
      } catch (error) {
        debugLogger.error('Vector combined search failed, falling back', { error });
        // Fall through to fallback
      }
    }

    // Fallback to separate searches
    try {
      const [memories, documents] = await Promise.all([
        searchMemories(query, { ...options, useVector: false }),
        searchDocuments(query, options)
      ]);

      return {
        memories,
        documents,
        success: true,
        message: `Found ${memories.length} memories and ${documents.length} documents (fallback search)`,
      };
    } catch (error) {
      debugLogger.error('Fallback combined search failed', { error });
      return {
        memories: [],
        documents: [],
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }, [status.isEnabled, status.migrationRequired, searchMemories, searchDocuments]);

  /**
   * Get migration estimation
   */
  const getMigrationEstimate = useCallback(async () => {
    return vectorMigrationService.estimateMigration();
  }, []);

  // Initialize on mount and when dependencies change
  useEffect(() => {
    initializeVectorService();
  }, [initializeVectorService]);

  /**
   * Get user's uploaded documents from vector database
   */
  const getUserDocuments = useCallback(async (
    skip = 0, 
    limit = 50
  ): Promise<VectorDocument[]> => {
    if (!status.isEnabled || status.migrationRequired) {
      return [];
    }

    try {
      const records = await vectorDatabaseService.getUserFiles(skip, limit);
      const documents = records
        .map(rawFileRecordToVectorDocument)
        .filter((doc): doc is VectorDocument => doc !== null);

      debugLogger.info('Retrieved user documents from vector database', { 
        count: documents.length 
      });
      return documents;
    } catch (error) {
      debugLogger.error('Failed to get user documents', { error });
      return [];
    }
  }, [status.isEnabled, status.migrationRequired]);

  /**
   * Delete a document from vector database
   */
  const deleteDocument = useCallback(async (
    fileId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!status.isEnabled || status.migrationRequired) {
      return { 
        success: false, 
        error: 'Vector database not available' 
      };
    }

    try {
      const success = await vectorDatabaseService.deleteDocument(fileId);
      if (success) {
        debugLogger.info('Document deleted from vector database', { fileId });
        return { success: true };
      } else {
        throw new Error('Document deletion failed');
      }
    } catch (error) {
      debugLogger.error('Failed to delete document', { fileId, error });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }, [status.isEnabled, status.migrationRequired]);

  // Auto-trigger migration if required and user just gained access
  useEffect(() => {
    if (status.migrationRequired && status.isAvailable && !status.isMigrating) {
      debugLogger.info('Auto-triggering vector migration for newly enabled advanced features');
      // Auto-migrate when vector storage becomes available for users with access
      performMigration({ cleanupAfterMigration: false }).then(result => {
        debugLogger.info('Migration completed', { result });
      }).catch(error => {
        debugLogger.error('Auto-triggered migration failed', { error });
      });
    }
  }, [status.migrationRequired, status.isAvailable, status.isMigrating, performMigration]);

  /**
   * Download a file from vector database/file-storage using MongoDB ObjectId
   */
  const downloadVectorFile = useCallback(async (
    fileId: string,
    filename: string
  ): Promise<void> => {
    if (!status.isEnabled) {
      throw new Error('Vector database not enabled');
    }

    try {
      await vectorDatabaseService.downloadFile(fileId, filename);
      debugLogger.info('File downloaded successfully', { fileId, filename });
    } catch (error) {
      debugLogger.error('Failed to download file', { fileId, filename, error });
      throw error;
    }
  }, [status.isEnabled]);

  /**
   * Get file preview content using MongoDB ObjectId
   */
  const getFilePreview = useCallback(async (
    fileId: string
  ): Promise<{ content: string; mimeType: string } | null> => {
    if (!status.isEnabled) {
      return null;
    }

    try {
      const preview = await vectorDatabaseService.getFilePreview(fileId);
      debugLogger.info('File preview retrieved', { fileId, hasContent: !!preview?.content });
      return preview;
    } catch (error) {
      debugLogger.error('Failed to get file preview', { fileId, error });
      return null;
    }
  }, [status.isEnabled]);

  /**
   * Get file blob for displaying full content in modal using MongoDB ObjectId
   */
  const getFileBlob = useCallback(async (
    fileId: string
  ): Promise<Blob> => {
    if (!status.isEnabled) {
      throw new Error('Vector database not enabled');
    }

    try {
      const blob = await vectorDatabaseService.getFileBlob(fileId);
      debugLogger.info('File blob retrieved', { fileId, size: blob.size });
      return blob;
    } catch (error) {
      debugLogger.error('Failed to get file blob', { fileId, error });
      throw error;
    }
  }, [status.isEnabled]);

  // Manual refresh function for debugging
  const refreshCompatibilityCheck = useCallback(() => {
    checkProviderCompatibility();
  }, [checkProviderCompatibility]);

  return {
    // Status
    status,
    isVectorEnabled: status.isEnabled && !status.migrationRequired,
    
    // Debug functions
    refreshCompatibilityCheck,
    
    // Migration
    performMigration,
    getMigrationEstimate,
    
    // Memory operations
    addMemory,
    batchCreateMemories,
    batchCreateMemoriesAdvanced,
    batchImportMemories,
    searchMemories,
    getUserMemories,
    deleteMemory,
    updateMemory,
    
    // Document operations
    uploadDocument,
    searchDocuments,
    getUserDocuments,
    deleteDocument,
    downloadVectorFile,
    getFilePreview,
    getFileBlob,
    
    // Combined operations
    searchAll,
    
    // Utilities
    initializeVectorService
  };
};

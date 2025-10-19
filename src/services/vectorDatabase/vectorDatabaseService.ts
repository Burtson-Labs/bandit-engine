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

// Bandit Engine Watermark: BL-WM-8982-9742E4
const __banditFingerprint_vectorDatabase_vectorDatabaseServicets = 'BL-FP-D2339E-A5C8';
const __auditTrail_vectorDatabase_vectorDatabaseServicets = 'BL-AU-MGOIKVW1-FS6U';
// File: vectorDatabaseService.ts | Path: src/services/vectorDatabase/vectorDatabaseService.ts | Hash: 8982a5c8

import { debugLogger } from '../logging/debugLogger';

export interface VectorMemory {
  id: string;
  content: string;
  title?: string;
  tags?: string[];
  score?: number;
  uploadedBy: string;
  uploadedAt: string;
  source?: 'auto' | 'user'; // Indicates if memory was created automatically or by user
  pinned?: boolean;
  lastReferencedAt?: string;
  metadata?: VectorMemoryMetadata;
}

export interface VectorMemoryMetadata {
  personalConfidence?: number;
  topic?: string;
  engagement?: number;
  extractedFrom?: string;
  tags?: string[];
  additionalProperties?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface VectorDocument {
  id: string;
  filename: string;
  content: string;
  mimeType: string;
  score?: number;
  uploadedBy: string;
  uploadedAt: string;
  isUserContent: boolean;
  isTeamContent: boolean;
  contentSource: 'user' | 'team';
}

export interface SearchResult {
  memories: VectorMemory[];
  documents: VectorDocument[];
  success: boolean;
  message?: string;
}

interface MemoryResultsEnvelope extends Record<string, unknown> {
  success?: boolean;
  results?: unknown[];
  memories?: unknown[];
  message?: string;
  totalCount?: number;
}

interface DocumentSearchResponse extends Record<string, unknown> {
  success?: boolean;
  results?: VectorDocument[];
  message?: string;
}

type RawFileRecord = Record<string, unknown>;

// Optional search filters aligned with New_Memories_API.md
export interface MemorySearchFilters {
  includePinned?: boolean;
  topics?: string[];
  source?: Array<'auto' | 'user'>;
  tags?: string[];
}

export interface CreateMemoryOptions {
  title?: string;
  tags?: string[];
  source?: 'auto' | 'user';
  pinned?: boolean;
  metadata?: VectorMemoryMetadata;
  lastReferencedAt?: string;
}

export interface FileUploadResult {
  success: boolean;
  fileId: string;
  message?: string;
}

/**
 * Upload request structure that matches the backend C# UploadRequest class
 */
export interface UploadRequest {
  /** The file to upload */
  file: File;
  /** 
   * Indicates whether the file should be shared with the team.
   * If true and the user has team information, the file will be saved to the team bucket.
   * If false, the file will be saved to the user's personal bucket regardless of team membership.
   * Defaults to true for backward compatibility.
   */
  shareWithTeam: boolean;
}

/**
 * Vector Database Service for Advanced Semantic Search
 * 
 * This service handles storage and retrieval of memories and documents
 * in the vector database when advanced semantic search is enabled.
 * 
 * Feature Gating:
 * - Requires admin authorization, pro subscription, or team subscription
 * - Supports admin users and pro/team subscription tiers
 * - Only active when advancedMemories feature is enabled
 */
export class VectorDatabaseService {
  private baseUrl: string;
  private fileStorageApiUrl: string;
  private token: string | null = null;
  private lastAvailabilityState: boolean | undefined;
  private lastConfigState: string | undefined;

  constructor(gatewayApiUrl?: string, fileStorageApiUrl?: string) {
    // Use provided URLs or fallback to defaults
    // For local development, use HTTPS localhost Gateway API (matches working curl command)
    this.baseUrl = gatewayApiUrl || 'https://localhost:5001/api';
    this.fileStorageApiUrl = fileStorageApiUrl || 'https://localhost:5001/api';
    
    debugLogger.info('Vector database service initialized', {
      baseUrl: this.baseUrl,
      fileStorageApiUrl: this.fileStorageApiUrl,
      hasToken: Boolean(this.token),
    });
  }

  /**
   * Set authentication token for API calls
   */
  setAuthToken(token: string) {
    this.token = token;
  }

  /**
   * Get authorization headers
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Check if vector database is available and configured
   */
  isAvailable(): boolean {
    const available = !!(this.baseUrl && this.fileStorageApiUrl && this.token);
    // Only log on first check or when availability changes
    if (this.lastAvailabilityState !== available) {
      debugLogger.debug('Vector service availability check', {
        baseUrl: this.baseUrl,
        fileStorageApiUrl: this.fileStorageApiUrl,
        hasToken: Boolean(this.token),
        available,
      });
      this.lastAvailabilityState = available;
    }
    return available;
  }

  // ===== MEMORY OPERATIONS =====

  /**
   * Create and embed a memory in the vector database
   */
  async createMemory(
    content: string,
    options: CreateMemoryOptions = {}
  ): Promise<{ success: boolean; memoryId?: string; message?: string }> {
    if (!this.isAvailable()) {
      throw new Error('Vector database service not available');
    }

    try {
      const {
        title,
        tags,
        source = 'user',
        pinned = false,
        metadata,
        lastReferencedAt,
      } = options;

      debugLogger.info('Creating vector memory', { 
        contentLength: content.length, 
        title, 
        tagsCount: tags?.length || 0,
        source,
        pinned,
      });

      const response = await fetch(`${this.baseUrl}/embedding/embed-memory`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          content,
          title,
          tags: tags || [],
          source,
          pinned,
          metadata,
          lastReferencedAt,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed: ${response.status}`);
      }

      const result = await response.json();
      
      debugLogger.info('Vector memory created successfully', { 
        memoryId: result.memoryId,
        contentLength: result.contentLength 
      });

      return {
        success: true,
        memoryId: result.memoryId,
        message: result.message
      };
    } catch (error) {
      debugLogger.error('Failed to create vector memory', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw new Error(`Failed to create memory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search memories in the vector database
   */
  private coerceStringArray(value: unknown): string[] {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item : String(item)))
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }
  private coerceString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private coerceBoolean(value: unknown): boolean | undefined {
    return typeof value === 'boolean' ? value : undefined;
  }

  private coerceNumber(value: unknown): number | undefined {
    return typeof value === 'number' ? value : undefined;
  }

  private asRecord(value: unknown): Record<string, unknown> | undefined {
    if (value && typeof value === 'object') {
      return value as Record<string, unknown>;
    }
    return undefined;
  }


  private toRecordArray(values: unknown[]): RawFileRecord[] {
    return values.reduce<RawFileRecord[]>((acc, item) => {
      const record = this.asRecord(item);
      if (record) {
        acc.push(record);
      }
      return acc;
    }, []);
  }

  private buildMetadata(primary?: Record<string, unknown>, fallback?: Record<string, unknown>): VectorMemoryMetadata | undefined {
    const metadata: VectorMemoryMetadata = {};
    let hasMetadata = false;

    const sources = [primary, fallback].filter(
      (source): source is Record<string, unknown> => Boolean(source) && typeof source === 'object'
    );

    const tagsSet = new Set<string>();

    for (const source of sources) {
      if (typeof source.personalConfidence === 'number') {
        metadata.personalConfidence = source.personalConfidence;
        hasMetadata = true;
      }
      if (typeof source.topic === 'string' && source.topic.trim()) {
        metadata.topic = source.topic.trim();
        hasMetadata = true;
      }
      if (typeof source.engagement === 'number') {
        metadata.engagement = source.engagement;
        hasMetadata = true;
      }
      if (typeof source.extractedFrom === 'string' && source.extractedFrom.trim()) {
        metadata.extractedFrom = source.extractedFrom.trim();
        hasMetadata = true;
      }

      this.coerceStringArray(source.tags).forEach((tag) => {
        tagsSet.add(tag);
        hasMetadata = true;
      });

      const additionalSource = source.additionalProperties;
      if (additionalSource && typeof additionalSource === 'object') {
        metadata.additionalProperties = {
          ...(metadata.additionalProperties || {}),
          ...additionalSource,
        };
        hasMetadata = true;
      }

      for (const [key, value] of Object.entries(source)) {
        if (
          key === 'personalConfidence' ||
          key === 'topic' ||
          key === 'engagement' ||
          key === 'extractedFrom' ||
          key === 'tags' ||
          key === 'additionalProperties'
        ) {
          continue;
        }

        if (key === 'vectorMemory') {
          continue;
        }

        metadata.additionalProperties = {
          ...(metadata.additionalProperties || {}),
          [key]: value,
        };
        hasMetadata = true;
      }
    }

    if (tagsSet.size > 0) {
      metadata.tags = Array.from(tagsSet);
    }

    return hasMetadata ? metadata : undefined;
  }

  private normalizeMemoryResult(rawInput: unknown): VectorMemory {
    const raw = this.asRecord(rawInput) ?? {};
    const rawMetadata = this.asRecord(raw['metadata']);
    const vectorMetadata = rawMetadata ? this.asRecord(rawMetadata['vectorMemory']) : undefined;
    const vector = vectorMetadata ?? raw;
    const vectorInnerMetadata = this.asRecord(vector['metadata']);

    const metadata = this.buildMetadata(vectorInnerMetadata, rawMetadata);

    const tagsSet = new Set<string>();
    this.coerceStringArray(vector['tags']).forEach((tag) => tagsSet.add(tag));
    this.coerceStringArray(raw['tags']).forEach((tag) => tagsSet.add(tag));
    metadata?.tags?.forEach((tag) => tagsSet.add(tag));

    const scoreCandidates = [
      this.coerceNumber(vector['score']),
      this.coerceNumber(raw['score']),
    ];
    const normalizedScore = scoreCandidates.find((value): value is number => typeof value === 'number');

    const pinnedValue =
      this.coerceBoolean(vector['pinned']) ??
      this.coerceBoolean(rawMetadata ? rawMetadata['pinned'] : undefined) ??
      this.coerceBoolean(raw['pinned']);

    const lastReferencedAt =
      this.coerceString(vector['lastReferencedAt']) ??
      this.coerceString(rawMetadata ? rawMetadata['lastReferencedAt'] : undefined) ??
      this.coerceString(raw['lastReferencedAt']);

    const uploadedAt =
      this.coerceString(vector['uploadedAt']) ??
      this.coerceString(raw['uploadedAt']) ??
      new Date().toISOString();

    const sourceValue = this.coerceString(vector['source']) ?? this.coerceString(raw['source']);
    const normalizedSource =
      sourceValue === 'auto' || sourceValue === 'user' ? sourceValue : undefined;

    const idValue = this.coerceString(vector['id']) ?? this.coerceString(raw['id']) ?? '';
    const contentValue = this.coerceString(vector['content']) ?? this.coerceString(raw['content']) ?? '';
    const titleValue =
      this.coerceString(vector['title']) ??
      this.coerceString(raw['title']) ??
      this.coerceString(raw['filename']) ??
      undefined;
    const uploadedByValue =
      this.coerceString(vector['uploadedBy']) ??
      this.coerceString(raw['uploadedBy']) ??
      'unknown';

    return {
      id: idValue,
      content: contentValue,
      title: titleValue,
      tags: tagsSet.size > 0 ? Array.from(tagsSet) : undefined,
      score: normalizedScore,
      uploadedBy: uploadedByValue,
      uploadedAt,
      source: normalizedSource,
      pinned: pinnedValue,
      lastReferencedAt,
      metadata,
    };
  }
  /**
   * Search memories in the vector database
   */
  async searchMemories(
    query: string,
    limit = 10,
    scoreThreshold = 0.6,
    filters?: MemorySearchFilters
  ): Promise<VectorMemory[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      debugLogger.info('Searching vector memories', { query: query.slice(0, 100), limit, scoreThreshold });

      const response = await fetch(`${this.baseUrl}/embedding/search-memories`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          query,
          limit,
          scoreThreshold,
          // Only include filters when provided
          ...(filters ? { filters } : {})
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Search request failed: ${response.status}`);
      }

      const statsHeader = response.headers.get('X-Memory-Stats');
      if (statsHeader) {
        debugLogger.memoryDebug('Vector memory search diagnostics', {
          header: statsHeader
        });
      }

      const result = (await response.json()) as MemoryResultsEnvelope;
      
      if (result.success === false) {
        throw new Error(result.message || 'Search was not successful');
      }

      const searchResults = Array.isArray(result.results) ? result.results : [];
      const normalizedResults = searchResults.map((entry) =>
        this.normalizeMemoryResult(entry)
      );

      debugLogger.info('Vector memory search completed', { 
        resultsCount: normalizedResults.length,
        message: result.message 
      });

      return normalizedResults;
    } catch (error) {
      debugLogger.error('Failed to search vector memories', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      return [];
    }
  }

  /**
   * Get user's memories with pagination
   */
  async getMyMemories(skip = 0, limit = 50): Promise<VectorMemory[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/embedding/my-memories?skip=${skip}&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch memories: ${response.status}`);
      }

      const result = (await response.json()) as MemoryResultsEnvelope;
      debugLogger.debug('Vector getMyMemories API response', result);
      
      // Handle both 'memories' and 'results' response formats for compatibility
      const rawMemories = Array.isArray(result.memories)
        ? result.memories
        : Array.isArray(result.results)
        ? result.results
        : [];
      const memories = rawMemories.map((entry) => this.normalizeMemoryResult(entry));

      debugLogger.info('Vector memories fetched successfully', { 
        count: memories.length, 
        totalCount: result.totalCount,
        responseStructure: Object.keys(result)
      });
      
      return memories;
    } catch (error) {
      debugLogger.error('Failed to fetch user memories', { error });
      return [];
    }
  }

  /**
   * Delete a memory from the vector database
   */
  async deleteMemory(memoryId: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/embedding/memory/${memoryId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to delete memory: ${response.status}`);
      }

      const result = await response.json();
      debugLogger.info('Vector memory deleted successfully', { memoryId, result });
      return result.success || true;
    } catch (error) {
      debugLogger.error('Failed to delete vector memory', { memoryId, error });
      return false;
    }
  }

  /**
   * Update a memory in the vector database (e.g., pin/unpin)
   */
  async updateMemory(memoryId: string, updates: { pinned?: boolean; content?: string; title?: string; tags?: string[] }): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      // Use the specific pin endpoint for pinning operations
      if (updates.pinned !== undefined) {
        const response = await fetch(`${this.baseUrl}/embedding/memory/${memoryId}/pin`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ pinned: updates.pinned })
        });

        if (!response.ok) {
          throw new Error(`Failed to update memory pin status: ${response.status}`);
        }

        const result = await response.json();
        debugLogger.info('Vector memory pin status updated successfully', { memoryId, pinned: updates.pinned, result });
        return result.success || true;
      }

      // For other updates, we'd need a general update endpoint (not specified in API doc)
      debugLogger.warn('General memory updates not supported yet', { memoryId, updates });
      return false;
    } catch (error) {
      debugLogger.error('Failed to update vector memory', { memoryId, error });
      return false;
    }
  }

  /**
   * Batch create memories in the vector database
   */
  async batchCreateMemories(
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
  }> {
    if (!this.isAvailable()) {
      throw new Error('Vector database service is not available');
    }

    try {
      const requestBody = {
        memories,
        mode,
        clearExisting
      };

      debugLogger.info('Batch creating memories', {
        count: memories.length,
        mode,
        clearExisting,
        firstMemoryPreview: memories[0]?.content?.substring(0, 50) || '',
      });

      const response = await fetch(`${this.baseUrl}/embedding/batch-embed-memories`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Batch memory creation failed: ${response.status}`);
      }

      const result = await response.json();
      
      debugLogger.info('Batch memory creation completed', {
        mode,
        totalMemories: memories.length,
        successCount: result.summary?.successCount || 0,
        failureCount: result.summary?.failureCount || 0
      });

      return result;
    } catch (error) {
      debugLogger.error('Failed to batch create memories', { 
        error, 
        memoriesCount: memories.length,
        mode 
      });
      throw error;
    }
  }

  /**
   * Advanced batch create memories with chunking and progress reporting
   */
  async batchCreateMemoriesAdvanced(
    memories: Array<{ content: string; title?: string; tags?: string[] }>,
    options: {
      mode?: 'append' | 'replace' | 'smartDedupe';
      clearExisting?: boolean;
      chunkSize?: number;
      onProgress?: (current: number, total: number, message: string) => void;
      validateContent?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    message: string;
    totalMemories: number;
    successCount: number;
    failureCount: number;
    skippedCount: number;
    errors: string[];
    warnings: string[];
    chunks: number;
    duration: number;
  }> {
    const startTime = Date.now();
    const {
      mode = 'append',
      clearExisting = false,
      chunkSize = 50,
      onProgress,
      validateContent = true
    } = options;

      // Import memory utilities
      const { MemoryUtils } = await import('../../utils/memoryUtils');

    try {
      // Validate memories if requested
      let validMemories = memories;
      const warnings: string[] = [];
      
      if (validateContent) {
        const validation = MemoryUtils.validateMemories(memories);
        validMemories = validation.valid;
        
        if (validation.invalid.length > 0) {
          warnings.push(`${validation.invalid.length} memories failed validation and were skipped`);
          debugLogger.warn('Some memories failed validation', { 
            invalidCount: validation.invalid.length,
            firstError: validation.invalid[0]?.error 
          });
        }
      }

      if (validMemories.length === 0) {
        return {
          success: false,
          message: 'No valid memories to process',
          totalMemories: memories.length,
          successCount: 0,
          failureCount: 0,
          skippedCount: memories.length,
          errors: ['All memories failed validation'],
          warnings,
          chunks: 0,
          duration: Date.now() - startTime
        };
      }

      // Chunk memories for better performance
      const chunks = MemoryUtils.chunkMemories(validMemories, chunkSize);
      let totalSuccessCount = 0;
      let totalFailureCount = 0;
      const errors: string[] = [];

      onProgress?.(0, validMemories.length, 'Starting batch operation...');

      // Process chunks sequentially to avoid overwhelming the server
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkStartIndex = i * chunkSize;
        
        try {
          onProgress?.(
            chunkStartIndex,
            validMemories.length,
            `Processing chunk ${i + 1}/${chunks.length}...`
          );

          const chunkResult = await this.batchCreateMemories(
            chunk,
            i === 0 ? mode : 'append', // Only use special modes on first chunk
            i === 0 ? clearExisting : false // Only clear on first chunk
          );

          totalSuccessCount += chunkResult.summary.successCount;
          totalFailureCount += chunkResult.summary.failureCount;

          // Collect errors from failed results
          chunkResult.results
            .filter(r => !r.success)
            .forEach(r => errors.push(r.message));

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`Chunk ${i + 1} failed: ${errorMsg}`);
          totalFailureCount += chunk.length;
          
          debugLogger.error('Chunk processing failed', { 
            chunkIndex: i,
            chunkSize: chunk.length,
            error: errorMsg
          });
        }

        // Brief pause between chunks to be respectful to the server
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const duration = Date.now() - startTime;
      const success = totalFailureCount === 0;
      const skippedCount = memories.length - validMemories.length;

      onProgress?.(
        validMemories.length,
        validMemories.length,
        success ? 'Batch operation completed successfully!' : 'Batch operation completed with errors'
      );

      const result = {
        success,
        message: `Processed ${totalSuccessCount}/${validMemories.length} memories successfully` + 
                 (skippedCount > 0 ? ` (${skippedCount} skipped)` : ''),
        totalMemories: memories.length,
        successCount: totalSuccessCount,
        failureCount: totalFailureCount,
        skippedCount,
        errors,
        warnings,
        chunks: chunks.length,
        duration
      };

      debugLogger.info('Advanced batch operation completed', result);
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      debugLogger.error('Advanced batch operation failed', { 
        error: errorMsg,
        memoriesCount: memories.length,
        duration
      });

      return {
        success: false,
        message: `Batch operation failed: ${errorMsg}`,
        totalMemories: memories.length,
        successCount: 0,
        failureCount: memories.length,
        skippedCount: 0,
        errors: [errorMsg],
        warnings: [],
        chunks: 0,
        duration
      };
    }
  }

  // ===== DOCUMENT OPERATIONS =====

  /**
   * Upload file to file storage API and get file ID
   * 
   * @param file - The file to upload
   * @param shareWithTeam - Whether to share the file with team members.
   *                       If true and user has team info, file goes to team bucket.
   *                       If false, file goes to user's personal bucket.
   *                       Defaults to true for backward compatibility.
   * @returns Promise<FileUploadResult> with success status and file ID
   */
  async uploadFile(file: File, shareWithTeam = true): Promise<FileUploadResult> {
    if (!this.fileStorageApiUrl) {
      throw new Error('File storage API URL not configured');
    }

    if (!this.token) {
      throw new Error('Authentication token not available');
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('shareWithTeam', shareWithTeam.toString());

      debugLogger.info('Uploading file to file storage API', { 
        filename: file.name, 
        size: file.size, 
        type: file.type,
        shareWithTeam: shareWithTeam,
        fileStorageApiUrl: this.fileStorageApiUrl
      });

      const response = await fetch(`${this.fileStorageApiUrl}/file/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `file storage upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      // File storage API returns 'id' field, but we need 'fileId'
      const fileId = result.fileId || result.id;
      
      debugLogger.debug('File storage API upload response', result);
      debugLogger.debug('Extracted vector file id', { fileId });
      
      debugLogger.info('File uploaded successfully to file storage', { 
        fileId: fileId,
        filename: file.name,
        originalResponse: result
      });

      return {
        success: true,
        fileId: fileId,
        message: result.message
      };
    } catch (error) {
      debugLogger.error('Failed to upload file to file storage', { error });
      throw new Error(`File storage upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Embed a document in the vector database via Gateway API
   */
  async embedDocument(
    fileId: string, 
    shareWithTeam = true
  ): Promise<{ success: boolean; message?: string }> {
    debugLogger.debug('Embedding document request', { fileId, shareWithTeam });
    
    if (!this.baseUrl) {
      debugLogger.error('Gateway API URL not configured', { baseUrl: this.baseUrl });
      throw new Error('Gateway API URL not configured');
    }

    if (!this.token) {
      debugLogger.error('Authentication token not available');
      throw new Error('Authentication token not available');
    }

    try {
      const endpoint = `${this.baseUrl}/embedding/embed-document`;
      const payload = {
        FileId: fileId,
        Options: null, // EmbeddingOptions - can be null for default options
        ShareWithTeam: shareWithTeam
      };
      
      debugLogger.debug('Making Gateway API call', {
        endpoint,
        method: 'POST',
        payload,
        hasToken: Boolean(this.token),
        tokenPreview: `${this.token.substring(0, 20)}...`,
      });

      debugLogger.info('Embedding document via Gateway API', { 
        fileId, 
        shareWithTeam,
        gatewayUrl: this.baseUrl
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      debugLogger.debug('Gateway API response headers', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Try to get response text for better error debugging
      let responseText = '';
      let parsedResponse: unknown;
      
      try {
        responseText = await response.text();
        debugLogger.debug('Gateway API raw response text', {
          preview: responseText.substring(0, 500),
        });
        
        if (responseText) {
          parsedResponse = JSON.parse(responseText);
        }
      } catch (parseError) {
        debugLogger.warn('Could not parse Gateway API response as JSON', { error: parseError });
      }

      const responseRecord = this.asRecord(parsedResponse);
      const responseMessage = responseRecord && typeof responseRecord['message'] === 'string' ? (responseRecord['message'] as string) : undefined;

      if (!response.ok) {
        debugLogger.error('Gateway API error response', {
          status: response.status,
          statusText: response.statusText,
          responseData: responseRecord ?? { rawResponse: responseText },
          endpoint,
          payload
        });
        
        // Check for specific error types
        if (response.status === 404) {
          throw new Error(`Gateway API endpoint not found: ${endpoint}. Check if Gateway API is running and endpoint exists.`);
        } else if (response.status === 401 || response.status === 403) {
          throw new Error(`Authentication failed: ${response.status}. Check if auth token is valid.`);
        } else if (response.status === 500) {
          throw new Error(`Gateway API server error: ${responseMessage || responseText || 'Unknown server error'}`);
        } else {
          throw new Error(responseMessage || responseText || `Gateway embedding failed: ${response.status}`);
        }
      }

      debugLogger.debug('Gateway API success response', responseRecord ?? { rawResponse: responseText });
      
      const responseFileId = responseRecord && typeof responseRecord['fileId'] === 'string' ? (responseRecord['fileId'] as string) : undefined;

      debugLogger.info('Document embedded successfully via Gateway API', { 
        fileId: responseFileId || fileId,
        message: responseMessage 
      });

      return {
        success: true,
        message: responseMessage || 'Document embedded successfully'
      };
    } catch (error) {
      debugLogger.error('Failed to embed document via Gateway API', { fileId, error });
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to Gateway API at ${this.baseUrl}. Check if Gateway API server is running.`);
      } else {
        throw new Error(`Gateway embedding failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Search documents in the vector database
   */
  async searchDocuments(
    query: string, 
    limit = 20, 
    scoreThreshold = 0.5
  ): Promise<VectorDocument[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      debugLogger.info('Searching vector documents', { query: query.slice(0, 100), limit, scoreThreshold });

      const response = await fetch(`${this.baseUrl}/embedding/search`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          query,
          limit,
          scoreThreshold
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Search failed: ${response.status}`);
      }

      const result = (await response.json()) as DocumentSearchResponse;
      
      if (result.success === false) {
        throw new Error(result.message || 'Search was not successful');
      }

      const documents = Array.isArray(result.results) ? result.results : [];

      debugLogger.info('Vector document search completed', { 
        resultsCount: documents.length 
      });

      return documents;
    } catch (error) {
      debugLogger.error('Failed to search vector documents', { error });
      return [];
    }
  }

  /**
   * Get available files that haven't been embedded
   */
  async getAvailableFiles(skip = 0, limit = 50): Promise<RawFileRecord[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/embedding/available-files?skip=${skip}&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch available files: ${response.status}`);
      }

      const result = await response.json();
      if (Array.isArray(result)) {
        return this.toRecordArray(result);
      }

      if (result && Array.isArray(result.files)) {
        return this.toRecordArray(result.files);
      }

      return [];
    } catch (error) {
      debugLogger.error('Failed to fetch available files', { error });
      return [];
    }
  }

  /**
   * Get user's files - tries both Gateway API and file storage API
   */
  async getUserFiles(skip = 0, limit = 50): Promise<RawFileRecord[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      debugLogger.debug('Fetching user files from Gateway API', { skip, limit });
      // First try Gateway API
      const response = await fetch(`${this.baseUrl}/embedding/files?skip=${skip}&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        debugLogger.warn('Gateway API files endpoint failed, falling back to file storage API', {
          status: response.status,
        });
        // If Gateway API fails, try file storage API
        return await this.getUserFilesFromFileStorage(skip, limit);
      }

      const result = await response.json();
      debugLogger.debug('Gateway API files response', result);

      if (Array.isArray(result)) {
        return this.toRecordArray(result);
      }

      if (result && Array.isArray(result.files)) {
        return this.toRecordArray(result.files);
      }

      return [];
    } catch (error) {
      debugLogger.error('Gateway API failed while fetching user files, trying file storage API', { error });
      // Fallback to file storage API
      return await this.getUserFilesFromFileStorage(skip, limit);
    }
  }

  /**
   * Get user's files from file storage API as fallback
   */
  private async getUserFilesFromFileStorage(skip = 0, limit = 50): Promise<RawFileRecord[]> {
    try {
      debugLogger.debug('Fetching user files from file storage API', { skip, limit });
      const response = await fetch(`${this.fileStorageApiUrl}/file/files?skip=${skip}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`File storage API failed: ${response.status}`);
      }

      const result = await response.json();
      debugLogger.debug('File storage API files response', result);
      
      if (Array.isArray(result)) {
        return this.toRecordArray(result);
      }

      if (result && Array.isArray(result.files)) {
        return this.toRecordArray(result.files);
      }

      return [];
    } catch (error) {
      debugLogger.error('Failed to fetch user files from file storage API', { error });
      return [];
    }
  }

  /**
   * Download a file using MongoDB ObjectId (secure method)
   */
  async downloadFile(fileId: string, filename: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Vector database service not available');
    }

    try {
      debugLogger.debug('Downloading vector file', { fileId, filename });
      
      // Download from file storage API using MongoDB ObjectId (correct file storage API format)
      const response = await fetch(`${this.fileStorageApiUrl}/file/download/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      // Get the file as a blob
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      URL.revokeObjectURL(url);
      
      debugLogger.info('Vector file downloaded successfully', { fileId, filename });
      
    } catch (error) {
      debugLogger.error('Failed to download vector file', { fileId, filename, error });
      throw new Error(`Failed to download ${filename}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get file blob using MongoDB ObjectId (for displaying content in modal)
   */
  async getFileBlob(fileId: string): Promise<Blob> {
    if (!this.isAvailable()) {
      throw new Error('Vector database service not available');
    }

    try {
      debugLogger.debug('Fetching vector file blob', { fileId });
      
      // Get file from file storage API using MongoDB ObjectId
      const response = await fetch(`${this.fileStorageApiUrl}/file/download/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get file: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      debugLogger.info('Successfully retrieved vector file blob', { fileId, size: blob.size });
      
      return blob;
      
    } catch (error) {
      debugLogger.error('Failed to get file blob', { fileId, error });
      throw new Error(`Failed to get file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get file content for preview using MongoDB ObjectId (from Gateway API metadata)
   */
  async getFilePreview(fileId: string, maxSize = 1024 * 1024): Promise<{ content: string; mimeType: string } | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      debugLogger.debug('Fetching vector file preview', { fileId });
      
      // Get file metadata from Gateway API which includes the preview content
      const response = await fetch(`${this.baseUrl}/embedding/files`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        debugLogger.warn('Failed to retrieve files list before preview', { status: response.status });
        return null;
      }

      const filesResponse = await response.json();
      const fileCandidates = Array.isArray(filesResponse)
        ? this.toRecordArray(filesResponse)
        : filesResponse && Array.isArray(filesResponse.files)
        ? this.toRecordArray(filesResponse.files)
        : [];
      
      const targetFile = fileCandidates.find((file) => this.coerceString(file['id']) === fileId);
      const previewContent = targetFile ? this.coerceString(targetFile['preview']) : undefined;
      const mimeType = targetFile ? this.coerceString(targetFile['mimeType']) : undefined;
      
      if (!previewContent) {
        debugLogger.warn('Preview not available for file', { fileId });
        return null;
      }

      return {
        content: previewContent,
        mimeType: mimeType || 'text/plain'
      };
      
    } catch (error) {
      debugLogger.error('Failed to get file preview', { fileId, error });
      return null;
    }
  }

  /**
   * Delete a document from vector database
   */
  async deleteDocument(fileId: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/embedding/${fileId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to delete document: ${response.status}`);
      }

      debugLogger.info('Vector document deleted successfully', { fileId });
      return true;
    } catch (error) {
      debugLogger.error('Failed to delete vector document', { fileId, error });
      return false;
    }
  }

  // ===== COMBINED SEARCH =====

  /**
   * Search both memories and documents simultaneously
   */
  async searchAll(
    query: string,
    memoryLimit = 10,
    documentLimit = 20,
    scoreThreshold = 0.6
  ): Promise<SearchResult> {
    if (!this.isAvailable()) {
      return {
        memories: [],
        documents: [],
        success: false,
        message: 'Vector database service not available'
      };
    }

    try {
      const [memories, documents] = await Promise.all([
        this.searchMemories(query, memoryLimit, scoreThreshold),
        this.searchDocuments(query, documentLimit, scoreThreshold)
      ]);

      return {
        memories,
        documents,
        success: true,
        message: `Found ${memories.length} memories and ${documents.length} documents`
      };
    } catch (error) {
      debugLogger.error('Failed to search all content', { error });
      return {
        memories: [],
        documents: [],
        success: false,
        message: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }
  /**
   * Configure the service with API URLs
   * This should be called by the main application with environment variables
   */
  configure(gatewayApiUrl: string, fileStorageApiUrl: string) {
    this.baseUrl = gatewayApiUrl;
    this.fileStorageApiUrl = fileStorageApiUrl;
    
    // Only log configuration changes, not repetitive calls
    if (this.lastConfigState !== `${gatewayApiUrl}|${fileStorageApiUrl}`) {
      debugLogger.info('Vector database service configured', {
        baseUrl: this.baseUrl,
        fileStorageApiUrl: this.fileStorageApiUrl,
        hasToken: Boolean(this.token),
      });
      this.lastConfigState = `${gatewayApiUrl}|${fileStorageApiUrl}`;
    }
  }

  /**
   * Manual debug function to test Gateway API connection
   * Call this from browser console to debug API issues
   */
  async debugTestConnection(): Promise<void> {
    debugLogger.info('Testing Gateway API connection');
    debugLogger.info('Vector service status snapshot', {
      baseUrl: this.baseUrl,
      fileStorageApiUrl: this.fileStorageApiUrl,
      hasToken: Boolean(this.token),
      tokenLength: this.token?.length || 0,
      tokenPreview: this.token ? `${this.token.substring(0, 30)}...` : undefined,
      isAvailable: this.isAvailable()
    });

    // Test basic connectivity
    try {
      debugLogger.debug('Testing basic connectivity to Gateway API');
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      debugLogger.debug('Gateway API health check response', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const result = await response.text();
        debugLogger.info('Gateway API is reachable', { result });
      } else {
        debugLogger.warn('Gateway API health check failed');
      }
    } catch (error) {
      debugLogger.error('Cannot reach Gateway API', { error });
    }

    // Test file storage API connectivity
    try {
      debugLogger.debug('Testing file storage API connectivity');
      const files = await this.getUserFilesFromFileStorage(0, 5);
      debugLogger.info('File storage API files response', {
        count: files.length,
        files: files.slice(0, 3) // Show first 3 files
      });
    } catch (error) {
      debugLogger.error('File storage API test failed', { error });
    }

    // Test embedding endpoint specifically
    try {
      debugLogger.debug('Testing embedding endpoint availability');
      const testResponse = await fetch(`${this.baseUrl}/embedding/available-files?limit=1`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      debugLogger.debug('Embedding endpoint response', {
        status: testResponse.status,
        ok: testResponse.ok,
        statusText: testResponse.statusText
      });

      if (testResponse.ok) {
        const result = await testResponse.json();
        debugLogger.info('Embedding endpoint is available', { result });
      }
    } catch (error) {
      debugLogger.error('Embedding endpoint test failed', { error });
    }
  }

  /**
   * Test embedding a specific file ID that you know exists
   */
  async debugTestEmbedding(fileId: string): Promise<void> {
    debugLogger.info('Testing embedding for file', { fileId });
    
    try {
      const result = await this.embedDocument(fileId, true);
      debugLogger.info('Embedding test result', result);
    } catch (error) {
      debugLogger.error('Embedding test failed', { error });
    }
  }
}

// Export singleton instance
export const vectorDatabaseService = new VectorDatabaseService();

// Expose to global scope for debugging in development
if (typeof window !== 'undefined') {
  const globalWindow = window as Window & { vectorDatabaseService?: VectorDatabaseService };
  globalWindow.vectorDatabaseService = vectorDatabaseService;
  debugLogger.info('Vector database service exposed globally for debugging');
}

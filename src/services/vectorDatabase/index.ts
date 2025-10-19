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

// Bandit Engine Watermark: BL-WM-F283-ED009B
const __banditFingerprint_vectorDatabase_indexts = 'BL-FP-39DD3F-AF64';
const __auditTrail_vectorDatabase_indexts = 'BL-AU-MGOIKVW0-QDMG';
// File: index.ts | Path: src/services/vectorDatabase/index.ts | Hash: f283af64

// Vector Database Service Exports
export { 
  vectorDatabaseService,
  type VectorMemory,
  type VectorDocument,
  type SearchResult,
  type FileUploadResult,
  type VectorMemoryMetadata,
  type MemorySearchFilters,
  type CreateMemoryOptions,
  type UploadRequest,
  VectorDatabaseService
} from './vectorDatabaseService';

export {
  vectorMigrationService,
  type MigrationStatus,
  type MigrationProgress,
  VectorMigrationService
} from './vectorMigrationService';

// Hooks
export { useVectorStore } from '../../hooks/useVectorStore';
export type { VectorStoreStatus, SearchOptions } from '../../hooks/useVectorStore';

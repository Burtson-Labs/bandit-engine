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

// Bandit Engine Watermark: BL-WM-EC0B-B7D363
const __banditFingerprint_examples_VectorDatabaseExampletsx = 'BL-FP-CF06E0-CBCE';
const __auditTrail_examples_VectorDatabaseExampletsx = 'BL-AU-MGOIKVVC-7USO';
// File: VectorDatabaseExample.tsx | Path: src/examples/VectorDatabaseExample.tsx | Hash: ec0bcbce

// Vector Database Integration Example

import React, { useState, useEffect } from 'react';
import { useVectorStore } from '../hooks/useVectorStore';
import { debugLogger } from '../services/logging/debugLogger';

type MemorySearchHit = {
  content?: string;
  score?: number;
  [key: string]: unknown;
};

type DocumentSearchHit = {
  filename?: string;
  content?: string;
  score?: number;
  [key: string]: unknown;
};

interface CombinedSearchResult {
  memories: MemorySearchHit[];
  documents: DocumentSearchHit[];
  success: boolean;
  message?: string;
}

interface MigrationEstimate {
  estimatedTime?: number;
  memoryCount?: number;
  documentCount?: number;
  estimatedDataSize?: number;
  [key: string]: unknown;
}

/**
 * Example component showing how to use the Vector Database features
 * 
 * This component demonstrates:
 * - Checking if vector features are enabled
 * - Performing migration from IndexedDB to vector database
 * - Adding memories to vector storage
 * - Searching memories and documents
 * - Uploading documents for semantic search
 */
export const VectorDatabaseExample: React.FC = () => {
  const {
    status,
    isVectorEnabled,
    performMigration,
    getMigrationEstimate,
    addMemory,
    searchMemories,
    searchDocuments,
    uploadDocument,
    searchAll
  } = useVectorStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CombinedSearchResult | null>(null);
  const [migrationEstimate, setMigrationEstimate] = useState<MigrationEstimate | null>(null);

  const normalizeSearchResults = (result: { memories: unknown[]; documents: unknown[]; success: boolean; message?: string }): CombinedSearchResult => {
    const mapMemory = (memory: unknown): MemorySearchHit => {
      if (memory && typeof memory === 'object') {
        const record = memory as Record<string, unknown>;
        return {
          ...record,
          content: typeof record.content === 'string' ? record.content : undefined,
          score: typeof record.score === 'number' ? record.score : undefined,
        } as MemorySearchHit;
      }
      return {};
    };

    const mapDocument = (doc: unknown): DocumentSearchHit => {
      if (doc && typeof doc === 'object') {
        const record = doc as Record<string, unknown>;
        return {
          ...record,
          filename: typeof record.filename === 'string' ? record.filename : undefined,
          content: typeof record.content === 'string' ? record.content : undefined,
          score: typeof record.score === 'number' ? record.score : undefined,
        } as DocumentSearchHit;
      }
      return {};
    };

    return {
      success: Boolean(result.success),
      message: result.message,
      memories: Array.isArray(result.memories) ? result.memories.map(mapMemory) : [],
      documents: Array.isArray(result.documents) ? result.documents.map(mapDocument) : [],
    };
  };

  // Get migration estimate on mount
  useEffect(() => {
    if (status.migrationRequired) {
      getMigrationEstimate().then((estimate) => {
        if (estimate && typeof estimate === 'object') {
          const typed = estimate as Partial<MigrationEstimate>;
          setMigrationEstimate({
            estimatedTime: typeof typed.estimatedTime === 'number' ? typed.estimatedTime : undefined,
            memoryCount: typeof typed.memoryCount === 'number' ? typed.memoryCount : undefined,
            documentCount: typeof typed.documentCount === 'number' ? typed.documentCount : undefined,
            estimatedDataSize: typeof typed.estimatedDataSize === 'number' ? typed.estimatedDataSize : undefined,
          });
        } else {
          setMigrationEstimate(null);
        }
      });
    }
  }, [status.migrationRequired, getMigrationEstimate]);

  const handleMigration = async () => {
    try {
      const result = await performMigration({ cleanupAfterMigration: false });
      debugLogger.info('Vector migration completed', { result });
    } catch (error) {
      debugLogger.error('Vector migration failed', { error });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const results = await searchAll(searchQuery, {
        memoryLimit: 10,
        documentLimit: 20,
        scoreThreshold: 0.6
      });
      setSearchResults(normalizeSearchResults(results));
    } catch (error) {
      debugLogger.error('Vector search failed', { error });
    }
  };

  const handleAddMemory = async () => {
    try {
      const result = await addMemory(
        'This is a test memory for vector database',
        ['test', 'example'],
        'user'
      );
      debugLogger.info('Vector memory added from example', { result });
    } catch (error) {
      debugLogger.error('Failed to add vector memory from example', { error });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadDocument(file, true);
      debugLogger.info('Vector document uploaded from example', { result });
    } catch (error) {
      debugLogger.error('Vector document upload failed in example', { error });
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Vector Database Integration Demo</h2>
      
      {/* Status Display */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Status</h3>
        <p><strong>Enabled:</strong> {isVectorEnabled ? 'Yes' : 'No'}</p>
        <p><strong>Available:</strong> {status.isAvailable ? 'Yes' : 'No'}</p>
        <p><strong>Migration Required:</strong> {status.migrationRequired ? 'Yes' : 'No'}</p>
        <p><strong>Migrating:</strong> {status.isMigrating ? 'Yes' : 'No'}</p>
        {status.lastError && <p style={{ color: 'red' }}><strong>Error:</strong> {status.lastError}</p>}
      </div>

      {/* Migration Section */}
      {status.migrationRequired && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
          <h3>Migration Required</h3>
          {migrationEstimate && (
            <div>
              <p>Estimated migration time: {migrationEstimate.estimatedTime ?? 'Unknown'} minutes</p>
              <p>Memories to migrate: {migrationEstimate.memoryCount ?? 'Unknown'}</p>
              <p>Documents to migrate: {migrationEstimate.documentCount ?? 'Unknown'}</p>
              <p>Data size: {migrationEstimate.estimatedDataSize ?? 'Unknown'} MB</p>
            </div>
          )}
          <button 
            onClick={handleMigration}
            disabled={status.isMigrating}
            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            {status.isMigrating ? 'Migrating...' : 'Start Migration'}
          </button>
          
          {status.migrationProgress && (
            <div style={{ marginTop: '10px' }}>
              <p>Phase: {status.migrationProgress.phase}</p>
              <p>Progress: {status.migrationProgress.current}/{status.migrationProgress.total}</p>
              {status.migrationProgress.currentItem && <p>Current: {status.migrationProgress.currentItem}</p>}
            </div>
          )}
        </div>
      )}

      {/* Memory Operations */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '5px' }}>
        <h3>Memory Operations</h3>
        <button 
          onClick={handleAddMemory}
          disabled={!isVectorEnabled}
          style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Add Test Memory
        </button>
      </div>

      {/* Document Upload */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#cce5ff', borderRadius: '5px' }}>
        <h3>Document Upload</h3>
        <input 
          type="file"
          onChange={handleFileUpload}
          disabled={!isVectorEnabled}
          accept=".txt,.pdf,.doc,.docx,.md"
        />
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h3>Semantic Search</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter search query..."
            style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
          />
          <button
            onClick={handleSearch}
            style={{ padding: '10px 20px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Search
          </button>
        </div>

        {searchResults && (
          <div style={{ marginTop: '20px' }}>
            <h4>Search Results</h4>
            <p><strong>Success:</strong> {searchResults.success ? 'Yes' : 'No'}</p>
            {searchResults.message && <p><strong>Message:</strong> {searchResults.message}</p>}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
              <div>
                <h5>Memories ({searchResults.memories.length})</h5>
                {searchResults.memories.map((memory, index) => (
                  <div key={index} style={{ padding: '10px', backgroundColor: '#e9ecef', borderRadius: '5px', marginBottom: '5px' }}>
                    <p><strong>Content:</strong> {memory.content?.slice(0, 100)}...</p>
                    {typeof memory.score === 'number' && <p><strong>Score:</strong> {memory.score.toFixed(3)}</p>}
                  </div>
                ))}
              </div>
              
              <div>
                <h5>Documents ({searchResults.documents.length})</h5>
                {searchResults.documents.map((doc, index) => (
                  <div key={index} style={{ padding: '10px', backgroundColor: '#e9ecef', borderRadius: '5px', marginBottom: '5px' }}>
                    <p><strong>Filename:</strong> {doc.filename}</p>
                    <p><strong>Content:</strong> {doc.content?.slice(0, 100)}...</p>
                    {typeof doc.score === 'number' && <p><strong>Score:</strong> {doc.score.toFixed(3)}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature Notes */}
      <div style={{ marginTop: '30px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
        <h3>Feature Notes</h3>
        <ul>
          <li>Vector database features require admin access, pro subscription, or team subscription and advanced memories enabled in preferences</li>
          <li>Environment variables VITE_VECTOR_API_URL and VITE_FILE_STORAGE_API_URL must be configured</li>
          <li>Migration will move data from IndexedDB to vector database when first enabled</li>
          <li>Fallback to IndexedDB if vector database is unavailable</li>
          <li>Search uses semantic similarity with configurable score thresholds</li>
        </ul>
      </div>
    </div>
  );
};

export default VectorDatabaseExample;

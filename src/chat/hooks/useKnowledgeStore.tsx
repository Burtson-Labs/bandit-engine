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

// Bandit Engine Watermark: BL-WM-85A0-F6B027
const __banditFingerprint_hooks_useKnowledgeStoretsx = 'BL-FP-418893-DFF3';
const __auditTrail_hooks_useKnowledgeStoretsx = 'BL-AU-MGOIKVV2-OGXL';
// File: useKnowledgeStore.tsx | Path: src/chat/hooks/useKnowledgeStore.tsx | Hash: 85a0dff3

import { useState, useCallback, useMemo } from "react";
import { useKnowledgeStore as useZustandKnowledgeStore, KnowledgeDoc } from "../../store/knowledgeStore";
import indexedDBService from "../../services/indexedDB/indexedDBService";
import { v4 as uuidv4 } from "uuid";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import type { TextItem, TextMarkedContent } from "pdfjs-dist/types/src/display/api";
import { embeddingService } from "../../services/embedding/embeddingService";
import { debugLogger } from "../../services/logging/debugLogger";
import { vectorDatabaseService } from "../../services/vectorDatabase/vectorDatabaseService";
import { useVectorStore } from "../../hooks/useVectorStore";

// Re-export for backward compatibility
export type { KnowledgeDoc };

/**
 * Knowledge Store Hook - Dual Storage Pattern
 * 
 * This hook supports two different storage patterns based on user subscription and preferences:
 * 
 * 1. **Local Storage (Basic Users)**:
 *    - Users without vector DB access (lower tier subscriptions)
 *    - Files are parsed locally and content + embeddings stored in IndexedDB
 *    - Uses fake embedding service for similarity search
 *    - Supports text files, DOCX, and limited PDF text extraction
 * 
 * 2. **Vector Database + S3 (Advanced Users)**:
 *    - Users with enhanced search features enabled
 *    - Files uploaded to S3, embeddings generated server-side
 *    - Only metadata stored in IndexedDB (lightweight references)
 *    - Full PDF preview and advanced semantic search capabilities
 * 
 * The storage method is automatically determined by `isVectorEnabled` from useVectorStore.
 */

// PDF worker will be configured when package settings are available
// pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.js";

const DB_NAME = "banditKnowledge";
const STORE_NAME = "documents";
const MAX_FILES = 20;

type KnowledgeDocWithVectorMetadata = KnowledgeDoc & { _vectorResult?: unknown };

const hasVectorMetadata = (doc: KnowledgeDoc): doc is KnowledgeDocWithVectorMetadata =>
  typeof doc === "object" && doc !== null && "_vectorResult" in doc;

const isTextItem = (item: TextItem | TextMarkedContent): item is TextItem =>
  typeof item === "object" && item !== null && "str" in item;

export const useKnowledgeStore = () => {
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);

  const vectorStore = useVectorStore();
  const { isVectorEnabled, uploadDocument } = vectorStore;

  const storeConfigs = useMemo(() => [{ name: STORE_NAME, keyPath: "id" }], []);

  const loadDocuments = useCallback(async () => {
    const docs = await indexedDBService.getAll<KnowledgeDoc>(DB_NAME, 1, STORE_NAME, storeConfigs);
    setDocuments(docs);
    
    // Sync with zustand store - set the docs directly
    useZustandKnowledgeStore.setState({ 
      docs: docs || [], 
      isLoaded: true 
    });
    debugLogger.debug("Synced knowledge docs with store", { count: docs?.length || 0 });
  }, [storeConfigs]);

  const removeDocument = async (id: string) => {
    try {
      // First, try to delete from Gateway API (vector database, S3, and MongoDB)
      // This handles vector documents stored in the cloud
      const gatewayDeleteSuccess = await vectorDatabaseService.deleteDocument(id);
      if (gatewayDeleteSuccess) {
        debugLogger.info("Document deleted from Gateway API", { id });
      } else {
        debugLogger.warn("Failed to delete from Gateway API or document not found", { id });
      }
    } catch (error) {
      debugLogger.error("Error deleting from Gateway API", { id, error });
    }

    try {
      // Always remove from local IndexedDB storage
      await indexedDBService.delete(DB_NAME, 1, STORE_NAME, id, storeConfigs);
      debugLogger.debug("Document removed from IndexedDB", { id });
    } catch (error) {
      debugLogger.error("Failed to remove from IndexedDB", { id, error });
    }

    // Reload documents to refresh the UI
    await loadDocuments();
  };

  const clearAllDocuments = async () => {
    await indexedDBService.clear(DB_NAME, 1, STORE_NAME, storeConfigs);
    await loadDocuments();
  };

  const addDocuments = async (files: File[]) => {
    const allKeys = await indexedDBService.getAllKeys(DB_NAME, 1, STORE_NAME, storeConfigs);
    if (allKeys.length + files.length > MAX_FILES) {
      throw new Error(`Max ${MAX_FILES} documents allowed.`);
    }

    const successfulUploads: KnowledgeDoc[] = [];
    
    for (const file of files) {
      try {
        debugLogger.debug("Processing file", { filename: file.name, type: file.type });
        
        if (isVectorEnabled && uploadDocument) {
          // Advanced users: Use vector database + S3 storage (like Knowledge Tab)
          const result = await uploadDocument(file, true);
          
          if (result.success && result.fileId) {
            const doc: KnowledgeDoc = {
              id: uuidv4(),
              name: file.name,
              originalFileName: file.name,
              s3Url: result.fileId, // Store fileId as s3Url for file access
              addedDate: new Date(),
              content: "", // Content is in vector DB, not stored locally
              embedding: [], // Embedding is in vector DB
              mimeType: file.type,
              size: file.size,
            };
            
            // Save metadata to IndexedDB (lightweight reference)
            await indexedDBService.put(DB_NAME, 1, STORE_NAME, doc, storeConfigs);
            successfulUploads.push(doc);
            
            debugLogger.debug("Document uploaded to vector database", { filename: file.name, fileId: result.fileId });
          } else {
            throw new Error(result.error || 'Vector upload failed');
          }
        } else {
          // Basic users: Use local IndexedDB storage with parsed content and embeddings
          const parseResult = await parseFile(file);
          if (parseResult.trim().length === 0) {
            debugLogger.warn("File has no content", { filename: file.name });
            continue;
          }
          
          debugLogger.debug("File content parsed", { filename: file.name, contentLength: parseResult.length });
          
          // Store raw file data as base64 for consistent download behavior
          const arrayBuffer = await file.arrayBuffer();
          // Use chunked approach to avoid "Maximum call stack size exceeded" for large files
          const uint8Array = new Uint8Array(arrayBuffer);
          let binaryString = '';
          const chunkSize = 8192; // Process 8KB chunks to avoid stack overflow
          
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize);
            binaryString += String.fromCharCode.apply(null, Array.from(chunk));
          }
          
          const base64Data = btoa(binaryString);
          debugLogger.debug("Raw file data encoded", { filename: file.name, rawDataLength: base64Data.length });
          
          const embedding = await embeddingService.generate(parseResult);
          debugLogger.debug("Embedding generated", { filename: file.name, embeddingLength: embedding?.length });
          
          const doc: KnowledgeDoc = {
            id: uuidv4(),
            name: file.name,
            content: parseResult,
            rawData: base64Data, // Store original file data
            originalFileName: file.name,
            embedding,
            addedDate: new Date(),
            mimeType: file.type,
            size: file.size,
          };
          
          await indexedDBService.put(DB_NAME, 1, STORE_NAME, doc, storeConfigs);
          successfulUploads.push(doc);
          
          debugLogger.debug("Document saved to IndexedDB", { filename: file.name, id: doc.id });
        }
        
      } catch (error) {
        debugLogger.error("Failed to process file", { filename: file.name, error });
        throw new Error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    if (successfulUploads.length === 0) {
      throw new Error("No files were successfully processed");
    }
    
    // Reload documents and sync with zustand store
    await loadDocuments();
    
    debugLogger.info("Documents added successfully", { 
      count: successfulUploads.length,
      filenames: successfulUploads.map(d => d.name),
      storageMethod: isVectorEnabled ? 'vector-db' : 'indexed-db'
    });
  };

  // Helper function to determine if a document is stored in vector DB
  const isVectorDocument = (doc: KnowledgeDoc): boolean => {
    if (!doc) return false;

    const hasExplicitVectorMarker = Boolean(
      (doc.s3Url && String(doc.s3Url).trim().length > 0) ||
        (hasVectorMetadata(doc) && doc._vectorResult)
    );

    if (hasExplicitVectorMarker) {
      return true;
    }

    const looksLikeMongoId = typeof doc.id === "string" && /^[0-9a-f]{24}$/i.test(doc.id);
    const lacksInlineContent = !doc.content || doc.content.length === 0;

    return looksLikeMongoId && lacksInlineContent;
  };

  const parseFile = async (file: File): Promise<string> => {
    const name = file.name.toLowerCase();

    try {
      debugLogger.debug("Parsing file", { filename: file.name, type: file.type, size: file.size });
      
      if (
        file.type.startsWith("text/") ||
        name.endsWith(".txt") ||
        name.endsWith(".md") ||
        name.endsWith(".json") ||
        name.endsWith(".cs") ||
        name.endsWith(".js") ||
        name.endsWith(".ts") ||
        name.endsWith(".tsx") ||
        name.endsWith(".jsx") ||
        name.endsWith(".py") ||
        name.endsWith(".java") ||
        name.endsWith(".cpp") ||
        name.endsWith(".c") ||
        name.endsWith(".html") ||
        name.endsWith(".css") ||
        name.endsWith(".php") ||
        name.endsWith(".rb") ||
        name.endsWith(".go") ||
        name.endsWith(".rs") ||
        name.endsWith(".kt") ||
        name.endsWith(".swift") ||
        name.endsWith(".scala") ||
        name.endsWith(".sh") ||
        name.endsWith(".bat") ||
        name.endsWith(".ps1") ||
        name.endsWith(".xml") ||
        name.endsWith(".yaml") ||
        name.endsWith(".yml") ||
        name.endsWith(".csv")
      ) {
        const content = await file.text();
        debugLogger.debug("Text file parsed", { filename: file.name, contentLength: content.length });
        return content;
      }

      if (name.endsWith(".docx")) {
        debugLogger.debug("Parsing DOCX file", { filename: file.name });
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        debugLogger.debug("DOCX file parsed", { filename: file.name, contentLength: value.length });
        return value;
      }

      if (name.endsWith(".pdf")) {
        debugLogger.debug("Parsing PDF file", { filename: file.name });
        // Use Burtson CDN PDF worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.burtson.ai/scripts/pdf.worker.js';
        
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

        const pages = await Promise.all(
          Array.from({ length: Math.min(10, pdf.numPages) }, async (_, i) => {
            const page = await pdf.getPage(i + 1);
            const content = await page.getTextContent();
            const items = content.items as Array<TextItem | TextMarkedContent>;
            return items
              .map((item) => (isTextItem(item) ? item.str : ""))
              .join(" ");
          })
        );
        const result = pages.join("\n\n");
        
        debugLogger.debug("PDF file parsed", { filename: file.name, contentLength: result.length, pageCount: pdf.numPages });
        return result;
      }
      
      debugLogger.warn("Unsupported file type", { filename: file.name, type: file.type });
      throw new Error(`Unsupported file type: ${file.type}`);
      
    } catch (err) {
      debugLogger.error("Failed to parse file", { filename: file.name, error: err });
      throw err;
    }
  };

  const searchDocuments = async (query: string): Promise<KnowledgeDoc[]> => {
    if (!query.trim()) return [];

    const queryEmbedding = await embeddingService.generate(query);
    const scored: { doc: KnowledgeDoc; score: number }[] = [];

    for (const doc of documents) {
      if (doc.embedding) {
        const score = embeddingService.cosineSimilarity(queryEmbedding, doc.embedding);
        scored.push({ doc, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const topMatches = scored.filter((entry) => entry.score >= 0.6).map((entry) => entry.doc);

    return topMatches;
  };

  return {
    documents,
    addDocuments,
    removeDocument,
    clearAllDocuments,
    loadDocuments,
    searchDocuments,
    isVectorDocument,
  };
};

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

// Bandit Engine Watermark: BL-WM-05A8-49CD8F
const __banditFingerprint_store_knowledgeStorets = 'BL-FP-602E09-4421';
const __auditTrail_store_knowledgeStorets = 'BL-AU-MGOIKVW4-CU0K';
// File: knowledgeStore.ts | Path: src/store/knowledgeStore.ts | Hash: 05a84421

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import indexedDBService from "../services/indexedDB/indexedDBService";
import { debugLogger } from "../services/logging/debugLogger";

export interface KnowledgeDoc {
  id: string;
  name: string;
  content: string;
  embedding?: number[];
  rawData?: string;
  type?: string;
  addedDate?: Date;
  size?: number;
  uploadedBy?: string;
  userEmail?: string;
  bucket?: string;
  key?: string; 

  isUserContent?: boolean;
  isTeamContent?: boolean;
  contentSource?: 'user' | 'team';
  teamSid?: string;

  mimeType?: string;
  originalFileName?: string;
  s3Url?: string;
}

interface KnowledgeStore {
  docs: KnowledgeDoc[];
  isLoaded: boolean;
  addDoc: (doc: Omit<KnowledgeDoc, "id">) => void;
  removeDoc: (id: string) => void;
  clearDocs: () => void;
  loadDocs: () => Promise<void>;
  saveDocs: () => Promise<void>;
}

export const useKnowledgeStore = create<KnowledgeStore>((set, get) => ({
  docs: [],
  isLoaded: false,
  
  addDoc: (doc) => {
    const current = get().docs;
    if (current.length >= 20) {
      debugLogger.warn("⚠️ Maximum of 20 knowledge docs reached.");
      return;
    }

    const newDoc: KnowledgeDoc = {
      id: uuidv4(),
      name: doc.name,
      content: doc.content,
      embedding: doc.embedding,
      rawData: doc.rawData,
      mimeType: doc.mimeType,
      originalFileName: doc.originalFileName,
      s3Url: doc.s3Url,
      type: doc.type,
      addedDate: doc.addedDate,
      size: doc.size,
      uploadedBy: doc.uploadedBy,
      userEmail: doc.userEmail,
      bucket: doc.bucket,
      key: doc.key,
      isUserContent: doc.isUserContent,
      isTeamContent: doc.isTeamContent,
      contentSource: doc.contentSource,
    };

    set({ docs: [...current, newDoc] });
    
    // Save individual doc to IndexedDB
    (async () => {
      try {
        const storeConfigs = [{ name: "documents", keyPath: "id" }];
        await indexedDBService.put("banditKnowledge", 1, "documents", newDoc, storeConfigs);
        debugLogger.debug("Knowledge doc added to IndexedDB", { id: newDoc.id, name: newDoc.name });
      } catch (error) {
        debugLogger.error("Failed to save new knowledge doc to IndexedDB", { error });
      }
    })();
  },
  
  removeDoc: (id) => {
    set((state) => ({
      docs: state.docs.filter((d) => d.id !== id),
    }));
    
    // Remove from IndexedDB
    (async () => {
      try {
        const storeConfigs = [{ name: "documents", keyPath: "id" }];
        await indexedDBService.delete("banditKnowledge", 1, "documents", id, storeConfigs);
        debugLogger.debug("Knowledge doc removed from IndexedDB", { id });
      } catch (error) {
        debugLogger.error("Failed to remove knowledge doc from IndexedDB", { error });
      }
    })();
  },
  
  clearDocs: () => {
    set({ docs: [] });
    
    // Clear IndexedDB
    (async () => {
      try {
        const storeConfigs = [{ name: "documents", keyPath: "id" }];
        await indexedDBService.clear("banditKnowledge", 1, "documents", storeConfigs);
        debugLogger.debug("All knowledge docs cleared from IndexedDB");
      } catch (error) {
        debugLogger.error("Failed to clear knowledge docs from IndexedDB", { error });
      }
    })();
  },
  
  loadDocs: async () => {
    try {
      const storeConfigs = [{ name: "documents", keyPath: "id" }];
      const docs = await indexedDBService.getAll<KnowledgeDoc>("banditKnowledge", 1, "documents", storeConfigs);
      
      set({ 
        docs: docs || [],
        isLoaded: true 
      });
      debugLogger.info("Knowledge docs loaded from IndexedDB", { count: docs?.length || 0 });
    } catch (error) {
      debugLogger.error("Failed to load knowledge docs from IndexedDB", { error });
      set({ isLoaded: true }); // Mark as loaded even if failed, so UI can render
    }
  },
  
  saveDocs: async () => {
    try {
      const { docs } = get();
      const storeConfigs = [{ name: "documents", keyPath: "id" }];
      
      // Clear existing docs and save new ones individually
      await indexedDBService.clear("banditKnowledge", 1, "documents", storeConfigs);
      
      for (const doc of docs) {
        await indexedDBService.put("banditKnowledge", 1, "documents", doc, storeConfigs);
      }
      
      debugLogger.debug("Knowledge docs saved to IndexedDB", { count: docs.length });
    } catch (error) {
      debugLogger.error("Failed to save knowledge docs to IndexedDB", { error });
    }
  },
}));
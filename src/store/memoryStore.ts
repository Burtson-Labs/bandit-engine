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

// Bandit Engine Watermark: BL-WM-8FA7-51595A
const __banditFingerprint_store_memoryStorets = 'BL-FP-C3FA6C-E06F';
const __auditTrail_store_memoryStorets = 'BL-AU-MGOIKVW4-KK1J';
// File: memoryStore.ts | Path: src/store/memoryStore.ts | Hash: 8fa7e06f

import { create } from "zustand";
import indexedDBService from "../services/indexedDB/indexedDBService";

export interface MemoryEntry {
  id: string;
  content: string;
  tags?: string[];
  timestamp: number;
  source: "auto" | "user";
  embedding?: number[];
  pinned?: boolean;
}

interface MemoryStore {
  entries: MemoryEntry[];
  _hasHydrated: boolean;
  addMemory: (
    content: string,
    tags?: string[],
    source?: "auto" | "user",
    embedding?: number[],
    pinned?: boolean
  ) => Promise<void>;
  searchMemory: (query: string) => MemoryEntry[];
  findRelevantMemories: (query: string, limit?: number) => MemoryEntry[];
  togglePinMemory: (id: string) => Promise<void>;
  hydrate: () => Promise<void>;
  removeMemory: (id: string) => Promise<void>;
  clearMemories: () => Promise<void>;
}

const DB_NAME = "bandit-memory-db";
const STORE_NAME = "bandit-memory";
const storeConfigs = [{ name: STORE_NAME, keyPath: "id" }];

// Helper: Normalize text for basic matching
const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const useMemoryStore = create<MemoryStore>((set, get) => ({
  entries: [],
  _hasHydrated: false,

  hydrate: async () => {
    const allEntries = await indexedDBService.getAll<MemoryEntry>(DB_NAME, 1, STORE_NAME, storeConfigs);
    set({ 
      entries: allEntries,
      _hasHydrated: true 
    });
  },

  addMemory: async (
    content,
    tags = [],
    source = "user",
    embedding,
    pinned = false
  ) => {
    const newEntry: MemoryEntry = {
      id: crypto.randomUUID(),
      content,
      tags,
      timestamp: Date.now(),
      source,
      embedding,
      pinned,
    };
    await indexedDBService.put(DB_NAME, 1, STORE_NAME, newEntry, storeConfigs);
    set((state) => ({
      entries: [...state.entries, newEntry],
    }));
  },

  removeMemory: async (id: string) => {
    await indexedDBService.delete(DB_NAME, 1, STORE_NAME, id, storeConfigs);
    set((state) => ({
      entries: state.entries.filter((entry) => entry.id !== id),
    }));
  },

  clearMemories: async () => {
    await indexedDBService.clear(DB_NAME, 1, STORE_NAME, storeConfigs);
    set({ 
      entries: [],
      _hasHydrated: true // Keep hydrated flag true after clearing
    });
  },

  searchMemory: (query) => {
    const lc = query.toLowerCase();
    return get().entries.filter((entry) => entry.content.toLowerCase().includes(lc));
  },

  findRelevantMemories: (query, limit = 3) => {
    const normQuery = normalize(query);
    const queryWords = normQuery.split(" ");

    const scored = get().entries.map((entry) => {
      const normContent = normalize(entry.content);
      const matchCount = queryWords.filter((word) =>
        normContent.includes(word)
      ).length;
      return { entry, score: matchCount };
    });

    return scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.entry);
  },

  togglePinMemory: async (id: string) => {
    set((state) => {
      const updatedEntries = state.entries.map((entry) =>
        entry.id === id ? { ...entry, pinned: !entry.pinned } : entry
      );
      (async () => {
        const updatedEntry = updatedEntries.find((entry) => entry.id === id);
        if (updatedEntry) {
          await indexedDBService.put(DB_NAME, 1, STORE_NAME, updatedEntry, storeConfigs);
        }
      })();
      return { entries: updatedEntries };
    });
  },
}));

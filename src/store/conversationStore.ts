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

// Bandit Engine Watermark: BL-WM-DBCC-69A917
const __banditFingerprint_store_conversationStorets = 'BL-FP-4510C8-8D68';
const __auditTrail_store_conversationStorets = 'BL-AU-MGOIKVW3-GEGF';
// File: conversationStore.ts | Path: src/store/conversationStore.ts | Hash: dbcc8d68

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { HistoryEntry, useAIQueryStore } from "./aiQueryStore";
import { useModelStore } from "./modelStore";
import indexedDBService from "../services/indexedDB/indexedDBService";
import { KnowledgeDoc } from "./knowledgeStore";
import { runConversationMigrations } from "../util/conversationMigration";
import { debugLogger } from "../services/logging/debugLogger";
import { CONVERSATION_DELETE_EVENT, CONVERSATION_UPSERT_EVENT } from "./conversationSyncEvents";

export interface Conversation {
  id: string;
  name: string;
  model: string;
  history: HistoryEntry[];
  projectId?: string; // Optional for backward compatibility
  createdAt?: Date;
  updatedAt?: Date;
  version?: number;
  summary?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  updatedBy?: string;
  deletedAt?: string | null;
  summaryStatus?: string;
  summaryGeneratedAt?: Date;
}

interface ConversationStore {
  conversations: Conversation[];
  currentId: string | null;
  _hasHydrated: boolean;
  createConversation: (firstMessage: string, projectId?: string) => void;
  createNewConversation: (projectId?: string) => void;
  deleteConversation: (id: string) => void;
  switchConversation: (id: string) => void;
  addToCurrent: (entry: HistoryEntry) => void;
  replaceLastAnswer: (answer: string, images?: string[], memoryUpdated?: boolean, sourceFiles?: KnowledgeDoc[], cancelled?: boolean) => void;
  setCurrent: (id: string) => void;
  renameConversation: (id: string, newName: string) => void;
  clearAllConversations: () => Promise<void>;
  moveConversationToProject: (conversationId: string, projectId: string | null) => void;
  getConversationsByProject: (projectId: string | null) => Conversation[];
  hydrate: () => Promise<void>;
  applyRemoteConversations: (conversations: Conversation[]) => Promise<void>;
  removeConversationsByIds: (ids: string[]) => Promise<void>;
}

const DB_NAME = "bandit-conversations";
const STORE_NAME = "conversations";
const DB_VERSION = 1;
const storeConfigs = [{ name: STORE_NAME, keyPath: "id" }];

export const EMOJI_REGEX = /\p{Extended_Pictographic}/gu;
export const VARIATION_SELECTORS_REGEX = /[\uFE0F\uFE0E]/g;
export const ZERO_WIDTH_JOINER_REGEX = /\u200D/g;

export function sanitizeConversationName(input: string | undefined | null, maxLength = 60): string {
  if (!input) return "Untitled Conversation";

  const withoutEmoji = input
    .replace(EMOJI_REGEX, "")
    .replace(VARIATION_SELECTORS_REGEX, "")
    .replace(ZERO_WIDTH_JOINER_REGEX, "");

  const normalized = withoutEmoji.normalize("NFC").trim().replace(/\s+/g, " ");

  if (!normalized) {
    return "Untitled Conversation";
  }

  const limited = Array.from(normalized).slice(0, maxLength).join("");
  return limited || "Untitled Conversation";
}

async function loadConversations(): Promise<Conversation[]> {
  const raw = await indexedDBService.getAll<Conversation>(DB_NAME, DB_VERSION, STORE_NAME, storeConfigs);
  return (raw || []).map(normalizeConversation);
}

async function saveConversation(conversation: Conversation) {
  await indexedDBService.put(DB_NAME, DB_VERSION, STORE_NAME, conversation, storeConfigs);
}

async function deleteConversationFromDB(id: string) {
  await indexedDBService.delete(DB_NAME, DB_VERSION, STORE_NAME, id, storeConfigs);
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  conversations: [],
  currentId: null,
  _hasHydrated: false,

  hydrate: async () => {
    try {
      // Run migrations first to ensure backward compatibility
      await runConversationMigrations();
      
      const conversations = await loadConversations();
      set({ conversations, _hasHydrated: true });
    } catch (error) {
      console.error("Failed to hydrate conversations:", error);
      set({ conversations: [], _hasHydrated: true });
    }
  },

  createConversation: (firstMessage: string, projectId?: string) => {
    const id = uuidv4();
    const { selectedModel } = useModelStore.getState();
    const sanitizedFirstMessage = sanitizeConversationName(firstMessage, 60);
    const name = sanitizedFirstMessage;
    const now = new Date();
    const newConv = normalizeConversation({ 
      id, 
      name, 
      history: [], 
      model: selectedModel,
      projectId,
      createdAt: now,
      updatedAt: now,
      version: 0,
    });
    set((state) => {
      const updatedConversations = [...state.conversations, newConv];
      saveConversation(newConv);
      emitConversationUpsert(id);
      return {
        conversations: updatedConversations,
        currentId: id,
      };
    });
  },

  createNewConversation: (projectId?: string) => {
    const { selectedModel } = useModelStore.getState();
    const id = uuidv4();
    const now = new Date();
    const newConv = normalizeConversation({
      id,
      name: "New Conversation",
      history: [],
      model: selectedModel,
      projectId,
      createdAt: now,
      updatedAt: now,
      version: 0,
    });
    set((state) => {
      const updatedConversations = [...state.conversations, newConv];
      saveConversation(newConv);
      emitConversationUpsert(id);
      return {
        conversations: updatedConversations,
        currentId: id,
      };
    });
  },

  deleteConversation: (id: string) => {
    const runHydrate = async () => {
      try {
        await get().hydrate();
      } catch (error) {
        debugLogger.warn("conversationStore: rehydrate after delete failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    set((state) => {
      const filtered = state.conversations.filter((c) => c.id !== id);
      const isDeletingCurrent = state.currentId === id;

      if (isDeletingCurrent) {
        useAIQueryStore.getState().reset();
      }

      deleteConversationFromDB(id)
        .then(runHydrate)
        .catch((error) => {
          debugLogger.error("Failed to delete conversation from DB", {
            error,
            conversationId: id,
          });
        });
      emitConversationDelete(id);

      return {
        conversations: filtered,
        currentId: isDeletingCurrent ? null : state.currentId,
      };
    });
  },

  switchConversation: (id: string) => {
    const { conversations } = get();
    const { setSelectedModel } = useModelStore.getState();
    const selectedModel = conversations.find((c) => c.id === id)?.model;
    selectedModel && setSelectedModel(selectedModel);
    set({ currentId: id });
  },

  addToCurrent: (entry: HistoryEntry) => {
    const { currentId, conversations } = get();
    if (!currentId) return;
    set(() => {
      const updatedConversations = conversations.map((c) =>
        c.id === currentId ? normalizeConversation({ ...c, history: [...c.history, entry], updatedAt: new Date() }) : c
      );
      const updatedConv = updatedConversations.find((c) => c.id === currentId);
      if (updatedConv) {
        saveConversation(updatedConv);
        emitConversationUpsert(updatedConv.id);
      }
      return { conversations: updatedConversations };
    });
  },

  renameConversation: (id: string, newName: string) => {
    set((state) => {
      const sanitized = sanitizeConversationName(newName);
      const updatedConversations = state.conversations.map((c) =>
        c.id === id ? normalizeConversation({ ...c, name: sanitized, updatedAt: new Date() }) : c
      );
      const updatedConv = updatedConversations.find((c) => c.id === id);
      if (updatedConv) {
        saveConversation(updatedConv);
        emitConversationUpsert(updatedConv.id);
      }
      return { conversations: updatedConversations };
    });
  },

  replaceLastAnswer: (answer: string, images?: string[], memoryUpdated?: boolean, sourceFiles?: KnowledgeDoc[], cancelled?: boolean) => {
    const { currentId, conversations } = get();
    if (!currentId) return;
    set(() => {
      const updatedConversations = conversations.map((c) => {
        if (c.id === currentId && c.history.length > 0) {
          const updatedHistory = [...c.history];
          updatedHistory[updatedHistory.length - 1] = {
            ...updatedHistory[updatedHistory.length - 1],
            answer,
            memoryUpdated,
            images: images ?? updatedHistory[updatedHistory.length - 1].images,
            sourceFiles: sourceFiles ?? updatedHistory[updatedHistory.length - 1].sourceFiles,
            cancelled: cancelled ?? updatedHistory[updatedHistory.length - 1].cancelled,
          };
          return normalizeConversation({ ...c, history: updatedHistory, updatedAt: new Date() });
        }
        return c;
      });
      const updatedConv = updatedConversations.find((c) => c.id === currentId);
      if (updatedConv) {
        saveConversation(updatedConv);
        emitConversationUpsert(updatedConv.id);
      }
      return { conversations: updatedConversations };
    });
  },

  setCurrent: (id: string) => set({ currentId: id }),

  moveConversationToProject: (conversationId: string, projectId: string | null) => {
    set((state) => {
      const updatedConversations = state.conversations.map((c) =>
        c.id === conversationId 
          ? normalizeConversation({ ...c, projectId: projectId || undefined, updatedAt: new Date() }) 
          : c
      );
      const updatedConv = updatedConversations.find((c) => c.id === conversationId);
      if (updatedConv) {
        saveConversation(updatedConv);
      }
      return { conversations: updatedConversations };
    });
  },

  clearAllConversations: async () => {
    try {
      // Clear all conversations from IndexedDB
      await indexedDBService.clear(DB_NAME, DB_VERSION, STORE_NAME, storeConfigs);
      
      // Reset store state
      set({
        conversations: [],
        currentId: null,
      });
      
      debugLogger.info("All conversations cleared successfully");
    } catch (error) {
      debugLogger.error("Failed to clear all conversations", { error });
      throw error;
    }
  },

  getConversationsByProject: (projectId: string | null) => {
    const { conversations } = get();
    if (projectId === null) {
      // Return conversations without a project (ungrouped)
      return conversations.filter(c => !c.projectId);
    }
    return conversations.filter(c => c.projectId === projectId);
  },

  applyRemoteConversations: async (incoming) => {
    const normalized = incoming.map(normalizeConversation);
    const toPersist: Conversation[] = [];

    set((state) => {
      const next = new Map(state.conversations.map((c) => [c.id, c] as const));

      for (const conversation of normalized) {
        const existing = next.get(conversation.id);

        if (existing) {
          const existingUpdatedAt = existing.updatedAt ? existing.updatedAt.getTime() : 0;
          const incomingUpdatedAt = conversation.updatedAt ? conversation.updatedAt.getTime() : 0;
          const existingHistoryLength = existing.history?.length ?? 0;
          const incomingHistoryLength = conversation.history?.length ?? 0;

          const incomingHasMoreHistory = incomingHistoryLength > existingHistoryLength;
          const incomingIsNewer = incomingUpdatedAt > existingUpdatedAt;

          if (incomingIsNewer && incomingHistoryLength < existingHistoryLength) {
            debugLogger.info("applyRemoteConversations: preserving local history over shorter incoming", {
              conversationId: conversation.id,
              existingHistoryLength,
              incomingHistoryLength,
              existingUpdatedAt,
              incomingUpdatedAt,
            });
            conversation.history = existing.history;
          }

          if (!incomingHasMoreHistory && !incomingIsNewer) {
            debugLogger.info("applyRemoteConversations: skipping stale conversation", {
              conversationId: conversation.id,
              existingHistoryLength,
              incomingHistoryLength,
              existingUpdatedAt,
              incomingUpdatedAt,
            });
            continue;
          }
        }

        next.set(conversation.id, conversation);
        toPersist.push(conversation);
      }

      return { conversations: Array.from(next.values()) };
    });

    if (toPersist.length > 0) {
      try {
        await Promise.all(toPersist.map((conversation) => saveConversation(conversation)));
      } catch (error) {
        debugLogger.error("Failed to persist remote conversations", { error, conversationIds: toPersist.map((c) => c.id) });
      }
    }
  },

  removeConversationsByIds: async (ids) => {
    if (!ids.length) {
      return;
    }

    try {
      await Promise.all(ids.map((id) => deleteConversationFromDB(id)));
    } catch (error) {
      debugLogger.error("Failed to remove conversations from IndexedDB", { error, ids });
    }

    set((state) => {
      const filtered = state.conversations.filter((c) => !ids.includes(c.id));
      const isCurrentDeleted = state.currentId ? ids.includes(state.currentId) : false;
      ids.forEach((id) => emitConversationDelete(id));
      return {
        conversations: filtered,
        currentId: isCurrentDeleted ? null : state.currentId,
      };
    });

    try {
      await get().hydrate();
    } catch (error) {
      debugLogger.warn("conversationStore: hydrate failed after remote delete", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
}));

function normalizeConversation(conversation: Conversation): Conversation {
  const ensureDate = (value?: Date | string | null): Date | undefined => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };

  return {
    ...conversation,
    name: sanitizeConversationName(conversation.name),
    createdAt: ensureDate(conversation.createdAt) ?? new Date(),
    updatedAt: ensureDate(conversation.updatedAt) ?? new Date(),
    summaryGeneratedAt: ensureDate(conversation.summaryGeneratedAt),
    history: Array.isArray(conversation.history)
      ? conversation.history.map((turn) => ({
          ...turn,
        }))
      : [],
  };
}
function emitConversationUpsert(id: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CONVERSATION_UPSERT_EVENT, { detail: id }));
}

function emitConversationDelete(id: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CONVERSATION_DELETE_EVENT, { detail: id }));
}

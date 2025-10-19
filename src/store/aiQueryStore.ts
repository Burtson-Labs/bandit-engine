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

// Bandit Engine Watermark: BL-WM-206C-8462DB
const __banditFingerprint_store_aiQueryStorets = 'BL-FP-38ACD0-3815';
const __auditTrail_store_aiQueryStorets = 'BL-AU-MGOIKVW3-J9DR';
// File: aiQueryStore.ts | Path: src/store/aiQueryStore.ts | Hash: 206c3815

import { create } from "zustand";
import indexedDBService from "../services/indexedDB/indexedDBService";
import { KnowledgeDoc } from "./knowledgeStore";

export type Position = { x: number; y: number };
export type HistoryEntry = {
  id?: string;
  question: string;
  answer: string;
  images?: string[];
  sourceFiles?: KnowledgeDoc[];
  memoryUpdated?: boolean;
  cancelled?: boolean;
};

export type ComponentStatus = "Idle" | "Loading" | "Error";

interface AIQueryState {
  inputValue: string;
  response: string;
  previousQuestion: string;
  position: Position;
  componentStatus: ComponentStatus;
  history: HistoryEntry[];
  apiKey: string;
  hydrated: boolean;

  setInputValue: (value: string) => void;
  setResponse: (response: string) => void;
  setPreviousQuestion: (question: string) => void;
  setPosition: (position: Position) => void;
  setComponentStatus: (status: ComponentStatus) => void;
  addHistory: (entry: HistoryEntry) => void;
  clearHistory: () => void;
  setApiKey: (key: string) => void;
  setHydrated: () => void;
  reset: () => void;
  hydrate: () => Promise<void>;
}

const DB_NAME = "ai-query-db";
const STORE_NAME = "ai-query";
const DB_VERSION = 1;
const STORAGE_KEY = "singleton";

const storeConfigs = [{ name: STORE_NAME }];

async function saveStateToDB(state: Partial<AIQueryState>) {
  await indexedDBService.put(DB_NAME, DB_VERSION, STORE_NAME, state, storeConfigs, STORAGE_KEY);
}

async function loadStateFromDB(): Promise<Partial<AIQueryState> | undefined> {
  return indexedDBService.get(DB_NAME, DB_VERSION, STORE_NAME, STORAGE_KEY, storeConfigs);
}

export const useAIQueryStore = create<AIQueryState>((set, get) => ({
  inputValue: "",
  response: "",
  previousQuestion: "",
  position: { x: window.innerWidth / 2 - 300, y: window.innerHeight - 350 },
  componentStatus: "Idle",
  history: [],
  apiKey: "",
  hydrated: false,

  setInputValue: (value) => {
    set({ inputValue: value });
    saveStateToDB({ inputValue: value });
  },
  setResponse: (response) => {
    set({ response });
    saveStateToDB({ response });
  },
  setPreviousQuestion: (question) => {
    set({ previousQuestion: question });
    saveStateToDB({ previousQuestion: question });
  },
  setPosition: (position) => {
    set({ position });
    saveStateToDB({ position });
  },
  setComponentStatus: (status) => set({ componentStatus: status }),
  addHistory: (entry) => {
    const newHistory = [...get().history, entry];
    set({ history: newHistory });
    saveStateToDB({ history: newHistory });
  },
  clearHistory: () => {
    set({ history: [] });
    saveStateToDB({ history: [] });
  },
  setApiKey: (key) => {
    set({ apiKey: key });
    saveStateToDB({ apiKey: key });
  },
  setHydrated: () => set({ hydrated: true }),

  reset: () => {
    const resetState = {
      inputValue: "",
      response: "",
      previousQuestion: "",
      position: { x: window.innerWidth / 2 - 300, y: window.innerHeight - 350 },
      componentStatus: "Idle",
      history: [],
      apiKey: "",
    } as Partial<AIQueryState>;
    set(resetState);
    saveStateToDB(resetState);
  },

  hydrate: async () => {
    const storedState = await loadStateFromDB();
    if (storedState) {
      set({
        inputValue: storedState.inputValue ?? "",
        response: storedState.response ?? "",
        previousQuestion: storedState.previousQuestion ?? "",
        position: storedState.position ?? { x: window.innerWidth / 2 - 300, y: window.innerHeight - 350 },
        componentStatus: "Idle",
        history: storedState.history ?? [],
        apiKey: storedState.apiKey ?? "",
        hydrated: true,
      });
    } else {
      set({ hydrated: true });
    }
  },
}));

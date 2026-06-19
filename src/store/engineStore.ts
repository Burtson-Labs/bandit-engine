/**
 * Base-model ("Engine") selection — the BRAIN powering responses, distinct from
 * the Persona (the voice/character in modelStore). Engines come from the gateway
 * catalog (GET {gateway}/api/models) and carry capability badges
 * (vision/tools/thinking/cloud). The chat sends the selected engine id as the
 * request `model`; the gateway resolves it (bandit-core, bandit-logic,
 * bandit-logic-2, bandit-core-2) to the actual backend.
 */
import { create } from "zustand";
import { usePackageSettingsStore } from "./packageSettingsStore";
import { authenticationService } from "../services/auth/authenticationService";
import { debugLogger } from "../services/logging/debugLogger";

export interface EngineInfo {
  id: string;
  displayName: string;
  description: string;
  provider: string;
  contextWindow: number;
  tier: string;
  vision: boolean;
  tools: boolean;
  thinking: boolean;
  cloud: boolean;
  available: boolean;
  unavailableReason?: string;
}

const STORAGE_KEY = "bandit.selectedEngine";

const readStored = (): string | null => {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  } catch {
    return null;
  }
};

interface EngineStore {
  selectedEngine: string | null;
  engines: EngineInfo[];
  loaded: boolean;
  setSelectedEngine: (id: string) => void;
  /** The effective engine id to send as the request model. */
  getSelectedEngine: () => string;
  fetchEngines: () => Promise<void>;
}

export const useEngineStore = create<EngineStore>((set, get) => ({
  selectedEngine: readStored(),
  engines: [],
  loaded: false,

  setSelectedEngine: (id) => {
    set({ selectedEngine: id });
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore persistence failures */
    }
  },

  getSelectedEngine: () =>
    get().selectedEngine ||
    usePackageSettingsStore.getState().settings?.defaultModel ||
    "bandit-core",

  fetchEngines: async () => {
    const settings = usePackageSettingsStore.getState().settings;
    const base = settings?.gatewayApiUrl?.replace(/\/$/, "") ?? "";
    if (!base || settings?.playgroundMode || base.toLowerCase().startsWith("playground://")) {
      set({ loaded: true });
      return;
    }
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = authenticationService.getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${base}/models`, { headers });
      const data = await res.json();
      if (res.ok && Array.isArray(data?.models)) {
        set({ engines: data.models as EngineInfo[], loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch (error) {
      debugLogger.error("Failed to fetch engines", {
        error: error instanceof Error ? error.message : String(error),
      });
      set({ loaded: true });
    }
  },
}));

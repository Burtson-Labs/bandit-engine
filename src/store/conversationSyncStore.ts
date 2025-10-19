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

// Bandit Engine Watermark: BL-WM-50BC-1F9568
const __banditFingerprint_store_conversationSyncStorets = 'BL-FP-E5217A-A962';
const __auditTrail_store_conversationSyncStorets = 'BL-AU-MGOIKVW4-TH1T';
// File: conversationSyncStore.ts | Path: src/store/conversationSyncStore.ts | Hash: 50bca962

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { useConversationStore, Conversation } from "./conversationStore";
import { useProjectStore, Project } from "./projectStore";
import { usePackageSettingsStore } from "./packageSettingsStore";
import { authenticationService } from "../services/auth/authenticationService";
import {
  CONVERSATION_DELETE_EVENT,
  CONVERSATION_UPSERT_EVENT,
  PROJECT_DELETE_EVENT,
  PROJECT_UPSERT_EVENT,
} from "./conversationSyncEvents";
import {
  ConversationRecordDTO,
  ConversationSyncPreferenceDTO,
  ConversationSyncRequest,
  ConversationSyncResponse,
  ConversationTurnDTO,
  ProjectRecordDTO,
  fetchConversationSyncPreference,
  syncConversations,
  updateConversationSyncPreference,
} from "../services/conversationSync/conversationSyncService";
import { debugLogger } from "../services/logging/debugLogger";

const DEVICE_STORAGE_KEY = "banditConversationDeviceId";
const PAYLOAD_VERSION = 1;
const MAX_CONVERSATION_BYTES = 12 * 1024 * 1024; // ~12 MB cloud cap
const WARN_CONVERSATION_BYTES = 10 * 1024 * 1024; // warn at ~10 MB

let suppressTracking = false;
let conversationsMeta = new Map<string, ConversationMeta>();
let projectsMeta = new Map<string, ProjectMeta>();
let conversationUnsubscribe: (() => void) | null = null;
let projectUnsubscribe: (() => void) | null = null;
let autoSyncTimeout: ReturnType<typeof setTimeout> | null = null;

const AUTO_SYNC_DELAY_MS = 4_000;

type ConversationStoreState = ReturnType<typeof useConversationStore.getState>;
type ProjectStoreState = ReturnType<typeof useProjectStore.getState>;

interface ConversationMeta {
  updatedAtMs: number;
  version?: number;
  historyLength: number;
}

interface ProjectMeta {
  updatedAtMs: number;
  version?: number;
  order: number;
}

interface ConversationSizeNotice {
  id: string;
  name: string;
  sizeBytes: number;
  limitBytes: number;
}

export type ConversationSyncStatus = "disabled" | "idle" | "syncing" | "error";

export interface ConversationSyncState {
  initialized: boolean;
  syncEnabled: boolean;
  status: ConversationSyncStatus;
  lastSyncAt?: string | null;
  cursor?: string | null;
  lastError?: string | null;
  keepLocalOnly?: boolean;
  isAdvancedVectorFeaturesEnabled: boolean;
  conflicts: ConversationSyncResponse["conflicts"] | null;
  deviceId: string;
  pendingConversationUpserts: Set<string>;
  pendingConversationDeletes: Set<string>;
  pendingProjectUpserts: Set<string>;
  pendingProjectDeletes: Set<string>;
  totalConversationsOnServer?: number;
  totalProjectsOnServer?: number;
  hasCompletedInitialUpload: boolean;
  warningConversations: ConversationSizeNotice[];
  oversizedConversations: ConversationSizeNotice[];
  initialize: () => Promise<void>;
  setSyncEnabled: (enabled: boolean) => Promise<void>;
  setAdvancedVectorFeaturesEnabled: (enabled: boolean) => Promise<void>;
  runSync: (options?: { force?: boolean }) => Promise<void>;
  registerError: (error: string) => void;
  clearConflicts: () => void;
}

function ensureDeviceId(): string {
  if (typeof window === "undefined") {
    return "bandit-web";
  }
  try {
    const existing = window.localStorage.getItem(DEVICE_STORAGE_KEY);
    if (existing) {
      return existing;
    }
    const generated = uuidv4();
    window.localStorage.setItem(DEVICE_STORAGE_KEY, generated);
    return generated;
  } catch (error) {
    debugLogger.warn("conversationSyncStore: unable to access localStorage, generating volatile device id", { error });
    return uuidv4();
  }
}

function mapConversationToDTO(conversation: Conversation): ConversationRecordDTO {
  const updatedAtIso = (conversation.updatedAt ?? new Date()).toISOString();
  const createdAtIso = conversation.createdAt ? conversation.createdAt.toISOString() : null;

  const history = conversation.history.map((entry, index) => {
    const turn: ConversationTurnDTO = {
      id: entry.id ?? `${conversation.id}-turn-${index}`,
      question: entry.question,
      answer: entry.answer,
      memoryUpdated: entry.memoryUpdated,
      cancelled: entry.cancelled,
    };

    if (entry.sourceFiles?.length) {
      turn.sourceFiles = entry.sourceFiles.map((doc) => ({
        id: doc.id,
        name: doc.name,
      }));
    }

    return turn;
  });

  return {
    id: conversation.id,
    name: conversation.name,
    model: conversation.model,
    projectId: conversation.projectId ?? null,
    history,
    summary: conversation.summary,
    tags: conversation.tags,
    metadata: conversation.metadata,
    createdAt: createdAtIso,
    updatedAt: updatedAtIso,
    version: conversation.version ?? 0,
    updatedBy: conversation.updatedBy,
    deletedAt: conversation.deletedAt ?? null,
    summaryStatus: conversation.summaryStatus,
    summaryGeneratedAt: conversation.summaryGeneratedAt ? conversation.summaryGeneratedAt.toISOString() : undefined,
  } as ConversationRecordDTO;
}

function mapProjectToDTO(project: Project): ProjectRecordDTO {
  const updatedAtIso = project.updatedAt?.toISOString() ?? new Date().toISOString();
  const createdAtIso = project.createdAt?.toISOString() ?? null;

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    color: project.color,
    order: project.order,
    conversationCount: project.conversationCount,
    lastActivityAt: project.lastActivityAt ? project.lastActivityAt.toISOString() : undefined,
    summary: project.summary,
    metadata: project.metadata,
    createdAt: createdAtIso,
    updatedAt: updatedAtIso,
    version: project.version ?? 0,
    updatedBy: project.updatedBy,
    deletedAt: project.deletedAt ?? null,
  } as ProjectRecordDTO;
}

function mapConversationFromDTO(dto: ConversationRecordDTO): Conversation {
  return {
    id: dto.id,
    name: dto.name,
    model: dto.model,
    projectId: dto.projectId ?? undefined,
    history: dto.history.map((turn) => ({
      question: turn.question,
      answer: turn.answer,
      sourceFiles: turn.sourceFiles?.map((doc) => ({
        id: doc.id,
        name: doc.name ?? "",
        content: "",
      })),
      memoryUpdated: turn.memoryUpdated,
      cancelled: turn.cancelled,
    })),
    summary: dto.summary ?? undefined,
    tags: dto.tags ?? undefined,
    metadata: dto.metadata ?? undefined,
    createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
    updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
    version: dto.version,
    updatedBy: dto.updatedBy,
    deletedAt: dto.deletedAt ?? undefined,
    summaryStatus: dto.summaryStatus,
    summaryGeneratedAt: dto.summaryGeneratedAt ? new Date(dto.summaryGeneratedAt) : undefined,
  } as Conversation;
}

function mapProjectFromDTO(dto: ProjectRecordDTO): Project {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    color: dto.color,
    order: dto.order,
    createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
    updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : new Date(),
    conversationCount: dto.conversationCount,
    lastActivityAt: dto.lastActivityAt ? new Date(dto.lastActivityAt) : undefined,
    summary: dto.summary ?? undefined,
    metadata: dto.metadata ?? undefined,
    version: dto.version,
    updatedBy: dto.updatedBy,
    deletedAt: dto.deletedAt ?? undefined,
  } as Project;
}

async function waitForInitialHydration(): Promise<void> {
  const ready = () =>
    useConversationStore.getState()._hasHydrated &&
    useProjectStore.getState()._hasHydrated;

  if (ready()) {
    debugLogger.debug('conversationSyncStore: hydration already complete');
    return;
  }

  await new Promise<void>((resolve) => {
    const checkAndResolve = () => {
      if (ready()) {
        unsubscribeConversation();
        unsubscribeProject();
        debugLogger.debug('conversationSyncStore: hydration complete (async wait)');
        resolve();
      }
    };

    const unsubscribeConversation = useConversationStore.subscribe((state, prevState) => {
      if (state._hasHydrated !== prevState._hasHydrated) {
        checkAndResolve();
      }
    });

    const unsubscribeProject = useProjectStore.subscribe((state, prevState) => {
      if (state._hasHydrated !== prevState._hasHydrated) {
        checkAndResolve();
      }
    });

    debugLogger.debug('conversationSyncStore: waiting for stores hydration');
    checkAndResolve();
  });
}

function buildConversationMeta(conversation: Conversation): ConversationMeta {
  return {
    updatedAtMs: conversation.updatedAt ? conversation.updatedAt.getTime() : 0,
    version: conversation.version,
    historyLength: conversation.history.length,
  };
}

function buildProjectMeta(project: Project): ProjectMeta {
  return {
    updatedAtMs: project.updatedAt ? project.updatedAt.getTime() : 0,
    version: project.version,
    order: project.order,
  };
}

function snapshotConversationMetaMap(conversations: Conversation[]): Map<string, ConversationMeta> {
  return new Map(
    conversations.map((conversation): [string, ConversationMeta] => [
      conversation.id,
      buildConversationMeta(conversation),
    ])
  );
}

function snapshotProjectMetaMap(projects: Project[]): Map<string, ProjectMeta> {
  return new Map(
    projects.map((project): [string, ProjectMeta] => [
      project.id,
      buildProjectMeta(project),
    ])
  );
}

function ensureTrackersInitialized() {
  if (!conversationUnsubscribe) {
    const initialState = useConversationStore.getState();
    conversationsMeta = snapshotConversationMetaMap(initialState.conversations);

    const handleConversationChange = (
      state: ConversationStoreState,
      _prevState: ConversationStoreState
    ) => {
      const conversations = state.conversations;
      debugLogger.debug('conversationSyncStore: conversation store changed', { count: conversations.length });

      if (!state._hasHydrated) {
        conversationsMeta = snapshotConversationMetaMap(conversations);
        return;
      }

      if (suppressTracking) {
        conversationsMeta = snapshotConversationMetaMap(conversations);
        return;
      }

      const nextMeta = snapshotConversationMetaMap(conversations);
      for (const conversation of conversations) {
        const previous = conversationsMeta.get(conversation.id);
        const updatedAtMs = conversation.updatedAt ? conversation.updatedAt.getTime() : 0;

        if (!previous) {
          debugLogger.debug('conversationSyncStore: detected new conversation', { id: conversation.id });
          queueConversationUpsert(conversation.id);
          continue;
        }

        if (
          previous.updatedAtMs !== updatedAtMs ||
          previous.version !== conversation.version ||
          previous.historyLength !== conversation.history.length
        ) {
          debugLogger.debug('conversationSyncStore: detected conversation change', { id: conversation.id });
          queueConversationUpsert(conversation.id);
        }
      }

      for (const id of conversationsMeta.keys()) {
        if (!nextMeta.has(id)) {
          debugLogger.debug('conversationSyncStore: detected conversation removal', { id });
          queueConversationDelete(id);
        }
      }

      conversationsMeta = nextMeta;
    };

    conversationUnsubscribe = useConversationStore.subscribe(handleConversationChange);
    handleConversationChange(initialState, initialState);
  }

  if (!projectUnsubscribe) {
    const initialState = useProjectStore.getState();
    projectsMeta = snapshotProjectMetaMap(initialState.projects);

    const handleProjectChange = (state: ProjectStoreState, _prevState: ProjectStoreState) => {
      const projects = state.projects;
      debugLogger.debug('conversationSyncStore: project store changed', { count: projects.length });

      if (!state._hasHydrated) {
        projectsMeta = snapshotProjectMetaMap(projects);
        return;
      }

      if (suppressTracking) {
        projectsMeta = snapshotProjectMetaMap(projects);
        return;
      }

      const nextMeta = snapshotProjectMetaMap(projects);
      for (const project of projects) {
        const previous = projectsMeta.get(project.id);
        const updatedAtMs = project.updatedAt ? project.updatedAt.getTime() : 0;

        if (!previous) {
          debugLogger.debug('conversationSyncStore: detected new project', { id: project.id });
          queueProjectUpsert(project.id);
          continue;
        }

        if (
          previous.updatedAtMs !== updatedAtMs ||
          previous.version !== project.version ||
          previous.order !== project.order
        ) {
          debugLogger.debug('conversationSyncStore: detected project change', { id: project.id });
          queueProjectUpsert(project.id);
        }
      }

      for (const id of projectsMeta.keys()) {
        if (!nextMeta.has(id)) {
          debugLogger.debug('conversationSyncStore: detected project removal', { id });
          queueProjectDelete(id);
        }
      }

      projectsMeta = nextMeta;
    };

    projectUnsubscribe = useProjectStore.subscribe(handleProjectChange);
    handleProjectChange(initialState, initialState);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener(CONVERSATION_UPSERT_EVENT, (event) => {
    const id = (event as CustomEvent<string>).detail;
    if (id && !suppressTracking) {
      queueConversationUpsert(id);
    }
  });

  window.addEventListener(CONVERSATION_DELETE_EVENT, (event) => {
    const id = (event as CustomEvent<string>).detail;
    if (id && !suppressTracking) {
      queueConversationDelete(id);
    }
  });

  window.addEventListener(PROJECT_UPSERT_EVENT, (event) => {
    const id = (event as CustomEvent<string>).detail;
    if (id && !suppressTracking) {
      queueProjectUpsert(id);
    }
  });

  window.addEventListener(PROJECT_DELETE_EVENT, (event) => {
    const id = (event as CustomEvent<string>).detail;
    if (id && !suppressTracking) {
      queueProjectDelete(id);
    }
  });
}

export function flagConversationUpsert(id: string) {
  queueConversationUpsert(id);
}

export function flagConversationDelete(id: string) {
  queueConversationDelete(id);
}

export function flagProjectUpsert(id: string) {
  queueProjectUpsert(id);
}

export function flagProjectDelete(id: string) {
  queueProjectDelete(id);
}

function queueConversationUpsert(id: string) {
  useConversationSyncStore.setState((state) => {
    const upserts = new Set(state.pendingConversationUpserts);
    const deletes = new Set(state.pendingConversationDeletes);
    deletes.delete(id);
    upserts.add(id);
    debugLogger.info('conversationSyncStore: queued conversation upsert', { id });
    return { pendingConversationUpserts: upserts, pendingConversationDeletes: deletes };
  });
  scheduleAutoSync();
}

function queueConversationDelete(id: string) {
  useConversationSyncStore.setState((state) => {
    const upserts = new Set(state.pendingConversationUpserts);
    const deletes = new Set(state.pendingConversationDeletes);
    upserts.delete(id);
    deletes.add(id);
    debugLogger.info('conversationSyncStore: queued conversation delete', { id });
    return { pendingConversationUpserts: upserts, pendingConversationDeletes: deletes };
  });
  scheduleAutoSync(true);
}

function queueProjectUpsert(id: string) {
  useConversationSyncStore.setState((state) => {
    const upserts = new Set(state.pendingProjectUpserts);
    const deletes = new Set(state.pendingProjectDeletes);
    deletes.delete(id);
    upserts.add(id);
    debugLogger.info('conversationSyncStore: queued project upsert', { id });
    return { pendingProjectUpserts: upserts, pendingProjectDeletes: deletes };
  });
  scheduleAutoSync();
}

function queueProjectDelete(id: string) {
  useConversationSyncStore.setState((state) => {
    const upserts = new Set(state.pendingProjectUpserts);
    const deletes = new Set(state.pendingProjectDeletes);
    upserts.delete(id);
    deletes.add(id);
    debugLogger.info('conversationSyncStore: queued project delete', { id });
    return { pendingProjectUpserts: upserts, pendingProjectDeletes: deletes };
  });
  scheduleAutoSync(true);
}

function scheduleAutoSync(prioritize = false) {
  const { syncEnabled, status } = useConversationSyncStore.getState();
  if (!syncEnabled) {
    return;
  }

  const delay = prioritize ? Math.min(1_000, AUTO_SYNC_DELAY_MS) : AUTO_SYNC_DELAY_MS;

  if (autoSyncTimeout) {
    clearTimeout(autoSyncTimeout);
  }

  if (status === 'syncing') {
    // Wait until current sync finishes; we'll schedule a follow-up once status changes
    autoSyncTimeout = setTimeout(() => scheduleAutoSync(prioritize), delay);
    return;
  }

  autoSyncTimeout = setTimeout(() => {
    autoSyncTimeout = null;
    useConversationSyncStore
      .getState()
      .runSync()
      .catch((error) => {
        debugLogger.error('conversationSyncStore: auto sync failed', { error });
      });
  }, delay);
}

async function applyServerResults(response: ConversationSyncResponse) {
  const conversationUpserts = response.conversations.upserts.map(mapConversationFromDTO);
  const projectUpserts = response.projects.upserts.map(mapProjectFromDTO);

  suppressTracking = true;
  try {
    if (projectUpserts.length > 0) {
      await useProjectStore.getState().applyRemoteProjects(projectUpserts);
      projectsMeta = new Map(
        useProjectStore.getState().projects.map((project) => [project.id, buildProjectMeta(project)])
      );
    }

    if (conversationUpserts.length > 0) {
      await useConversationStore.getState().applyRemoteConversations(conversationUpserts);
      conversationsMeta = new Map(
        useConversationStore.getState().conversations.map((conversation) => [conversation.id, buildConversationMeta(conversation)])
      );
    }

    if (response.projects.deletes.length > 0) {
      await useProjectStore.getState().removeProjectsByIds(response.projects.deletes);
      projectsMeta = new Map(
        useProjectStore.getState().projects.map((project) => [project.id, buildProjectMeta(project)])
      );
    }

    if (response.conversations.deletes.length > 0) {
      await useConversationStore.getState().removeConversationsByIds(response.conversations.deletes);
      conversationsMeta = new Map(
        useConversationStore.getState().conversations.map((conversation) => [conversation.id, buildConversationMeta(conversation)])
      );
    }
  } finally {
    suppressTracking = false;
  }
}

export const useConversationSyncStore = create<ConversationSyncState>((set, get) => ({
  initialized: false,
  syncEnabled: false,
  status: "disabled",
  lastSyncAt: null,
  cursor: null,
  lastError: null,
  keepLocalOnly: false,
  isAdvancedVectorFeaturesEnabled: false,
  conflicts: null,
  deviceId: ensureDeviceId(),
  pendingConversationUpserts: new Set<string>(),
  pendingConversationDeletes: new Set<string>(),
  pendingProjectUpserts: new Set<string>(),
  pendingProjectDeletes: new Set<string>(),
  totalConversationsOnServer: undefined,
  totalProjectsOnServer: undefined,
  hasCompletedInitialUpload: false,
  warningConversations: [],
  oversizedConversations: [],

  async initialize() {
    if (get().initialized) {
      return;
    }

    ensureTrackersInitialized();

    const gatewayUrl = usePackageSettingsStore.getState().settings?.gatewayApiUrl;
    if (!gatewayUrl) {
      debugLogger.info("conversationSyncStore: gateway API URL not configured; sync disabled");
      set({ initialized: true, status: "disabled", syncEnabled: false });
      return;
    }

    const token = authenticationService.getToken();
    if (!token) {
      debugLogger.info("conversationSyncStore: no authentication token; sync disabled until login");
      set({ initialized: true, status: "disabled", syncEnabled: false });
      return;
    }

    try {
      await waitForInitialHydration();
      const preference = await fetchConversationSyncPreference();
      const { deviceId } = get();
      const isNewDevice = Boolean(
        preference.lastDeviceId && preference.lastDeviceId !== deviceId
      );

      if (isNewDevice) {
        debugLogger.info('conversationSyncStore: detected new device, resetting cursor for full hydration', {
          deviceId,
          lastDeviceId: preference.lastDeviceId,
        });
      }

      applyPreference(preference, set, get, {
        isNewDevice,
        override: {
          isAdvancedVectorFeaturesEnabled: get().isAdvancedVectorFeaturesEnabled,
        },
      });
      set({ initialized: true });
      if (preference.syncEnabled) {
        await get().runSync({ force: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load conversation sync preference";
      debugLogger.error("conversationSyncStore: initialization failed", { error: message });
      set({ initialized: true, status: "error", lastError: message });
    }
  },

  async setSyncEnabled(enabled: boolean) {
    const state = get();
    const { deviceId, keepLocalOnly = false, isAdvancedVectorFeaturesEnabled } = state;
    try {
      const preference = await updateConversationSyncPreference({
        syncEnabled: enabled,
        deviceId,
        keepLocalOnly,
        isAdvancedVectorFeaturesEnabled,
      });
      const isNewDevice = Boolean(
        preference.lastDeviceId && preference.lastDeviceId !== deviceId
      );

      if (isNewDevice) {
        debugLogger.info('conversationSyncStore: preference updated from different device, forcing full hydration', {
          deviceId,
          lastDeviceId: preference.lastDeviceId,
        });
      }

      applyPreference(preference, set, get, {
        isNewDevice,
        override: {
          isAdvancedVectorFeaturesEnabled,
        },
      });
      if (enabled) {
        set({ hasCompletedInitialUpload: false });
      }
      if (preference.syncEnabled) {
        await get().runSync({ force: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update sync preference";
      debugLogger.error("conversationSyncStore: setSyncEnabled failed", { error: message });
      set({ status: "error", lastError: message });
    }
  },

  async setAdvancedVectorFeaturesEnabled(enabled: boolean) {
    const state = get();
    const { deviceId, keepLocalOnly = false, syncEnabled } = state;
    try {
      const preference = await updateConversationSyncPreference({
        syncEnabled,
        deviceId,
        keepLocalOnly,
        isAdvancedVectorFeaturesEnabled: enabled,
      });

      const isNewDevice = Boolean(
        preference.lastDeviceId && preference.lastDeviceId !== deviceId
      );

      if (isNewDevice) {
        debugLogger.info('conversationSyncStore: preference updated from different device, forcing full hydration', {
          deviceId,
          lastDeviceId: preference.lastDeviceId,
        });
      }

      applyPreference(preference, set, get, {
        isNewDevice,
        override: {
          isAdvancedVectorFeaturesEnabled: enabled,
        },
      });
      if (preference.syncEnabled && preference.isAdvancedVectorFeaturesEnabled) {
        await get().runSync({ force: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update advanced vector setting";
      debugLogger.error("conversationSyncStore: setAdvancedVectorFeaturesEnabled failed", { error: message });
      set({ status: "error", lastError: message });
      throw error;
    }
  },

  async runSync({ force = false } = {}) {
    await waitForInitialHydration();
    const stateBefore = get();
    debugLogger.info('conversationSyncStore: runSync invoked', {
      force,
      syncEnabled: stateBefore.syncEnabled,
      status: stateBefore.status,
      pendingConversationUpserts: stateBefore.pendingConversationUpserts.size,
      pendingConversationDeletes: stateBefore.pendingConversationDeletes.size,
      pendingProjectUpserts: stateBefore.pendingProjectUpserts.size,
      pendingProjectDeletes: stateBefore.pendingProjectDeletes.size,
      cursor: stateBefore.cursor,
      lastSyncAt: stateBefore.lastSyncAt,
    });
    const state = get();
    if (!state.syncEnabled && !force) {
      debugLogger.info('conversationSyncStore: runSync aborted - sync disabled and not forced');
      return;
    }
    if (state.status === "syncing") {
      debugLogger.debug('conversationSyncStore: runSync aborted - already syncing');
      return;
    }

    const gatewayUrl = usePackageSettingsStore.getState().settings?.gatewayApiUrl;
    if (!gatewayUrl) {
      set({ status: "error", lastError: "Gateway API URL is not configured." });
      debugLogger.error('conversationSyncStore: runSync error - missing gateway URL');
      return;
    }

    const token = authenticationService.getToken();
    if (!token) {
      set({ status: "error", lastError: "Authentication required to sync conversations." });
      debugLogger.error('conversationSyncStore: runSync error - missing auth token');
      return;
    }

    const pendingConversationIds = Array.from(state.pendingConversationUpserts);
    const pendingConversationDeleteIds = Array.from(state.pendingConversationDeletes);
    const pendingProjectIds = Array.from(state.pendingProjectUpserts);
    const pendingProjectDeleteIds = Array.from(state.pendingProjectDeletes);

    const conversationStore = useConversationStore.getState();
    const projectStore = useProjectStore.getState();

    const conversationCandidates = pendingConversationIds
      .map((id) => conversationStore.conversations.find((c) => c.id === id))
      .filter(Boolean) as Conversation[];

    let {
      allowed: conversationPayloads,
      warnings: warningConversations,
      oversized: oversizedConversations,
    } = analyzeConversations(conversationCandidates);

    let projectPayloads = pendingProjectIds
      .map((id) => projectStore.projects.find((p) => p.id === id))
      .filter(Boolean)
      .map((project) => mapProjectToDTO(project as Project));

    const isInitialSync = state.cursor == null;
    const shouldBootstrapSnapshot = !state.hasCompletedInitialUpload;

    const payloadDebug = {
      pendingConversationIds,
      pendingConversationDeleteIds,
      pendingProjectIds,
      pendingProjectDeleteIds,
      totalConversationsLocal: conversationStore.conversations.length,
      totalProjectsLocal: projectStore.projects.length,
      isInitialSync,
      shouldBootstrapSnapshot,
    };
    debugLogger.info('conversationSyncStore: preparing sync payload', payloadDebug);

    if (
      (isInitialSync || shouldBootstrapSnapshot) &&
      conversationPayloads.length === 0 &&
      pendingConversationDeleteIds.length === 0 &&
      projectPayloads.length === 0 &&
      pendingProjectDeleteIds.length === 0
    ) {
      const analysis = analyzeConversations(conversationStore.conversations);
      conversationPayloads = analysis.allowed;
      warningConversations = analysis.warnings;
      oversizedConversations = analysis.oversized;
      projectPayloads = projectStore.projects.map((project) => mapProjectToDTO(project));
      const bootInfo = {
        conversationCount: conversationPayloads.length,
        projectCount: projectPayloads.length,
      };
      debugLogger.info('conversationSyncStore: bootstrapping initial snapshot', bootInfo);
    }

    if (!force &&
      conversationPayloads.length === 0 &&
      pendingConversationDeleteIds.length === 0 &&
      projectPayloads.length === 0 &&
      pendingProjectDeleteIds.length === 0
    ) {
      // Nothing to push; still pull deltas if cursor exists
      if (!state.cursor) {
        debugLogger.debug('conversationSyncStore: runSync early exit - nothing to push and no cursor');
        set((current) => ({
          warningConversations,
          oversizedConversations,
          lastError: oversizedConversations.length ? buildOversizedMessage(oversizedConversations) : null,
          status: oversizedConversations.length ? 'error' : current.syncEnabled ? 'idle' : current.status,
        }));
        return;
      }
    }

    set({ status: "syncing", lastError: null });
    debugLogger.info('conversationSyncStore: issuing sync request', {
      conversationUpserts: conversationPayloads.length,
      conversationDeletes: pendingConversationDeleteIds.length,
      projectUpserts: projectPayloads.length,
      projectDeletes: pendingProjectDeleteIds.length,
      cursor: state.cursor,
    });

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const request: ConversationSyncRequest = {
      deviceId: state.deviceId,
      cursor: state.cursor ?? undefined,
      timezone,
      payloadVersion: PAYLOAD_VERSION,
      changes: {
        conversations: {
          upserts: conversationPayloads,
          deletes: pendingConversationDeleteIds,
        },
        projects: {
          upserts: projectPayloads,
          deletes: pendingProjectDeleteIds,
        },
      },
    };

    try {
      let response = await syncConversations(request);
      await applyServerResults(response);

      let nextCursor = response.nextCursor?.token ?? state.cursor ?? null;
      let totalConversations = response.conversations.totalCount;
      let totalProjects = response.projects.totalCount;
      let conflicts = response.conflicts;

      while (response.hasMore) {
        const followUpRequest: ConversationSyncRequest = {
          deviceId: state.deviceId,
          cursor: response.nextCursor?.token ?? nextCursor ?? undefined,
          timezone,
          payloadVersion: PAYLOAD_VERSION,
          changes: {
            conversations: { upserts: [], deletes: [] },
            projects: { upserts: [], deletes: [] },
          },
        };
        response = await syncConversations(followUpRequest);
        await applyServerResults(response);
        nextCursor = response.nextCursor?.token ?? nextCursor;
        totalConversations = response.conversations.totalCount;
        totalProjects = response.projects.totalCount;
        conflicts = {
          conversationConflicts: [
            ...conflicts.conversationConflicts,
            ...response.conflicts.conversationConflicts,
          ],
          projectConflicts: [
            ...conflicts.projectConflicts,
            ...response.conflicts.projectConflicts,
          ],
        };
      }

      const sentConversationIds = new Set(conversationPayloads.map((c) => c.id));
      const sentProjectIds = new Set(projectPayloads.map((p) => p.id));
      const sentConversationDeleteIds = new Set(pendingConversationDeleteIds);
      const sentProjectDeleteIds = new Set(pendingProjectDeleteIds);

      set((current) => {
        const nextConversationUpserts = new Set(current.pendingConversationUpserts);
        const nextConversationDeletes = new Set(current.pendingConversationDeletes);
        const nextProjectUpserts = new Set(current.pendingProjectUpserts);
        const nextProjectDeletes = new Set(current.pendingProjectDeletes);

        for (const id of sentConversationIds) {
          nextConversationUpserts.delete(id);
        }
        for (const id of sentConversationDeleteIds) {
          nextConversationDeletes.delete(id);
        }
        for (const id of sentProjectIds) {
          nextProjectUpserts.delete(id);
        }
        for (const id of sentProjectDeleteIds) {
          nextProjectDeletes.delete(id);
        }

        const hasOversized = oversizedConversations.length > 0;

        return {
          status: hasOversized ? "error" : current.syncEnabled ? "idle" : "disabled",
          cursor: nextCursor,
          lastSyncAt: new Date().toISOString(),
          conflicts,
          totalConversationsOnServer: totalConversations,
          totalProjectsOnServer: totalProjects,
          pendingConversationUpserts: nextConversationUpserts,
          pendingConversationDeletes: nextConversationDeletes,
          pendingProjectUpserts: nextProjectUpserts,
          pendingProjectDeletes: nextProjectDeletes,
          hasCompletedInitialUpload: true,
          warningConversations,
          oversizedConversations,
          lastError: hasOversized ? buildOversizedMessage(oversizedConversations) : null,
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Conversation sync failed";
      debugLogger.error("conversationSyncStore: runSync failed", { error: message });
      set({ status: "error", lastError: message });
    }
  },

  registerError(error: string) {
    set({ status: "error", lastError: error });
  },

  clearConflicts() {
    set({ conflicts: null });
  },
}));

function applyPreference(
  preference: ConversationSyncPreferenceDTO,
  set: (partial: Partial<ConversationSyncState>) => void,
  getState: () => ConversationSyncState,
  options?: {
    isNewDevice?: boolean;
    override?: Partial<Pick<ConversationSyncState, 'isAdvancedVectorFeaturesEnabled'>>;
  }
) {
  const isNewDevice = options?.isNewDevice ?? false;
  const current = getState();
  const override = options?.override ?? {};

  const preferenceVectorFlag = preference.isAdvancedVectorFeaturesEnabled;
  const overrideVectorFlag = override.isAdvancedVectorFeaturesEnabled;
  const resolvedVectorFlag =
    preferenceVectorFlag !== undefined
      ? preferenceVectorFlag
      : overrideVectorFlag !== undefined
      ? overrideVectorFlag
      : current.isAdvancedVectorFeaturesEnabled ?? false;

  set({
    syncEnabled: preference.syncEnabled,
    status: preference.syncEnabled ? "idle" : "disabled",
    lastSyncAt: isNewDevice ? null : preference.lastSyncAt ?? null,
    cursor: isNewDevice ? null : preference.cursor ?? null,
    keepLocalOnly: preference.keepLocalOnly,
    isAdvancedVectorFeaturesEnabled: resolvedVectorFlag,
    lastError: null,
    hasCompletedInitialUpload:
      preference.syncEnabled && preference.lastSyncAt != null && !isNewDevice,
    warningConversations: [],
    oversizedConversations: [],
  });
}

function analyzeConversations(conversations: Conversation[]): {
  allowed: ConversationRecordDTO[];
  warnings: ConversationSizeNotice[];
  oversized: ConversationSizeNotice[];
} {
  const allowed: ConversationRecordDTO[] = [];
  const warnings: ConversationSizeNotice[] = [];
  const oversized: ConversationSizeNotice[] = [];
  const encoder = new TextEncoder();

  for (const conversation of conversations) {
    const dto = mapConversationToDTO(conversation);
    const sizeBytes = encoder.encode(JSON.stringify(dto)).length;
    const notice: ConversationSizeNotice = {
      id: conversation.id,
      name: conversation.name,
      sizeBytes,
      limitBytes: MAX_CONVERSATION_BYTES,
    };
    if (sizeBytes >= MAX_CONVERSATION_BYTES) {
      oversized.push(notice);
      continue;
    }
    if (sizeBytes >= WARN_CONVERSATION_BYTES) {
      warnings.push(notice);
    }
    allowed.push(dto);
  }

  return { allowed, warnings, oversized };
}

function buildOversizedMessage(notices: ConversationSizeNotice[]): string {
  if (!notices.length) {
    return '';
  }
  const names = notices.map((n) => `"${n.name || 'Untitled'}"`).join(', ');
  return `Some conversations (${names}) are too large for Bandit Cloud. Start a new conversation or archive older turns to continue syncing.`;
}

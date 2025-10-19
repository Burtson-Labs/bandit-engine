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

// Bandit Engine Watermark: BL-WM-ECF9-6DA236
const __banditFingerprint_conversationSync_conversationSyncServicets = 'BL-FP-63F1FF-931F';
const __auditTrail_conversationSync_conversationSyncServicets = 'BL-AU-MGOIKVVS-90K4';
// File: conversationSyncService.ts | Path: src/services/conversationSync/conversationSyncService.ts | Hash: ecf9931f

import { authenticationService } from "../auth/authenticationService";
import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import { debugLogger } from "../logging/debugLogger";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getString = (record: Record<string, unknown>, key: string): string | undefined => {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
};

class HttpResponseError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'HttpResponseError';
  }
}

export interface SyncMetadataDTO {
  version: number;
  updatedAt: string;
  updatedBy?: string;
  deletedAt?: string | null;
}

export interface KnowledgeDocRefDTO {
  id: string;
  name?: string;
}

export interface ConversationTurnDTO {
  id: string;
  question: string;
  answer: string;
  images?: string[];
  sourceFiles?: KnowledgeDocRefDTO[];
  memoryUpdated?: boolean;
  cancelled?: boolean;
}

export interface ConversationRecordDTO extends SyncMetadataDTO {
  id: string;
  name: string;
  model: string;
  projectId?: string | null;
  history: ConversationTurnDTO[];
  summary?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt?: string | null;
  summaryStatus?: string;
  summaryGeneratedAt?: string;
}

export interface ProjectRecordDTO extends SyncMetadataDTO {
  id: string;
  name: string;
  description?: string;
  color?: string;
  order: number;
  conversationCount?: number;
  lastActivityAt?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string | null;
}

export interface ConversationSyncPreferenceDTO {
  syncEnabled: boolean;
  lastSyncAt?: string | null;
  cursor?: string | null;
  lastDeviceId?: string | null;
  keepLocalOnly?: boolean;
  isAdvancedVectorFeaturesEnabled: boolean;
}

export interface ConversationSyncRequest {
  deviceId: string;
  cursor?: string | null;
  timezone?: string;
  payloadVersion: number;
  changes: {
    conversations: {
      upserts: ConversationRecordDTO[];
      deletes: string[];
    };
    projects: {
      upserts: ProjectRecordDTO[];
      deletes: string[];
    };
  };
}

export interface ConflictRecordDTO<T> {
  id: string;
  server: T;
  client?: T;
  reason: 'version_mismatch' | 'missing_dependency' | 'validation_error';
  message?: string;
}

export interface ConversationSyncResponse {
  nextCursor?: {
    token: string;
    expiresAt?: string;
  } | null;
  conversations: {
    upserts: ConversationRecordDTO[];
    deletes: string[];
    totalCount: number;
  };
  projects: {
    upserts: ProjectRecordDTO[];
    deletes: string[];
    totalCount: number;
  };
  conflicts: {
    conversationConflicts: ConflictRecordDTO<ConversationRecordDTO>[];
    projectConflicts: ConflictRecordDTO<ProjectRecordDTO>[];
  };
  hasMore: boolean;
}

function buildUrl(path: string): string {
  const base = usePackageSettingsStore.getState().settings?.gatewayApiUrl?.replace(/\/$/, "");
  if (base) {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalized}`;
  }
  return path;
}

function buildHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const token = authenticationService.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  let data: unknown = null;
  try {
    data = await response.json();
  } catch (error) {
    debugLogger.warn('conversationSyncService: failed to parse JSON response', { error });
  }

  if (!response.ok) {
    const record = isRecord(data) ? data : {};
    const message =
      getString(record, 'error') ||
      getString(record, 'message') ||
      getString(record, 'detail') ||
      fallbackMessage;
    const code = getString(record, 'code') || getString(record, 'error_code');
    throw new HttpResponseError(message, response.status, data, code);
  }

  return data as T;
}

export async function fetchConversationSyncPreference(): Promise<ConversationSyncPreferenceDTO> {
  const url = buildUrl('/v1/preferences/conversation-sync');
  const headers = buildHeaders();
  try {
    const response = await fetch(url, { method: 'GET', headers });
    return await handleJsonResponse<ConversationSyncPreferenceDTO>(response, 'Failed to load conversation sync preference');
  } catch (error) {
    debugLogger.error('conversationSyncService: failed to fetch sync preference', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function updateConversationSyncPreference(body: {
  syncEnabled: boolean;
  deviceId?: string;
  keepLocalOnly?: boolean;
  isAdvancedVectorFeaturesEnabled: boolean;
}): Promise<ConversationSyncPreferenceDTO> {
  const url = buildUrl('/v1/preferences/conversation-sync');
  const headers = buildHeaders();
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    return await handleJsonResponse<ConversationSyncPreferenceDTO>(response, 'Failed to update conversation sync preference');
  } catch (error) {
    debugLogger.error('conversationSyncService: failed to update sync preference', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function syncConversations(request: ConversationSyncRequest): Promise<ConversationSyncResponse> {
  const url = buildUrl('/v1/conversations/sync');
  const headers = buildHeaders();
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });
    return await handleJsonResponse<ConversationSyncResponse>(response, 'Failed to sync conversations');
  } catch (error) {
    debugLogger.error('conversationSyncService: sync request failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

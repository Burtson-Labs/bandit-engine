/*
  (c) 2025 Burtson Labs - Licensed under Business Source License 1.1
  https://burtson.ai/license

  This file is protected intellectual property.
  Do NOT use in commercial software, prompts, AI training data, or derivative works without a valid commercial license.

  AI NOTICE: This file contains visible and invisible watermarks.
  VIOLATION NOTICE: Removing, modifying, or obscuring these watermarks is a license violation.
  LICENSE TERMINATION: Upon license termination, ALL forks, copies, and derivatives must be permanently deleted.
  AUDIT TRAIL: File usage is logged and monitored for compliance verification.
*/

// Bandit Engine Watermark: BL-WM-2A4F-9C7E31
const __banditFingerprint_services_seedPacks_seedPackServicets = 'BL-FP-64B2F0-3F9D';
const __auditTrail_services_seedPacks_seedPackServicets = 'BL-AU-MGOIKVWX-RH8T';
// File: seedPackService.ts | Path: src/services/seedPacks/seedPackService.ts | Hash: 2a4f3f9d

import { authenticationService } from "../auth/authenticationService";
import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import { debugLogger } from "../logging/debugLogger";

export type SeedPackStatus = "draft" | "published" | "archived";
export type SeedPackScope = "team" | "user";

export interface SeedPack {
  sid: string;
  name: string;
  description?: string;
  status: SeedPackStatus;
  version?: number;
  contentType?: "markdown" | "files";
  content?: string;
  summary?: string;
  tags?: string[];
  scopeType?: SeedPackScope;
  scopeSid?: string;
  createdBySid?: string;
  updatedBySid?: string;
  publishedBySid?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface SeedPackDraft {
  name: string;
  description?: string;
  content?: string;
  tags?: string[];
  contentType?: "markdown" | "files";
}

class HttpResponseError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
    public readonly code?: string
  ) {
    super(message);
    this.name = "HttpResponseError";
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getString = (record: Record<string, unknown>, key: string): string | undefined => {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
};

const getNumber = (record: Record<string, unknown>, key: string): number | undefined => {
  const value = record[key];
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const getStringArray = (record: Record<string, unknown>, key: string): string[] | undefined => {
  const value = record[key];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return undefined;
};

const toSeedPackStatus = (value?: string): SeedPackStatus => {
  if (value === "draft" || value === "published" || value === "archived") {
    return value;
  }
  return "draft";
};

const toSeedPackScope = (value?: string): SeedPackScope | undefined => {
  if (value === "team" || value === "user") {
    return value;
  }
  return undefined;
};

const normalizeSeedPack = (record: Record<string, unknown>): SeedPack => {
  const sid = getString(record, "sid") ?? getString(record, "id") ?? "";
  return {
    sid,
    name: getString(record, "name") ?? "Untitled Seed Pack",
    description: getString(record, "description"),
    status: toSeedPackStatus(getString(record, "status")),
    version: getNumber(record, "version"),
    contentType: (getString(record, "contentType") as "markdown" | "files" | undefined) ?? "markdown",
    content: getString(record, "content"),
    summary: getString(record, "summary"),
    tags: getStringArray(record, "tags"),
    scopeType: toSeedPackScope(getString(record, "scopeType")),
    scopeSid: getString(record, "scopeSid"),
    createdBySid: getString(record, "createdBySid"),
    updatedBySid: getString(record, "updatedBySid"),
    publishedBySid: getString(record, "publishedBySid"),
    createdAt: getString(record, "createdAt"),
    updatedAt: getString(record, "updatedAt"),
    publishedAt: getString(record, "publishedAt"),
  };
};

const extractSeedPack = (payload: unknown): SeedPack | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const candidate =
    (isRecord(payload.seedPack) && payload.seedPack) ||
    (isRecord(payload.data) && payload.data) ||
    payload;

  if (!isRecord(candidate)) {
    return null;
  }

  const pack = normalizeSeedPack(candidate);
  if (!pack.sid) {
    return null;
  }
  return pack;
};

const extractSeedPackList = (payload: unknown): SeedPack[] => {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => (isRecord(item) ? normalizeSeedPack(item) : null))
      .filter((item): item is SeedPack => Boolean(item?.sid));
  }

  if (!isRecord(payload)) {
    return [];
  }

  const candidates = [
    payload.seedPacks,
    payload.items,
    payload.results,
    payload.data
  ];

  const list = candidates.find(Array.isArray);
  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .map((item) => (isRecord(item) ? normalizeSeedPack(item) : null))
    .filter((item): item is SeedPack => Boolean(item?.sid));
};

const buildUrl = (path: string): string => {
  const base = usePackageSettingsStore.getState().settings?.gatewayApiUrl?.replace(/\/$/, "");
  if (!base) {
    throw new Error("Gateway API is not configured");
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
};

const buildHeaders = (): HeadersInit => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = authenticationService.getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const handleJsonResponse = async <T>(response: Response, fallbackMessage: string): Promise<T> => {
  let data: unknown = null;
  try {
    data = await response.json();
  } catch (error) {
    debugLogger.warn("seedPackService: failed to parse JSON response", { error });
  }

  if (!response.ok) {
    const record = isRecord(data) ? data : {};
    const message =
      getString(record, "error") ||
      getString(record, "message") ||
      getString(record, "detail") ||
      fallbackMessage;
    const code = getString(record, "code") || getString(record, "error_code");
    throw new HttpResponseError(message, response.status, data, code);
  }

  return data as T;
};

const buildDraftPayload = (draft: SeedPackDraft): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    name: draft.name,
    contentType: draft.contentType ?? "markdown",
  };

  if (draft.description !== undefined) {
    payload.description = draft.description;
  }

  if (draft.content !== undefined) {
    payload.content = draft.content;
  }

  if (draft.tags) {
    payload.tags = draft.tags;
  }

  return payload;
};

export const listSeedPacks = async (): Promise<SeedPack[]> => {
  const url = buildUrl("/seed-packs");
  try {
    const response = await fetch(url, { method: "GET", headers: buildHeaders() });
    const payload = await handleJsonResponse<unknown>(response, "Failed to load seed packs");
    return extractSeedPackList(payload);
  } catch (error) {
    debugLogger.error("seedPackService: failed to list seed packs", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const getSeedPack = async (sid: string): Promise<SeedPack> => {
  const url = buildUrl(`/seed-packs/${encodeURIComponent(sid)}`);
  try {
    const response = await fetch(url, { method: "GET", headers: buildHeaders() });
    const payload = await handleJsonResponse<unknown>(response, "Failed to load seed pack");
    const pack = extractSeedPack(payload);
    if (!pack) {
      throw new Error("Seed pack response was empty");
    }
    return pack;
  } catch (error) {
    debugLogger.error("seedPackService: failed to load seed pack", {
      sid,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const createSeedPack = async (draft: SeedPackDraft): Promise<SeedPack> => {
  const url = buildUrl("/seed-packs");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(buildDraftPayload(draft)),
    });
    const payload = await handleJsonResponse<unknown>(response, "Failed to create seed pack");
    const pack = extractSeedPack(payload);
    if (!pack) {
      throw new Error("Seed pack response was empty");
    }
    return pack;
  } catch (error) {
    debugLogger.error("seedPackService: failed to create seed pack", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const updateSeedPack = async (sid: string, draft: SeedPackDraft): Promise<SeedPack> => {
  const url = buildUrl(`/seed-packs/${encodeURIComponent(sid)}`);
  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(buildDraftPayload(draft)),
    });
    const payload = await handleJsonResponse<unknown>(response, "Failed to update seed pack");
    const pack = extractSeedPack(payload);
    if (!pack) {
      throw new Error("Seed pack response was empty");
    }
    return pack;
  } catch (error) {
    debugLogger.error("seedPackService: failed to update seed pack", {
      sid,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const publishSeedPack = async (sid: string): Promise<SeedPack> => {
  const url = buildUrl(`/seed-packs/${encodeURIComponent(sid)}/publish`);
  try {
    const response = await fetch(url, { method: "POST", headers: buildHeaders() });
    const payload = await handleJsonResponse<unknown>(response, "Failed to publish seed pack");
    const pack = extractSeedPack(payload);
    if (!pack) {
      throw new Error("Seed pack response was empty");
    }
    return pack;
  } catch (error) {
    debugLogger.error("seedPackService: failed to publish seed pack", {
      sid,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const archiveSeedPack = async (sid: string): Promise<SeedPack> => {
  const url = buildUrl(`/seed-packs/${encodeURIComponent(sid)}/archive`);
  try {
    const response = await fetch(url, { method: "POST", headers: buildHeaders() });
    const payload = await handleJsonResponse<unknown>(response, "Failed to archive seed pack");
    const pack = extractSeedPack(payload);
    if (!pack) {
      throw new Error("Seed pack response was empty");
    }
    return pack;
  } catch (error) {
    debugLogger.error("seedPackService: failed to archive seed pack", {
      sid,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const deleteSeedPack = async (sid: string): Promise<void> => {
  const url = buildUrl(`/seed-packs/${encodeURIComponent(sid)}`);
  try {
    const response = await fetch(url, { method: "DELETE", headers: buildHeaders() });
    if (response.status === 204) {
      return;
    }
    await handleJsonResponse<unknown>(response, "Failed to delete seed pack");
  } catch (error) {
    debugLogger.error("seedPackService: failed to delete seed pack", {
      sid,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

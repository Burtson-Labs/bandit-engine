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

// Bandit Engine Watermark: BL-WM-D920-E6B3B8
const __banditFingerprint_mcp_mcpControllerServicets = 'BL-FP-5B6964-A0CB';
const __auditTrail_mcp_mcpControllerServicets = 'BL-AU-MGOIKVVV-RXNY';
// File: mcpControllerService.ts | Path: src/services/mcp/mcpControllerService.ts | Hash: d920a0cb

import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import { authenticationService } from "../auth/authenticationService";
import { debugLogger } from "../logging/debugLogger";

export interface McpTool {
  id: string;
  name: string;
  description: string;
  supportedParameters: string[];
  isEnabled: boolean;
}

export interface McpHealthResponse {
  status: string; // "healthy" | "unhealthy"
  timestamp: string;
  totalTools: number;
  enabledTools: number;
  availableTools: Array<{ id: string; name: string }>;
}

const isPlaygroundMode = (): boolean => {
  const settings = usePackageSettingsStore.getState().settings;
  if (!settings) {
    return false;
  }
  const gatewayUrl = settings.gatewayApiUrl?.toLowerCase() ?? "";
  return Boolean(settings.playgroundMode || gatewayUrl.startsWith("playground://"));
};

function buildUrl(path: string): string {
  // When running in playground mode, we never call the gateway directly.
  if (isPlaygroundMode()) {
    debugLogger.info("MCP controller URL build skipped in playground mode", { path });
    return path.startsWith("/") ? path : `/${path}`;
  }

  // Prefer configured gateway URL when available, otherwise fall back to relative path
  const base = usePackageSettingsStore.getState().settings?.gatewayApiUrl?.replace(/\/$/, "") || "";
  if (base) {
    // Ensure path begins with '/'
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalized}`;
  }
  return path; // relative to current origin
}

function authHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const token = authenticationService.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function fetchAvailableMcpTools(): Promise<McpTool[]> {
  if (isPlaygroundMode()) {
    debugLogger.info("Skipping remote MCP tool fetch — playground mode active");
    return [];
  }

  const url = buildUrl('/mcp/tools');
  try {
    const res = await fetch(url, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to load MCP tools (${res.status})`);
    }
    return data as McpTool[];
  } catch (error) {
    debugLogger.error('Failed to fetch MCP tools', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

export async function fetchMcpHealth(): Promise<McpHealthResponse> {
  if (isPlaygroundMode()) {
    debugLogger.info("Returning mocked MCP health — playground mode active");
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      totalTools: 0,
      enabledTools: 0,
      availableTools: [],
    };
  }

  const url = buildUrl('/mcp/health');
  try {
    const res = await fetch(url, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to fetch MCP health (${res.status})`);
    }
    return data as McpHealthResponse;
  } catch (error) {
    debugLogger.error('Failed to fetch MCP health', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import { authenticationService } from "../auth/authenticationService";

/**
 * Client for the gateway's MCP host (phase 1 backend at /api/mcp/servers + /invoke).
 * Lets users connect their own remote MCP servers; the gateway holds the configs
 * and proxies discovery/invocation. Mirrors mcpService's gateway-base + bearer
 * conventions (gatewayApiUrl already ends in /api, so paths start with /mcp/...).
 */

export interface McpServer {
  id: string;
  name: string;
  url: string;
  authType: string;
  hasAuth: boolean;
  headerName?: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface McpServerInput {
  name: string;
  url: string;
  authType?: "none" | "bearer" | "header";
  authValue?: string;
  headerName?: string;
  enabled?: boolean;
}

export interface McpDiscoveredTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

const gatewayBase = (): string => {
  const settings = usePackageSettingsStore.getState().settings;
  const url = settings?.gatewayApiUrl?.replace(/\/$/, "");
  if (!url) throw new Error("Gateway API is not configured.");
  return url;
};

const authHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = authenticationService.getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

const parse = async (res: Response) => {
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message =
      (body && typeof body === "object" && (body.error || body.message)) ||
      `Request failed (${res.status})`;
    throw new Error(String(message));
  }
  return body;
};

export const listMcpServers = async (): Promise<McpServer[]> =>
  parse(await fetch(`${gatewayBase()}/mcp/servers`, { headers: authHeaders() }));

export const addMcpServer = async (input: McpServerInput): Promise<McpServer> =>
  parse(
    await fetch(`${gatewayBase()}/mcp/servers`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(input),
    }),
  );

export const updateMcpServer = async (
  id: string,
  input: Partial<McpServerInput>,
): Promise<McpServer> =>
  parse(
    await fetch(`${gatewayBase()}/mcp/servers/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(input),
    }),
  );

export const deleteMcpServer = async (id: string): Promise<void> => {
  const res = await fetch(`${gatewayBase()}/mcp/servers/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Could not remove the server (${res.status}).`);
  }
};

export const discoverMcpTools = async (
  id: string,
): Promise<{ serverId: string; server: string; tools: McpDiscoveredTool[] }> =>
  parse(await fetch(`${gatewayBase()}/mcp/servers/${encodeURIComponent(id)}/tools`, { headers: authHeaders() }));

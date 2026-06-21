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

// Bandit Engine Watermark: BL-WM-BF8A-82BFF7
const __banditFingerprint_store_mcpToolsStorets = 'BL-FP-414506-12AF';
const __auditTrail_store_mcpToolsStorets = 'BL-AU-MGOIKVW4-PIWV';
// File: mcpToolsStore.ts | Path: src/store/mcpToolsStore.ts | Hash: bf8a12af

import { create } from "zustand";
import indexedDBService from "../services/indexedDB/indexedDBService";
import { debugLogger } from "../services/logging/debugLogger";
import { listMcpServers, discoverMcpTools } from "../services/mcp/mcpServersService";

// Sanitize an MCP tool into a valid, namespaced function name for the model.
const sanitizeMcpToolName = (raw: string): string =>
  raw.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, 60);

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
    };
  };
  endpoint?: string; // API endpoint for gateway calls
  method?: "GET" | "POST" | "PUT" | "DELETE";
  isBuiltIn?: boolean;
  // Set when this tool comes from a user-connected MCP server. Such tools are
  // invoked through POST /mcp/invoke (not a fixed endpoint) and are never
  // persisted to IndexedDB — they're re-discovered from the gateway each load.
  mcpServerId?: string;
  mcpToolName?: string; // the tool's real name on the MCP server
}

interface MCPToolsStore {
  tools: MCPTool[];
  isLoaded: boolean;
  addTool: (tool: Omit<MCPTool, "id">) => void;
  updateTool: (id: string, updates: Partial<MCPTool>) => void;
  deleteTool: (id: string) => void;
  toggleTool: (id: string) => void;
  loadTools: () => Promise<void>;
  saveTools: () => Promise<void>;
  getEnabledTools: () => MCPTool[];
  loadMcpServerTools: () => Promise<void>;
}

// Built-in controller-backed tools
const healthCheckTool: MCPTool = {
  id: "health-check",
  name: "check_gateway_health",
  description: "Check the health status of the gateway API service",
  enabled: true,
  type: "function",
  function: {
    name: "check_gateway_health",
    description: "Check the health status of the gateway API service",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  endpoint: "/mcp/health",
  method: "GET",
  isBuiltIn: true
};

const webSearchTool: MCPTool = {
  id: "web-search",
  name: "web_search",
  description: "Search the web for current information, documentation, and facts",
  enabled: true,
  type: "function",
  function: {
    name: "web_search",
    description: "Search the web and return ranked results with snippets (and an optional summarized answer). Use for current events, documentation, libraries, error messages, and factual lookups.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query — natural language or keywords" },
        count: { type: "number", description: "Number of results to return (1-10, default 5)" },
        include_answer: { type: "boolean", description: "Include a short summarized answer when available" }
      },
      required: ["query"]
    }
  },
  endpoint: "/mcp/web-search",
  method: "GET",
  isBuiltIn: true
};

const webFetchTool: MCPTool = {
  id: "web-fetch",
  name: "web_fetch",
  description: "Fetch the text content of a specific URL",
  enabled: true,
  type: "function",
  function: {
    name: "web_fetch",
    description: "Fetch a single public URL and return its trimmed text content. Use when you already have a specific link you need to read.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "Absolute http(s) URL to fetch" }
      },
      required: ["url"]
    }
  },
  endpoint: "/mcp/web-fetch",
  method: "GET",
  isBuiltIn: true
};

// New: Image Generation tool (OpenAI DALL·E 3)
const imageGenerationTool: MCPTool = {
  id: "image-generation",
  name: "image_generation",
  description: "Generate high-quality images using DALL-E 3 from text prompts",
  enabled: true,
  type: "function",
  function: {
    name: "image_generation",
    description: "Generate high-quality images using DALL-E 3 from text prompts",
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Text description of the image to generate" },
        size: { type: "string", enum: ["1024x1024", "1024x1792", "1792x1024"], description: "Image dimensions" },
        quality: { type: "string", enum: ["standard", "hd"], description: "Image quality" },
        style: { type: "string", enum: ["vivid", "natural"], description: "Style preference" }
      },
      required: ["prompt"]
    }
  },
  endpoint: "/mcp/generate-image",
  method: "POST",
  isBuiltIn: true
};

// Create a downloadable file for the user (stored ~1 hour at a gateway URL).
const createFileTool: MCPTool = {
  id: "create-file",
  name: "create_file",
  description: "Create a downloadable file for the user (md, txt, csv, json, html, docx, pptx). Returns a temporary (~1 hour) download link.",
  enabled: true,
  type: "function",
  function: {
    name: "create_file",
    description:
      "Generate a file the user can download. For docx/pptx write well-structured Markdown (headings, lists, tables; use '## ' headings to start each slide). Returns a short-lived (~1 hour) download URL — tell the user it expires.",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "The file content (Markdown for docx/pptx; raw text for others)." },
        filename: { type: "string", description: "Desired filename, e.g. 'report.docx' or 'notes.md'." },
        format: {
          type: "string",
          enum: ["md", "txt", "csv", "json", "html", "xml", "yaml", "docx", "pptx"],
          description: "File format. Defaults to md.",
        },
      },
      required: ["content", "format"],
    },
  },
  endpoint: "/mcp/create-file",
  method: "POST",
  isBuiltIn: true,
};

const defaultTools: MCPTool[] = [healthCheckTool, webSearchTool, webFetchTool, imageGenerationTool, createFileTool];

export const useMCPToolsStore = create<MCPToolsStore>((set, get) => ({
  tools: defaultTools,
  isLoaded: false,
  
  addTool: (toolData) => {
    const newTool: MCPTool = {
      ...toolData,
      id: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    set((state) => ({
      tools: [...state.tools, newTool],
    }));
    get().saveTools();
  },
  
  updateTool: (id, updates) => {
    set((state) => ({
      tools: state.tools.map((tool) =>
        tool.id === id ? { ...tool, ...updates } : tool
      ),
    }));
    get().saveTools();
  },
  
  deleteTool: (id) => {
    set((state) => ({
      tools: state.tools.filter((tool) => tool.id !== id || tool.isBuiltIn),
    }));
    get().saveTools();
  },
  
  toggleTool: (id) => {
    set((state) => ({
      tools: state.tools.map((tool) =>
        tool.id === id ? { ...tool, enabled: !tool.enabled } : tool
      ),
    }));
    get().saveTools();
  },
  
  getEnabledTools: () => {
    return get().tools.filter((tool) => tool.enabled);
  },
  
  loadTools: async () => {
    try {
      const storeConfigs = [{ name: "config", keyPath: "id" }];
      const data = await indexedDBService.get("banditConfig", 1, "config", "mcpTools", storeConfigs);
      
      if (data?.tools && Array.isArray(data.tools)) {
        // Merge saved tools with built-in tools, ensuring built-ins always use default definition
        const savedTools = data.tools as MCPTool[];
        const builtInIds = defaultTools.map(t => t.id);
        const customTools = savedTools.filter(
          (tool) => !tool.isBuiltIn && !builtInIds.includes(tool.id)
        );

        set({
          tools: [...defaultTools, ...customTools],
          isLoaded: true
        });
        debugLogger.info("MCP tools loaded from IndexedDB", { 
          totalTools: defaultTools.length + customTools.length,
          builtInTools: defaultTools.length,
          customTools: customTools.length
        });
      } else {
        // First time, save defaults
        set({ isLoaded: true });
        await get().saveTools();
        debugLogger.info("Default MCP tools initialized");
      }
    } catch (error) {
      debugLogger.error("Failed to load MCP tools from IndexedDB", { error });
      set({ isLoaded: true }); // Mark as loaded even if failed, so UI can render
    }
  },
  
  saveTools: async () => {
    try {
      const { tools } = get();
      const storeConfigs = [{ name: "config", keyPath: "id" }];
      
      // Persist only user-defined custom tools — never built-ins or the dynamic
      // tools discovered from MCP servers (those are re-fetched from the gateway).
      const customTools = tools.filter((tool) => !tool.isBuiltIn && !tool.mcpServerId);

      await indexedDBService.put("banditConfig", 1, "config", {
        id: "mcpTools",
        tools: customTools,
      }, storeConfigs);

      debugLogger.debug("MCP tools saved to IndexedDB", { toolCount: customTools.length });
    } catch (error) {
      debugLogger.error("Failed to save MCP tools to IndexedDB", { error });
    }
  },

  // Discover the user's connected MCP servers' tools from the gateway and merge
  // them into the tool list (so the model can call them). Replaces any prior
  // MCP-server tools; best-effort — a single unreachable server is skipped.
  loadMcpServerTools: async () => {
    let servers;
    try {
      servers = await listMcpServers();
    } catch (error) {
      debugLogger.warn("Could not list MCP servers", { error: String(error) });
      return;
    }

    const collected: MCPTool[] = [];
    for (const server of servers.filter((s) => s.enabled)) {
      try {
        const { tools } = await discoverMcpTools(server.id);
        for (const t of tools) {
          const fnName = sanitizeMcpToolName(`mcp_${server.name}_${t.name}`);
          const schema =
            t.inputSchema && typeof t.inputSchema === "object" && (t.inputSchema as { type?: string }).type === "object"
              ? (t.inputSchema as MCPTool["function"]["parameters"])
              : { type: "object" as const, properties: {}, required: [] };
          collected.push({
            id: `mcp-${server.id}-${t.name}`,
            name: fnName,
            description: t.description || `${t.name} (via ${server.name})`,
            enabled: true,
            type: "function",
            function: {
              name: fnName,
              description: t.description || `${t.name} — provided by the ${server.name} MCP server.`,
              parameters: schema,
            },
            mcpServerId: server.id,
            mcpToolName: t.name,
          });
        }
      } catch (error) {
        debugLogger.warn("Failed to discover tools for MCP server", { server: server.name, error: String(error) });
      }
    }

    set((state) => ({
      tools: [...state.tools.filter((t) => !t.mcpServerId), ...collected],
    }));
    debugLogger.info("MCP server tools loaded", { count: collected.length });
  },
}));

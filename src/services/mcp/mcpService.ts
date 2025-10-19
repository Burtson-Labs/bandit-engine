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

// Bandit Engine Watermark: BL-WM-1A78-E27B68
const __banditFingerprint_mcp_mcpServicets = 'BL-FP-11075C-9BD5';
const __auditTrail_mcp_mcpServicets = 'BL-AU-MGOIKVVV-87H3';
// File: mcpService.ts | Path: src/services/mcp/mcpService.ts | Hash: 1a789bd5

import { useMCPToolsStore } from "../../store/mcpToolsStore";
import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import { authenticationService } from "../auth/authenticationService";
import { debugLogger } from "../logging/debugLogger";

export interface MCPToolCall {
  toolName: string;
  parameters?: Record<string, unknown>;
}

export interface MCPToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

const isPlaygroundMode = (): boolean => {
  const settings = usePackageSettingsStore.getState().settings;
  if (!settings) {
    return false;
  }
  const gatewayUrl = settings.gatewayApiUrl?.toLowerCase() ?? "";
  return Boolean(settings.playgroundMode || gatewayUrl.startsWith("playground://"));
};

/**
 * Execute an MCP tool by name with the given parameters
 */
export const executeMCPTool = async (toolCall: MCPToolCall): Promise<MCPToolResult> => {
  try {
    const { tools } = useMCPToolsStore.getState();
    const { settings } = usePackageSettingsStore.getState();

    if (isPlaygroundMode()) {
      debugLogger.info("Skipping MCP tool execution in playground mode", { toolName: toolCall.toolName });
      return {
        success: false,
        error: "MCP tools are disabled while playground mode is active."
      };
    }
    
    // Find the tool
    const tool = tools.find(t => t.function.name === toolCall.toolName && t.enabled);
    if (!tool) {
      return {
        success: false,
        error: `Tool '${toolCall.toolName}' not found or not enabled`
      };
    }
    
    // Ensure gateway is configured (tool execution goes through gateway)
    if (!settings?.gatewayApiUrl) {
      return {
        success: false,
        error: "Gateway API not configured"
      };
    }

    // Check if tool has an endpoint
    if (!tool.endpoint) {
      return {
        success: false,
        error: `Tool '${toolCall.toolName}' has no endpoint configured`
      };
    }
    
    // Build the API call
    const base = settings.gatewayApiUrl.replace(/\/$/, "");
    let url = `${base}${tool.endpoint}`;
    const method = tool.method || 'GET';
    
    debugLogger.info("Executing MCP tool", { 
      toolName: toolCall.toolName, 
      method, 
      endpoint: tool.endpoint,
      parameters: toolCall.parameters 
    });
    
    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    // Add authentication if available
    const token = authenticationService.getToken();
    if (token) {
      requestOptions.headers = {
        ...requestOptions.headers,
        'Authorization': `Bearer ${token}`,
      };
    }
    
    // Attach parameters
    if (toolCall.parameters && Object.keys(toolCall.parameters).length > 0) {
      if (method === 'GET' || method === 'DELETE') {
        // Append as query string
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(toolCall.parameters)) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, String(v)));
          } else if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        }
        const qs = params.toString();
        if (qs) {
          url += (url.includes('?') ? '&' : '?') + qs;
        }
      } else {
        // Add body for POST/PUT requests
        requestOptions.body = JSON.stringify(toolCall.parameters);
      }
    }
    
    // Make the API call
    const response = await fetch(url, requestOptions);
    const data = await response.json();
    
    if (!response.ok) {
      debugLogger.error("MCP tool execution failed", { 
        toolName: toolCall.toolName, 
        status: response.status, 
        statusText: response.statusText,
        data 
      });
      
      return {
        success: false,
        error: `API call failed: ${response.status} ${response.statusText}`,
        data
      };
    }
    
    debugLogger.info("MCP tool executed successfully", { 
      toolName: toolCall.toolName, 
      resultPreview: JSON.stringify(data).substring(0, 200) + "..."
    });
    
    return {
      success: true,
      data
    };
    
  } catch (error) {
    debugLogger.error("MCP tool execution error", { 
      toolName: toolCall.toolName, 
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

/**
 * Get all enabled MCP tools formatted for AI provider consumption
 */
export const getEnabledMCPToolsForAI = () => {
  const { getEnabledTools } = useMCPToolsStore.getState();
  const enabledTools = getEnabledTools();
  
  return enabledTools.map(tool => ({
    type: tool.type,
    function: tool.function
  }));
};

/**
 * Check if MCP tools are available and configured
 */
export const isMCPAvailable = (): boolean => {
  if (isPlaygroundMode()) {
    return false;
  }

  const { settings } = usePackageSettingsStore.getState();
  const { tools } = useMCPToolsStore.getState();
  
  return !!(settings?.gatewayApiUrl && tools.some(t => t.enabled));
};

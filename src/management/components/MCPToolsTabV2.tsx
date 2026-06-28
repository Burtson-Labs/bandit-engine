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

// Bandit Engine Watermark: BL-WM-6468-24BE3B
const __banditFingerprint_components_MCPToolsTabV2tsx = 'BL-FP-885971-25D5';
const __auditTrail_components_MCPToolsTabV2tsx = 'BL-AU-MGOIKVVJ-JBSK';
// File: MCPToolsTabV2.tsx | Path: src/management/components/MCPToolsTabV2.tsx | Hash: 646825d5

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Typography, Paper, IconButton, Tooltip, LinearProgress, Switch } from '@mui/material';
import { fetchAvailableMcpTools, fetchMcpHealth, McpTool } from '../../services/mcp/mcpControllerService';
import McpServersSection from './McpServersSection';
import { useMCPToolsStore } from '../../store/mcpToolsStore';
import { usePackageSettingsStore } from '../../store/packageSettingsStore';
import { RefreshIcon } from "../../icons/lucide-icons";

const MCPToolsTabV2: React.FC = () => {
  const { settings } = usePackageSettingsStore();
  const { tools: localTools, loadTools, toggleTool, addTool, updateTool, isLoaded } = useMCPToolsStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tools, setTools] = useState<McpTool[]>([]);
  const [health, setHealth] = useState<{ status: 'healthy' | 'unhealthy' | 'unknown'; timestamp?: string } | null>(null);

  const gatewayConfigured = !!settings?.gatewayApiUrl;

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await loadTools(); // ensure local store is hydrated
      const [serverTools, healthResp] = await Promise.all([
        fetchAvailableMcpTools(),
        fetchMcpHealth().catch(() => null)
      ]);
      setTools(serverTools);
      // Merge controller tools into local store to keep AI enablement aligned
      serverTools.forEach(ct => {
        const functionName = (ct.id || ct.name).replace(/[^a-zA-Z0-9_]/g, '_');
        let match = localTools.find(lt => lt.function.name === functionName);
        if (!match) {
          match = localTools.find(lt => lt.function.name === ct.id);
        }
        if (!match) {
          match = localTools.find(lt => lt.id === ct.id);
        }
        
        if (!match) {
          // Add a new local tool representation to allow enabling for AI
          addTool({
            name: functionName,
            description: ct.description,
            enabled: ct.isEnabled, // Use server's enabled state for new tools
            type: 'function',
            function: {
              name: ct.id, // Use server ID as function name for better mapping
              description: ct.description,
              parameters: { type: 'object', properties: {}, required: [] },
            },
            endpoint: `/mcp/${ct.id}`,
            method: 'GET',
            isBuiltIn: false,
          });
        } else {
          // For existing tools, sync with server state
          updateTool(match.id, { enabled: ct.isEnabled });
        }
      });
      if (healthResp) {
        const status = healthResp.status === 'healthy' || healthResp.status === 'unhealthy'
          ? healthResp.status
          : 'unknown';
        setHealth({ status, timestamp: healthResp.timestamp });
      } else {
        setHealth({ status: 'unknown' });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load MCP data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      refresh();
    } else {
      // Ensure local tools are loaded first
      loadTools().then(() => {
        refresh();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const localEnabledMap = useMemo(() => {
    const map = new Map<string, boolean>();
    
    // Sort tools to prioritize built-in tools over custom duplicates
    const sortedTools = [...localTools].sort((a, b) => {
      // Built-in tools (shorter, cleaner IDs) come first
      if (a.isBuiltIn && !b.isBuiltIn) return -1;
      if (!a.isBuiltIn && b.isBuiltIn) return 1;
      // Among non-built-in tools, shorter IDs (likely original) come first
      return a.id.length - b.id.length;
    });
    
    sortedTools.forEach(t => {
      // Map by function name (primary)
      map.set(t.function.name, t.enabled);
      // Also map by tool id for easier lookup
      map.set(t.id, t.enabled);
      // Map by tool name for fallback
      if (t.name) {
        map.set(t.name, t.enabled);
      }
    });
    
    return map;
  }, [localTools]);

  return (
    <Box>
      <McpServersSection />

      {/* Built-in capabilities — things Bandit can do on its own */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.6 }}>
            Built-in capabilities
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Tooltip title={`Controller: ${health?.status || 'unknown'}`}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor:
                    health?.status === 'healthy'
                      ? 'success.main'
                      : health?.status === 'unhealthy'
                        ? 'error.main'
                        : 'grey.500',
                }}
              />
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={refresh}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Things Bandit can do on its own — toggle what it’s allowed to use.
        </Typography>

        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {!gatewayConfigured && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Using this origin for tool endpoints (no gateway URL configured).
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 1.25,
          }}
        >
          {tools.map((tool) => {
            let locallyEnabled = localEnabledMap.get(tool.id);
            if (locallyEnabled === undefined) {
              locallyEnabled = localEnabledMap.get(tool.name);
            }
            if (locallyEnabled === undefined) {
              const directLookup = localTools.find(
                (t) => t.id === tool.id || t.function.name === tool.id || t.name === tool.name,
              );
              locallyEnabled = directLookup?.enabled ?? tool.isEnabled;
            }

            return (
              <Paper
                key={tool.id}
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {tool.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                    {tool.description}
                  </Typography>
                </Box>
                <Switch
                  size="small"
                  checked={!!locallyEnabled}
                  sx={{ flexShrink: 0 }}
                  onChange={() => {
                    let local = localTools.find((t) => t.function.name === tool.id);
                    if (!local) local = localTools.find((t) => t.function.name === tool.name);
                    if (!local) local = localTools.find((t) => t.id === tool.id);
                    if (!local) local = localTools.find((t) => t.name === tool.name);
                    if (local) toggleTool(local.id);
                  }}
                />
              </Paper>
            );
          })}
          {!loading && tools.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No built-in tools reported.
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default MCPToolsTabV2;

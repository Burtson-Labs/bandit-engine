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
import { Box, Typography, Paper, Chip, Stack, IconButton, Tooltip, LinearProgress, Switch, FormControlLabel } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import { fetchAvailableMcpTools, fetchMcpHealth, McpTool } from '../../services/mcp/mcpControllerService';
import { useMCPToolsStore } from '../../store/mcpToolsStore';
import { usePackageSettingsStore } from '../../store/packageSettingsStore';

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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>Available Tools</Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={refresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {!gatewayConfigured && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Gateway API URL isn’t configured. The controller endpoints will be fetched relative to this origin.
          </Typography>
        </Paper>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {health?.status === 'healthy' ? (
            <HealthAndSafetyIcon color="success" />
          ) : health?.status === 'unhealthy' ? (
            <ErrorOutlineIcon color="error" />
          ) : (
            <ErrorOutlineIcon color="disabled" />
          )}
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Controller Health</Typography>
          <Chip
            size="small"
            label={(health?.status || 'unknown').toString()}
            color={health?.status === 'healthy' ? 'success' : health?.status === 'unhealthy' ? 'error' : 'default'}
            sx={{ ml: 1 }}
          />
          {health?.timestamp && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {new Date(health.timestamp).toLocaleString()}
            </Typography>
          )}
        </Box>
      </Paper>

      {loading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
        </Box>
      )}
      {error && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <Stack spacing={2}>
        {tools.map((tool) => {
          // Try multiple lookup strategies to find the local enabled state
          let locallyEnabled = localEnabledMap.get(tool.id); // Try server tool id first
          if (locallyEnabled === undefined) {
            locallyEnabled = localEnabledMap.get(tool.name); // Try server tool name
          }
          if (locallyEnabled === undefined) {
            // Fallback to direct lookup in localTools array (more reliable)
            const directLookup = localTools.find(t => 
              t.id === tool.id || 
              t.function.name === tool.id || 
              t.name === tool.name
            );
            locallyEnabled = directLookup?.enabled ?? tool.isEnabled;
          }
          
          return (
            <Paper key={tool.id} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{tool.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {tool.description}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FormControlLabel
                    control={<Switch checked={!!locallyEnabled} onChange={() => {
                      // Find the corresponding local tool using multiple strategies
                      let local = localTools.find(t => t.function.name === tool.id);
                      if (!local) {
                        local = localTools.find(t => t.function.name === tool.name);
                      }
                      if (!local) {
                        local = localTools.find(t => t.id === tool.id);
                      }
                      if (!local) {
                        local = localTools.find(t => t.name === tool.name);
                      }
                      
                      if (local) {
                        toggleTool(local.id);
                      } else {
                        console.warn('Could not find local tool for server tool:', tool);
                      }
                    }} />}
                    label={locallyEnabled ? 'Enabled' : 'Disabled'}
                  />
                  <Tooltip title="Controller-driven tools (read-only schema)">
                    <SettingsIcon color="disabled" />
                  </Tooltip>
                </Box>
              </Box>
              {!!tool.supportedParameters?.length && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">Supported parameters</Typography>
                  <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {tool.supportedParameters.map((p) => (
                      <Chip key={p} size="small" label={p} />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
};

export default MCPToolsTabV2;

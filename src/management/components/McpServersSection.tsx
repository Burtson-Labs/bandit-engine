import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  FormControlLabel,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { AddIcon, CloudIcon, DeleteIcon, RefreshIcon } from '../../icons/lucide-icons';
import {
  addMcpServer,
  deleteMcpServer,
  discoverMcpTools,
  listMcpServers,
  updateMcpServer,
  type McpDiscoveredTool,
  type McpServer,
  type McpServerInput,
} from '../../services/mcp/mcpServersService';
import { useMCPToolsStore } from '../../store/mcpToolsStore';

const emptyForm: McpServerInput = { name: '', url: '', authType: 'none', authValue: '', headerName: '' };

type ToolState = McpDiscoveredTool[] | { error: string } | 'loading' | undefined;

const McpServersSection = () => {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<McpServerInput>(emptyForm);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tools, setTools] = useState<Record<string, ToolState>>({});
  const reloadChatTools = useMCPToolsStore((s) => s.loadMcpServerTools);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setServers(await listMcpServers());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load MCP servers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.url.trim()) {
      setError('Name and URL are required.');
      return;
    }
    setAdding(true);
    setError(null);
    try {
      await addMcpServer({
        name: form.name.trim(),
        url: form.url.trim(),
        authType: form.authType,
        authValue: form.authType === 'none' ? undefined : form.authValue,
        headerName: form.authType === 'header' ? form.headerName : undefined,
      });
      setForm(emptyForm);
      setShowForm(false);
      await refresh();
      void reloadChatTools();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add the server.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await deleteMcpServer(id);
      await refresh();
      void reloadChatTools();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove the server.');
    }
  };

  const handleToggle = async (server: McpServer) => {
    setError(null);
    try {
      await updateMcpServer(server.id, { enabled: !server.enabled });
      await refresh();
      void reloadChatTools();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the server.');
    }
  };

  const handleDiscover = async (id: string) => {
    setTools((prev) => ({ ...prev, [id]: 'loading' }));
    try {
      const { tools: discovered } = await discoverMcpTools(id);
      setTools((prev) => ({ ...prev, [id]: discovered }));
    } catch (e) {
      setTools((prev) => ({ ...prev, [id]: { error: e instanceof Error ? e.message : 'Could not connect.' } }));
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 1, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudIcon />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            MCP Servers
          </Typography>
          <Chip size="small" label={String(servers.length)} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={refresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm((v) => !v)}>
            Add server
          </Button>
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Connect a remote Model Context Protocol server to give the assistant its tools. The gateway holds the
        connection and proxies calls — your browser never talks to the server directly.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Collapse in={showForm}>
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Name"
              size="small"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. github"
              fullWidth
            />
            <TextField
              label="Server URL"
              size="small"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://mcp.example.com/mcp"
              fullWidth
            />
            <TextField
              select
              label="Auth"
              size="small"
              value={form.authType}
              onChange={(e) => setForm({ ...form, authType: e.target.value as McpServerInput['authType'] })}
              sx={{ maxWidth: 220 }}
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="bearer">Bearer token</MenuItem>
              <MenuItem value="header">Custom header</MenuItem>
            </TextField>
            {form.authType === 'header' && (
              <TextField
                label="Header name"
                size="small"
                value={form.headerName}
                onChange={(e) => setForm({ ...form, headerName: e.target.value })}
                placeholder="X-Api-Key"
                fullWidth
              />
            )}
            {form.authType !== 'none' && (
              <TextField
                label={form.authType === 'bearer' ? 'Token' : 'Header value'}
                size="small"
                type="password"
                value={form.authValue}
                onChange={(e) => setForm({ ...form, authValue: e.target.value })}
                fullWidth
              />
            )}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={handleAdd} disabled={adding}>
                {adding ? 'Adding…' : 'Add server'}
              </Button>
              <Button
                onClick={() => {
                  setShowForm(false);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Collapse>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Stack spacing={1.5}>
        {servers.length === 0 && !loading && (
          <Typography variant="body2" color="text.secondary">
            No MCP servers connected yet.
          </Typography>
        )}
        {servers.map((server) => {
          const toolState = tools[server.id];
          return (
            <Paper key={server.id} variant="outlined" sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {server.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                    {server.url}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                  {server.hasAuth && <Chip size="small" label={server.authType} />}
                  <Tooltip title={server.enabled ? 'Enabled' : 'Disabled'}>
                    <FormControlLabel
                      sx={{ mr: 0 }}
                      control={<Switch size="small" checked={server.enabled} onChange={() => handleToggle(server)} />}
                      label=""
                    />
                  </Tooltip>
                  <Tooltip title="Test & list tools">
                    <IconButton size="small" onClick={() => handleDiscover(server.id)}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove">
                    <IconButton size="small" onClick={() => handleDelete(server.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {toolState === 'loading' && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="text.secondary">
                    Connecting…
                  </Typography>
                </Box>
              )}
              {Array.isArray(toolState) && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {toolState.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      Connected — no tools reported.
                    </Typography>
                  ) : (
                    toolState.map((t) => (
                      <Tooltip key={t.name} title={t.description || ''}>
                        <Chip size="small" label={t.name} />
                      </Tooltip>
                    ))
                  )}
                </Box>
              )}
              {toolState && !Array.isArray(toolState) && toolState !== 'loading' && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  {toolState.error}
                </Alert>
              )}
            </Paper>
          );
        })}
      </Stack>
    </Paper>
  );
};

export default McpServersSection;

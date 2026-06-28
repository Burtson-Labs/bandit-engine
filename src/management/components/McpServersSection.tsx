import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  CircularProgress,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Link,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { AddIcon, DeleteIcon, RefreshIcon } from '../../icons/lucide-icons';
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

/**
 * Curated remote MCP servers people actually want to connect. These are hosted
 * (the gateway can reach them); each "Connect" pre-fills the form so the user
 * only has to paste their access token / authorize. `tokenHelp` links to where
 * the provider issues a token. Local-only servers (Figma Dev Mode, Azure DevOps)
 * live behind the custom option since the cloud gateway can't reach localhost.
 */
type CatalogEntry = {
  key: string;
  name: string;
  blurb: string;
  letter: string;
  accent: string;
  url: string;
  authType: McpServerInput['authType'];
  tokenLabel?: string;
  tokenHelp?: string;
};

const CATALOG: CatalogEntry[] = [
  {
    key: 'linear',
    name: 'Linear',
    blurb: 'Create and track issues, projects, and cycles',
    letter: 'L',
    accent: '#5E6AD2',
    url: 'https://mcp.linear.app/sse',
    authType: 'bearer',
    tokenLabel: 'Linear API key',
    tokenHelp: 'https://linear.app/settings/api',
  },
  {
    key: 'notion',
    name: 'Notion',
    blurb: 'Search and update pages across your workspace',
    letter: 'N',
    accent: '#0f0f0f',
    url: 'https://mcp.notion.com/mcp',
    authType: 'bearer',
    tokenLabel: 'Notion integration token',
    tokenHelp: 'https://www.notion.so/my-integrations',
  },
  {
    key: 'github',
    name: 'GitHub',
    blurb: 'Issues, pull requests, code search, and actions',
    letter: 'G',
    accent: '#24292f',
    url: 'https://api.githubcopilot.com/mcp/',
    authType: 'bearer',
    tokenLabel: 'GitHub personal access token',
    tokenHelp: 'https://github.com/settings/tokens',
  },
  {
    key: 'sentry',
    name: 'Sentry',
    blurb: 'Triage errors and inspect production issues',
    letter: 'S',
    accent: '#362D59',
    url: 'https://mcp.sentry.dev/mcp',
    authType: 'bearer',
    tokenLabel: 'Sentry auth token',
    tokenHelp: 'https://sentry.io/settings/auth-tokens/',
  },
  {
    key: 'atlassian',
    name: 'Jira & Confluence',
    blurb: 'Atlassian issues, boards, and docs',
    letter: 'J',
    accent: '#0052CC',
    url: 'https://mcp.atlassian.com/v1/sse',
    authType: 'bearer',
    tokenLabel: 'Atlassian API token',
    tokenHelp: 'https://id.atlassian.com/manage-profile/security/api-tokens',
  },
  {
    key: 'stripe',
    name: 'Stripe',
    blurb: 'Payments, customers, and invoices',
    letter: 'S',
    accent: '#635BFF',
    url: 'https://mcp.stripe.com',
    authType: 'bearer',
    tokenLabel: 'Stripe restricted key',
    tokenHelp: 'https://dashboard.stripe.com/apikeys',
  },
];

const McpServersSection = () => {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<McpServerInput>(emptyForm);
  const [activeEntry, setActiveEntry] = useState<CatalogEntry | null>(null);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tools, setTools] = useState<Record<string, ToolState>>({});
  const reloadChatTools = useMCPToolsStore((s) => s.loadMcpServerTools);
  const formRef = useRef<HTMLDivElement | null>(null);

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

  const connectedKeys = new Set(servers.map((s) => s.url.replace(/\/+$/, '')));

  const openForCatalog = (entry: CatalogEntry) => {
    setActiveEntry(entry);
    setForm({ name: entry.name, url: entry.url, authType: entry.authType, authValue: '', headerName: '' });
    setShowForm(true);
    setError(null);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  };

  const openCustom = () => {
    setActiveEntry(null);
    setForm(emptyForm);
    setShowForm((v) => !v);
    setError(null);
  };

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
      setActiveEntry(null);
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
    <Box>
      {/* Plain-language intro — what this is and why anyone would use it */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Connect your tools
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 680, lineHeight: 1.6 }}>
          Let Bandit work inside the apps you already use — open a Linear issue, search Notion, or
          triage a Sentry error right from chat. Connect a service once; the gateway holds the
          connection securely, so your browser never talks to it directly.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Catalog of popular integrations */}
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.6 }}>
        Popular integrations
      </Typography>
      <Box
        sx={{
          mt: 1,
          mb: 3,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 1.25,
        }}
      >
        {CATALOG.map((entry) => {
          const connected = connectedKeys.has(entry.url.replace(/\/+$/, ''));
          return (
            <Paper
              key={entry.key}
              variant="outlined"
              sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                borderRadius: 2,
                transition: 'border-color 0.15s ease, transform 0.15s ease',
                '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 16,
                  bgcolor: entry.accent,
                }}
              >
                {entry.letter}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {entry.name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', lineHeight: 1.35 }}
                >
                  {entry.blurb}
                </Typography>
              </Box>
              {connected ? (
                <Chip size="small" color="success" label="Added" sx={{ flexShrink: 0 }} />
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => openForCatalog(entry)}
                  sx={{ flexShrink: 0, minWidth: 0 }}
                >
                  Connect
                </Button>
              )}
            </Paper>
          );
        })}
      </Box>

      {/* Connect form — pre-filled from the catalog, or blank for a custom server */}
      <Box ref={formRef}>
        <Collapse in={showForm}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              {activeEntry ? `Connect ${activeEntry.name}` : 'Add a custom server'}
            </Typography>
            {activeEntry?.tokenHelp && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Paste your {activeEntry.tokenLabel}.{' '}
                <Link href={activeEntry.tokenHelp} target="_blank" rel="noopener noreferrer">
                  Get one here →
                </Link>
              </Typography>
            )}
            <Stack spacing={1.75}>
              <TextField
                label="Name"
                size="small"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Linear"
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
                  label={
                    activeEntry?.tokenLabel ?? (form.authType === 'bearer' ? 'Token' : 'Header value')
                  }
                  size="small"
                  type="password"
                  value={form.authValue}
                  onChange={(e) => setForm({ ...form, authValue: e.target.value })}
                  fullWidth
                />
              )}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={handleAdd} disabled={adding}>
                  {adding ? 'Connecting…' : 'Connect'}
                </Button>
                <Button
                  onClick={() => {
                    setShowForm(false);
                    setActiveEntry(null);
                    setForm(emptyForm);
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Collapse>
      </Box>

      {/* Connected servers */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.6 }}>
          Your connections{servers.length ? ` (${servers.length})` : ''}
        </Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={openCustom}>
          Custom server
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Stack spacing={1.25}>
        {servers.length === 0 && !loading && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
            Nothing connected yet — pick a tool above to get started.
          </Typography>
        )}
        {servers.map((server) => {
          const toolState = tools[server.id];
          return (
            <Paper key={server.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
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

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, lineHeight: 1.5 }}>
        Running a local server (Figma Dev Mode, Azure DevOps)? Add it as a custom server — note the
        cloud gateway can't reach <code>localhost</code>, so local servers need the Bandit desktop app.
      </Typography>
    </Box>
  );
};

export default McpServersSection;

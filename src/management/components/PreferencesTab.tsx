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

// Bandit Engine Watermark: BL-WM-0A6C-FE4A94
const __banditFingerprint_components_PreferencesTabtsx = 'BL-FP-D52A4A-DEAB';
const __auditTrail_components_PreferencesTabtsx = 'BL-AU-MGOIKVVK-ISXN';
// File: PreferencesTab.tsx | Path: src/management/components/PreferencesTab.tsx | Hash: 0a6cdeab

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Button,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  Alert,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LinkIcon from '@mui/icons-material/Link';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import RestoreIcon from '@mui/icons-material/Restore';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SyncIcon from '@mui/icons-material/Sync';
import RefreshIcon from '@mui/icons-material/Refresh';
import { UserPreferences, usePreferencesStore } from "../../store/preferencesStore";
import { useModelStore } from "../../store/modelStore";
import { useVoiceStore } from "../../store/voiceStore";
import { useFeatures } from "../../hooks/useFeatures";
import { PackageSettings } from "../../store/packageSettingsStore";
import { useConversationSyncStore } from "../../store/conversationSyncStore";
import { useGatewayHealth } from "../../hooks/useGatewayQueries";

interface PreferencesTabProps {
  preferences: UserPreferences;
  packageSettings: PackageSettings | null;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  handleSavePreferences: () => void;
  showSnackbar?: (message: string, severity: 'success' | 'error') => void;
}

const PreferencesTab: React.FC<PreferencesTabProps> = ({
  preferences,
  packageSettings,
  updatePreference,
  handleSavePreferences,
  showSnackbar,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [homeUrlStatus, setHomeUrlStatus] = useState<'idle' | 'valid' | 'invalid' | 'saving' | 'saved'>('idle');
  const [homeUrlError, setHomeUrlError] = useState<string>('');
  const [localHomeUrl, setLocalHomeUrl] = useState(preferences.homeUrl || '');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncToggleLoading, setSyncToggleLoading] = useState(false);
  const [manualSyncLoading, setManualSyncLoading] = useState(false);
  const [advancedVectorToggleLoading, setAdvancedVectorToggleLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Access the preferences store for export/import/reset functions
  const { exportPreferences, importPreferences, resetToDefaults } = usePreferencesStore();

  // Access voice store for TTS/STT service availability
  const { isServiceAvailable: isTTSSTTAvailable } = useVoiceStore();

  // Access feature flags for advanced features toggle
  const { hasAdvancedSearch, hasAdvancedMemories } = useFeatures();

  const {
    initialized: syncInitialized,
    syncEnabled,
    status: syncStatus,
    lastSyncAt,
    lastError: syncError,
    conflicts,
    pendingConversationUpserts,
    pendingConversationDeletes,
    pendingProjectUpserts,
    pendingProjectDeletes,
    totalConversationsOnServer,
    totalProjectsOnServer,
    warningConversations,
    oversizedConversations,
    setSyncEnabled,
    isAdvancedVectorFeaturesEnabled,
    setAdvancedVectorFeaturesEnabled,
    runSync,
  } = useConversationSyncStore((state) => ({
    initialized: state.initialized,
    syncEnabled: state.syncEnabled,
    status: state.status,
    lastSyncAt: state.lastSyncAt,
    lastError: state.lastError,
    conflicts: state.conflicts,
    pendingConversationUpserts: state.pendingConversationUpserts,
    pendingConversationDeletes: state.pendingConversationDeletes,
    pendingProjectUpserts: state.pendingProjectUpserts,
    pendingProjectDeletes: state.pendingProjectDeletes,
    totalConversationsOnServer: state.totalConversationsOnServer,
    totalProjectsOnServer: state.totalProjectsOnServer,
    warningConversations: state.warningConversations,
    oversizedConversations: state.oversizedConversations,
    setSyncEnabled: state.setSyncEnabled,
    isAdvancedVectorFeaturesEnabled: state.isAdvancedVectorFeaturesEnabled,
    setAdvancedVectorFeaturesEnabled: state.setAdvancedVectorFeaturesEnabled,
    runSync: state.runSync,
  }));

  const spinSx = {
    animation: 'spin 1s linear infinite',
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
  } as const;

  const syncStatusLabel = (() => {
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing';
      case 'error':
        return 'Attention needed';
      case 'idle':
        return 'Up to date';
      case 'disabled':
      default:
        return 'Not syncing';
    }
  })();

  const syncIcon = (() => {
    switch (syncStatus) {
      case 'syncing':
        return <SyncIcon color="primary" sx={spinSx} fontSize="small" />;
      case 'idle':
        return <CloudDoneIcon color="success" fontSize="small" />;
      case 'error':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'disabled':
      default:
        return <CloudOffIcon color="action" fontSize="small" />;
    }
  })();

  const pendingCount =
    pendingConversationUpserts.size +
    pendingConversationDeletes.size +
    pendingProjectUpserts.size +
    pendingProjectDeletes.size;

  const conflictCount =
    (conflicts?.conversationConflicts.length ?? 0) +
    (conflicts?.projectConflicts.length ?? 0);

  const lastSyncDisplay = lastSyncAt ? new Date(lastSyncAt).toLocaleString() : 'Never';

  const MAX_CONVERSATION_MB = 12;
  const WARN_CONVERSATION_MB = 10;
  const formatBytesToMB = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  const renderNoticeList = (notices: typeof warningConversations) => (
    <Box component="ul" sx={{ pl: 2, mb: 0 }}>
      {notices.map((notice) => (
        <Box component="li" key={notice.id} sx={{ mb: 0.5 }}>
          <Typography component="span" variant="body2" color="text.primary">
            {(notice.name && notice.name.trim()) || 'Untitled conversation'}
          </Typography>
          <Typography component="span" variant="body2" color="text.secondary">
            {` — ${formatBytesToMB(notice.sizeBytes)} / ${MAX_CONVERSATION_MB} MB`}
          </Typography>
        </Box>
      ))}
    </Box>
  );

  const gatewayConfigured = Boolean(packageSettings?.gatewayApiUrl);

  const {
    data: gatewayHealth,
    error: gatewayHealthError,
    isLoading: gatewayHealthLoading,
    isFetching: gatewayHealthFetching,
    refetch: refetchGatewayHealth,
  } = useGatewayHealth({
    enabled: gatewayConfigured,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const isGatewayLoading = gatewayHealthLoading || gatewayHealthFetching;

  const gatewayChipLabel = gatewayConfigured
    ? isGatewayLoading
      ? 'Checking…'
      : gatewayHealthError
      ? 'Offline'
      : gatewayHealth
      ? (gatewayHealth.status?.toLowerCase() === 'healthy')
        ? 'Online'
        : 'Offline'
      : 'Unknown'
    : 'Not Configured';

  const gatewayChipColor: 'default' | 'error' | 'success' | 'warning' = (() => {
    if (!gatewayConfigured) return 'default';
    if (gatewayHealthError) return 'error';
    if (isGatewayLoading) return 'default';
    if (!gatewayHealth) return 'warning';
    return (gatewayHealth.status?.toLowerCase() === 'healthy') ? 'success' : 'error';
  })();

  const handleGatewayStatusRefresh = useCallback(() => {
    if (!gatewayConfigured) {
      return;
    }
    refetchGatewayHealth();
  }, [gatewayConfigured, refetchGatewayHealth]);

  const handleSyncToggleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setSyncToggleLoading(true);
    try {
      await setSyncEnabled(enabled);
      if (showSnackbar) {
        showSnackbar(
          enabled ? 'Cloud sync enabled. We will keep this device in parity with Bandit Cloud.' : 'Cloud sync disabled.',
          'success'
        );
      }
    } catch (error) {
      if (showSnackbar) {
        showSnackbar('Failed to update sync preference.', 'error');
      }
    } finally {
      setSyncToggleLoading(false);
    }
  };

  const handleManualSync = async () => {
    setManualSyncLoading(true);
    await runSync({ force: true });
    const statusAfter = useConversationSyncStore.getState().status;
    const message = statusAfter === 'idle'
      ? 'Sync completed successfully.'
      : 'Sync did not complete. Check status details.';
    const severity = statusAfter === 'idle' ? 'success' : 'error';
    if (showSnackbar) {
      showSnackbar(message, severity);
    }
    setManualSyncLoading(false);
  };

  const handleAdvancedVectorToggleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setAdvancedVectorToggleLoading(true);
    try {
      await setAdvancedVectorFeaturesEnabled(enabled);
      if (showSnackbar) {
        showSnackbar(
          enabled
            ? 'Advanced vector features enabled for this account.'
            : 'Advanced vector features disabled.',
          'success'
        );
      }
    } catch (error) {
      if (showSnackbar) {
        showSnackbar('Failed to update advanced vector setting.', 'error');
      }
    } finally {
      setAdvancedVectorToggleLoading(false);
    }
  };

  // URL validation regex - more comprehensive
  const urlRegex = /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.]*))?(?:\#(?:\w*))?)?$/;

  // Get effective home URL (user preference overrides package setting)
  const getEffectiveHomeUrl = () => {
    if (preferences.homeUrl && preferences.homeUrl.trim()) {
      return preferences.homeUrl;
    }
    return packageSettings?.homeUrl || '';
  };

  // Sync local state with preferences when they change externally
  useEffect(() => {
    setLocalHomeUrl(preferences.homeUrl || '');
  }, [preferences.homeUrl]);

  const validateAndSaveHomeUrl = async (url: string) => {
    if (!url.trim()) {
      // Empty URL is valid (will use default)
      setHomeUrlStatus('valid');
      setHomeUrlError('');
      updatePreference('homeUrl', '');
      setHomeUrlStatus('saving');
      try {
        await handleSavePreferences();
        setHomeUrlStatus('saved');
        setTimeout(() => setHomeUrlStatus('idle'), 2000);
      } catch (error) {
        setHomeUrlStatus('invalid');
        setHomeUrlError('Failed to save. Please try again.');
      }
      return;
    }

    if (urlRegex.test(url)) {
      setHomeUrlStatus('valid');
      setHomeUrlError('');
      updatePreference('homeUrl', url);
      setHomeUrlStatus('saving');
      try {
        await handleSavePreferences();
        setHomeUrlStatus('saved');
        setTimeout(() => setHomeUrlStatus('idle'), 2000);
      } catch (error) {
        setHomeUrlStatus('invalid');
        setHomeUrlError('Failed to save. Please try again.');
      }
    } else {
      setHomeUrlStatus('invalid');
      setHomeUrlError('Please enter a valid URL (e.g., https://example.com)');
    }
  };

  const handleHomeUrlChange = (value: string) => {
    setLocalHomeUrl(value);
    setHomeUrlStatus('idle'); // Reset status while typing
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for validation and auto-save
    timeoutRef.current = setTimeout(() => {
      validateAndSaveHomeUrl(value);
    }, 1500); // Increased to 1.5 seconds for better UX
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Export/Import/Reset functions
  const handleExportPreferences = () => {
    const jsonData = exportPreferences();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bandit-preferences-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportPreferences = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = await importPreferences(text);
      
      if (success) {
        setImportStatus('success');
        // Refresh the local state
        setLocalHomeUrl(preferences.homeUrl || '');
        setTimeout(() => setImportStatus('idle'), 3000);
      } else {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    } catch (error) {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetToDefaults = async () => {
    if (confirm('Are you sure you want to reset all preferences to their default values? This action cannot be undone.')) {
      await resetToDefaults();
      setLocalHomeUrl('');
      setHomeUrlStatus('idle');
    }
  };

  const getHomeUrlFieldProps = () => {
    const baseProps = {
      size: "small" as const,
      variant: "outlined" as const,
      fullWidth: true,
    };

    const getHelperText = () => {
      if (homeUrlStatus === 'saving') return "Saving...";
      if (homeUrlStatus === 'invalid') return homeUrlError;
      if (homeUrlStatus === 'valid') return "Valid URL format";
      
      // Default helper text based on current state
      if (localHomeUrl) {
        return `Will navigate to: ${localHomeUrl}`;
      } else if (packageSettings?.homeUrl) {
        return `Will use package default: ${packageSettings.homeUrl}`;
      } else {
        return "Enter a URL for the home button";
      }
    };

    switch (homeUrlStatus) {
      case 'valid':
        return {
          ...baseProps,
          color: "success" as const,
          helperText: getHelperText(),
        };
      case 'invalid':
        return {
          ...baseProps,
          color: "error" as const,
          error: true,
          helperText: getHelperText(),
        };
      case 'saving':
        return {
          ...baseProps,
          color: "primary" as const,
          helperText: getHelperText(),
          disabled: true,
        };
      case 'saved':
        return {
          ...baseProps,
          color: "success" as const,
          helperText: "✓ Saved successfully",
        };
      default:
        return {
          ...baseProps,
          helperText: getHelperText(),
        };
    }
  };

  const getEndAdornment = () => {
    switch (homeUrlStatus) {
      case 'valid':
      case 'saved':
        return (
          <InputAdornment position="end">
            <CheckCircleIcon color="success" fontSize="small" />
          </InputAdornment>
        );
      case 'invalid':
        return (
          <InputAdornment position="end">
            <ErrorIcon color="error" fontSize="small" />
          </InputAdornment>
        );
      case 'saving':
        return (
          <InputAdornment position="end">
            <Box sx={{ 
              width: 16, 
              height: 16, 
              border: '2px solid #1976d2',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }} />
          </InputAdornment>
        );
      default:
        return (
          <InputAdornment position="end">
            <LinkIcon color="action" fontSize="small" />
          </InputAdornment>
        );
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3, md: 4 } }}>
      <Box sx={{ mb: { xs: 2.5, md: 3 } }}>
        <Typography
          variant="h5"
          color="text.primary"
          sx={{ mb: 1, fontWeight: 600, fontSize: { xs: '1.6rem', md: '1.8rem' } }}
        >
          Preferences
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          paragraph
          sx={{ opacity: 0.9, fontSize: { xs: '0.95rem', sm: '1rem' }, lineHeight: 1.5 }}
        >
          Control which AI features are enabled to optimize performance for your device. Disabling features can help
          reduce resource usage on machines with limited capabilities.
        </Typography>

        <Paper sx={{ p: { xs: 1.75, sm: 2.5 }, mb: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>Conversation & Project Sync</Typography>
              <Typography variant="body2" color="text.secondary">
                Mirror conversations and projects to Bandit Cloud so you can resume work on any device. Images stay on this
                machine until a dedicated media pipeline is ready.
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={syncEnabled}
                  onChange={handleSyncToggleChange}
                  color="primary"
                  disabled={!syncInitialized || syncToggleLoading}
                />
              }
              label={
                <Box textAlign="left">
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary" }}>
                    {syncEnabled ? 'Sync enabled' : 'Sync disabled'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {syncInitialized ? 'Toggle at any time from the management panel.' : 'Loading preference…'}
                  </Typography>
                </Box>
              }
              sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, ml: { xs: 0, sm: 2 } }}
            />
          </Box>

          <Box sx={{ mt: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {syncIcon}
              <Typography variant="body2" color="text.primary">{syncStatusLabel}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Last sync: {lastSyncDisplay}
            </Typography>
            {syncEnabled && (
              <Typography variant="body2" color="text.secondary">
                Server totals: {totalConversationsOnServer ?? 0} conversations · {totalProjectsOnServer ?? 0} projects
              </Typography>
            )}
            {pendingCount > 0 && (
              <Chip
                label={`${pendingCount} change${pendingCount === 1 ? '' : 's'} pending upload`}
                color="warning"
                size="small"
              />
            )}
            {conflictCount > 0 && (
              <Chip
                label={`${conflictCount} conflict${conflictCount === 1 ? '' : 's'} to review`}
                color="error"
                size="small"
              />
            )}
          </Box>

          {(hasAdvancedSearch() || hasAdvancedMemories()) && (
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isAdvancedVectorFeaturesEnabled}
                    onChange={handleAdvancedVectorToggleChange}
                    color="primary"
                    disabled={!syncInitialized || advancedVectorToggleLoading}
                  />
                }
                label={
                  <Box textAlign="left">
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary" }}>
                      Advanced vector features
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Keep semantic search, vector memories, and related context in sync across devices
                    </Typography>
                  </Box>
                }
                sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
              />
            </Box>
          )}

        {syncError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {syncError}
          </Alert>
        )}

          {oversizedConversations.length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Start a new conversation to keep syncing with Bandit Cloud.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                These threads exceeded the {MAX_CONVERSATION_MB} MB limit and are skipped until they are shortened:
              </Typography>
              {renderNoticeList(oversizedConversations)}
            </Alert>
          )}

          {warningConversations.length > 0 && oversizedConversations.length === 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                You are nearing the Bandit Cloud size limit.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Consider starting a fresh conversation once these reach about {WARN_CONVERSATION_MB} MB:
              </Typography>
              {renderNoticeList(warningConversations)}
            </Alert>
          )}

          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleManualSync}
              disabled={!syncEnabled || syncStatus === 'syncing' || manualSyncLoading}
              startIcon={syncStatus === 'syncing' || manualSyncLoading ? <SyncIcon sx={spinSx} /> : <CloudDoneIcon />}
            >
              {syncStatus === 'syncing' || manualSyncLoading ? 'Syncing…' : 'Sync now'}
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              Need media support? Images and large files stay local until retention rules are finalized.
            </Typography>
          </Box>
        </Paper>

        <Paper sx={{ p: { xs: 1.75, sm: 2.5 }, mb: { xs: 2, md: 3 } }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "text.primary" }}>Feature Controls</Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: "text.primary", display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinkIcon fontSize="small" color="primary" />
                Home Button URL
              </Typography>
              <TextField
                label="Custom Home URL (optional)"
                value={localHomeUrl}
                onChange={(e) => handleHomeUrlChange(e.target.value)}
                placeholder="https://example.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: getEndAdornment(),
                }}
                {...getHomeUrlFieldProps()}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.memoryEnabled}
                  onChange={(e) => updatePreference('memoryEnabled', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary" }}>Memory</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enable automatic conversation memory and context retention
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.knowledgeDocsEnabled}
                  onChange={(e) => updatePreference('knowledgeDocsEnabled', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary" }}>Knowledge Documents</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use uploaded documents to enhance AI responses
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.moodEnabled}
                  onChange={(e) => updatePreference('moodEnabled', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary" }}>Mood Adaptation</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Allow AI personality to adapt based on conversation tone
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.chatSuggestionsEnabled}
                  onChange={(e) => updatePreference('chatSuggestionsEnabled', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary" }}>Chat Suggestions</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Show suggested prompts and conversation starters
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.ttsEnabled}
                  onChange={(e) => updatePreference('ttsEnabled', e.target.checked)}
                  color="primary"
                  disabled={!isTTSSTTAvailable}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary" }}>Text-to-Speech (TTS)</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isTTSSTTAvailable 
                      ? "Enable AI voice responses"
                      : packageSettings?.gatewayApiUrl 
                        ? "TTS service is currently unavailable"
                        : "TTS service not configured - contact administrator"
                    }
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.sttEnabled}
                  onChange={(e) => updatePreference('sttEnabled', e.target.checked)}
                  color="primary"
                  disabled={!isTTSSTTAvailable}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary" }}>Speech-to-Text (STT)</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isTTSSTTAvailable 
                      ? "Enable voice input and transcription"
                      : packageSettings?.gatewayApiUrl 
                        ? "STT service is currently unavailable"
                        : "STT service not configured - contact administrator"
                    }
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.banditModelsEnabled}
                  onChange={(e) => updatePreference('banditModelsEnabled', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary" }}>Include Bandit Personalities</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Include default Bandit personalities alongside CDN models
                  </Typography>
                </Box>
              }
            />

            {preferences.banditModelsEnabled && (
              <Box sx={{ mt: 2, ml: 4 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RestoreIcon />}
                  onClick={async () => {
                    try {
                      const result = await useModelStore.getState().restoreDeletedBanditModels();
                      if (showSnackbar) {
                        if (result.hadNothingToRestore) {
                          showSnackbar("No deleted Bandit personalities found to restore.", 'success');
                        } else if (result.restored.length > 0) {
                          showSnackbar(`Restored ${result.restored.length} Bandit personalit${result.restored.length === 1 ? 'y' : 'ies'}: ${result.restored.join(', ')}`, 'success');
                        } else {
                          showSnackbar("Bandit personalities restored from deleted list (enable Bandit personalities to see them).", 'success');
                        }
                      }
                    } catch (error) {
                      if (showSnackbar) {
                        showSnackbar("Failed to restore Bandit personalities. Please try again.", 'error');
                      }
                    }
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Restore Deleted Bandit Personalities
                </Button>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                  Restores any Bandit default personalities you may have deleted
                </Typography>
              </Box>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.feedbackEnabled}
                  onChange={(e) => updatePreference('feedbackEnabled', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary" }}>Feedback Button</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Show feedback button in chat interface and other components
                  </Typography>
                </Box>
              }
            />
          </Box>
        </Paper>

        <Paper sx={{ p: { xs: 1.75, sm: 2.5 }, mb: { xs: 2, md: 3 } }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "text.primary" }}>Backup & Restore</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Export your preferences to save your settings, or import previously saved preferences. You can also reset to default values.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportPreferences}
              sx={{ minWidth: { xs: '100%', sm: '160px' } }}
            >
              Export
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={handleImportPreferences}
              color={importStatus === 'success' ? 'success' : importStatus === 'error' ? 'error' : 'primary'}
              sx={{ minWidth: { xs: '100%', sm: '160px' } }}
            >
              {importStatus === 'success' ? '✓ Imported' : importStatus === 'error' ? '✗ Failed' : 'Import'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<RestoreIcon />}
              onClick={handleResetToDefaults}
              color="warning"
              sx={{ minWidth: { xs: '100%', sm: '160px' } }}
            >
              Reset
            </Button>
          </Box>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            style={{ display: 'none' }}
          />
        </Paper>

        <Paper sx={{ p: { xs: 1.75, sm: 2.5 } }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "text.primary" }}>Service Status</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            The following services are configured for this deployment. Contact your administrator for more information about enabling or configuring these services.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>Text-to-Speech (TTS)</Typography>
              <Chip
                label={isTTSSTTAvailable ? "Available" : packageSettings?.gatewayApiUrl ? "Unavailable" : "Not Configured"}
                color={isTTSSTTAvailable ? "success" : packageSettings?.gatewayApiUrl ? "warning" : "default"}
                size="small"
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>Speech-to-Text (STT)</Typography>
              <Chip
                label={isTTSSTTAvailable ? "Available" : packageSettings?.gatewayApiUrl ? "Unavailable" : "Not Configured"}
                color={isTTSSTTAvailable ? "success" : packageSettings?.gatewayApiUrl ? "warning" : "default"}
                size="small"
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>Gateway/MCP</Typography>
                {gatewayConfigured && (
                  <Tooltip title="Refresh gateway status" placement="top">
                    <span>
                      <IconButton
                        size="small"
                        onClick={handleGatewayStatusRefresh}
                        disabled={isGatewayLoading}
                        sx={{ p: 0.25 }}
                      >
                        <RefreshIcon fontSize="small" sx={isGatewayLoading ? spinSx : undefined} />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </Box>
              <Chip
                label={gatewayChipLabel}
                color={gatewayChipColor}
                size="small"
              />
            </Box>

            {gatewayConfigured && gatewayHealthError && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, pl: { xs: 0, sm: 0.5 } }}>
                <Typography variant="caption" color="error">
                  {gatewayHealthError.message}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default PreferencesTab;

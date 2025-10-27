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

// Bandit Engine Watermark: BL-WM-8422-DD3359
const __banditFingerprint_components_ProviderTabtsx = 'BL-FP-40A439-27B6';
const __auditTrail_components_ProviderTabtsx = 'BL-AU-MGOIKVVK-2GRA';
// File: ProviderTab.tsx | Path: src/management/components/ProviderTab.tsx | Hash: 842227b6

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  Chip,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useAIProviderStore } from '../../store/aiProviderStore';
import { usePackageSettingsStore } from '../../store/packageSettingsStore';
import { AIProviderConfig, AIProviderType } from '../../services/ai-provider/types/common.types';
import { aiProviderInitService } from '../../services/ai-provider-init.service';
import { AIProviderFactory } from '../../services/ai-provider/ai-provider.factory';
import { debugLogger } from '../../services/logging/debugLogger';
import indexedDBService from '../../services/indexedDB/indexedDBService';

type PersistedProviderConfig = Omit<AIProviderConfig, 'tokenFactory'> & { id: string };
type GatewayBackendProvider = NonNullable<AIProviderConfig['provider']>;

export const ProviderTab: React.FC = () => {
  const { provider: currentProvider, config: currentProviderConfig } = useAIProviderStore();
  const { settings: packageSettings } = usePackageSettingsStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getSuggestedModel = useCallback((type: AIProviderType): string => {
    const configuredDefault = packageSettings?.defaultModel?.trim();
    if (configuredDefault) {
      return configuredDefault;
    }

    switch (type) {
      case AIProviderType.OPENAI:
        return 'gpt-4o-mini';
      case AIProviderType.XAI:
        return 'grok-beta';
      default:
        return '';
    }
  }, [packageSettings?.defaultModel]);

  const applyDefaultModel = useCallback((config: AIProviderConfig): AIProviderConfig => {
    const normalized = { ...config } as AIProviderConfig & { defaultModel?: string };
    const trimmed = typeof normalized.defaultModel === 'string' ? normalized.defaultModel.trim() : undefined;
    const requiresModel =
      normalized.type === AIProviderType.OPENAI ||
      normalized.type === AIProviderType.XAI;

    if (trimmed) {
      normalized.defaultModel = trimmed;
      return normalized;
    }

    if (!requiresModel) {
      delete normalized.defaultModel;
      return normalized;
    }

    const suggestion = getSuggestedModel(normalized.type as AIProviderType);
    if (suggestion) {
      normalized.defaultModel = suggestion;
    } else {
      delete normalized.defaultModel;
    }

    return normalized;
  }, [getSuggestedModel]);

  const sanitizeConfigForSave = useCallback((config: AIProviderConfig): AIProviderConfig => {
    const sanitized = { ...config } as AIProviderConfig & { defaultModel?: string };
    if (typeof sanitized.defaultModel === 'string') {
      const trimmed = sanitized.defaultModel.trim();
      sanitized.defaultModel = trimmed || undefined;
    }
    return sanitized;
  }, []);

  // AI Provider configuration state
  const [providerConfig, setProviderConfig] = useState<AIProviderConfig>({
    type: 'ollama' as const,
    baseUrl: 'http://localhost:11434'
  });
  const [isProviderConfigOpen, setIsProviderConfigOpen] = useState(false);

  // Snackbar states
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const saveProviderConfigToDB = async (config: AIProviderConfig) => {
    try {
      const { tokenFactory: _tokenFactory, ...persistableConfig } = config;
      const serializableConfig: PersistedProviderConfig = {
        ...persistableConfig,
        id: 'aiProvider'
      };

      await indexedDBService.put<PersistedProviderConfig>(
        'banditConfig', 
        1, 
        'config', 
        serializableConfig,
        [{ name: 'config', keyPath: 'id' }]
      );
      debugLogger.info('Provider configuration saved to IndexedDB', { type: config.type });
    } catch (error) {
      console.error('Failed to save provider config to IndexedDB:', error);
      debugLogger.error('Failed to save provider config to IndexedDB:', { error });
      throw error; // Re-throw to handle in the calling function
    }
  };

  const loadProviderConfigFromDB = async (): Promise<AIProviderConfig | null> => {
    try {
      const config = await indexedDBService.get<PersistedProviderConfig>(
        'banditConfig', 
        1, 
        'config', 
        'aiProvider',
        [{ name: 'config', keyPath: 'id' }]
      );
      if (config) {
        debugLogger.info('Provider configuration loaded from IndexedDB', { type: config.type });
        // Remove the id property that was added for IndexedDB storage
        const { id: _id, ...configWithoutId } = config;
        return configWithoutId as AIProviderConfig;
      }
    } catch (error) {
      debugLogger.error('Failed to load provider config from IndexedDB:', { error });
    }
    return null;
  };

  const convertAnthropicConfig = useCallback((config: AIProviderConfig | null | undefined): AIProviderConfig | null => {
    if (!config) return null;
    if (config.type !== AIProviderType.ANTHROPIC) {
      return config;
    }

    const gatewayUrl = config.gatewayUrl || packageSettings?.gatewayApiUrl || '';
    const defaultModel = typeof config.defaultModel === 'string' && config.defaultModel.trim()
      ? config.defaultModel.trim()
      : 'claude-3-5-sonnet-latest';
    const converted: AIProviderConfig = {
      type: AIProviderType.GATEWAY,
      gatewayUrl,
      provider: 'anthropic',
      defaultModel,
      tokenFactory: config.tokenFactory
    };

    return converted;
  }, [packageSettings?.gatewayApiUrl]);

  // Load current provider configuration
  useEffect(() => {
    const initializeProviderConfig = async () => {
      // First try to load from IndexedDB
      const savedConfig = await loadProviderConfigFromDB();
      
      if (savedConfig) {
        const normalized = convertAnthropicConfig(savedConfig) || savedConfig;
        setProviderConfig(applyDefaultModel(normalized));
      } else if (currentProviderConfig) {
        const normalized = convertAnthropicConfig(currentProviderConfig) || currentProviderConfig;
        setProviderConfig(applyDefaultModel(normalized));
      } else if (packageSettings?.aiProvider) {
        const normalized = convertAnthropicConfig(packageSettings.aiProvider) || packageSettings.aiProvider;
        setProviderConfig(applyDefaultModel(normalized));
      }
    };

    initializeProviderConfig();
  }, [applyDefaultModel, convertAnthropicConfig, currentProviderConfig, packageSettings]);

  const showMessage = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setShowSnackbar(true);
  };

  // AI Provider configuration handlers
  const handleProviderTypeChange = (type: AIProviderType) => {
    const baseConfig: AIProviderConfig = { type };
    
    switch (type) {
      case AIProviderType.OLLAMA:
        setProviderConfig(applyDefaultModel({
          ...baseConfig,
          baseUrl: 'http://localhost:11434'
        }));
        break;
      case AIProviderType.OPENAI:
        setProviderConfig(applyDefaultModel({
          ...baseConfig,
          baseUrl: 'https://api.openai.com/v1',
          apiKey: ''
        }));
        break;
      case AIProviderType.AZURE_OPENAI:
        setProviderConfig(applyDefaultModel({
          ...baseConfig,
          baseUrl: '',
          apiKey: '',
          apiVersion: '2024-02-01',
          deploymentName: ''
        }));
        break;
      case AIProviderType.ANTHROPIC:
        showMessage('Anthropic is only available via the Gateway provider. Please configure Gateway and choose Anthropic as the backend.', 'error');
        setProviderConfig(applyDefaultModel({
          type: AIProviderType.GATEWAY,
          gatewayUrl: packageSettings?.gatewayApiUrl || '',
          provider: 'anthropic',
          defaultModel: 'claude-3-5-sonnet-latest'
        }));
        break;
      case AIProviderType.XAI:
        setProviderConfig(applyDefaultModel({
          ...baseConfig,
          baseUrl: 'https://api.x.ai/v1',
          apiKey: ''
        }));
        break;
      case AIProviderType.GATEWAY:
        setProviderConfig(applyDefaultModel({
          ...baseConfig,
          gatewayUrl: packageSettings?.gatewayApiUrl || '',
          provider: 'openai'
        }));
        break;
      case AIProviderType.PLAYGROUND:
        setProviderConfig(applyDefaultModel({
          ...baseConfig
        }));
        break;
    }
  };

  const handleSaveProviderConfig = async () => {
    try { 
      const normalizedConfigIntermediate = sanitizeConfigForSave(providerConfig);
      const normalizedConfig = convertAnthropicConfig(normalizedConfigIntermediate) || normalizedConfigIntermediate;
      const requiresModel =
        normalizedConfig.type === AIProviderType.OPENAI ||
        normalizedConfig.type === AIProviderType.XAI;

      if (requiresModel && !normalizedConfig.defaultModel) {
        showMessage('Please provide a default model ID for the selected provider.', 'error');
        return;
      }

      // Validate the configuration
      const isValid = AIProviderFactory.validateConfig(normalizedConfig);
      if (!isValid) {
        showMessage('Invalid provider configuration. Please check all required fields.', 'error');
        return;
      }

      // Save to IndexedDB first
      await saveProviderConfigToDB(normalizedConfig);

      // Switch to the new provider
      await aiProviderInitService.switchProvider(normalizedConfig);
      
      // Update package settings
      if (packageSettings) {
        const updatedSettings = {
          ...packageSettings,
          aiProvider: normalizedConfig
        };
        if (normalizedConfig.defaultModel) {
          updatedSettings.defaultModel = normalizedConfig.defaultModel;
        }
        usePackageSettingsStore.setState({ settings: updatedSettings });
      }

      setProviderConfig(applyDefaultModel(normalizedConfig));
      setIsProviderConfigOpen(false);
      showMessage('Provider configuration saved and switched successfully!', 'success');
      debugLogger.info('Provider configuration saved and switched', { type: normalizedConfig.type });
    } catch (error) {
      debugLogger.error('Failed to save provider configuration:', { error });
      showMessage(`Failed to save provider configuration: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleTestProviderConnection = async () => {
    try {
      const testConfig = sanitizeConfigForSave(providerConfig);
      const normalizedTestConfig = convertAnthropicConfig(testConfig) || testConfig;
      const testProvider = AIProviderFactory.createProvider(normalizedTestConfig);

      const result = await testProvider.validateServiceAvailability({ timeoutMs: 10000 });
      
      if (result.isAvailable) {
        showMessage('Connection successful! Provider is available.', 'success');
      } else {
        showMessage('Connection failed. Please check your configuration.', 'error');
      }
    } catch (error) {
      debugLogger.error('Provider connection test failed:', { error });
      showMessage('Connection test failed. Please check your configuration.', 'error');
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3, md: 4 } }}>
      <Box sx={{ mb: { xs: 2.5, md: 3 } }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, mb: 1, color: "primary.main", fontSize: { xs: '1.6rem', md: '1.8rem' } }}
        >
          AI Provider Configuration
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          paragraph
          sx={{ opacity: 0.9, fontSize: { xs: '0.95rem', sm: '1rem' }, lineHeight: 1.5 }}
        >
          Configure your AI provider for chat, generation, and model services. This determines which backend service powers your AI interactions.
        </Typography>

        {/* Current Provider Status */}
        <Paper sx={{ p: { xs: 1.75, sm: 2.5 }, mb: { xs: 2, md: 3 }, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "text.primary" }}>
            Current Provider
          </Typography>
          {currentProvider ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={currentProvider.getProviderType().toUpperCase()}
                color="primary"
                variant="filled"
              />
              <Typography variant="body2" color="text.secondary">
                {currentProviderConfig?.baseUrl || currentProviderConfig?.gatewayUrl || 'No URL configured'}
              </Typography>
            </Box>
          ) : (
            <Chip label="No Provider Configured" color="warning" />
          )}
        </Paper>

        {/* Provider Configuration Form */}
        <Paper sx={{ p: { xs: 1.75, sm: 2.5 }, mb: { xs: 2, md: 3 }, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: { xs: 1, sm: 2 },
              mb: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
              Provider Configuration
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setIsProviderConfigOpen(!isProviderConfigOpen)}
              size={isMobile ? 'small' : 'medium'}
            >
              {isProviderConfigOpen ? 'Hide' : 'Configure'} Provider
            </Button>
          </Box>

          {isProviderConfigOpen && (
            <Box sx={{ mt: 3 }}>
              {/* Provider Type Selection */}
              <TextField
                label="Provider Type"
                select
                value={providerConfig.type}
                onChange={(e) => handleProviderTypeChange(e.target.value as AIProviderType)}
                fullWidth
                sx={{ mb: 3 }}
              >
              <MenuItem value="gateway">Gateway (Recommended)</MenuItem>
              <MenuItem value="ollama">Ollama</MenuItem>
              <MenuItem value="openai">OpenAI</MenuItem>
              <MenuItem value="azure-openai">Azure OpenAI</MenuItem>
              <MenuItem value="xai">xAI</MenuItem>
              <MenuItem value="playground">Playground (Mock Demo)</MenuItem>
            </TextField>

              {/* Gateway Configuration */}
              {providerConfig.type === 'gateway' && (
                <Box>
                  <TextField
                    label="Gateway URL"
                    value={providerConfig.gatewayUrl || ''}
                    onChange={(e) => setProviderConfig({...providerConfig, gatewayUrl: e.target.value})}
                    fullWidth
                    sx={{ mb: 2 }}
                    placeholder="https://your-gateway-api.com"
                  />
                  <TextField
                    label="Backend Provider"
                    select
                    value={providerConfig.provider || 'openai'}
                    onChange={(e) => setProviderConfig({
                      ...providerConfig,
                      provider: e.target.value as GatewayBackendProvider
                    })}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="openai">OpenAI</MenuItem>
                    <MenuItem value="azure-openai">Azure OpenAI</MenuItem>
                    <MenuItem value="anthropic">Anthropic</MenuItem>
                    <MenuItem value="ollama">Ollama</MenuItem>
                    <MenuItem value="xai">xAI</MenuItem>
                  </TextField>
                </Box>
              )}

              {/* Ollama Configuration */}
              {providerConfig.type === 'ollama' && (
                <TextField
                  label="Ollama URL"
                  value={providerConfig.baseUrl || ''}
                  onChange={(e) => setProviderConfig({...providerConfig, baseUrl: e.target.value})}
                  fullWidth
                  placeholder="http://localhost:11434"
                />
              )}

              {/* OpenAI Configuration */}
              {providerConfig.type === 'openai' && (
                <Box>
                  <TextField
                    label="API Base URL"
                    value={providerConfig.baseUrl || ''}
                    onChange={(e) =>
                      setProviderConfig((prev) => ({
                        ...prev,
                        baseUrl: e.target.value
                      }))
                    }
                    fullWidth
                    sx={{ mb: 2 }}
                    placeholder="https://api.openai.com/v1"
                  />
                  <TextField
                    label="API Key"
                    type="password"
                    value={providerConfig.apiKey || ''}
                    onChange={(e) =>
                      setProviderConfig((prev) => ({
                        ...prev,
                        apiKey: e.target.value
                      }))
                    }
                    fullWidth
                    sx={{ mb: 2 }}
                    placeholder="sk-..."
                  />
                  <TextField
                    label="Default Model ID"
                    value={providerConfig.defaultModel || ''}
                    onChange={(e) =>
                      setProviderConfig((prev) => ({
                        ...prev,
                        defaultModel: e.target.value
                      }))
                    }
                    fullWidth
                    placeholder="gpt-4o-mini"
                    helperText="Example: gpt-4o-mini, gpt-4.1, gpt-3.5-turbo"
                  />
                </Box>
              )}

              {/* Azure OpenAI Configuration */}
              {providerConfig.type === 'azure-openai' && (
                <Box>
                  <TextField
                    label="Azure Endpoint"
                    value={providerConfig.baseUrl || ''}
                    onChange={(e) => setProviderConfig({...providerConfig, baseUrl: e.target.value})}
                    fullWidth
                    sx={{ mb: 2 }}
                    placeholder="https://your-resource.openai.azure.com"
                  />
                  <TextField
                    label="API Key"
                    type="password"
                    value={providerConfig.apiKey || ''}
                    onChange={(e) => setProviderConfig({...providerConfig, apiKey: e.target.value})}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="API Version"
                    value={providerConfig.apiVersion || ''}
                    onChange={(e) => setProviderConfig({...providerConfig, apiVersion: e.target.value})}
                    fullWidth
                    sx={{ mb: 2 }}
                    placeholder="2024-02-01"
                  />
                  <TextField
                    label="Deployment Name"
                    value={providerConfig.deploymentName || ''}
                    onChange={(e) => setProviderConfig({...providerConfig, deploymentName: e.target.value})}
                    fullWidth
                    placeholder="gpt-4"
                  />
                </Box>
              )}

              {/* xAI Configuration */}
              {providerConfig.type === 'xai' && (
                <Box>
                  <TextField
                    label="API Base URL"
                    value={providerConfig.baseUrl || ''}
                    onChange={(e) =>
                      setProviderConfig((prev) => ({
                        ...prev,
                        baseUrl: e.target.value
                      }))
                    }
                    fullWidth
                    sx={{ mb: 2 }}
                    placeholder="https://api.x.ai/v1"
                  />
                  <TextField
                    label="API Key"
                    type="password"
                    value={providerConfig.apiKey || ''}
                    onChange={(e) =>
                      setProviderConfig((prev) => ({
                        ...prev,
                        apiKey: e.target.value
                      }))
                    }
                    fullWidth
                    sx={{ mb: 2 }}
                    placeholder="xai-..."
                  />
                  <TextField
                    label="Default Model ID"
                    value={providerConfig.defaultModel || ''}
                    onChange={(e) =>
                      setProviderConfig((prev) => ({
                        ...prev,
                        defaultModel: e.target.value
                      }))
                    }
                    fullWidth
                    placeholder="grok-beta"
                    helperText="Example: grok-beta, grok-2, grok-vision-beta"
                  />
                </Box>
              )}

              {/* Anthropic Configuration (deprecated direct support) */}
              {providerConfig.type === 'anthropic' && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Anthropic is only supported through the Bandit Gateway provider. Please switch to Gateway and
                  select Anthropic as the backend service.
                </Alert>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={handleTestProviderConnection}
                  disabled={!providerConfig.type}
                >
                  Test Connection
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveProviderConfig}
                  disabled={!providerConfig.type}
                >
                  Save & Switch Provider
                </Button>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Migration Information */}
        <Paper sx={{ p: 3, bgcolor: 'info.main', color: 'info.contrastText', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: "text.primary" }}>
            🚀 Gateway Provider Recommended
          </Typography>
          <Typography variant="body2">
            For production deployments, we recommend using the Gateway provider which routes requests through your secure backend API. 
            This approach keeps API keys secure, enables rate limiting, and provides better monitoring capabilities.
          </Typography>
        </Paper>
      </Box>

      {/* Snackbar for messages */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setShowSnackbar(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

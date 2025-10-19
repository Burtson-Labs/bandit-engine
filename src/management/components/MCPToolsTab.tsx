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

// Bandit Engine Watermark: BL-WM-319F-4FCAEC
const __banditFingerprint_components_MCPToolsTabtsx = 'BL-FP-12DCB8-102F';
const __auditTrail_components_MCPToolsTabtsx = 'BL-AU-MGOIKVVI-BBID';
// File: MCPToolsTab.tsx | Path: src/management/components/MCPToolsTab.tsx | Hash: 319f102f

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Chip,
  Alert,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
  FormControlLabel,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddCircleIcon from '@mui/icons-material/AddCircle';

import { useMCPToolsStore } from '../../store/mcpToolsStore';
import { usePackageSettingsStore } from '../../store/packageSettingsStore';
import { executeMCPTool } from '../../services/mcp/mcpService';
import { debugLogger } from '../../services/logging/debugLogger';
import type { MCPTool } from '../../store/mcpToolsStore';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type ParameterType = 'string' | 'number' | 'boolean' | 'array' | 'object';

interface ParameterItems {
  type: string;
}

interface GuidedParameter {
  name: string;
  type: ParameterType;
  description: string;
  required: boolean;
  enumValues?: string[];
  pattern?: string;
  minimum?: number;
  maximum?: number;
  items?: ParameterItems;
}

interface ParameterSchemaProperty {
  type: ParameterType | string;
  description?: string;
  enum?: string[];
  pattern?: string;
  minimum?: number;
  maximum?: number;
  items?: ParameterItems;
}

interface ParameterSchema {
  type: 'object';
  properties: Record<string, ParameterSchemaProperty>;
  required?: string[];
}

type MCPTestResult = {
  success: boolean;
  message: string;
  details?: unknown;
};

const PARAMETER_TYPES: ReadonlyArray<ParameterType> = ['string', 'number', 'boolean', 'array', 'object'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const normalizeParameterType = (value: unknown): ParameterType => {
  if (typeof value === 'string' && (PARAMETER_TYPES as readonly string[]).includes(value)) {
    return value as ParameterType;
  }
  return 'string';
};

const parseEnumValues = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const filtered = value.filter(isNonEmptyString);
  return filtered.length ? filtered : undefined;
};

const parseItems = (value: unknown): ParameterItems | undefined => {
  if (!isRecord(value) || !isNonEmptyString(value.type)) {
    return undefined;
  }
  return { type: value.type };
};

const extractGuidedParametersFromSchema = (schema: unknown): GuidedParameter[] => {
  if (!isRecord(schema) || !isRecord(schema.properties)) {
    return [];
  }

  const requiredList = Array.isArray(schema.required)
    ? schema.required.filter(isNonEmptyString)
    : [];

  return Object.entries(schema.properties).reduce<GuidedParameter[]>((acc, [name, propValue]) => {
    if (!isNonEmptyString(name) || !isRecord(propValue)) {
      return acc;
    }

    const schemaProperty = propValue as Record<string, unknown>;
    const type = normalizeParameterType(schemaProperty.type);
    const description = typeof schemaProperty.description === 'string' ? schemaProperty.description : '';
    const enumValues = parseEnumValues(schemaProperty.enum);
    const pattern = typeof schemaProperty.pattern === 'string' ? schemaProperty.pattern : undefined;
    const minimum = typeof schemaProperty.minimum === 'number' ? schemaProperty.minimum : undefined;
    const maximum = typeof schemaProperty.maximum === 'number' ? schemaProperty.maximum : undefined;
    const items = parseItems(schemaProperty.items);

    acc.push({
      name,
      type,
      description,
      required: requiredList.includes(name),
      enumValues,
      pattern,
      minimum,
      maximum,
      items
    });
    return acc;
  }, []);
};

const toolTemplates = {
  github: {
    name: "GitHub Repository",
    description: "Get information about GitHub repositories, commits, and issues",
    endpoint: "/api/github/repo",
    method: 'GET' as HttpMethod,
    parameters: JSON.stringify({
      type: "object",
      properties: {
        owner: { type: "string", description: "GitHub repository owner" },
        repo: { type: "string", description: "GitHub repository name" }
      },
      required: ["owner", "repo"]
    }, null, 2)
  },
  weather: {
    name: "Weather API",
    description: "Get current weather information for any location",
    endpoint: "/api/weather",
    method: 'GET' as HttpMethod,
    parameters: JSON.stringify({
      type: "object",
      properties: {
        location: { type: "string", description: "City name or coordinates" },
        units: { type: "string", description: "Temperature units", enum: ["metric", "imperial"] }
      },
      required: ["location"]
    }, null, 2)
  },
  database: {
    name: "Database Query",
    description: "Execute SQL queries on configured databases",
    endpoint: "/api/database/query",
    method: 'POST' as HttpMethod,
    parameters: JSON.stringify({
      type: "object",
      properties: {
        query: { type: "string", description: "SQL query to execute" },
        database: { type: "string", description: "Database connection name" }
      },
      required: ["query"]
    }, null, 2)
  },
  crm: {
    name: "CRM Integration",
    description: "Access customer data from Salesforce or similar CRM systems",
    endpoint: "/api/crm/contact",
    method: 'GET' as HttpMethod,
    parameters: JSON.stringify({
      type: "object",
      properties: {
        contactId: { type: "string", description: "Contact ID to retrieve" },
        email: { type: "string", description: "Contact email to search for" }
      },
      required: []
    }, null, 2)
  }
};

type ToolTemplateKey = keyof typeof toolTemplates;

const parameterTemplates: Record<string, GuidedParameter> = {
  location: { name: 'location', type: 'string', description: 'City name, address, or coordinates', required: true },
  userId: { name: 'userId', type: 'string', description: 'Unique user identifier', required: true },
  limit: { name: 'limit', type: 'number', description: 'Maximum number of results to return', required: false, minimum: 1, maximum: 100 },
  units: { name: 'units', type: 'string', description: 'Unit system for measurements', required: false, enumValues: ['metric', 'imperial'] },
  enabled: { name: 'enabled', type: 'boolean', description: 'Whether the feature is enabled', required: false },
  tags: { name: 'tags', type: 'array', description: 'List of tags or categories', required: false, items: { type: 'string' } },
  email: { name: 'email', type: 'string', description: 'Email address', required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
  date: { name: 'date', type: 'string', description: 'Date in YYYY-MM-DD format', required: false, pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
  url: { name: 'url', type: 'string', description: 'Valid URL', required: false, pattern: '^https?://' }
};

type ParameterTemplateKey = keyof typeof parameterTemplates;

interface CustomToolFormState {
  name: string;
  description: string;
  endpoint: string;
  method: HttpMethod;
  parameters: string;
  template: ToolTemplateKey | 'custom';
}

const MCPToolsTab: React.FC = () => {
  const { settings: packageSettings } = usePackageSettingsStore();
  const { tools: mcpTools, loadTools: loadMCPTools, toggleTool, addTool, updateTool, deleteTool } = useMCPToolsStore();

  const [mcpTestModalOpen, setMcpTestModalOpen] = useState(false);
  const [mcpTestResult, setMcpTestResult] = useState<MCPTestResult | null>(null);

  const [customToolModalOpen, setCustomToolModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<string | null>(null);
  const [customToolForm, setCustomToolForm] = useState<CustomToolFormState>({
    name: '',
    description: '',
    endpoint: '',
    method: 'GET',
    parameters: '{}',
    template: 'custom'
  });

  const [jsonViewerOpen, setJsonViewerOpen] = useState(false);
  const [viewingToolJson, setViewingToolJson] = useState<MCPTool | null>(null);

  const [parameterMode, setParameterMode] = useState<'guided' | 'advanced'>('guided');
  const [guidedParameters, setGuidedParameters] = useState<GuidedParameter[]>([]);

  // Dialog state for messages
  const [messageDialog, setMessageDialog] = useState<{
    open: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    open: false,
    type: 'info',
    title: '',
    message: ''
  });

  useEffect(() => {
    loadMCPTools();
  }, [loadMCPTools]);

  // Helper functions for dialog
  const showMessageDialog = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setMessageDialog({
      open: true,
      type,
      title,
      message
    });
  };

  const closeMessageDialog = () => {
    setMessageDialog(prev => ({ ...prev, open: false }));
  };

  // MCP Tool handlers
  const handleTestMCPTool = async (toolName: string) => {
    try {
      const result = await executeMCPTool({
        toolName,
        parameters: {}
      });
      
      setMcpTestResult({
        success: result.success,
        message: result.success ? 'Tool executed successfully!' : result.error || 'Tool execution failed',
        details: result.data || result.error
      });
      setMcpTestModalOpen(true);
    } catch (error) {
      setMcpTestResult({
        success: false,
        message: 'Tool execution failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      setMcpTestModalOpen(true);
    }
  };

  const handleTemplateSelect = (templateKey: ToolTemplateKey) => {
    const template = toolTemplates[templateKey];
    if (template) {
      setCustomToolForm({
        name: template.name,
        description: template.description,
        endpoint: template.endpoint,
        method: template.method,
        parameters: template.parameters,
        template: templateKey
      });
    }
  };

  const resetCustomToolForm = () => {
    setCustomToolForm({
      name: '',
      description: '',
      endpoint: '',
      method: 'GET',
      parameters: JSON.stringify({
        type: "object",
        properties: {},
        required: []
      }, null, 2),
      template: 'custom'
    });
    setGuidedParameters([]);
    setParameterMode('guided');
    setEditingTool(null);
  };

  const handleCustomToolSubmit = async () => {
    try {
      // Build parameters from guided mode if necessary
      let parametersJson = customToolForm.parameters;
      if (parameterMode === 'guided' && guidedParameters.length > 0) {
        parametersJson = buildParametersFromGuided();
      }

      const toolFunction: MCPTool['function'] = {
        name: customToolForm.name.toLowerCase().replace(/\s+/g, '_'),
        description: customToolForm.description,
        parameters: JSON.parse(parametersJson) as MCPTool['function']['parameters']
      };

      const toolData: Omit<MCPTool, 'id'> = {
        name: toolFunction.name,
        description: customToolForm.description,
        enabled: true,
        type: 'function',
        function: toolFunction,
        endpoint: customToolForm.endpoint,
        method: customToolForm.method,
        isBuiltIn: false
      };

      if (editingTool) {
        await updateTool(editingTool, toolData);
      } else {
        await addTool(toolData);
      }

      setCustomToolModalOpen(false);
      resetCustomToolForm();
    } catch (error) {
      debugLogger.error('Failed to save custom tool:');
      showMessageDialog('error', 'Save Failed', 'Failed to save tool. Please check the parameters format.');
    }
  };

  const handleEditTool = (toolId: string) => {
    const tool = mcpTools.find(t => t.id === toolId);
    if (tool && !tool.isBuiltIn) {
      setEditingTool(toolId);
      setCustomToolForm({
        name: tool.name,
        description: tool.description,
        endpoint: tool.endpoint || '',
        method: tool.method || 'GET',
        parameters: JSON.stringify(tool.function.parameters, null, 2),
        template: 'custom'
      });
      setCustomToolModalOpen(true);
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    if (confirm('Are you sure you want to delete this tool?')) {
      await deleteTool(toolId);
    }
  };

  const handleViewToolJson = (tool: MCPTool) => {
    setViewingToolJson({
      ...tool,
      name: tool.function.name
    });
    setJsonViewerOpen(true);
  };

  const buildParametersFromGuided = () => {
    const schema: ParameterSchema = {
      type: 'object',
      properties: {},
      required: guidedParameters.filter((p) => p.required).map((p) => p.name)
    };

    guidedParameters.forEach((param) => {
      const property: ParameterSchemaProperty = {
        type: param.type,
        description: param.description
      };

      const enumValues = param.enumValues?.filter(isNonEmptyString);
      if (enumValues && enumValues.length > 0) {
        property.enum = enumValues;
      }

      if (isNonEmptyString(param.pattern)) {
        property.pattern = param.pattern;
      }

      if (param.type === 'number') {
        if (typeof param.minimum === 'number') {
          property.minimum = param.minimum;
        }
        if (typeof param.maximum === 'number') {
          property.maximum = param.maximum;
        }
      }

      if (param.type === 'array' && param.items) {
        property.items = param.items;
      }

      schema.properties[param.name] = property;
    });

    return JSON.stringify(schema, null, 2);
  };

  const addGuidedParameter = (template?: ParameterTemplateKey) => {
    const baseParam: GuidedParameter = {
      name: '',
      type: 'string',
      description: '',
      required: false,
      enumValues: []
    };

    if (template && parameterTemplates[template]) {
      const templateParam = parameterTemplates[template];
      setGuidedParameters((prev) => [...prev, { ...baseParam, ...templateParam }]);
    } else {
      setGuidedParameters((prev) => [...prev, baseParam]);
    }
  };

  const removeGuidedParameter = (index: number) => {
    setGuidedParameters((prev) => prev.filter((_, i) => i !== index));
  };

  const updateGuidedParameter = <K extends keyof GuidedParameter>(
    index: number,
    field: K,
    value: GuidedParameter[K]
  ) => {
    setGuidedParameters((prev) =>
      prev.map((param, i) => (i === index ? { ...param, [field]: value } : param))
    );
  };

  return (
    <Box>
      <Box sx={{ px: { xs: 2, sm: 4, md: 6 }, pt: 3, pb: 5 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
          MCP Tools
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ opacity: 0.9 }}>
          Add external tools and APIs that your AI can use during conversations. 
          Create tools that connect to databases, APIs, and services to give your AI superpowers.
        </Typography>

        {!packageSettings?.gatewayApiUrl ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 6,
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: '2px dashed',
            borderColor: 'divider'
          }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              Gateway Not Configured
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Contact your administrator to enable MCP tool integration.
            </Typography>
            <Chip label="Gateway Service Required" color="warning" />
          </Box>
        ) : (
          <Box>
            {/* Quick Add Section */}
            <Paper sx={{ p: 3, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'primary.main', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>
                    ⚡ Quick Add Tools
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose from popular templates or create your own
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCustomToolModalOpen(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Create Custom Tool
                </Button>
              </Box>
              
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 2 
              }}>
                {(Object.keys(toolTemplates) as ToolTemplateKey[]).map((key) => {
                  const template = toolTemplates[key];
                  return (
                  <Card 
                    key={key} 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 6
                      },
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                    onClick={() => {
                      handleTemplateSelect(key);
                      setCustomToolModalOpen(true);
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: 1, 
                          bgcolor: 'primary.main', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          mr: 1
                        }}>
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {template.name.charAt(0)}
                          </Typography>
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                          {template.name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.3
                      }}>
                        {template.description}
                      </Typography>
                    </CardContent>
                  </Card>
                  );
                })}
              </Box>
            </Paper>

            {/* Tools List */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
                  Your Tools ({mcpTools.length})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gateway: <code>{packageSettings.gatewayApiUrl}</code>
                </Typography>
              </Box>
              
              {mcpTools.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 6,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: '2px dashed',
                  borderColor: 'divider'
                }}>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    No Tools Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Add your first tool using the templates above or create a custom one
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setCustomToolModalOpen(true)}
                  >
                    Add First Tool
                  </Button>
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                  gap: 3 
                }}>
                  {mcpTools.map((tool) => (
                    <Card key={tool.id} sx={{ 
                      border: '1px solid',
                      borderColor: tool.enabled ? 'primary.main' : 'divider',
                      bgcolor: tool.enabled ? 'rgba(25, 118, 210, 0.04)' : 'background.paper'
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                            <Box sx={{ 
                              width: 40, 
                              height: 40, 
                              borderRadius: 2, 
                              bgcolor: tool.enabled ? 'primary.main' : 'grey.400',
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              mr: 1
                            }}>
                              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                                {tool.function.name.charAt(0).toUpperCase()}
                              </Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: "text.primary" }}>
                                {tool.function.name}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                <Chip 
                                  label={tool.isBuiltIn ? "Built-in" : "Custom"} 
                                  size="small" 
                                  color={tool.isBuiltIn ? "primary" : "secondary"} 
                                  variant="outlined"
                                />
                                <Chip 
                                  label={tool.enabled ? "Enabled" : "Disabled"} 
                                  size="small" 
                                  color={tool.enabled ? "success" : "default"}
                                />
                              </Box>
                            </Box>
                          </Box>
                          
                          <Switch
                            checked={tool.enabled}
                            onChange={() => toggleTool(tool.id)}
                            color="primary"
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.5 }}>
                          {tool.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button 
                            variant="outlined" 
                            size="small"
                            startIcon={<PlayArrowIcon />}
                            disabled={!tool.enabled}
                            onClick={() => handleTestMCPTool(tool.function.name)}
                            sx={{ borderRadius: 1 }}
                          >
                            Test
                          </Button>
                          
                          <Button 
                            variant="outlined" 
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewToolJson(tool)}
                            sx={{ borderRadius: 1 }}
                          >
                            View JSON
                          </Button>
                          
                          {!tool.isBuiltIn && (
                            <>
                              <Button
                                variant="text"
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() => handleEditTool(tool.id)}
                                sx={{ borderRadius: 1 }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="text"
                                size="small"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleDeleteTool(tool.id)}
                                sx={{ borderRadius: 1 }}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {/* MCP Tool Test Result Modal */}
      <Dialog
        open={mcpTestModalOpen}
        onClose={() => setMcpTestModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          MCP Tool Test Result
        </DialogTitle>
        <DialogContent>
          {mcpTestResult && (
            <Box>
              <Alert 
                severity={mcpTestResult.success ? "success" : "error"} 
                sx={{ mb: 2 }}
              >
                {mcpTestResult.message}
              </Alert>
              
              {mcpTestResult.details && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Details:
                  </Typography>
                  <Box component="pre" sx={{ 
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                    color: (theme) => theme.palette.mode === 'dark' ? 'grey.300' : 'grey.800',
                    p: 2, 
                    borderRadius: 1, 
                    fontSize: '0.875rem',
                    overflow: 'auto',
                    maxHeight: '300px',
                    border: (theme) => `1px solid ${theme.palette.divider}`
                  }}>
                    {typeof mcpTestResult.details === 'string' 
                      ? mcpTestResult.details 
                      : JSON.stringify(mcpTestResult.details, null, 2)
                    }
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMcpTestModalOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* JSON Viewer Modal */}
      <Dialog
        open={jsonViewerOpen}
        onClose={() => setJsonViewerOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Tool Configuration JSON
        </DialogTitle>
        <DialogContent>
          {viewingToolJson && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                This is the raw JSON configuration for the "{viewingToolJson.name}" tool.
              </Alert>
              
              <Box component="pre" sx={{ 
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                color: (theme) => theme.palette.mode === 'dark' ? 'grey.300' : 'grey.800',
                p: 2, 
                borderRadius: 1, 
                fontSize: '0.875rem',
                overflow: 'auto',
                maxHeight: '500px',
                border: (theme) => `1px solid ${theme.palette.divider}`,
                fontFamily: 'Monaco, Consolas, "Lucida Console", monospace'
              }}>
                {JSON.stringify(viewingToolJson, null, 2)}
              </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  <strong>Tip:</strong> You can copy this JSON to create similar tools or for debugging purposes. 
                  The parameters section defines what inputs this tool accepts.
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              if (viewingToolJson) {
                navigator.clipboard.writeText(JSON.stringify(viewingToolJson, null, 2));
              }
            }}
            variant="outlined"
          >
            Copy to Clipboard
          </Button>
          <Button onClick={() => setJsonViewerOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Custom Tool Creation Modal */}
      <Dialog
        open={customToolModalOpen}
        onClose={() => {
          setCustomToolModalOpen(false);
          resetCustomToolForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingTool ? 'Edit Custom Tool' : 'Create Custom Tool'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            {/* Template Selection */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                Start with a Template
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 2 
              }}>
                {Object.entries(toolTemplates).map(([key, template]) => (
                  <Card 
                    key={key} 
                    sx={{ 
                      cursor: 'pointer',
                      border: customToolForm.template === key ? '2px solid' : '1px solid',
                      borderColor: customToolForm.template === key ? 'primary.main' : 'divider',
                      bgcolor: customToolForm.template === key ? 'rgba(25, 118, 210, 0.04)' : 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                    onClick={() => handleTemplateSelect(key)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: 1, 
                          bgcolor: 'primary.main', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          mr: 1
                        }}>
                          <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {template.name.charAt(0)}
                          </Typography>
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {template.name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {template.description}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Custom/Blank Option */}
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: customToolForm.template === 'custom' ? '2px solid' : '1px solid',
                    borderColor: customToolForm.template === 'custom' ? 'primary.main' : 'divider',
                    bgcolor: customToolForm.template === 'custom' ? 'rgba(25, 118, 210, 0.04)' : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                  onClick={() => {
                    resetCustomToolForm();
                    setCustomToolForm(prev => ({ ...prev, template: 'custom' }));
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: 1, 
                        bgcolor: 'secondary.main', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mr: 1
                      }}>
                        <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                          ✨
                        </Typography>
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Start from Scratch
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Build a completely custom tool
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Box>

            <Divider />

            {/* Tool Configuration */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                Tool Configuration
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Tool Name"
                  value={customToolForm.name}
                  onChange={(e) => setCustomToolForm(prev => ({ ...prev, name: e.target.value }))}
                  fullWidth
                  required
                  helperText="A clear name for your tool (e.g., 'GitHub Repository Info')"
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>Tag</Typography>
                  }}
                />
                
                <TextField
                  label="Description"
                  value={customToolForm.description}
                  onChange={(e) => setCustomToolForm(prev => ({ ...prev, description: e.target.value }))}
                  fullWidth
                  multiline
                  rows={2}
                  required
                  helperText="Explain what this tool does so the AI knows when to use it"
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }}>📝</Typography>
                  }}
                />
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="HTTP Method"
                    value={customToolForm.method}
                    onChange={(e) => setCustomToolForm(prev => ({ ...prev, method: e.target.value as HttpMethod }))}
                    select
                    sx={{ minWidth: 120 }}
                    required
                  >
                    <MenuItem value="GET">GET</MenuItem>
                    <MenuItem value="POST">POST</MenuItem>
                    <MenuItem value="PUT">PUT</MenuItem>
                    <MenuItem value="DELETE">DELETE</MenuItem>
                  </TextField>
                  
                  <TextField
                    label="API Endpoint"
                    value={customToolForm.endpoint}
                    onChange={(e) => setCustomToolForm(prev => ({ ...prev, endpoint: e.target.value }))}
                    fullWidth
                    required
                    helperText="The API path (e.g., '/api/github/repo' or '/weather')"
                    placeholder="/api/your-endpoint"
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>🔗</Typography>
                    }}
                  />
                </Box>
              </Box>
            </Box>

            <Divider />

            {/* Parameters Section */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  Parameters
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant={parameterMode === 'guided' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => {
                      setParameterMode('guided');
                      if (parameterMode === 'advanced') {
                        // Try to sync from JSON to guided mode if possible
                        try {
                          const parsed = JSON.parse(customToolForm.parameters);
                          const newGuided = extractGuidedParametersFromSchema(parsed);
                          setGuidedParameters(newGuided);
                        } catch (e) {
                          // If parsing fails, just start fresh
                        }
                      }
                    }}
                  >
                    Guided
                  </Button>
                  <Button
                    variant={parameterMode === 'advanced' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => {
                      setParameterMode('advanced');
                      if (parameterMode === 'guided' && guidedParameters.length > 0) {
                        // Build JSON from guided parameters
                        setCustomToolForm(prev => ({ ...prev, parameters: buildParametersFromGuided() }));
                      }
                    }}
                  >
                    Advanced JSON
                  </Button>
                </Box>
              </Box>

              {parameterMode === 'guided' ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Add parameters that your tool needs. The AI will send these when calling your API.
                  </Typography>
                  
                  {/* Parameter Templates */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
                      Quick Templates
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 1 
                    }}>
                      {(Object.keys(parameterTemplates) as ParameterTemplateKey[]).map((key) => {
                        const template = parameterTemplates[key];
                        return (
                          <Chip
                            key={key}
                            label={template.name}
                            onClick={() => addGuidedParameter(key)}
                            variant="outlined"
                            clickable
                            size="small"
                            sx={{ 
                              '&:hover': { 
                                bgcolor: 'primary.light', 
                                color: 'white' 
                              }
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                  
                  {guidedParameters.map((param, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
                        <TextField
                          label="Parameter Name"
                          value={param.name}
                          onChange={(e) => updateGuidedParameter(index, 'name', e.target.value)}
                          size="small"
                          sx={{ flex: 1 }}
                          placeholder="e.g., location"
                          error={!param.name}
                          helperText={!param.name ? "Required" : ""}
                        />
                        <TextField
                          label="Type"
                          value={param.type}
                          onChange={(e) => updateGuidedParameter(index, 'type', e.target.value as ParameterType)}
                          select
                          size="small"
                          sx={{ minWidth: 130 }}
                        >
                          <MenuItem value="string">📝 Text</MenuItem>
                          <MenuItem value="number">🔢 Number</MenuItem>
                          <MenuItem value="boolean">True/False</MenuItem>
                          <MenuItem value="array">List</MenuItem>
                          <MenuItem value="object">📦 Object</MenuItem>
                        </TextField>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={param.required}
                              onChange={(e) => updateGuidedParameter(index, 'required', e.target.checked)}
                              size="small"
                            />
                          }
                          label="Required"
                          sx={{ minWidth: 100 }}
                        />
                        <Button
                          color="error"
                          size="small"
                          onClick={() => removeGuidedParameter(index)}
                          sx={{ minWidth: 0, p: 1 }}
                        >
                          ✕
                        </Button>
                      </Box>
                      
                      <TextField
                        label="Description"
                        value={param.description}
                        onChange={(e) => updateGuidedParameter(index, 'description', e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="Describe what this parameter is for (e.g., City name or coordinates)"
                        sx={{ mb: 1 }}
                        error={!param.description}
                        helperText={!param.description ? "Description helps the AI understand when to use this parameter" : ""}
                      />
                      
                      {/* Type-specific fields */}
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1 }}>
                        {param.type === 'string' && (
                          <>
                            <TextField
                              label="Allowed Values (optional)"
                              value={param.enumValues?.join(', ') || ''}
                              onChange={(e) =>
                                updateGuidedParameter(
                                  index,
                                  'enumValues',
                                  e.target.value
                                    .split(',')
                                    .map((value) => value.trim())
                                    .filter(isNonEmptyString)
                                )
                              }
                              size="small"
                              placeholder="e.g., metric, imperial"
                              helperText="Comma separated. Leave empty for any text"
                            />
                            <TextField
                              label="Pattern (optional)"
                              value={param.pattern || ''}
                              onChange={(e) => updateGuidedParameter(index, 'pattern', e.target.value)}
                              size="small"
                              placeholder="e.g., ^[A-Za-z]+$"
                              helperText="Regex pattern for validation"
                            />
                          </>
                        )}
                        
                        {param.type === 'number' && (
                          <>
                            <TextField
                              label="Minimum Value"
                              type="number"
                              value={param.minimum ?? ''}
                              onChange={(e) => updateGuidedParameter(index, 'minimum', e.target.value ? Number(e.target.value) : undefined)}
                              size="small"
                              placeholder="e.g., 0"
                            />
                            <TextField
                              label="Maximum Value"
                              type="number"
                              value={param.maximum ?? ''}
                              onChange={(e) => updateGuidedParameter(index, 'maximum', e.target.value ? Number(e.target.value) : undefined)}
                              size="small"
                              placeholder="e.g., 100"
                            />
                          </>
                        )}
                        
                        {param.type === 'array' && (
                          <TextField
                            label="Item Type"
                            value={param.items?.type || 'string'}
                            onChange={(e) => updateGuidedParameter(index, 'items', { type: e.target.value })}
                            select
                            size="small"
                          >
                            <MenuItem value="string">Text Items</MenuItem>
                            <MenuItem value="number">Number Items</MenuItem>
                            <MenuItem value="boolean">Boolean Items</MenuItem>
                          </TextField>
                        )}
                      </Box>
                    </Paper>
                  ))}
                  
                  <Button
                    startIcon={<AddCircleIcon />}
                    onClick={() => addGuidedParameter()}
                    variant="outlined"
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    Add Custom Parameter
                  </Button>
                  
                  {guidedParameters.length > 0 && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'primary.main' }}>
                      <Typography variant="caption" color="text.secondary">
                        ✨ <strong>Preview:</strong> Your JSON schema will be automatically generated from these parameters when you switch to Advanced mode or save the tool.
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Define parameters using JSON Schema format. Advanced users can write custom schemas here.
                  </Typography>
                  
                  <TextField
                    value={customToolForm.parameters}
                    onChange={(e) => setCustomToolForm(prev => ({ ...prev, parameters: e.target.value }))}
                    fullWidth
                    multiline
                    rows={12}
                    variant="outlined"
                    placeholder={`{
  "type": "object",
  "properties": {
    "location": {
      "type": "string",
      "description": "City name or coordinates"
    },
    "units": {
      "type": "string",
      "description": "Temperature units",
      "enum": ["metric", "imperial"]
    }
  },
  "required": ["location"]
}`}
                    sx={{
                      '& .MuiInputBase-input': {
                        fontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                  
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">
                      <strong>Pro tip:</strong> Use clear descriptions for each parameter. 
                      The AI uses these to understand what data to send to your API.
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setCustomToolModalOpen(false);
              resetCustomToolForm();
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCustomToolSubmit}
            variant="contained"
            disabled={!customToolForm.name || !customToolForm.description || !customToolForm.endpoint}
          >
            {editingTool ? 'Update Tool' : 'Create Tool'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Message Dialog */}
      <Dialog
        open={messageDialog.open}
        onClose={closeMessageDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          color: messageDialog.type === 'error' ? 'error.main' : 
                 messageDialog.type === 'success' ? 'success.main' : 'primary.main',
          fontWeight: 600
        }}>
          {messageDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary' }}>
            {messageDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={closeMessageDialog} 
            variant="contained"
            color={messageDialog.type === 'error' ? 'error' : 
                   messageDialog.type === 'success' ? 'success' : 'primary'}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MCPToolsTab;

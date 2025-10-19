import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { executeMCPTool, getEnabledMCPToolsForAI, isMCPAvailable, MCPToolCall } from '../mcpService';
import { useMCPToolsStore } from '../../../store/mcpToolsStore';
import { usePackageSettingsStore, type PackageSettings } from '../../../store/packageSettingsStore';
import { authenticationService } from '../../auth/authenticationService';

// Mock the stores and services
vi.mock('../../../store/mcpToolsStore');
vi.mock('../../../store/packageSettingsStore');
vi.mock('../../auth/authenticationService');
vi.mock('../../logging/debugLogger');

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('mcpService', () => {
  const mockTool = {
    id: 'test-tool',
    name: 'test_function',
    description: 'A test function',
    enabled: true,
    type: 'function' as const,
    function: {
      name: 'test_function',
      description: 'A test function',
      parameters: {
        type: 'object' as const,
        properties: {
          param1: { type: 'string', description: 'First parameter' },
          param2: { type: 'number', description: 'Second parameter' }
        },
        required: ['param1']
      }
    },
    endpoint: '/api/test',
    method: 'POST' as const
  };

  const mockSettings: PackageSettings = {
    ollamaUrl: 'http://localhost:11434',
    defaultModel: 'test-model',
    gatewayApiUrl: 'https://api.example.com',
    brandingConfigUrl: ''
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset fetch mock
    mockFetch.mockReset();
    
    // Mock store getState methods directly
    vi.mocked(useMCPToolsStore.getState).mockReturnValue({
      tools: [mockTool],
      isLoaded: true,
      addTool: vi.fn(),
      updateTool: vi.fn(),
      deleteTool: vi.fn(),
      toggleTool: vi.fn(),
      loadTools: vi.fn(),
      saveTools: vi.fn(),
      getEnabledTools: () => [mockTool]
    });

    vi.mocked(usePackageSettingsStore.getState).mockReturnValue({
      settings: mockSettings,
      setSettings: vi.fn(),
      getSettings: vi.fn().mockReturnValue(mockSettings),
      resetSettings: vi.fn()
    });

    vi.mocked(authenticationService.getToken).mockReturnValue('mock-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeMCPTool', () => {
    it('should execute a tool successfully with POST method', async () => {
      const mockResponse = { success: true, result: 'test result' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const toolCall: MCPToolCall = {
        toolName: 'test_function',
        parameters: { param1: 'value1', param2: 42 }
      };

      const result = await executeMCPTool(toolCall);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/test',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({ param1: 'value1', param2: 42 })
        }
      );
    });

    it('should execute a tool successfully with GET method', async () => {
      const getToolMock = {
        ...mockTool,
        method: 'GET' as const,
        endpoint: '/api/health'
      };

      vi.mocked(useMCPToolsStore.getState).mockReturnValue({
        tools: [getToolMock],
        isLoaded: true,
        addTool: vi.fn(),
        updateTool: vi.fn(),
        deleteTool: vi.fn(),
        toggleTool: vi.fn(),
        loadTools: vi.fn(),
        saveTools: vi.fn(),
        getEnabledTools: () => [getToolMock]
      });

      const mockResponse = { status: 'healthy' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const toolCall: MCPToolCall = {
        toolName: 'test_function',
        parameters: {}
      };

      const result = await executeMCPTool(toolCall);

      expect(result).toEqual({
        success: true,
        data: mockResponse
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/health',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          }
        }
      );
    });

    it('should handle tool not found error', async () => {
      const toolCall: MCPToolCall = {
        toolName: 'nonexistent_tool',
        parameters: {}
      };

      const result = await executeMCPTool(toolCall);

      expect(result).toEqual({
        success: false,
        error: "Tool 'nonexistent_tool' not found or not enabled"
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle disabled tool error', async () => {
      const disabledTool = { ...mockTool, enabled: false };
      
      vi.mocked(useMCPToolsStore.getState).mockReturnValue({
        tools: [disabledTool],
        isLoaded: true,
        addTool: vi.fn(),
        updateTool: vi.fn(),
        deleteTool: vi.fn(),
        toggleTool: vi.fn(),
        loadTools: vi.fn(),
        saveTools: vi.fn(),
        getEnabledTools: () => []
      });

      const toolCall: MCPToolCall = {
        toolName: 'test_function',
        parameters: {}
      };

      const result = await executeMCPTool(toolCall);

      expect(result).toEqual({
        success: false,
        error: "Tool 'test_function' not found or not enabled"
      });
    });

    it('should handle missing gateway configuration', async () => {
      vi.mocked(usePackageSettingsStore.getState).mockReturnValue({
        settings: null,
        setSettings: vi.fn(),
        getSettings: vi.fn(),
        resetSettings: vi.fn()
      });

      const toolCall: MCPToolCall = {
        toolName: 'test_function',
        parameters: {}
      };

      const result = await executeMCPTool(toolCall);

      expect(result).toEqual({
        success: false,
        error: "Gateway API not configured"
      });
    });

    it('should handle API error responses', async () => {
      const errorResponse = { error: 'Bad Request' };
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve(errorResponse)
      });

      const toolCall: MCPToolCall = {
        toolName: 'test_function',
        parameters: { param1: 'invalid' }
      };

      const result = await executeMCPTool(toolCall);

      expect(result).toEqual({
        success: false,
        error: 'API call failed: 400 Bad Request',
        data: errorResponse
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const toolCall: MCPToolCall = {
        toolName: 'test_function',
        parameters: {}
      };

      const result = await executeMCPTool(toolCall);

      expect(result).toEqual({
        success: false,
        error: 'Network error'
      });
    });

    it('should work without authentication token', async () => {
      vi.mocked(authenticationService.getToken).mockReturnValue(null);

      const mockResponse = { success: true };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const toolCall: MCPToolCall = {
        toolName: 'test_function',
        parameters: { param1: 'value1' }
      };

      const result = await executeMCPTool(toolCall);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/test',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ param1: 'value1' })
        }
      );
    });
  });

  describe('getEnabledMCPToolsForAI', () => {
    it('should return formatted tools for AI provider', () => {
      const result = getEnabledMCPToolsForAI();

      expect(result).toEqual([
        {
          type: 'function',
          function: {
            name: 'test_function',
            description: 'A test function',
            parameters: {
              type: 'object',
              properties: {
                param1: { type: 'string', description: 'First parameter' },
                param2: { type: 'number', description: 'Second parameter' }
              },
              required: ['param1']
            }
          }
        }
      ]);
    });

    it('should return empty array when no enabled tools', () => {
      vi.mocked(useMCPToolsStore.getState).mockReturnValue({
        tools: [],
        isLoaded: true,
        addTool: vi.fn(),
        updateTool: vi.fn(),
        deleteTool: vi.fn(),
        toggleTool: vi.fn(),
        loadTools: vi.fn(),
        saveTools: vi.fn(),
        getEnabledTools: () => []
      });

      const result = getEnabledMCPToolsForAI();

      expect(result).toEqual([]);
    });

    it('should filter out disabled tools', () => {
      const disabledTool = { ...mockTool, enabled: false };
      const enabledTool = { ...mockTool, id: 'enabled-tool', enabled: true };

      vi.mocked(useMCPToolsStore.getState).mockReturnValue({
        tools: [disabledTool, enabledTool],
        isLoaded: true,
        addTool: vi.fn(),
        updateTool: vi.fn(),
        deleteTool: vi.fn(),
        toggleTool: vi.fn(),
        loadTools: vi.fn(),
        saveTools: vi.fn(),
        getEnabledTools: () => [enabledTool] // Only enabled tool
      });

      const result = getEnabledMCPToolsForAI();

      expect(result).toHaveLength(1);
      expect(result[0].function.name).toBe('test_function');
    });
  });

  describe('isMCPAvailable', () => {
    it('should return true when gateway is configured and tools are enabled', () => {
      const result = isMCPAvailable();
      expect(result).toBe(true);
    });

    it('should return false when gateway is not configured', () => {
      vi.mocked(usePackageSettingsStore.getState).mockReturnValue({
        settings: { ...mockSettings, gatewayApiUrl: '' },
        setSettings: vi.fn(),
        getSettings: vi.fn(),
        resetSettings: vi.fn()
      });

      const result = isMCPAvailable();
      expect(result).toBe(false);
    });

    it('should return false when no tools are enabled', () => {
      vi.mocked(useMCPToolsStore.getState).mockReturnValue({
        tools: [{ ...mockTool, enabled: false }],
        isLoaded: true,
        addTool: vi.fn(),
        updateTool: vi.fn(),
        deleteTool: vi.fn(),
        toggleTool: vi.fn(),
        loadTools: vi.fn(),
        saveTools: vi.fn(),
        getEnabledTools: vi.fn(() => [])
      });

      const result = isMCPAvailable();
      expect(result).toBe(false);
    });

    it('should return false when no tools exist', () => {
      vi.mocked(useMCPToolsStore.getState).mockReturnValue({
        tools: [],
        isLoaded: true,
        addTool: vi.fn(),
        updateTool: vi.fn(),
        deleteTool: vi.fn(),
        toggleTool: vi.fn(),
        loadTools: vi.fn(),
        saveTools: vi.fn(),
        getEnabledTools: vi.fn(() => [])
      });

      const result = isMCPAvailable();
      expect(result).toBe(false);
    });

    it('should return false when settings is null', () => {
      vi.mocked(usePackageSettingsStore.getState).mockReturnValue({
        settings: null,
        setSettings: vi.fn(),
        getSettings: vi.fn(),
        resetSettings: vi.fn()
      });

      const result = isMCPAvailable();
      expect(result).toBe(false);
    });
  });
});

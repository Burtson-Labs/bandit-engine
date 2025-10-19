import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getEnabledMCPToolsForAI, isMCPAvailable } from '../../../services/mcp';
import { useMCPToolsStore } from '../../../store/mcpToolsStore';
import { usePackageSettingsStore, type PackageSettings } from '../../../store/packageSettingsStore';

// Mock the dependencies
vi.mock('../../../store/mcpToolsStore');
vi.mock('../../../store/packageSettingsStore');
vi.mock('../../../services/logging/debugLogger');

describe('MCP Tool Integration with AI Provider', () => {
  const mockTool = {
    id: 'test-tool',
    name: 'test_function',
    description: 'A test function for AI',
    enabled: true,
    type: 'function' as const,
    function: {
      name: 'test_function',
      description: 'A test function that helps with testing',
      parameters: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Test query parameter' }
        },
        required: ['query']
      }
    },
    endpoint: '/api/test',
    method: 'POST' as const
  };

  const mockSettings: PackageSettings = {
    ollamaUrl: 'http://localhost:11434',
    defaultModel: 'bandit-core:4b-it-qat',
    gatewayApiUrl: 'https://api.example.com',
    brandingConfigUrl: ''
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock store implementations  
    vi.mocked(useMCPToolsStore.getState).mockReturnValue({
      tools: [mockTool],
      isLoaded: true,
      addTool: vi.fn(),
      updateTool: vi.fn(),
      deleteTool: vi.fn(),
      toggleTool: vi.fn(),
      loadTools: vi.fn(),
      saveTools: vi.fn(),
      getEnabledTools: vi.fn(() => [mockTool])
    });

    vi.mocked(usePackageSettingsStore.getState).mockReturnValue({
      settings: mockSettings,
      setSettings: vi.fn(),
      getSettings: vi.fn().mockReturnValue(mockSettings),
      resetSettings: vi.fn()
    });
  });

  describe('getEnabledMCPToolsForAI', () => {
    it('should format tools correctly for AI provider', () => {
      const result = getEnabledMCPToolsForAI();

      expect(result).toEqual([
        {
          type: 'function',
          function: {
            name: 'test_function',
            description: 'A test function that helps with testing',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Test query parameter' }
              },
              required: ['query']
            }
          }
        }
      ]);
    });

    it('should return empty array when no tools are enabled', () => {
      // Override the mock for this test
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

      const result = getEnabledMCPToolsForAI();
      expect(result).toEqual([]);
    });

    it('should handle multiple tools correctly', () => {
      const secondTool = {
        ...mockTool,
        id: 'second-tool',
        name: 'second_function',
        function: {
          ...mockTool.function,
          name: 'second_function',
          description: 'A second test function'
        }
      };

      // Override the mock for this test to include both tools
      vi.mocked(useMCPToolsStore.getState).mockReturnValue({
        tools: [mockTool, secondTool],
        isLoaded: true,
        addTool: vi.fn(),
        updateTool: vi.fn(),
        deleteTool: vi.fn(),
        toggleTool: vi.fn(),
        loadTools: vi.fn(),
        saveTools: vi.fn(),
        getEnabledTools: vi.fn(() => [mockTool, secondTool])
      });

      const result = getEnabledMCPToolsForAI();
      expect(result).toHaveLength(2);
      expect(result.map(t => t.function.name)).toEqual(['test_function', 'second_function']);
    });
  });

  describe('isMCPAvailable', () => {
    it('should return true when gateway is configured and tools are enabled', () => {
      // Default mocks should work for this test - gateway configured and tools enabled
      const result = isMCPAvailable();
      expect(result).toBe(true);
    });

    it('should return false when gateway is not configured', () => {
      // Override the mock for this test to have no gateway URL
      vi.mocked(usePackageSettingsStore.getState).mockReturnValue({
        settings: null,
        setSettings: vi.fn(),
        getSettings: vi.fn(),
        resetSettings: vi.fn()
      });

      const result = isMCPAvailable();
      expect(result).toBe(false);
    });

    it('should return false when no tools are enabled', () => {
      // Override the mock for this test to have no enabled tools
      vi.mocked(useMCPToolsStore.getState).mockReturnValue({
        tools: [{ ...mockTool, enabled: false }],
        isLoaded: true,
        addTool: vi.fn(),
        updateTool: vi.fn(),
        deleteTool: vi.fn(),
        toggleTool: vi.fn(),
        loadTools: vi.fn(),
        saveTools: vi.fn(),
        getEnabledTools: vi.fn(() => []) // No enabled tools
      });

      const result = isMCPAvailable();
      expect(result).toBe(false);
    });
  });

  describe('AI Provider Integration', () => {
    it('should properly structure system prompt with tool information', () => {
      const toolsInfo = getEnabledMCPToolsForAI();
      
      // Simulate how the system prompt is constructed in useAIProvider
      let systemPrompt = "You are a helpful assistant.";
      
      if (toolsInfo.length > 0) {
        systemPrompt += `\n\nYou have access to the following tools that can help you provide better responses. Use them when appropriate:\n\n${toolsInfo.map(tool => 
          `- ${tool.function.name}: ${tool.function.description}`
        ).join('\n')}\n\nWhen you need to use a tool, respond with a function call in the format specified by the tool's schema.`;
      }

      expect(systemPrompt).toContain('You have access to the following tools');
      expect(systemPrompt).toContain('test_function: A test function that helps with testing');
      expect(systemPrompt).toContain('When you need to use a tool, respond with a function call');
    });

    it('should create proper request structure with tools', () => {
      const storeState = {
        tools: [mockTool],
        isLoaded: true,
        addTool: vi.fn(),
        updateTool: vi.fn(),
        deleteTool: vi.fn(),
        toggleTool: vi.fn(),
        loadTools: vi.fn(),
        saveTools: vi.fn(),
        getEnabledTools: vi.fn(() => [mockTool])
      } satisfies ReturnType<typeof useMCPToolsStore.getState>;

      vi.mocked(useMCPToolsStore.getState).mockReturnValue(storeState);

      const settingsState = {
        settings: mockSettings,
        setSettings: vi.fn(),
        getSettings: vi.fn().mockReturnValue(mockSettings),
        resetSettings: vi.fn()
      } satisfies ReturnType<typeof usePackageSettingsStore.getState>;

      vi.mocked(usePackageSettingsStore.getState).mockReturnValue(settingsState);

      const enabledTools = getEnabledMCPToolsForAI();
      const mcpAvailable = isMCPAvailable();

      // Simulate the request structure from useAIProvider
      type MockAIRequest = {
        model: string;
        messages: Array<{ role: 'system' | 'user'; content: string }>;
        stream: boolean;
        options: { num_predict: number };
        tools?: ReturnType<typeof getEnabledMCPToolsForAI>;
      };

      const request: MockAIRequest = {
        model: 'bandit-core:4b-it-qat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Test question' }
        ],
        stream: true,
        options: { num_predict: 1000 }
      };

      if (mcpAvailable && enabledTools.length > 0) {
        request.tools = enabledTools;
      }

      expect(request.tools).toBeDefined();
      expect(request.tools).toHaveLength(1);
      expect(request.tools[0]).toEqual({
        type: 'function',
        function: {
          name: 'test_function',
          description: 'A test function that helps with testing',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Test query parameter' }
            },
            required: ['query']
          }
        }
      });
    });
  });
});

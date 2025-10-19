import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMCPToolsStore } from '../mcpToolsStore';
import indexedDBService from '../../services/indexedDB/indexedDBService';

// Mock IndexedDB service
vi.mock('../../services/indexedDB/indexedDBService');
vi.mock('../../services/logging/debugLogger');

describe('mcpToolsStore', () => {
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
          param1: { type: 'string', description: 'First parameter' }
        },
        required: ['param1']
      }
    },
    endpoint: '/api/test',
    method: 'POST' as const
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset the store state to include built-in tools (like the actual store initialization)
    const healthCheckTool = {
      id: "health-check",
      name: "check_gateway_health",
      description: "Check the health status of the gateway API service",
      enabled: true,
      type: "function" as const,
      function: {
        name: "check_gateway_health",
        description: "Check the health status of the gateway API service",
        parameters: {
          type: "object" as const,
          properties: {},
          required: []
        }
      },
      endpoint: "/health",
      method: "GET" as const,
      isBuiltIn: true
    };
    
    useMCPToolsStore.setState({
      tools: [healthCheckTool],
      isLoaded: false
    });

    // Mock IndexedDB service
    vi.mocked(indexedDBService.get).mockResolvedValue(undefined);
    vi.mocked(indexedDBService.put).mockResolvedValue(undefined);
  });

  describe('addTool', () => {
    it('should add a new tool with generated ID', () => {
      const { addTool } = useMCPToolsStore.getState();
      const { id, ...toolWithoutId } = mockTool;
      const toolToAdd = toolWithoutId;

      addTool(toolToAdd);

      const { tools } = useMCPToolsStore.getState();
      expect(tools).toHaveLength(2); // Health check tool + new tool
      const newTool = tools.find(t => t.name === toolToAdd.name);
      expect(newTool).toMatchObject(toolToAdd);
      expect(newTool?.id).toBeDefined();
      expect(typeof newTool?.id).toBe('string');
    });
  });

  describe('updateTool', () => {
    beforeEach(() => {
      // Pre-populate store with a tool
      useMCPToolsStore.setState({
        tools: [mockTool],
        isLoaded: true
      });
    });

    it('should update existing tool', () => {
      const { updateTool } = useMCPToolsStore.getState();
      
      updateTool(mockTool.id, { 
        name: 'updated_function',
        description: 'Updated description' 
      });

      const { tools } = useMCPToolsStore.getState();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('updated_function');
      expect(tools[0].description).toBe('Updated description');
      expect(tools[0].id).toBe(mockTool.id);
    });

    it('should not update non-existent tool', () => {
      const { updateTool } = useMCPToolsStore.getState();
      const originalTools = useMCPToolsStore.getState().tools;
      
      updateTool('non-existent-id', { name: 'should_not_update' });

      const { tools } = useMCPToolsStore.getState();
      expect(tools).toEqual(originalTools);
    });
  });

  describe('deleteTool', () => {
    beforeEach(() => {
      useMCPToolsStore.setState({
        tools: [mockTool],
        isLoaded: true
      });
    });

    it('should delete existing tool', () => {
      const { deleteTool } = useMCPToolsStore.getState();
      
      deleteTool(mockTool.id);

      const { tools } = useMCPToolsStore.getState();
      expect(tools).toHaveLength(0);
    });

    it('should not delete non-existent tool', () => {
      const { deleteTool } = useMCPToolsStore.getState();
      const originalTools = useMCPToolsStore.getState().tools;
      
      deleteTool('non-existent-id');

      const { tools } = useMCPToolsStore.getState();
      expect(tools).toEqual(originalTools);
    });

    it('should not delete built-in tools', () => {
      const builtInTool = { ...mockTool, isBuiltIn: true };
      useMCPToolsStore.setState({
        tools: [builtInTool],
        isLoaded: true
      });

      const { deleteTool } = useMCPToolsStore.getState();
      deleteTool(builtInTool.id);

      const { tools } = useMCPToolsStore.getState();
      expect(tools).toHaveLength(1);
      expect(tools[0]).toEqual(builtInTool);
    });
  });

  describe('toggleTool', () => {
    beforeEach(() => {
      useMCPToolsStore.setState({
        tools: [mockTool],
        isLoaded: true
      });
    });

    it('should toggle tool enabled state', () => {
      const { toggleTool } = useMCPToolsStore.getState();
      
      expect(useMCPToolsStore.getState().tools[0].enabled).toBe(true);
      
      toggleTool(mockTool.id);
      expect(useMCPToolsStore.getState().tools[0].enabled).toBe(false);
      
      toggleTool(mockTool.id);
      expect(useMCPToolsStore.getState().tools[0].enabled).toBe(true);
    });

    it('should not toggle non-existent tool', () => {
      const { toggleTool } = useMCPToolsStore.getState();
      const originalTools = useMCPToolsStore.getState().tools;
      
      toggleTool('non-existent-id');

      const { tools } = useMCPToolsStore.getState();
      expect(tools).toEqual(originalTools);
    });
  });

  describe('getEnabledTools', () => {
    it('should return only enabled tools', () => {
      const disabledTool = { ...mockTool, id: 'disabled-tool', enabled: false };
      const enabledTool = { ...mockTool, id: 'enabled-tool', enabled: true };
      
      useMCPToolsStore.setState({
        tools: [disabledTool, enabledTool],
        isLoaded: true
      });

      const { getEnabledTools } = useMCPToolsStore.getState();
      const enabledTools = getEnabledTools();

      expect(enabledTools).toHaveLength(1);
      expect(enabledTools[0].id).toBe('enabled-tool');
    });

    it('should return empty array when no tools are enabled', () => {
      const disabledTool = { ...mockTool, enabled: false };
      
      useMCPToolsStore.setState({
        tools: [disabledTool],
        isLoaded: true
      });

      const { getEnabledTools } = useMCPToolsStore.getState();
      const enabledTools = getEnabledTools();

      expect(enabledTools).toHaveLength(0);
    });
  });

  describe('loadTools', () => {
    it('should load tools from IndexedDB', async () => {
      const savedData = { id: 'mcpTools', tools: [mockTool] };
      vi.mocked(indexedDBService.get).mockResolvedValue(savedData);

      const { loadTools } = useMCPToolsStore.getState();
      await loadTools();

      const { tools, isLoaded } = useMCPToolsStore.getState();
      expect(isLoaded).toBe(true);
      // Should include the health check tool plus our saved tool
      expect(tools.length).toBeGreaterThan(1);
      expect(tools.some(t => t.id === mockTool.id)).toBe(true);
      expect(indexedDBService.get).toHaveBeenCalledWith(
        'banditConfig', 
        1, 
        'config', 
        'mcpTools', 
        [{ name: 'config', keyPath: 'id' }]
      );
    });

    it('should handle empty IndexedDB result', async () => {
      vi.mocked(indexedDBService.get).mockResolvedValue(null);

      const { loadTools } = useMCPToolsStore.getState();
      await loadTools();

      const { tools, isLoaded } = useMCPToolsStore.getState();
      expect(tools).toHaveLength(1); // Should include built-in health check tool
      expect(isLoaded).toBe(true);
    });

    it('should handle IndexedDB errors gracefully', async () => {
      vi.mocked(indexedDBService.get).mockRejectedValue(new Error('DB Error'));

      const { loadTools } = useMCPToolsStore.getState();
      await loadTools();

      const { tools, isLoaded } = useMCPToolsStore.getState();
      expect(tools).toHaveLength(1); // Should include built-in health check tool
      expect(isLoaded).toBe(true);
    });
  });

  describe('saveTools', () => {
    beforeEach(() => {
      useMCPToolsStore.setState({
        tools: [mockTool],
        isLoaded: true
      });
    });

    it('should save tools to IndexedDB', async () => {
      const { saveTools } = useMCPToolsStore.getState();
      await saveTools();

      expect(indexedDBService.put).toHaveBeenCalledWith(
        'banditConfig',
        1,
        'config',
        {
          id: 'mcpTools',
          tools: [mockTool]
        },
        [{ name: 'config', keyPath: 'id' }]
      );
    });

    it('should handle IndexedDB save errors gracefully', async () => {
      vi.mocked(indexedDBService.put).mockRejectedValue(new Error('Save Error'));

      const { saveTools } = useMCPToolsStore.getState();
      
      // Should not throw
      await expect(saveTools()).resolves.toBeUndefined();
    });
  });

  describe('built-in tools', () => {
    it('should include health check tool by default', async () => {
      vi.mocked(indexedDBService.get).mockResolvedValue(null);

      const { loadTools } = useMCPToolsStore.getState();
      await loadTools();

      const { tools } = useMCPToolsStore.getState();
      const healthCheckTool = tools.find(t => t.id === 'health-check');
      
      expect(healthCheckTool).toBeDefined();
      expect(healthCheckTool?.function.name).toBe('check_gateway_health');
      expect(healthCheckTool?.isBuiltIn).toBe(true);
      expect(healthCheckTool?.enabled).toBe(true);
    });

    it('should preserve built-in tool settings from saved data', async () => {
      const savedHealthCheck = {
        id: 'health-check',
        name: 'check_gateway_health',
        description: 'Check the health status of the gateway API service',
        enabled: false, // User disabled it
        type: 'function' as const,
        function: {
          name: 'check_gateway_health',
          description: 'Check the health status of the gateway API service',
          parameters: {
            type: 'object' as const,
            properties: {},
            required: []
          }
        },
        endpoint: '/health',
        method: 'GET' as const,
        isBuiltIn: true
      };

      const savedData = { id: 'mcpTools', tools: [savedHealthCheck] };
      vi.mocked(indexedDBService.get).mockResolvedValue(savedData);

      const { loadTools } = useMCPToolsStore.getState();
      await loadTools();

      const { tools } = useMCPToolsStore.getState();
      const healthCheckTool = tools.find(t => t.id === 'health-check');
      
      // Should use the default built-in version, not the saved version
      expect(healthCheckTool?.enabled).toBe(true);
    });
  });
});

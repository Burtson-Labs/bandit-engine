import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeMCPTool } from '../mcpService';
import { useMCPToolsStore } from '../../../store/mcpToolsStore';
import { usePackageSettingsStore } from '../../../store/packageSettingsStore';

// Mock fetch
global.fetch = vi.fn();

// Mock stores
vi.mock('../../../store/mcpToolsStore');
vi.mock('../../../store/packageSettingsStore');
vi.mock('../../../services/auth/authenticationService');

describe('Custom MCP Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock store states
    vi.mocked(useMCPToolsStore.getState).mockReturnValue({
      tools: [
        {
          id: 'github-repo',
          name: 'github_repository_info',
          description: 'Get information about GitHub repositories, commits, and issues',
          enabled: true,
          type: 'function',
          function: {
            name: 'github_repository_info',
            description: 'Get information about GitHub repositories, commits, and issues',
            parameters: {
              type: "object",
              properties: {
                owner: {
                  type: "string",
                  description: "GitHub repository owner"
                },
                repo: {
                  type: "string", 
                  description: "GitHub repository name"
                }
              },
              required: ["owner", "repo"]
            }
          },
          endpoint: '/api/github/repo',
          method: 'GET',
          isBuiltIn: false
        },
        {
          id: 'weather-api',
          name: 'get_weather',
          description: 'Get current weather information for any location',
          enabled: true,
          type: 'function',
          function: {
            name: 'get_weather',
            description: 'Get current weather information for any location',
            parameters: {
              type: "object",
              properties: {
                location: {
                  type: "string",
                  description: "City name or coordinates"
                },
                units: {
                  type: "string",
                  description: "Temperature units (metric, imperial)",
                  enum: ["metric", "imperial"]
                }
              },
              required: ["location"]
            }
          },
          endpoint: '/api/weather',
          method: 'GET',
          isBuiltIn: false
        },
        {
          id: 'database-query',
          name: 'execute_sql_query',
          description: 'Execute SQL queries on configured databases',
          enabled: true,
          type: 'function',
          function: {
            name: 'execute_sql_query',
            description: 'Execute SQL queries on configured databases',
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "SQL query to execute"
                },
                database: {
                  type: "string",
                  description: "Database connection name"
                }
              },
              required: ["query"]
            }
          },
          endpoint: '/api/database/query',
          method: 'POST',
          isBuiltIn: false
        }
      ],
      isLoaded: true,
      addTool: vi.fn(),
      updateTool: vi.fn(),
      deleteTool: vi.fn(),
      toggleTool: vi.fn(),
      loadTools: vi.fn(),
      saveTools: vi.fn(),
      getEnabledTools: vi.fn(() => []),
    });

    vi.mocked(usePackageSettingsStore.getState).mockReturnValue({
      settings: {
        gatewayApiUrl: 'http://localhost:8080',
        ollamaUrl: 'http://localhost:11434',
        defaultModel: 'bandit-core:4b-it-qat',
        brandingConfigUrl: 'http://localhost:8080/branding'
      },
      setSettings: vi.fn(),
      getSettings: vi.fn(),
      resetSettings: vi.fn()
    });
  });

  describe('GitHub Repository Tool', () => {
    it('should execute GitHub repository info request successfully', async () => {
      const mockResponse = {
        name: 'bandit',
        full_name: 'mark/bandit',
        description: 'Advanced AI chat application with RAG capabilities',
        stargazers_count: 42,
        forks_count: 8,
        language: 'TypeScript',
        topics: ['ai', 'chat', 'rag', 'typescript'],
        default_branch: 'main',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-12-01T00:00:00Z'
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await executeMCPTool({
        toolName: 'github_repository_info',
        parameters: {
          owner: 'mark',
          repo: 'bandit'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/github/repo?owner=mark&repo=bandit',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle GitHub API errors gracefully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Repository not found' }),
      } as Response);

      const result = await executeMCPTool({
        toolName: 'github_repository_info',
        parameters: {
          owner: 'nonexistent',
          repo: 'repo'
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('404');
    });
  });

  describe('Weather API Tool', () => {
    it('should execute weather request successfully', async () => {
      const mockWeatherResponse = {
        location: 'San Francisco, CA',
        temperature: 72,
        condition: 'Partly Cloudy',
        humidity: 65,
        wind_speed: 12,
        forecast: [
          { day: 'Today', high: 75, low: 62, condition: 'Partly Cloudy' },
          { day: 'Tomorrow', high: 78, low: 64, condition: 'Sunny' }
        ]
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWeatherResponse),
      } as Response);

      const result = await executeMCPTool({
        toolName: 'get_weather',
        parameters: {
          location: 'San Francisco',
          units: 'imperial'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockWeatherResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/weather?location=San+Francisco&units=imperial',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });
  });

  describe('Database Query Tool', () => {
    it('should execute SQL query successfully', async () => {
      const mockQueryResponse = {
        rows: [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
        ],
        rowCount: 2,
        executionTime: '15ms'
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockQueryResponse),
      } as Response);

      const result = await executeMCPTool({
        toolName: 'execute_sql_query',
        parameters: {
          query: 'SELECT id, name, email FROM users LIMIT 10',
          database: 'production'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockQueryResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/database/query',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            query: 'SELECT id, name, email FROM users LIMIT 10',
            database: 'production'
          })
        })
      );
    });

    it('should handle SQL errors gracefully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ 
          error: 'SQL syntax error',
          details: 'Syntax error near \'SELCT\' at line 1'
        }),
      } as Response);

      const result = await executeMCPTool({
        toolName: 'execute_sql_query',
        parameters: {
          query: 'SELCT * FROM users', // intentional typo
          database: 'production'
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('400');
    });
  });

  describe('Tool Configuration Validation', () => {
    it('should reject tools with missing endpoints', async () => {
      // Mock a tool without an endpoint
      vi.mocked(useMCPToolsStore.getState).mockReturnValue({
        tools: [
          {
            id: 'invalid-tool',
            name: 'invalid_tool',
            description: 'Tool without endpoint',
            enabled: true,
            type: 'function',
            function: {
              name: 'invalid_tool',
              description: 'Tool without endpoint',
              parameters: { type: "object", properties: {}, required: [] }
            },
            // endpoint: undefined - missing endpoint
            method: 'GET',
            isBuiltIn: false
          }
        ],
        isLoaded: true,
        addTool: vi.fn(),
        updateTool: vi.fn(),
        deleteTool: vi.fn(),
        toggleTool: vi.fn(),
        loadTools: vi.fn(),
        saveTools: vi.fn(),
        getEnabledTools: vi.fn(() => []),
      });

      const result = await executeMCPTool({
        toolName: 'invalid_tool',
        parameters: {}
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('has no endpoint configured');
    });

    it('should handle disabled tools appropriately', async () => {
      // Mock a disabled tool
      vi.mocked(useMCPToolsStore.getState).mockReturnValue({
        tools: [
          {
            id: 'disabled-tool',
            name: 'disabled_tool',
            description: 'A disabled tool',
            enabled: false, // disabled
            type: 'function',
            function: {
              name: 'disabled_tool',
              description: 'A disabled tool',
              parameters: { type: "object", properties: {}, required: [] }
            },
            endpoint: '/api/disabled',
            method: 'GET',
            isBuiltIn: false
          }
        ],
        isLoaded: true,
        addTool: vi.fn(),
        updateTool: vi.fn(),
        deleteTool: vi.fn(),
        toggleTool: vi.fn(),
        loadTools: vi.fn(),
        saveTools: vi.fn(),
        getEnabledTools: vi.fn(() => []),
      });

      const result = await executeMCPTool({
        toolName: 'disabled_tool',
        parameters: {}
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found or not enabled');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await executeMCPTool({
        toolName: 'github_repository_info',
        parameters: {
          owner: 'mark',
          repo: 'bandit'
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle missing gateway configuration', async () => {
      vi.mocked(usePackageSettingsStore.getState).mockReturnValue({
        settings: null, // no settings
        setSettings: vi.fn(),
        getSettings: vi.fn(),
        resetSettings: vi.fn()
      });

      const result = await executeMCPTool({
        toolName: 'github_repository_info',
        parameters: {
          owner: 'mark',
          repo: 'bandit'
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Gateway API not configured');
    });
  });
});

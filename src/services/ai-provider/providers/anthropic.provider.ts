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

// Bandit Engine Watermark: BL-WM-8631-D26CFA
const __banditFingerprint_providers_anthropicproviderts = 'BL-FP-B138E7-AB87';
const __auditTrail_providers_anthropicproviderts = 'BL-AU-MGOIKVVP-762R';
// File: anthropic.provider.ts | Path: src/services/ai-provider/providers/anthropic.provider.ts | Hash: 8631ab87

import { Observable, from, switchMap, map, throwError } from 'rxjs';
import { IAIProvider } from '../interfaces/ai-provider.interface';
import {
  AIChatRequest,
  AIChatResponse,
  AIGenerateRequest,
  AIGenerateResponse,
  AIModel,
  AIProviderConfig,
  AIProviderType
} from '../types/common.types';
import { debugLogger } from '../../logging/debugLogger';
import { deprecatedAnthropicProvider } from './deprecated';

type AnthropicRole = 'user' | 'assistant';

interface AnthropicChatMessagePayload {
  role: AnthropicRole;
  content: string;
}

interface AnthropicChatPayload {
  model: string;
  messages: AnthropicChatMessagePayload[];
  system?: string;
  stream: boolean;
  temperature?: number;
  max_tokens: number;
}

interface AnthropicStreamChunk {
  delta?: {
    text?: string;
  };
}

interface AnthropicChatResponsePayload {
  content?: unknown;
  completion?: string;
  message?: {
    content?: string;
  };
}

/**
 * Anthropic provider implementation for direct API access
 */
export class AnthropicProvider implements IAIProvider {
  private config: AIProviderConfig;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    deprecatedAnthropicProvider(); // Show deprecation warning
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
  }

  chat(request: AIChatRequest): Observable<AIChatResponse> {
    const url = `${this.baseUrl}/messages`;
    
    // Convert system messages to Anthropic format
    const systemMessage = request.messages.find(msg => msg.role === 'system');
    const userMessages = request.messages.filter(msg => msg.role !== 'system');
    
    const payload: AnthropicChatPayload = {
      model: request.model,
      messages: userMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      system: systemMessage?.content,
      stream: Boolean(request.stream),
      temperature: request.temperature,
      max_tokens: request.maxTokens ?? 1000
    };

    if (request.stream) {
      return this.streamChatRequest(url, payload);
    } else {
      return this.nonStreamChatRequest(url, payload);
    }
  }

  generate(request: AIGenerateRequest): Observable<AIGenerateResponse> {
    // For Anthropic, we'll use the messages endpoint with a single user message
    const chatRequest: AIChatRequest = {
      model: request.model,
      messages: [{ role: 'user', content: request.prompt }],
      stream: request.stream,
      options: request.options
    };

    return this.chat(chatRequest).pipe(
      map(response => ({
        response: response.message.content,
        done: response.done
      }))
    );
  }

  listModels(): Observable<AIModel[]> {
    // Anthropic doesn't have a public models endpoint, return common models
    const commonModels: AIModel[] = [
      {
        name: 'claude-3-5-sonnet-20241022',
        details: {
          format: 'anthropic',
          family: 'claude-3.5'
        }
      },
      {
        name: 'claude-3-5-haiku-20241022',
        details: {
          format: 'anthropic',
          family: 'claude-3.5'
        }
      },
      {
        name: 'claude-3-opus-20240229',
        details: {
          format: 'anthropic',
          family: 'claude-3'
        }
      },
      {
        name: 'claude-3-sonnet-20240229',
        details: {
          format: 'anthropic',
          family: 'claude-3'
        }
      },
      {
        name: 'claude-3-haiku-20240307',
        details: {
          format: 'anthropic',
          family: 'claude-3'
        }
      }
    ];

    return new Observable<AIModel[]>(observer => {
      observer.next(commonModels);
      observer.complete();
    });
  }

  async validateServiceAvailability(args: { 
    fallbackUrl?: string; 
    timeoutMs: number; 
  }): Promise<{ url: string; isAvailable: boolean }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), args.timeoutMs);

      // Test with a simple messages request
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      return {
        url: this.baseUrl,
        isAvailable: response.ok || response.status === 400 // 400 might be expected for the test
      };
    } catch (error) {
      if (args.fallbackUrl) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), args.timeoutMs);

          const response = await fetch(`${args.fallbackUrl}/messages`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              messages: [{ role: 'user', content: 'test' }],
              max_tokens: 1
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok || response.status === 400) {
            this.baseUrl = args.fallbackUrl;
            return {
              url: args.fallbackUrl,
              isAvailable: true
            };
          }
        } catch (fallbackError) {
          // Fall through to return unavailable
        }
      }

      return {
        url: this.baseUrl,
        isAvailable: false
      };
    }
  }

  getProviderType(): string {
    return AIProviderType.ANTHROPIC;
  }

  getConfig(): AIProviderConfig {
    return this.config;
  }

  private streamChatRequest(url: string, payload: AnthropicChatPayload): Observable<AIChatResponse> {
    return new Observable<AIChatResponse>(observer => {
      const task = fetch(url, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      task.then(response => {
        if (!response.ok) {
          observer.error(new Error(`Anthropic request failed: ${response.status}`));
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const read = () => {
          reader?.read().then(({ done, value }) => {
            if (done) {
              observer.next({
                message: { content: '', role: 'assistant' },
                done: true
              });
              observer.complete();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (line.trim() && line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') {
                  observer.next({
                    message: { content: '', role: 'assistant' },
                    done: true
                  });
                  observer.complete();
                  return;
                }

                try {
                  const parsed = JSON.parse(data) as AnthropicStreamChunk;
                  // Anthropic streaming format may differ, adjust as needed
                  const content = parsed.delta?.text || '';
                  if (content) {
                    observer.next({
                      message: { content, role: 'assistant' },
                      done: false
                    });
                  }
                } catch (err) {
                  debugLogger.error('Error parsing Anthropic stream data:', { data, error: err });
                }
              }
            }

            read();
          }).catch(err => observer.error(err));
        };
        read();
      }).catch(err => observer.error(err));
    });
  }

  private nonStreamChatRequest(url: string, payload: AnthropicChatPayload): Observable<AIChatResponse> {
    return from(fetch(url, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
      })).pipe(
      switchMap(response => {
        if (!response.ok) {
          return throwError(() => new Error(`Anthropic request failed: ${response.status}`));
        }
        return from(response.json() as Promise<AnthropicChatResponsePayload>);
      }),
      map((data) => ({
        message: {
          content: this.extractContentText(data),
          role: 'assistant' as const
        },
        done: true
      }))
    );
  }

  private extractContentText(payload: AnthropicChatResponsePayload): string {
    const { content } = payload;

    if (Array.isArray(content)) {
      for (const entry of content) {
        if (typeof entry === 'string') {
          return entry;
        }
        if (entry && typeof entry === 'object' && 'text' in entry) {
          const text = (entry as { text?: unknown }).text;
          if (typeof text === 'string') {
            return text;
          }
        }
      }
    } else if (typeof content === 'string') {
      return content;
    }

    if (typeof payload.completion === 'string') {
      return payload.completion;
    }

    if (payload.message && typeof payload.message.content === 'string') {
      return payload.message.content;
    }

    return '';
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'anthropic-version': '2023-06-01'
    };
    
    if (this.config.apiKey) {
      headers['x-api-key'] = this.config.apiKey;
    }

    return headers;
  }
}

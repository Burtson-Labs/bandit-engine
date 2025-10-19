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

// Bandit Engine Watermark: BL-WM-E7EE-93DC85
const __banditFingerprint_providers_openaiproviderts = 'BL-FP-7E2188-DCC5';
const __auditTrail_providers_openaiproviderts = 'BL-AU-MGOIKVVQ-8GVP';
// File: openai.provider.ts | Path: src/services/ai-provider/providers/openai.provider.ts | Hash: e7eedcc5

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
import { deprecatedOpenAIProvider } from './deprecated';

interface OpenAIChatPayload {
  model: string;
  messages: AIChatRequest['messages'];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
}

interface OpenAIStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
}

interface OpenAIChatResponsePayload {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface OpenAIModelListResponse {
  data: Array<{
    id: string;
    object?: string;
  }>;
}

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider implements IAIProvider {
  private config: AIProviderConfig;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    deprecatedOpenAIProvider(); // Show deprecation warning
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  chat(request: AIChatRequest): Observable<AIChatResponse> {
    const url = `${this.baseUrl}/chat/completions`;
    
    const payload: OpenAIChatPayload = {
      model: request.model,
      messages: request.messages,
      stream: Boolean(request.stream),
      temperature: request.temperature,
      max_tokens: request.maxTokens
    };

    if (request.stream) {
      return this.streamChatRequest(url, payload);
    } else {
      return this.nonStreamChatRequest(url, payload);
    }
  }

  generate(request: AIGenerateRequest): Observable<AIGenerateResponse> {
    // For OpenAI, we'll use the chat endpoint with a single user message
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
    const url = `${this.baseUrl}/models`;
    
    return from(fetch(url, {
      headers: this.getHeaders()
    })).pipe(
      switchMap(response => {
        if (!response.ok) {
          return throwError(() => new Error(`Failed to list models: ${response.status}`));
        }
        return from(response.json() as Promise<OpenAIModelListResponse>);
      }),
      map((data) =>
        data.data.map((model) => ({
          name: model.id,
          details: {
            format: 'openai',
            family: model.object
          }
        }))
      )
    );
  }

  async validateServiceAvailability(args: { 
    fallbackUrl?: string; 
    timeoutMs: number; 
  }): Promise<{ url: string; isAvailable: boolean }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), args.timeoutMs);

      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.getHeaders(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      return {
        url: this.baseUrl,
        isAvailable: response.ok
      };
    } catch (error) {
      if (args.fallbackUrl) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), args.timeoutMs);

          const response = await fetch(`${args.fallbackUrl}/models`, {
            headers: this.getHeaders(),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
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
    return AIProviderType.OPENAI;
  }

  getConfig(): AIProviderConfig {
    return this.config;
  }

  private streamChatRequest(url: string, payload: OpenAIChatPayload): Observable<AIChatResponse> {
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
          observer.error(new Error(`OpenAI request failed: ${response.status}`));
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
                  const parsed = JSON.parse(data) as OpenAIStreamChunk;
                  const content = parsed.choices?.[0]?.delta?.content ?? '';
                  if (content) {
                    observer.next({
                      message: { content, role: 'assistant' },
                      done: false
                    });
                  }
                } catch (err) {
                  debugLogger.error('Error parsing OpenAI stream data:', { data, error: err });
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

  private nonStreamChatRequest(url: string, payload: OpenAIChatPayload): Observable<AIChatResponse> {
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
          return throwError(() => new Error(`OpenAI request failed: ${response.status}`));
        }
        return from(response.json() as Promise<OpenAIChatResponsePayload>);
      }),
      map((data) => ({
        message: {
          content: data.choices?.[0]?.message?.content ?? '',
          role: 'assistant' as const
        },
        done: true
      }))
    );
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }
}

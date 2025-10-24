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

// Bandit Engine Watermark: BL-WM-16A2-8F5D0C
const __banditFingerprint_providers_xaiproviderts = 'BL-FP-DA7844-7C12';
const __auditTrail_providers_xaiproviderts = 'BL-AU-MGOIKVVR-W7UB';
// File: xai.provider.ts | Path: src/services/ai-provider/providers/xai.provider.ts | Hash: 16a28f5d

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

interface XAIChatPayload {
  model: string;
  messages: AIChatRequest['messages'];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
}

interface XAIStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
}

interface XAIChatResponsePayload {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface XAIModelListResponse {
  data: Array<{
    id: string;
    object?: string;
  }>;
}

/**
 * xAI provider implementation
 */
export class XAIProvider implements IAIProvider {
  private config: AIProviderConfig;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.x.ai/v1';
  }

  chat(request: AIChatRequest): Observable<AIChatResponse> {
    const url = `${this.baseUrl}/chat/completions`;

    const payload: XAIChatPayload = {
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
        return from(response.json() as Promise<XAIModelListResponse>);
      }),
      map((data) =>
        data.data.map((model) => ({
          name: model.id,
          details: {
            format: 'xai',
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
          debugLogger.warn('xAI fallback validation failed', { error: fallbackError });
        }
      }

      return {
        url: this.baseUrl,
        isAvailable: false
      };
    }
  }

  getProviderType(): string {
    return AIProviderType.XAI;
  }

  getConfig(): AIProviderConfig {
    return this.config;
  }

  private streamChatRequest(url: string, payload: XAIChatPayload): Observable<AIChatResponse> {
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
          observer.error(new Error(`xAI request failed: ${response.status}`));
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

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
                  const parsed = JSON.parse(data) as XAIStreamChunk;
                  const content = parsed.choices?.[0]?.delta?.content ?? '';
                  if (content) {
                    observer.next({
                      message: { content, role: 'assistant' },
                      done: false
                    });
                  }
                } catch (err) {
                  debugLogger.error('Error parsing xAI stream data:', { data, error: err });
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

  private nonStreamChatRequest(url: string, payload: XAIChatPayload): Observable<AIChatResponse> {
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
          return throwError(() => new Error(`xAI request failed: ${response.status}`));
        }
        return from(response.json() as Promise<XAIChatResponsePayload>);
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

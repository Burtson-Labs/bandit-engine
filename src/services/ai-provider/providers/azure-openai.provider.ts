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

// Bandit Engine Watermark: BL-WM-4A56-02BF87
const __banditFingerprint_providers_azureopenaiproviderts = 'BL-FP-51FF06-B29D';
const __auditTrail_providers_azureopenaiproviderts = 'BL-AU-MGOIKVVQ-070A';
// File: azure-openai.provider.ts | Path: src/services/ai-provider/providers/azure-openai.provider.ts | Hash: 4a56b29d

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
import { deprecatedAzureOpenAIProvider } from './deprecated';

interface AzureChatPayload {
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
/**
 * Azure OpenAI provider implementation
 */
export class AzureOpenAIProvider implements IAIProvider {
  private config: AIProviderConfig;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    deprecatedAzureOpenAIProvider(); // Show deprecation warning
    this.config = config;
    if (!config.baseUrl || !config.deploymentName || !config.apiVersion) {
      throw new Error('Azure OpenAI requires baseUrl, deploymentName, and apiVersion');
    }
    this.baseUrl = config.baseUrl;
  }

  chat(request: AIChatRequest): Observable<AIChatResponse> {
    const url = `${this.baseUrl}/openai/deployments/${this.config.deploymentName}/chat/completions?api-version=${this.config.apiVersion}`;
    
    const payload: AzureChatPayload = {
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
    // For Azure OpenAI, we'll use the chat endpoint with a single user message
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
    // Azure OpenAI doesn't have a direct models endpoint, return the deployment as a model
    const model: AIModel = {
      name: this.config.deploymentName || 'azure-deployment',
      details: {
        format: 'azure-openai',
        family: 'gpt'
      }
    };

    return new Observable<AIModel[]>(observer => {
      observer.next([model]);
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

      // Test with a simple chat request
      const testUrl = `${this.baseUrl}/openai/deployments/${this.config.deploymentName}/chat/completions?api-version=${this.config.apiVersion}`;
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
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

          const testUrl = `${args.fallbackUrl}/openai/deployments/${this.config.deploymentName}/chat/completions?api-version=${this.config.apiVersion}`;
          const response = await fetch(testUrl, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
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
    return AIProviderType.AZURE_OPENAI;
  }

  getConfig(): AIProviderConfig {
    return this.config;
  }

  private streamChatRequest(url: string, payload: AzureChatPayload): Observable<AIChatResponse> {
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
          observer.error(new Error(`Azure OpenAI request failed: ${response.status}`));
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
                  debugLogger.error('Error parsing Azure OpenAI stream data:', { data, error: err });
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

  private nonStreamChatRequest(url: string, payload: AzureChatPayload): Observable<AIChatResponse> {
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
          return throwError(() => new Error(`Azure OpenAI request failed: ${response.status}`));
        }
        return from(response.json() as Promise<OpenAIChatResponsePayload>);
      }),
      map((data) => {
        const content = data.choices?.[0]?.message?.content ?? '';
        return {
          message: {
            content,
            role: 'assistant' as const
          },
          done: true
        };
      })
    );
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.config.apiKey) {
      headers['api-key'] = this.config.apiKey;
    }

    return headers;
  }
}

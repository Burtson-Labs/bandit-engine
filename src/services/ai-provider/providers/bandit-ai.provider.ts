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

// Bandit Engine Watermark: BL-WM-7D56-94BC03
const __banditFingerprint_providers_banditai_providerts = 'BL-FP-0A9B76-CCF1';
const __auditTrail_providers_banditai_providerts = 'BL-AU-MGOIKVVS-LZU9';
// File: bandit-ai.provider.ts | Path: src/services/ai-provider/providers/bandit-ai.provider.ts | Hash: 7d5694bc

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

interface BanditAIChatPayload {
  model: string;
  messages: BanditAIMessage[];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
}

interface BanditAIStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
    finish_reason?: string | null;
  }>;
}

interface BanditAINonStreamResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface BanditAIModelListResponse {
  data: Array<{
    id: string;
    object?: string;
  }>;
}

const DEFAULT_BANDIT_BASE = 'https://api.burtson.ai';

type BanditAIMessageContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' | 'auto' } }
    >;

interface BanditAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: BanditAIMessageContent;
}

const normalizeImageUrl = (value: string | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (/^data:/i.test(trimmed) || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `data:image/jpeg;base64,${trimmed}`;
};

const injectImagesIntoMessages = (
  messages: AIChatRequest['messages'],
  images: string[] | undefined
): BanditAIMessage[] => {
  const normalized: BanditAIMessage[] = messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  if (!images || images.length === 0) {
    return normalized;
  }

  const normalizedImages = images
    .map(normalizeImageUrl)
    .filter((url): url is string => Boolean(url));

  if (normalizedImages.length === 0) {
    return normalized;
  }

  const lastUserIndex = normalized.map((msg) => msg.role).lastIndexOf('user');
  if (lastUserIndex === -1) {
    return normalized;
  }

  const target = normalized[lastUserIndex];
  const baseContent =
    typeof target.content === 'string' && target.content.trim().length > 0
      ? [
          {
            type: 'text' as const,
            text: target.content,
          },
        ]
      : [];

  const imageContent = normalizedImages.map((url) => ({
    type: 'image_url' as const,
    image_url: { url, detail: 'auto' as const },
  }));

  normalized[lastUserIndex] = {
    role: target.role,
    content: [...baseContent, ...imageContent],
  };

  return normalized;
};

/**
 * Bandit AI provider implementation (OpenAI-compatible)
 */
export class BanditAIProvider implements IAIProvider {
  private config: AIProviderConfig;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.baseUrl = (config.baseUrl || DEFAULT_BANDIT_BASE).replace(/\/$/, '');
  }

  chat(request: AIChatRequest): Observable<AIChatResponse> {
    const url = `${this.baseUrl}/chat/completions`;
    const messages = injectImagesIntoMessages(request.messages, request.images);

    const payload: BanditAIChatPayload = {
      model: request.model,
      messages,
      stream: Boolean(request.stream),
      temperature: request.temperature,
      max_tokens: request.maxTokens
    };

    if (request.stream) {
      return this.streamChatRequest(url, payload);
    }

    return this.nonStreamChatRequest(url, payload);
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

    return from(fetch(url, { headers: this.getHeaders() })).pipe(
      switchMap(response => {
        if (!response.ok) {
          debugLogger.error('BanditAI listModels failed', { status: response.status, url });
          return throwError(() => new Error(`Failed to list Bandit models: ${response.status}`));
        }
        return from(response.json() as Promise<BanditAIModelListResponse>);
      }),
      map((data) =>
        data.data.map((model) => ({
          name: model.id,
          details: {
            format: 'bandit',
            family: model.object
          }
        }))
      )
    );
  }

  async validateServiceAvailability(args: { fallbackUrl?: string; timeoutMs: number; }): Promise<{ url: string; isAvailable: boolean }> {
    const attempt = async (url: string) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), args.timeoutMs);
        const response = await fetch(`${url}/models`, {
          headers: this.getHeaders(),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response.ok;
      } catch (error) {
        debugLogger.warn('BanditAI availability check failed', { url, error });
        return false;
      }
    };

    const primary = await attempt(this.baseUrl);
    if (primary) {
      return { url: this.baseUrl, isAvailable: true };
    }

    if (args.fallbackUrl) {
      const fallback = args.fallbackUrl.replace(/\/$/, '');
      if (await attempt(fallback)) {
        this.baseUrl = fallback;
        return { url: fallback, isAvailable: true };
      }
    }

    return { url: this.baseUrl, isAvailable: false };
  }

  getProviderType(): string {
    return AIProviderType.BANDIT;
  }

  getConfig(): AIProviderConfig {
    return this.config;
  }

  private streamChatRequest(url: string, payload: BanditAIChatPayload): Observable<AIChatResponse> {
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
          observer.error(new Error(`BanditAI request failed: ${response.status}`));
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const read = () => {
          reader?.read().then(({ done, value }) => {
            if (done) {
              observer.next({ message: { content: '', role: 'assistant' }, done: true });
              observer.complete();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const rawLine of lines) {
              const line = rawLine.trim();
              if (!line.startsWith('data: ')) {
                continue;
              }

              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                observer.next({ message: { content: '', role: 'assistant' }, done: true });
                observer.complete();
                return;
              }

              try {
                const parsed = JSON.parse(data) as BanditAIStreamChunk;
                const content = parsed.choices?.[0]?.delta?.content ?? '';
                if (content) {
                  observer.next({ message: { content, role: 'assistant' }, done: false });
                }
              } catch (error) {
                debugLogger.error('BanditAI stream chunk parse failure', { data, error });
              }
            }

            read();
          }).catch(err => observer.error(err));
        };

        read();
      }).catch(err => observer.error(err));
    });
  }

  private nonStreamChatRequest(url: string, payload: BanditAIChatPayload): Observable<AIChatResponse> {
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
          return throwError(() => new Error(`BanditAI request failed: ${response.status}`));
        }
        return from(response.json() as Promise<BanditAINonStreamResponse>);
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

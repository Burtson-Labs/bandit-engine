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

// Bandit Engine Watermark: BL-WM-809E-685A92
const __banditFingerprint_gateway_gatewayservicets = 'BL-FP-6DB2F9-8464';
const __auditTrail_gateway_gatewayservicets = 'BL-AU-MGOIKVVT-6725';
// File: gateway.service.ts | Path: src/services/gateway/gateway.service.ts | Hash: 809e8464

import axios, { AxiosError, AxiosHeaders, AxiosInstance } from "axios";
import {
  GatewayChatRequest,
  GatewayChatResponse,
  GatewayGenerateRequest,
  GatewayGenerateResponse,
  GatewayModel,
  GatewayModelsResponse,
  GatewayHealthResponse,
  GatewayMemoryResponse
} from "./interfaces";
import { FeedbackRequest, FeedbackResponse } from "./feedback.interfaces";
import { catchError, from, lastValueFrom, map, Observable, of, shareReplay, timeout } from "rxjs";
import { debugLogger } from "../logging/debugLogger";

interface GatewayHttpErrorResponse {
  status: number;
  statusText: string;
  data: unknown;
  url: string;
}

type GatewayHttpError = Error & { response: GatewayHttpErrorResponse };

export class GatewayService {
  private readonly _client: AxiosInstance;

  constructor(
    private _baseUrl: string,
    private readonly _tokenFactory: () => string | null,
    private readonly _feedbackEmail?: string
  ) {
    if (!this._baseUrl) {
      this._baseUrl = 'http://localhost:5000'
      debugLogger.warn(`No gateway URL provided, using default: ${this._baseUrl}`);
    }
    
    // Ensure baseUrl doesn't end with slash
    this._baseUrl = this._baseUrl.replace(/\/$/, '');

    // Remove /api suffix if it exists to avoid double /api/api paths
    if (this._baseUrl.endsWith('/api')) {
      this._baseUrl = this._baseUrl.slice(0, -4);
      debugLogger.info(`Removed /api suffix from gateway URL: ${this._baseUrl}`);
    }

    this._client = this._createAxiosClient();
  }

  private _createAxiosClient(): AxiosInstance {
    const instance = axios.create({
      baseURL: this._baseUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    instance.interceptors.request.use((config) => {
      const token = this._tokenFactory();
      const headers = AxiosHeaders.from(config.headers ?? {});

      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      if (token && token.trim()) {
        headers.set('Authorization', `Bearer ${token}`);
      } else if (headers.has('Authorization')) {
        headers.delete('Authorization');
      }

      config.headers = headers;
      return config;
    });

    instance.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(this._normalizeAxiosError(error))
    );

    return instance;
  }

  private _normalizeAxiosError(error: AxiosError): Error {
    if (error.response) {
      return this._createHttpError(
        `Request failed: ${error.response.status} ${error.response.statusText ?? ""}`,
        {
          status: error.response.status,
          statusText: error.response.statusText ?? "",
          data: error.response.data,
          url: error.config?.url ?? ""
        }
      );
    }

    if (error.request) {
      return new Error(`No response received from gateway: ${error.message}`);
    }

    return new Error(error.message);
  }

  private _createHttpError(message: string, response: GatewayHttpErrorResponse): GatewayHttpError {
    return Object.assign(new Error(message), { response }) as GatewayHttpError;
  }

  private _setBaseUrl(url: string) {
    this._baseUrl = url;
    this._client.defaults.baseURL = url;
  }

  private _tryGatewayWithTimeout(args: {
    url: string,
    responseType: 'json' | 'text',
    timeoutMs: number,
  }): Observable<boolean> {
    const { url, responseType, timeoutMs } = args;
    const source = this._get(url, responseType)
    const mapped = source.pipe(
      catchError((e) => (e?.message.includes("401") ? of(true) : of(false))),
      map(() => true),
      timeout(timeoutMs),
    );
    return mapped;
  }

  /**
   * Validates the availability of the gateway service.
   * @param fallbackUrl The fallback URL to try if the base URL is not available.
   * @returns An object containing the URL and availability status.
   */
  async validateServiceAvailability(args: { fallbackUrl?: string; timeoutMs: number; }): Promise<{ url: string, isAvailable: boolean }> {
    const { fallbackUrl, timeoutMs } = args;
    const responseType = 'json';
    const availability = {
      url: "",
      isAvailable: false,
    }

    try {
      debugLogger.debug(`Validating gateway service availability at ${this._baseUrl}`);

      availability.url = this._baseUrl;
      availability.isAvailable = await lastValueFrom(
        this._tryGatewayWithTimeout({
          url: `${availability.url}/api/health`,
          responseType,
          timeoutMs,
        })
      ) as boolean;
      
      if (!availability.isAvailable) {
        throw new Error(`Gateway service not available at ${this._baseUrl}`);
      }

      return availability;
    } catch (e) {
      if (fallbackUrl) {
        debugLogger.warn(`Gateway service not available at ${this._baseUrl}, trying fallback URL: ${fallbackUrl}`);
        try {
          availability.url = fallbackUrl.replace(/\/$/, '');
          availability.isAvailable = await lastValueFrom(
            this._tryGatewayWithTimeout({
              url: `${availability.url}/api/health`,
              responseType,
              timeoutMs,
            })
          ) as boolean;

          if (!availability.isAvailable) {
            throw new Error(`Gateway service not available at ${fallbackUrl}`);
          }
          
          this._setBaseUrl(availability.url);
          return availability;
        } catch (e) {
          debugLogger.error(`Gateway service not available at fallback URL: ${fallbackUrl}`);
          throw e;
        }
      } else {
        debugLogger.error(`Gateway service not available and no fallback URL provided`);
        throw e;
      }
    }
  }

  /**
   * Get gateway health status and available providers
   */
  getHealth(): Observable<GatewayHealthResponse> {
    const url = `${this._baseUrl}/api/health`;
    return this._get<GatewayHealthResponse>(url);
  }

  /**
   * Chat completion using the gateway API
   */
  chat(request: GatewayChatRequest): Observable<GatewayChatResponse> {
    // Use provider-specific endpoint if provider is specified
    // For Ollama specifically, use /chat instead of /chat/completions
    const endpoint = request.provider === 'ollama' 
      ? `/api/${request.provider}/chat`
      : request.provider 
        ? `/api/${request.provider}/chat/completions` 
        : '/api/chat/completions';
    const url = `${this._baseUrl}${endpoint}`;
    const normalizedModel =
      request.provider === 'bandit'
        ? (() => {
            const trimmed = (request.model ?? '').replace(/^bandit:/, '').trim();
            return trimmed !== '' ? trimmed : 'bandit-core-1';
          })()
        : request.model;
    
    debugLogger.debug(`Gateway chat request to ${url} with provider: ${request.provider || 'default'}`, {
      model: normalizedModel,
      messageCount: request.messages.length,
      hasImages: !!(request.images && request.images.length > 0),
      imageCount: request.images?.length || 0
    });
    
    
    const requestBody = { ...request, model: normalizedModel, stream: request.stream !== false };
    
    return new Observable<GatewayChatResponse>(observer => {
      const controller = new AbortController();
      const task = fetch(url, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      task.then(async (response) => {
        
        debugLogger.debug(`Gateway chat response status: ${response.status} for provider: ${request.provider || 'default'}`);
        
        if (!response.ok) {
          // Handle error response properly with body parsing
          let errorText = '';
          let errorData: unknown = null;
          
          try {
            // First, try to read the response body
            errorText = await response.text();
            debugLogger.error('GatewayService chat error response body', {
              status: response.status,
              statusText: response.statusText,
              url: response.url,
              body: errorText
            });
          } catch (readError) {
            debugLogger.error('GatewayService chat failed to read error response body', { error: readError });
            errorText = `Request failed with status ${response.status}`;
          }
          
          // Then, try to parse as JSON for better error info
          try {
            errorData = JSON.parse(errorText);
            debugLogger.error('GatewayService chat parsed error payload', errorData);
          } catch (parseError) {
            debugLogger.error('GatewayService chat error payload was not valid JSON');
            errorData = { message: errorText };
          }
          
          // Create an error object that mimics an HTTP response error for the notification service
          const error = this._createHttpError(
            `POST ${url} failed: ${response.status} ${response.statusText ?? ""}`,
            {
              status: response.status,
              statusText: response.statusText ?? "",
              data: errorData,
              url
            }
          );
          
          throw error;
        }

  const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        
        const read = () => {
          reader?.read().then(({ done, value }) => {
            if (done) {
              if (buffer.trim() !== "") {
                try {
                  const finalResponse = JSON.parse(buffer);
                  observer.next(finalResponse);
                } catch (err) {
                  debugLogger.error('GatewayService chat final chunk parsing error', { buffer, error: err });
                  observer.error(err);
                }
              }
              observer.complete();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed) {
                // Handle both SSE format (OpenAI-style) and direct JSON (Ollama-style)
                let data = trimmed;
                
                if (trimmed.startsWith('data: ')) {
                  data = trimmed.slice(6); // Remove 'data: ' prefix for SSE format
                  if (data === '[DONE]') {
                    observer.complete();
                    return;
                  }
                }
                
                try {
                  const parsed = JSON.parse(data);
                  
                  // Transform Ollama chat format to OpenAI-compatible format
                  if (request.provider === 'ollama' && parsed.message) {
                    const transformed: GatewayChatResponse = {
                      id: `chatcmpl-${Date.now()}`,
                      object: 'chat.completion.chunk',
                      created: Math.floor(new Date(parsed.created_at || Date.now()).getTime() / 1000),
                      model: parsed.model,
                      choices: [{
                        index: 0,
                        delta: {
                          role: parsed.message.role,
                          content: parsed.message.content
                        },
                        finish_reason: parsed.done ? (parsed.done_reason || 'stop') : null
                      }]
                    };
                    
                    if (parsed.done && parsed.total_duration) {
                      transformed.usage = {
                        prompt_tokens: parsed.prompt_eval_count || 0,
                        completion_tokens: parsed.eval_count || 0,
                        total_tokens: (parsed.prompt_eval_count || 0) + (parsed.eval_count || 0)
                      };
                    }
                    
                    observer.next(transformed);
                  } else {
                    // For non-Ollama providers or already transformed responses
                    observer.next(parsed);
                  }
                } catch (err) {
                  debugLogger.error('GatewayService chat stream chunk parsing error', {
                    line: trimmed,
                    rawData: data,
                    error: err
                  });
                  observer.error(err);
                }
              }
            }

            read();
          }).catch(err => observer.error(err));
        };
        read();
      })
      .catch(err => {
        debugLogger.error('GatewayService chat fetch error', {
          error: err,
          url,
          provider: request.provider
        });
        observer.error(err);
      });

      // Teardown: abort the request/stream on unsubscribe
      return () => {
        try { controller.abort(); } catch {}
      };
    });
  }

  /**
   * Text generation using the gateway API
   */
  generate(request: GatewayGenerateRequest): Observable<GatewayGenerateResponse> {
    // Use provider-specific endpoint if provider is specified
    const endpoint = request.provider ? `/api/${request.provider}/generate` : '/api/generate';
    const url = `${this._baseUrl}${endpoint}`;
    const normalizedModel =
      request.provider === 'bandit'
        ? (() => {
            const trimmed = (request.model ?? '').replace(/^bandit:/, '').trim();
            return trimmed !== '' ? trimmed : 'bandit-core-1';
          })()
        : request.model;
    
    debugLogger.debug(`Gateway generate request to ${url} with provider: ${request.provider || 'default'}`, {
      model: normalizedModel
    });
    
    return new Observable<GatewayGenerateResponse>(observer => {
      const task = fetch(url, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify({ ...request, model: normalizedModel, stream: request.stream !== false }),
      });
      
      task.then(async (response) => {
        if (!response.ok) {
          // Handle error response properly with body parsing
          let errorText = '';
          let errorData: unknown = null;
          
          try {
            // First, try to read the response body
            errorText = await response.text();
          } catch (readError) {
            errorText = `Request failed with status ${response.status}`;
          }
          
          // Then, try to parse as JSON for better error info
          try {
            errorData = JSON.parse(errorText);
          } catch (parseError) {
            errorData = { message: errorText };
          }
          
          // Create an error object that mimics an HTTP response error for the notification service
          const error = this._createHttpError(
            `POST ${url} failed: ${response.status} ${response.statusText ?? ""}`,
            {
              status: response.status,
              statusText: response.statusText ?? "",
              data: errorData,
              url
            }
          );
          
          throw error;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        
        const read = () => {
          reader?.read().then(({ done, value }) => {
            if (done) {
              if (buffer.trim() !== "") {
                try {
                  observer.next(JSON.parse(buffer));
                } catch (err) {
                  observer.error(err);
                  debugLogger.error('Final chunk parsing error (gateway generate):', { buffer });
                }
              }
              observer.complete();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (line.trim()) {
                try {
                  observer.next(JSON.parse(line));
                } catch (err) {
                  observer.error(err);
                  debugLogger.error('Error parsing JSON line (gateway generate):', { line });
                }
              }
            }

            read();
          }).catch(err => observer.error(err));
        };
        read();
      })
      .catch(err => observer.error(err));
    });
  }

  /**
   * List all available models from all providers
   */
  listModels(): Observable<GatewayModel[]> {
    const url = `${this._baseUrl}/api/models`;
    const response = this._get<GatewayModelsResponse>(url);
    const result = response.pipe(
      map(data => data.models),
      shareReplay(1)
    );
    return result;
  }

  /**
   * List models for a specific provider
   */
  listModelsByProvider(provider: string): Observable<GatewayModel[]> {
    const url = `${this._baseUrl}/api/models/${provider}`;
    const response = this._get<GatewayModelsResponse>(url);
    const result = response.pipe(
      map(data => data.models),
      shareReplay(1)
    );
    return result;
  }

  getMemory(): Observable<GatewayMemoryResponse> {
    const url = `${this._baseUrl}/api/memory`;
    return this._get<GatewayMemoryResponse>(url);
  }

  private _get<T>(url: string, responseType: 'json' | 'text' = 'json'): Observable<T> {
    const request = this._client.get<T>(url, { responseType });
    return from(request).pipe(
      map(response => response.data as T),
      shareReplay(1)
    );
  }

  private _post<TRequest, TResponse>(url: string, body: TRequest): Observable<TResponse> {
    const request = this._client.post<TResponse>(url, body);
    return from(request).pipe(
      map(response => response.data),
      shareReplay(1)
    );
  }

  private _getHeaders() {
    const token = this._tokenFactory();
    
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };
    
    // Only include Authorization header if we have a real token
    if (token && token.trim() !== '') {
      headers['Authorization'] = `Bearer ${token}`;
      debugLogger.debug("Authorization header set with token");
    } else {
      debugLogger.warn('GatewayService: No token found, skipping Authorization header');
    }
    
    return headers;
  }

  /**
   * Submit feedback to the gateway API
   */
  submitFeedback(feedback: FeedbackRequest): Observable<FeedbackResponse> {
    const url = `${this._baseUrl}/api/feedback`;
    
    debugLogger.debug('Gateway feedback submission', {
      category: feedback.category,
      priority: feedback.priority,
      hasImages: !!(feedback.images && feedback.images.length > 0),
      hasAttachments: !!(feedback.attachments && feedback.attachments.length > 0)
    });

    return from(
      this._client.post<FeedbackResponse>(url, feedback).then(response => response.data)
    ).pipe(
      catchError(error => {
        debugLogger.error('Feedback submission failed, using email fallback', error);

        const fallbackResponse: FeedbackResponse = {
          id: `fallback-${Date.now()}`,
          status: 'submitted',
          message: 'Feedback submission failed. Opening email client as fallback.',
          mailtoUrl: this._generateMailtoUrl(feedback)
        };
        return of(fallbackResponse);
      })
    );
  }

  /**
   * Generate a mailto URL as fallback for feedback submission
   */
  private _generateMailtoUrl(feedback: FeedbackRequest): string {
    const subject = encodeURIComponent(`[${feedback.category.toUpperCase()}] ${feedback.title}`);
    
    let body = `Category: ${feedback.category}\n`;
    body += `Priority: ${feedback.priority}\n`;
    
    if (feedback.annoyanceLevel) {
      const annoyanceLabels = {
        1: '😊 Not annoying at all',
        2: '😐 Slightly annoying',
        3: '🙄 Moderately annoying', 
        4: '😠 Very annoying',
        5: '🤬 Extremely annoying'
      };
      body += `Annoyance Level: ${feedback.annoyanceLevel}/5 - ${annoyanceLabels[feedback.annoyanceLevel as keyof typeof annoyanceLabels]}\n`;
    }
    
    body += `\nDescription:\n${feedback.description}\n\n`;
    
    if (feedback.sessionInfo) {
      body += `Session Info:\n`;
      body += `- Model: ${feedback.sessionInfo.currentModel}\n`;
      body += `- Provider: ${feedback.sessionInfo.currentProvider}\n`;
      body += `- Conversation: ${feedback.sessionInfo.conversationId}\n`;
      body += `- Timestamp: ${feedback.sessionInfo.timestamp}\n\n`;
    }
    
    if (feedback.browserInfo) {
      body += `Browser Info:\n`;
      body += `- Name: ${feedback.browserInfo.name}\n`;
      body += `- Version: ${feedback.browserInfo.version}\n`;
      body += `- Platform: ${feedback.browserInfo.platform}\n\n`;
    }
    
    if (feedback.userAgent) {
      body += `User Agent: ${feedback.userAgent}\n\n`;
    }
    
    if (feedback.contactEmail) {
      body += `Contact Email: ${feedback.contactEmail}\n\n`;
    }
    
    if (feedback.images && feedback.images.length > 0) {
      body += `📎 IMAGE ATTACHMENT:\n`;
      body += `Please paste your clipboard contents here (Ctrl+V or Cmd+V)\n\n`;
    }
    
    if (feedback.attachments && feedback.attachments.length > 0) {
      body += `📎 IMPORTANT - FILES TO ATTACH:\n`;
      body += `Please attach the following ${feedback.attachments.length} file(s) to this email:\n`;
      feedback.attachments.forEach((attachment, index) => {
        body += `   • File ${index + 1}: ${attachment.name || `[Attachment ${index + 1}]`}\n`;
      });
      body += `\n(Note: Files cannot be automatically included in email links)\n\n`;
    }
    
    body += `---\nGenerated by Bandit AI Feedback System`;
    
    const encodedBody = encodeURIComponent(body);
    const toEmail = this._feedbackEmail || 'feedback@burtson.ai'; // Use custom email or default
    
    return `mailto:${toEmail}?subject=${subject}&body=${encodedBody}`;
  }
}

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

// Bandit Engine Watermark: BL-WM-6CED-5122D4
const __banditFingerprint_ollama_ollamaservicets = 'BL-FP-3B6550-DAFC';
const __auditTrail_ollama_ollamaservicets = 'BL-AU-MGOIKVVW-1K0E';
// File: ollama.service.ts | Path: src/services/ollama/ollama.service.ts | Hash: 6ceddafc

import { ChatRequest, ChatResponse, GenerateRequest, GenerateResponse, Model, ModelResponse } from "./interfaces";
import { catchError, from, lastValueFrom, map, Observable, of, shareReplay, switchMap, throwError, timeout } from "rxjs";
import { debugLogger } from "../logging/debugLogger";

const handleError = () => (obs: Observable<Response>) =>
  obs.pipe(
    switchMap((response) =>
      response.ok
        ? of(response)
        : throwError(() => new Error(`Request failed: ${response.status} ${response.statusText}`))
    )
  );

const parseResponseBody = async <T>(response: Response, responseType: 'json' | 'text'): Promise<T> => {
  if (responseType === 'text') {
    return (await response.text()) as unknown as T;
  }
  return (await response.json()) as T;
};

export class OllamaService {

  constructor(
    private _baseUrl: string,
    private readonly _tokenFactory: () => string | null
  ) {
    if (!this._baseUrl) {
      this._baseUrl = 'http://localhost:11434'
      debugLogger.warn(`No base URL provided, using default: ${this._baseUrl}`);
    }
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
   * Validates the availability of the service at the given base URL.
   * @param fallbackUrl The fallback URL to try if the base URL is not available.
   * @returns An object containing the URL and availability status.
   */
  async validateServiceAvailability(args: { fallbackUrl: string; timeoutMs: number; }): Promise<{ url: string, isAvailable: boolean }> {
    const { fallbackUrl, timeoutMs } = args;
    const responseType = 'text';
    const availablility = {
      url: "",
      isAvailable: false,
    }
    try {
      debugLogger.debug(`Validating service availability at ${this._baseUrl}`);



      availablility.url = this._baseUrl;
      availablility.isAvailable = await lastValueFrom(
        this._tryGatewayWithTimeout({
          url: availablility.url,
          responseType,
          timeoutMs,
        })
      ) as boolean;
      if (!availablility.isAvailable) {
        throw new Error(`Service not available at ${this._baseUrl}`);
      }

      return availablility;
    } catch (e) {
      debugLogger.warn(`Service not available at ${this._baseUrl}, trying fallback URL: ${fallbackUrl}`);
      try {

        availablility.url = fallbackUrl;
        availablility.isAvailable = await lastValueFrom(
          this._tryGatewayWithTimeout({
            url: availablility.url,
            responseType,
            timeoutMs,
          })
        ) as boolean;

        if (!availablility.isAvailable) {
          throw new Error(`Service not available at ${fallbackUrl}`);
        }
        this._baseUrl = fallbackUrl;
        return availablility;
      } catch (e) {
        debugLogger.error(`Service not available at fallback URL: ${fallbackUrl}`);
        throw e;
      }
    }
  }


  generate(request: GenerateRequest): Observable<GenerateResponse> {
    const url = `${this._baseUrl}/api/generate`;
    return new Observable<GenerateResponse>(observer => {
      const task = fetch(url, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify({ ...request, stream: request.stream === false ? false : true }),
      });
      task.then(response => {
        this._throwErrorIfNotOk(url, response);

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
                  debugLogger.error('Final chunk parsing error (generate):', { buffer });
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
                  debugLogger.error('Error parsing JSON line (generate):', { line });
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

  // generate(request: GenerateRequest): Observable<GenerateResponse> {
  //   const url = `${this._baseUrl}/api/generate`;
  //   return this._post<GenerateRequest, GenerateResponse>(url, request);
  // }

  chat(request: ChatRequest): Observable<ChatResponse> {
    const url = `${this._baseUrl}/api/chat`;
    return new Observable<ChatResponse>(observer => {
      const task = fetch(url, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify({ ...request, stream: true }),
      });
      task.then(response => {
        this._throwErrorIfNotOk(url, response);

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
                  debugLogger.error('Final chunk parsing error (chat):', { buffer });
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
                  debugLogger.error('Error parsing JSON line (chat):', { line });
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


  listModels(): Observable<Model[]> {
    const url = `${this._baseUrl}/api/tags`;
    const response = this._get<ModelResponse>(url);
    const result = response.pipe(
      map(data => data.models),
      shareReplay(1));
    return result;
  }

  private _get<T>(url: string, responseType: 'json' | 'text' = 'json'): Observable<T> {
    const requestInit = {
      method: 'GET',
      headers: this._getHeaders(),
    }

    const response = from(fetch(url, requestInit));
    const handleFetchError = response.pipe(handleError());
    const data = handleFetchError.pipe(switchMap((res) => from(parseResponseBody<T>(res, responseType))));
    const result = data.pipe(shareReplay(1));

    return result;
  }

  private _post<TRequest, TResponse>(url: string, body: TRequest): Observable<TResponse> {
    const response = from(fetch(url, {
      method: 'POST',
      headers: this._getHeaders(),
      body: JSON.stringify(body),
    }));
    const handleFetchError = response.pipe(handleError());
    const json = handleFetchError.pipe(switchMap((res) => from(parseResponseBody<TResponse>(res, 'json'))));
    const result = json.pipe(shareReplay(1));
    return result;
  }
  private _throwErrorIfNotOk(url: string, response: Response) {
    if (!response.ok) {
      throw new Error(`POST ${url} failed: ${response.status} ${response.statusText}`);
    }
  }
  private _getHeaders() {
    const token = this._tokenFactory();
    
    if (!token) {
      debugLogger.warn('OllamaService: No token found, using empty string for Authorization header');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`
    };
  }


}

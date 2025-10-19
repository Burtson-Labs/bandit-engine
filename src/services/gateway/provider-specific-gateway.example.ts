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

// Bandit Engine Watermark: BL-WM-B448-DE6106
const __banditFingerprint_gateway_providerspecificgatewayexamplets = 'BL-FP-E88224-38F2';
const __auditTrail_gateway_providerspecificgatewayexamplets = 'BL-AU-MGOIKVVU-YLBF';
// File: provider-specific-gateway.example.ts | Path: src/services/gateway/provider-specific-gateway.example.ts | Hash: b44838f2

// Example: Provider-Specific Gateway Service
// This shows how you could modify the gateway service to use provider-specific endpoints

import { Observable, from } from 'rxjs';
import { GatewayChatRequest, GatewayChatResponse, GatewayGenerateRequest, GatewayGenerateResponse, GatewayHealthResponse } from './interfaces';

export class ProviderSpecificGatewayService {
  constructor(
    private _baseUrl: string,
    private _provider: string,
    private readonly _tokenFactory: () => string | null
  ) {
    this._baseUrl = this._baseUrl.replace(/\/$/, '');
  }

  private _getHeaders(): HeadersInit {
    const token = this._tokenFactory();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * Chat completion using provider-specific endpoint
   * URL: /api/{provider}/chat
   */
  chat(request: Omit<GatewayChatRequest, 'provider'>): Observable<GatewayChatResponse> {
    const url = `${this._baseUrl}/api/${this._provider}/chat`;
    
    return from(
      fetch(url, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify(request),
      }).then(response => {
        if (!response.ok) {
          throw new Error(`Chat request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
    );
  }

  /**
   * Text generation using provider-specific endpoint
   * URL: /api/{provider}/generate
   */
  generate(request: Omit<GatewayGenerateRequest, 'provider'>): Observable<GatewayGenerateResponse> {
    const url = `${this._baseUrl}/api/${this._provider}/generate`;
    
    return from(
      fetch(url, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify(request),
      }).then(response => {
        if (!response.ok) {
          throw new Error(`Generate request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
    );
  }

  /**
   * Health check using provider-specific endpoint
   * URL: /api/{provider}/health
   */
  getHealth(): Observable<GatewayHealthResponse> {
    const url = `${this._baseUrl}/api/${this._provider}/health`;
    
    return from(
      fetch(url, {
        method: 'GET',
        headers: this._getHeaders(),
      }).then(response => {
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
        }
        return response.json() as Promise<GatewayHealthResponse>;
      })
    );
  }
}

// Usage example:
export class CustomOllamaGatewayService extends ProviderSpecificGatewayService {
  constructor(gatewayUrl: string, tokenFactory: () => string | null) {
    super(gatewayUrl, 'ollama', tokenFactory);
  }
}

export class CustomOpenAIGatewayService extends ProviderSpecificGatewayService {
  constructor(gatewayUrl: string, tokenFactory: () => string | null) {
    super(gatewayUrl, 'openai', tokenFactory);
  }
}

// Example usage:
/*
const ollamaGateway = new CustomOllamaGatewayService(
  'https://your-gateway.com',
  () => localStorage.getItem('authToken')
);

// This will call: POST https://your-gateway.com/api/ollama/chat
const chatResponse = await ollamaGateway.chat({
  model: 'llama2',
  messages: [{ role: 'user', content: 'Hello!' }]
}).toPromise();

// This will call: POST https://your-gateway.com/api/ollama/generate
const generateResponse = await ollamaGateway.generate({
  model: 'llama2',
  prompt: 'Hello, world!'
}).toPromise();
*/

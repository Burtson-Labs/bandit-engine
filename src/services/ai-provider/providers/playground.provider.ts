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

// Bandit Engine Watermark: BL-WM-DBA3-6C3A2B
const __banditFingerprint_providers_playgroundproviderts = 'BL-FP-7465CF-7B8B';
const __auditTrail_providers_playgroundproviderts = 'BL-AU-MGOIKVVR-EV75';
// File: playground.provider.ts | Path: src/services/ai-provider/providers/playground.provider.ts | Hash: dba37b8b

import { Observable } from 'rxjs';
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

type PlaygroundScript = {
  match: (input: string) => boolean;
  response: string;
};

const PLAYGROUND_MODELS: AIModel[] = [
  {
    name: 'bandit-playground',
    details: {
      format: 'chat',
      family: 'bandit',
      families: ['bandit', 'demo'],
      parameter_size: 'demo',
      quantization_level: 'synthetic'
    },
    digest: 'playground-demo-001',
    modified_at: new Date().toISOString()
  },
  {
    name: 'bandit-starter',
    details: {
      format: 'chat',
      family: 'bandit',
      families: ['bandit', 'demo'],
      parameter_size: 'demo',
      quantization_level: 'synthetic'
    },
    digest: 'playground-demo-002',
    modified_at: new Date().toISOString()
  }
];

const PLAYGROUND_CONVERSATION_STARTERS = [
  'What can I build with Bandit Engine if my backend is not ready yet?',
  'How does the gateway contract keep API keys out of the browser?',
  'Can I theme the chat UI to match my product brand?',
  'How do I switch between Ollama and OpenAI without redeploying the frontend?',
  'Show me how the management console handles personas and models.'
];

const PLAYGROUND_SCRIPTS: PlaygroundScript[] = [
  {
    match: (input) => /model|switch|personas|management/i.test(input),
    response: [
      "Absolutely — the management console ships with live model switching, persona editing, and feature toggles.",
      "",
      "- Use the **Models** tab to expose whichever gateway-backed models you want customers to see.",
      "- Personas hydrate the chat with branded system prompts, voice preferences, and avatars.",
      "- Everything persists through the gateway, so you can roll out changes without shipping a new build."
    ].join('\n')
  },
  {
    match: (input) => /gateway|api|contract|backend/i.test(input),
    response: [
      "The gateway contract keeps secrets on the server while giving the UI a unified AI API.",
      "",
      "Key highlights:",
      "1. `/api/chat/completions` is the default OpenAI-format endpoint when no provider override is set.",
      "2. `/api/{provider}/chat/completions` handles OpenAI, Azure OpenAI, and Anthropic while `/api/ollama/chat` streams Ollama responses.",
      "3. The contract is language-agnostic — Express, FastAPI, .NET, Go… anything works as long as it speaks HTTP."
    ].join('\n')
  },
  {
    match: (input) => /style|theme|brand|ui/i.test(input),
    response: [
      "Every surface in Bandit Engine is themeable.",
      "",
      "- Drop a JSON config into your `public/` folder (or host it on a CDN) to control themes, logos, and accent colors.",
      "- The React components expose hooks for custom headers, menus, and call-to-action buttons.",
      "- Need a modal? `ChatModal` reuses the same store, so the handoff between embedded chat and floating assistant stays seamless."
    ].join('\n')
  },
  {
    match: (input) => /voice|tts|audio/i.test(input),
    response: [
      "Voice is opt-in, but the plumbing is ready.",
      "",
      "- Configure `/api/tts` and `/api/stt` on the gateway to unlock the speak/listen controls.",
      "- The UI lazily loads voices and respects feature flags, so you can leave it disabled in the playground.",
      "- Everything streams — the assistant starts speaking before the full response lands."
    ].join('\n')
  },
  {
    match: (input) => /deploy|production|secure/i.test(input),
    response: [
      "Production hardening is front and center.",
      "",
      "- Gateway tokens ride in the `Authorization` header; rotate them server-side without touching the bundle.",
      "- Feature flags gate premium surfaces, letting you trial the UI before wiring billing.",
      "- Vector search, knowledge, and memories are isolated behind `/api/embedding/*` so you can plug in your own storage policies."
    ].join('\n')
  }
];

const FALLBACK_RESPONSE = [
  "Bandit Engine is running in playground mode. I'm simulating how streaming works so you can explore the UX without connecting a live model.",
  "",
  "Try asking about the gateway contract, theming, voice features, or model management to see tailored walkthroughs."
].join('\n');

const STREAM_DELAY_MS = 350;

export class PlaygroundProvider implements IAIProvider {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = { type: AIProviderType.PLAYGROUND, ...config };
  }

  chat(request: AIChatRequest): Observable<AIChatResponse> {
    const lastUserMessage = [...request.messages]
      .reverse()
      .find((m) => m.role === 'user')?.content ?? '';

    const script = PLAYGROUND_SCRIPTS.find((scenario) =>
      scenario.match(lastUserMessage)
    );

    const responseText = script?.response ?? FALLBACK_RESPONSE;
    const chunks = this.splitIntoChunks(responseText);

    return new Observable<AIChatResponse>((observer) => {
      let index = 0;
      const emitChunk = () => {
        if (index >= chunks.length) {
          observer.complete();
          return;
        }

        const chunk = chunks[index];
        observer.next({
          message: {
            content: chunk,
            role: 'assistant'
          },
          done: index === chunks.length - 1
        });

        index += 1;
        setTimeout(emitChunk, STREAM_DELAY_MS);
      };

      emitChunk();

      return () => {
        index = chunks.length;
      };
    });
  }

  generate(_request: AIGenerateRequest): Observable<AIGenerateResponse> {
    const starters = PLAYGROUND_CONVERSATION_STARTERS.join('\n');

    return new Observable<AIGenerateResponse>((observer) => {
      observer.next({
        response: starters,
        done: true
      });
      observer.complete();
    });
  }

  listModels(): Observable<AIModel[]> {
    return new Observable<AIModel[]>((observer) => {
      observer.next(PLAYGROUND_MODELS);
      observer.complete();
    });
  }

  async validateServiceAvailability(args: { fallbackUrl?: string; timeoutMs: number }): Promise<{ url: string; isAvailable: boolean }> {
    const simulatedUrl = this.config.baseUrl ?? 'playground://local';

    if (args.timeoutMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(args.timeoutMs, 250)));
    }

    return {
      url: simulatedUrl,
      isAvailable: true
    };
  }

  getProviderType(): string {
    return AIProviderType.PLAYGROUND;
  }

  getConfig(): AIProviderConfig {
    return this.config;
  }

  private splitIntoChunks(response: string): string[] {
    const paragraphs = response.split('\n\n').map((p) => p.trim()).filter(Boolean);

    if (paragraphs.length <= 1) {
      const sentences = response.split(/(?<=[.!?])\s+/).filter(Boolean);
      return sentences.length > 0 ? sentences : [response];
    }

    return paragraphs;
  }
}

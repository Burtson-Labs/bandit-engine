# Bandit Gateway Node Example

This example demonstrates a minimal HTTP gateway that proxies chat and generation requests to OpenAI, Azure OpenAI, Anthropic, or Ollama via provider-specific endpoints. Use it to validate your Bandit Engine integration before wiring up your production infrastructure.

## Getting Started
```bash
npm install
npm run dev
```

The server listens on `http://localhost:8080`. Configure the following environment variables as needed:

- `OPENAI_API_KEY` – Optional; required when proxying to OpenAI.
- `OLLAMA_URL` – Optional; defaults to `http://localhost:11434`.
- `AZURE_OPENAI_CHAT_URL` / `AZURE_OPENAI_RESPONSES_URL` – Optional; set to your Azure deployment REST URLs when using Azure OpenAI.
- `AZURE_OPENAI_KEY` – Optional; required for Azure requests.
- `ANTHROPIC_API_KEY` – Optional; required for Anthropic requests.
- `PORT` – Optional; defaults to `8080`.

## Endpoints
| Endpoint | Description |
| --- | --- |
| `GET /api/health` | Returns gateway status and configured providers. |
| `GET /api/models` | Lists all advertised models for the management UI. |
| `GET /api/models/:provider` | Lists models scoped to a single provider. |
| `POST /api/chat/completions` | Default OpenAI-style chat route when no provider override is set. |
| `POST /api/generate` | Default OpenAI-style text generation route. |
| `POST /api/openai/chat/completions` | OpenAI chat completions proxy. |
| `POST /api/openai/generate` | OpenAI text generation proxy. |
| `POST /api/azure-openai/chat/completions` | Azure OpenAI chat completions proxy (wire your deployment URLs). |
| `POST /api/azure-openai/generate` | Azure OpenAI text generation proxy. |
| `POST /api/anthropic/chat/completions` | Anthropic messages proxy. |
| `POST /api/anthropic/generate` | Anthropic text generation proxy. |
| `POST /api/ollama/chat` | Native Ollama chat streaming proxy. |
| `POST /api/ollama/generate` | Native Ollama generate proxy. |

These map directly to the requirements described in [`docs/02_gateway_api.md`](../../docs/02_gateway_api.md). Providers without credentials or URLs return `501 Not Implemented` responses so you can enable them incrementally.

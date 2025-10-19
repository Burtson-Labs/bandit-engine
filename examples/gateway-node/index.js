import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

const providers = {
  openai: {
    chatUrl: "https://api.openai.com/v1/chat/completions",
    generateUrl: "https://api.openai.com/v1/responses",
    headers: () => ({
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    }),
    isConfigured: () => !!process.env.OPENAI_API_KEY
  },
  "azure-openai": {
    // Replace with your Azure deployment URL, e.g. https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions?api-version=2024-02-15-preview
    chatUrl: process.env.AZURE_OPENAI_CHAT_URL,
    generateUrl: process.env.AZURE_OPENAI_RESPONSES_URL,
    headers: () => ({
      "api-key": process.env.AZURE_OPENAI_KEY,
      "Content-Type": "application/json"
    }),
    isConfigured: () => !!(process.env.AZURE_OPENAI_CHAT_URL && process.env.AZURE_OPENAI_RESPONSES_URL && process.env.AZURE_OPENAI_KEY)
  },
  anthropic: {
    chatUrl: "https://api.anthropic.com/v1/messages",
    generateUrl: "https://api.anthropic.com/v1/messages",
    headers: () => ({
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01"
    }),
    isConfigured: () => !!process.env.ANTHROPIC_API_KEY
  },
  ollama: {
    chatUrl: `${OLLAMA_URL}/api/chat`,
    generateUrl: `${OLLAMA_URL}/api/generate`,
    headers: () => ({
      "Content-Type": "application/json"
    }),
    isConfigured: () => true
  }
};

const models = [
  {
    id: "openai:gpt-4.1-mini",
    name: "gpt-4.1-mini",
    provider: "openai",
    created: Date.now(),
    modified_at: new Date().toISOString(),
    size: 0,
    digest: "",
    details: {
      format: "chat",
      family: "gpt",
      families: ["gpt"],
      parameter_size: "",
      quantization_level: ""
    }
  },
  {
    id: "ollama:llama3",
    name: "llama3",
    provider: "ollama",
    created: Date.now(),
    modified_at: new Date().toISOString(),
    size: 0,
    digest: "",
    details: {
      format: "chat",
      family: "llama",
      families: ["llama"],
      parameter_size: "",
      quantization_level: ""
    }
  }
];

async function proxyRequest(res, providerKey, type, payload) {
  const provider = providers[providerKey];

  if (!provider || !provider[`${type}Url`]) {
    res.status(501).json({ message: `Provider ${providerKey} not configured for ${type}` });
    return;
  }

  if (provider.isConfigured && !provider.isConfigured()) {
    res.status(501).json({ message: `Provider ${providerKey} missing required configuration` });
    return;
  }

  const url = provider[`${type}Url`];
  const headersFactory = provider.headers;
  let headers = headersFactory ? provider.headers() : {};
  headers = Object.entries(headers ?? {}).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      acc[key] = value;
    }
    return acc;
  }, {});
  if (!headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    res.status(response.status);
    response.body?.pipe(res);
  } catch (error) {
    console.error(`Error proxying ${type} request to ${providerKey}:`, error);
    res.status(502).json({ message: "Upstream provider error", details: error instanceof Error ? error.message : error });
  }
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    providers: Object.keys(providers).filter((key) => {
      const provider = providers[key];
      return !!provider.chatUrl && (!provider.isConfigured || provider.isConfigured());
    }),
    version: "1.0.0"
  });
});

app.get("/api/models", (req, res) => {
  res.json({ models });
});

app.get("/api/models/:provider", (req, res) => {
  const { provider } = req.params;
  res.json({ models: models.filter((model) => model.provider === provider) });
});

app.post("/api/chat/completions", async (req, res) => {
  const payload = { ...req.body, stream: req.body.stream !== false };
  await proxyRequest(res, "openai", "chat", payload);
});

app.post("/api/generate", async (req, res) => {
  const payload = { ...req.body, stream: req.body.stream !== false };
  await proxyRequest(res, "openai", "generate", payload);
});

app.post("/api/:provider/chat/completions", async (req, res) => {
  const { provider } = req.params;

  if (provider === "ollama") {
    res.status(404).json({ message: "Ollama uses /api/ollama/chat" });
    return;
  }

  const payload = { ...req.body, stream: req.body.stream !== false };
  await proxyRequest(res, provider, "chat", payload);
});

app.post("/api/:provider/generate", async (req, res) => {
  const { provider } = req.params;

  if (provider === "ollama") {
    res.status(404).json({ message: "Ollama uses /api/ollama/generate" });
    return;
  }

  const payload = { ...req.body, stream: req.body.stream !== false };
  await proxyRequest(res, provider, "generate", payload);
});

app.post("/api/ollama/chat", async (req, res) => {
  const payload = { ...req.body, stream: req.body.stream !== false };
  await proxyRequest(res, "ollama", "chat", payload);
});

app.post("/api/ollama/generate", async (req, res) => {
  const payload = { ...req.body, stream: req.body.stream !== false };
  await proxyRequest(res, "ollama", "generate", payload);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Gateway listening on ${port}`);
});

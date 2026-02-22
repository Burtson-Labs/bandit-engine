import express from "express";
import fetch from "node-fetch";
import crypto from "node:crypto";

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

const seedPackStore = new Map();
const defaultSeedPackScope = process.env.SEED_PACK_SCOPE_TYPE === "user" ? "user" : "team";

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
}

function generateSeedPackSid() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildSeedPackSummary(content) {
  if (typeof content !== "string") {
    return undefined;
  }
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return undefined;
  }
  return normalized.length > 280 ? `${normalized.slice(0, 280)}...` : normalized;
}

function serializeSeedPack(pack) {
  return {
    sid: pack.sid,
    name: pack.name,
    description: pack.description,
    status: pack.status,
    version: pack.version,
    contentType: pack.contentType,
    content: pack.content,
    summary: pack.summary,
    tags: pack.tags,
    scopeType: pack.scopeType,
    scopeSid: pack.scopeSid,
    createdBySid: pack.createdBySid,
    updatedBySid: pack.updatedBySid,
    publishedBySid: pack.publishedBySid,
    createdAt: pack.createdAt,
    updatedAt: pack.updatedAt,
    publishedAt: pack.publishedAt
  };
}

function getSeedPackBySid(sid) {
  return seedPackStore.get(String(sid));
}

function inferScopeSid(req) {
  const teamSidHeader = normalizeOptionalString(req.get("x-team-sid"));
  const userSidHeader = normalizeOptionalString(req.get("x-user-sid"));
  if (defaultSeedPackScope === "team") {
    return teamSidHeader || "team-local";
  }
  return userSidHeader || "user-local";
}

function resolveAzureWikiContent(payload) {
  if (typeof payload?.content === "string" && payload.content.trim().length > 0) {
    return payload.content.trim();
  }

  const pageList = Array.isArray(payload?.pages)
    ? payload.pages
    : Array.isArray(payload?.files)
      ? payload.files
      : [];

  if (pageList.length === 0) {
    return "";
  }

  return pageList
    .map((page, index) => {
      if (!page || typeof page !== "object") {
        return "";
      }
      const title =
        normalizeOptionalString(page.path) ||
        normalizeOptionalString(page.name) ||
        `Wiki Page ${index + 1}`;
      const markdown = typeof page.content === "string" ? page.content.trim() : "";
      if (!markdown) {
        return "";
      }
      return `## ${title}\n\n${markdown}`;
    })
    .filter((section) => section.length > 0)
    .join("\n\n---\n\n");
}

function createSeedPackRecord(req, payload) {
  const timestamp = new Date().toISOString();
  const content = typeof payload.content === "string" ? payload.content : "";
  return {
    sid: generateSeedPackSid(),
    name: payload.name,
    description: normalizeOptionalString(payload.description),
    status: "draft",
    version: 0,
    contentType: "markdown",
    content,
    summary: buildSeedPackSummary(content),
    tags: normalizeTags(payload.tags),
    scopeType: defaultSeedPackScope,
    scopeSid: inferScopeSid(req),
    createdBySid: normalizeOptionalString(req.get("x-user-sid")) || "gateway-user",
    updatedBySid: normalizeOptionalString(req.get("x-user-sid")) || "gateway-user",
    publishedBySid: undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
    publishedAt: undefined
  };
}

function registerSeedPackRoutes(prefix = "") {
  const route = (path) => `${prefix}${path}`;

  app.get(route("/seed-packs"), (req, res) => {
    const items = Array.from(seedPackStore.values())
      .map((pack) => serializeSeedPack(pack))
      .sort((a, b) => {
        const left = Date.parse(a.updatedAt || a.createdAt || 0);
        const right = Date.parse(b.updatedAt || b.createdAt || 0);
        return Number.isNaN(right) || Number.isNaN(left) ? 0 : right - left;
      });
    res.json({ seedPacks: items });
  });

  app.post(route("/seed-packs"), (req, res) => {
    const name = normalizeOptionalString(req.body?.name);
    if (!name) {
      res.status(400).json({ message: "Seed pack name is required" });
      return;
    }

    const created = createSeedPackRecord(req, {
      ...req.body,
      name
    });
    seedPackStore.set(created.sid, created);
    res.status(201).json({ seedPack: serializeSeedPack(created) });
  });

  app.post(route("/seed-packs/import/azure-devops-wiki"), (req, res) => {
    const name = normalizeOptionalString(req.body?.name);
    if (!name) {
      res.status(400).json({ message: "Seed pack name is required" });
      return;
    }

    const content = resolveAzureWikiContent(req.body);
    if (!content) {
      res.status(400).json({
        message: "No markdown content was found. Provide content or pages/files with markdown content."
      });
      return;
    }

    const created = createSeedPackRecord(req, {
      ...req.body,
      name,
      content
    });
    seedPackStore.set(created.sid, created);
    res.status(201).json({ seedPack: serializeSeedPack(created) });
  });

  app.get(route("/seed-packs/:sid"), (req, res) => {
    const record = getSeedPackBySid(req.params.sid);
    if (!record) {
      res.status(404).json({ message: "Seed pack not found" });
      return;
    }
    res.json({ seedPack: serializeSeedPack(record) });
  });

  app.put(route("/seed-packs/:sid"), (req, res) => {
    const record = getSeedPackBySid(req.params.sid);
    if (!record) {
      res.status(404).json({ message: "Seed pack not found" });
      return;
    }

    const name = normalizeOptionalString(req.body?.name);
    if (!name) {
      res.status(400).json({ message: "Seed pack name is required" });
      return;
    }

    const nextContent = typeof req.body?.content === "string" ? req.body.content : record.content || "";
    const updated = {
      ...record,
      name,
      description: normalizeOptionalString(req.body?.description),
      content: nextContent,
      summary: buildSeedPackSummary(nextContent),
      tags: normalizeTags(req.body?.tags),
      updatedBySid: normalizeOptionalString(req.get("x-user-sid")) || record.updatedBySid,
      updatedAt: new Date().toISOString()
    };
    seedPackStore.set(updated.sid, updated);
    res.json({ seedPack: serializeSeedPack(updated) });
  });

  app.post(route("/seed-packs/:sid/publish"), (req, res) => {
    const record = getSeedPackBySid(req.params.sid);
    if (!record) {
      res.status(404).json({ message: "Seed pack not found" });
      return;
    }

    const timestamp = new Date().toISOString();
    const published = {
      ...record,
      status: "published",
      version: Number.isFinite(record.version) ? record.version + 1 : 1,
      publishedBySid: normalizeOptionalString(req.get("x-user-sid")) || "gateway-user",
      updatedBySid: normalizeOptionalString(req.get("x-user-sid")) || record.updatedBySid,
      publishedAt: timestamp,
      updatedAt: timestamp
    };
    seedPackStore.set(published.sid, published);
    res.json({ seedPack: serializeSeedPack(published) });
  });

  app.post(route("/seed-packs/:sid/archive"), (req, res) => {
    const record = getSeedPackBySid(req.params.sid);
    if (!record) {
      res.status(404).json({ message: "Seed pack not found" });
      return;
    }

    const archived = {
      ...record,
      status: "archived",
      updatedBySid: normalizeOptionalString(req.get("x-user-sid")) || record.updatedBySid,
      updatedAt: new Date().toISOString()
    };
    seedPackStore.set(archived.sid, archived);
    res.json({ seedPack: serializeSeedPack(archived) });
  });

  app.delete(route("/seed-packs/:sid"), (req, res) => {
    const record = getSeedPackBySid(req.params.sid);
    if (!record) {
      res.status(404).json({ message: "Seed pack not found" });
      return;
    }

    seedPackStore.delete(record.sid);
    res.status(204).send();
  });
}

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

registerSeedPackRoutes();
registerSeedPackRoutes("/api");

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Gateway listening on ${port}`);
});

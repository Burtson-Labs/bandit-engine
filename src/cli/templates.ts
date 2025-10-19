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

// Bandit Engine Watermark: BL-WM-6A01-0C8694
const __banditFingerprint_cli_templatests = 'BL-FP-49CAAA-1041';
const __auditTrail_cli_templatests = 'BL-AU-MGOIKVV7-J6PV';
// File: templates.ts | Path: src/cli/templates.ts | Hash: 6a011041

import { formatJson, ensureTrailingNewline, normalizeLineEndings } from "./utils";

export interface GatewayModelTemplate {
  id: string;
  name: string;
  provider: string;
}

export interface QuickstartTemplateContext {
  packageName: string;
  projectTitle: string;
  engineVersion: string;
  brandingText: string;
  logoBase64: string;
  hasTransparentLogo: boolean;
  isDefaultLogo: boolean;
  gatewayPort: number;
  frontendPort: number;
  defaultProvider: "openai" | "ollama";
  defaultGatewayUrl: string;
  defaultModelId: string;
  fallbackModelId?: string;
  gatewayModels: GatewayModelTemplate[];
}

const QUOTE = '"';

export const buildPackageJson = (ctx: QuickstartTemplateContext): string =>
  formatJson({
    name: ctx.packageName,
    private: true,
    version: "0.1.0",
    type: "module",
    scripts: {
      dev: "concurrently -k \"npm run dev:gateway\" \"npm run dev:web\"",
      "dev:web": "vite",
      "dev:gateway": "node server/gateway.js",
      build: "vite build",
      preview: "vite preview"
    },
    dependencies: {
      "@burtson-labs/bandit-engine": `^${ctx.engineVersion}`,
      "@emotion/react": "^11.14.0",
      "@emotion/styled": "^11.14.0",
      "@mui/material": "^7.1.0",
      "@tanstack/react-query": "^5.59.20",
      "cors": "^2.8.5",
      "dotenv": "^16.4.5",
      "express": "^4.19.2",
      "react": "^19.0.0",
      "react-dom": "^19.0.0",
      "react-router-dom": "^7.5.0",
      "zustand": "^4.5.6"
    },
    devDependencies: {
      "@types/express": "^4.17.21",
      "@types/node": "^20.17.7",
      "@types/react": "^18.3.22",
      "@types/react-dom": "^18.2.18",
      "@vitejs/plugin-react": "^5.0.0",
      "concurrently": "^8.2.2",
      "typescript": "^5.5.4",
      "vite": "^7.1.9"
    }
  });

export const buildEnvExample = (ctx: QuickstartTemplateContext): string =>
  ensureTrailingNewline(
    normalizeLineEndings(
      `# Frontend configuration\nVITE_DEV_PORT=${ctx.frontendPort}\nVITE_GATEWAY_URL=${ctx.defaultGatewayUrl}\nVITE_DEFAULT_MODEL=${ctx.defaultModelId}\nVITE_FALLBACK_MODEL=${ctx.fallbackModelId ?? ""}\nVITE_GATEWAY_PROVIDER=${ctx.defaultProvider}\nVITE_BRANDING_TEXT=${ctx.brandingText}\n\n# Gateway configuration\n# OPENAI_API_KEY=sk-................................\n# OLLAMA_URL=http://localhost:11434\n# PORT=${ctx.gatewayPort}\n`
    )
  );

export const buildTsConfig = (): string =>
  formatJson({
    compilerOptions: {
      target: "ESNext",
      useDefineForClassFields: true,
      lib: ["DOM", "DOM.Iterable", "ESNext"],
      allowJs: false,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      module: "ESNext",
      moduleResolution: "Node",
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx"
    },
    include: ["src"]
  });

export const buildEnvDts = (): string =>
  ensureTrailingNewline(
    `/// <reference types="vite/client" />\n\ninterface ImportMetaEnv {\n  readonly VITE_GATEWAY_URL?: string;\n  readonly VITE_GATEWAY_PROVIDER?: string;\n  readonly VITE_DEFAULT_MODEL?: string;\n  readonly VITE_FALLBACK_MODEL?: string;\n  readonly VITE_FEEDBACK_EMAIL?: string;\n  readonly VITE_BRANDING_TEXT?: string;\n}\n\ninterface ImportMeta {\n  readonly env: ImportMetaEnv;\n}\n`
  );

export const buildViteConfig = (ctx: QuickstartTemplateContext): string =>
  ensureTrailingNewline(
    normalizeLineEndings(
      `import { defineConfig, loadEnv } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig(({ mode }) => {\n  const env = loadEnv(mode, process.cwd(), "");\n  const parsedPort = Number(env.VITE_DEV_PORT || env.PORT || ${ctx.frontendPort});\n  const port = Number.isFinite(parsedPort) ? parsedPort : ${ctx.frontendPort};\n\n  return {\n    plugins: [react()],\n    resolve: {\n      dedupe: [\n        "react",\n        "react-dom",\n        "@mui/material",\n        "@mui/system",\n        "@emotion/react",\n        "@emotion/styled",
        "react-router-dom"\n      ],\n    },\n    optimizeDeps: {\n      include: ["@burtson-labs/bandit-engine"],\n    },\n    server: {\n      port,\n    },\n  };\n});\n`
    )
  );

export const buildMainTsx = (): string =>
  ensureTrailingNewline(
    normalizeLineEndings(
      `import React from "react";\nimport ReactDOM from "react-dom/client";\nimport { BrowserRouter } from "react-router-dom";\nimport App from "./App";\nimport "./index.css";\n\nReactDOM.createRoot(document.getElementById("root")!).render(\n  <React.StrictMode>\n    <BrowserRouter>\n      <App />\n    </BrowserRouter>\n  </React.StrictMode>\n);\n`
    )
  );

export const buildIndexCss = (): string =>
  ensureTrailingNewline(
    normalizeLineEndings(
      `:root {\n  font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\n  background: radial-gradient(circle at top left, rgba(120, 119, 255, 0.12), transparent 45%),\n    radial-gradient(circle at bottom right, rgba(244, 114, 182, 0.1), transparent 55%),\n    #05070f;\n  color: #f8fafc;\n  min-height: 100vh;\n}\n\nbody {\n  margin: 0;\n}\n\n* {\n  box-sizing: border-box;\n}\n`
    )
  );

export const buildIndexHtml = (): string =>
  ensureTrailingNewline(
    normalizeLineEndings(
      `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <link rel="icon" href="https://cdn.burtson.ai/images/bandit-head.png" />\n    <title>Bandit Quickstart</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`
    )
  );

export const buildThemeTs = (): string =>
  ensureTrailingNewline(
    normalizeLineEndings(
      `import { createTheme } from "@mui/material/styles";\n\nexport const banditQuickstartTheme = createTheme({\n  palette: {\n    mode: "dark",\n    primary: {\n      main: "#f97316",\n    },\n    secondary: {\n      main: "#6366f1",\n    },\n    background: {\n      default: "#05070f",\n      paper: "rgba(15, 23, 42, 0.78)",\n    },\n  },\n  typography: {\n    fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',\n    h1: {\n      fontWeight: 700,\n    },\n    h2: {\n      fontWeight: 600,\n    },\n  },\n  components: {\n    MuiPaper: {\n      styleOverrides: {\n        root: {\n          backdropFilter: "blur(18px)",\n          backgroundImage: "linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.92))",\n        },\n      },\n    },\n  },\n});\n`
    )
  );

export const buildAppTsx = (ctx: QuickstartTemplateContext): string => {
  const responseStatusExpr = "${response.status}";
  const gatewayErrorExpr = '${gatewayError ?? "Unknown"}';

  const template = `
import { useEffect, useState, useMemo, useCallback, type ReactNode } from "react";
import {
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  Chip,
  Tooltip,
  Stack,
  Card,
  CardContent
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { Routes, Route, Navigate, Link as RouterLink, useLocation } from "react-router-dom";
import { ChatProvider, Chat, ChatModal, Management } from "@burtson-labs/bandit-engine";
import * as BanditEngine from "@burtson-labs/bandit-engine";
import { banditQuickstartTheme } from "./theme";

const gatewayBaseUrl = (import.meta.env.VITE_GATEWAY_URL ?? "${ctx.defaultGatewayUrl}").replace(/\\/$/, "");
const defaultModelId = import.meta.env.VITE_DEFAULT_MODEL ?? "${ctx.defaultModelId}";
const fallbackModelId = import.meta.env.VITE_FALLBACK_MODEL ?? ${ctx.fallbackModelId ? `${QUOTE}${ctx.fallbackModelId}${QUOTE}` : "undefined"};
const brandingText = import.meta.env.VITE_BRANDING_TEXT ?? "${ctx.brandingText}";
const provider = (import.meta.env.VITE_GATEWAY_PROVIDER ?? "${ctx.defaultProvider}") as "openai" | "ollama";

const gatewayApiUrl = gatewayBaseUrl.endsWith("/api") ? gatewayBaseUrl : gatewayBaseUrl + "/api";
const banditHeadLogoUrl = "https://cdn.burtson.ai/images/bandit-head.png";
const burtsonLabsLogoUrl = "https://cdn.burtson.ai/logos/burtson-labs-logo-alt.png";
const healthEndpoint = gatewayApiUrl + "/health";

// Move packageSettings outside the component to prevent recreation on every render
const packageSettings = {
  defaultModel: defaultModelId,
  fallbackModel: fallbackModelId,
  gatewayApiUrl: gatewayApiUrl,
  brandingConfigUrl: "/config.json",
  aiProvider: {
    type: "gateway" as const,
    gatewayUrl: gatewayApiUrl,
    provider,
    tokenFactory: () => {
      return localStorage.getItem("authToken");
    }
  },
  feedbackEmail: import.meta.env.VITE_FEEDBACK_EMAIL,
  featureFlags: {
    subscriptionType: "premium" as const,
    rolesClaimKey: "roles",
    subscriptionTypeClaimKey: "subscriptionType", 
    isSubscribedClaimKey: "isSubscribed",
    jwtStorageKey: "authToken",
    adminRole: "admin",
    debug: true,
    featureMatrix: {
      tts: false,
      stt: false,
      semanticSearchSimple: false,
      semanticSearchPremium: false,
      advancedSearch: false,
      advancedMemories: false,
    },
  },
};

function App() {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<"checking" | "healthy" | "error">("checking");
  const [gatewayError, setGatewayError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const applyAuthToken = (token: string) => {
        localStorage.setItem("authToken", token);
        const maybeService = (BanditEngine as { authenticationService?: { setToken: (token: string) => void } }).authenticationService;
        try {
          maybeService?.setToken(token);
        } catch (error) {
          console.warn("Bandit quickstart: failed to seed authentication service token", error);
        }
      };

      const ensureAuthToken = () => {
        const existing = localStorage.getItem("authToken");
        if (existing) {
          applyAuthToken(existing);
          return;
        }

        const header = {
          alg: "HS256",
          typ: "JWT",
        };
        const payload = {
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
          roles: ["admin"],
          iat: Math.floor(Date.now() / 1000),
          email: "quickstart@burtson.ai",
          sub: "123456789012345678901",
        };
        const encodeSegment = (value: unknown) =>
          btoa(JSON.stringify(value))
            .replace(/=+$/g, "")
            .replace(/\\+/g, "-")
            .replace(/\\//g, "_");
        const mockToken = \`${"${"}encodeSegment(header)}.${"${"}encodeSegment(payload)}.quickstart\`;
        applyAuthToken(mockToken);
      };

      ensureAuthToken();
    }
  }, []);

  // Separate effect for health checking to avoid re-renders
  useEffect(() => {
    let cancelled = false;

    const checkHealth = async () => {
      try {
        const response = await fetch(healthEndpoint, { headers: { "Content-Type": "application/json" } });
        if (!response.ok) {
          throw new Error(\`HTTP __RESPONSE_STATUS__\`);
        }
        await response.json();
        if (!cancelled) {
          setGatewayStatus(prevStatus => prevStatus !== "healthy" ? "healthy" : prevStatus);
          setGatewayError(prevError => prevError !== null ? null : prevError);
        }
      } catch (error) {
        if (!cancelled) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          setGatewayStatus(prevStatus => prevStatus !== "error" ? "error" : prevStatus);
          setGatewayError(prevError => prevError !== errorMessage ? errorMessage : prevError);
        }
      }
    };

    // Initial check
    checkHealth();
    
    // Set up interval for periodic checks
    const interval = setInterval(checkHealth, 15000);
    
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const gatewayChip = useMemo(() => (
    <Tooltip
      title={
        gatewayStatus === "error"
          ? \`Gateway health check failed. Last error: __GATEWAY_ERROR__\`
          : gatewayStatus === "healthy"
            ? "Gateway reachable"
            : "Checking gateway health..."
      }
    >
      <Chip
        size="small"
        color={gatewayStatus === "healthy" ? "success" : gatewayStatus === "error" ? "error" : "default"}
        variant={gatewayStatus === "healthy" ? "filled" : "outlined"}
        label={
          gatewayStatus === "healthy"
            ? "Gateway: Healthy"
            : gatewayStatus === "error"
              ? "Gateway: Unreachable"
              : "Gateway: Checking..."
        }
        sx={{ fontWeight: 600 }}
      />
    </Tooltip>
  ), [gatewayStatus, gatewayError]);

  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

  const HomePage = ({ onOpenModal }: { onOpenModal: () => void }) => (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={{ xs: 5, md: 7 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column-reverse", md: "row" },
            alignItems: "center",
            gap: { xs: 4, md: 8 },
          }}
        >
          <Stack spacing={3} sx={{ flex: 1, width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                component="img"
                src={banditHeadLogoUrl}
                alt="Bandit AI logo"
                sx={{ height: 48, width: 48, borderRadius: 3, boxShadow: "0 18px 50px rgba(99, 102, 241, 0.35)" }}
              />
              <Typography variant="overline" color="primary.light" sx={{ letterSpacing: 2 }}>
                Powered by Bandit Engine
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight={700}>
              {brandingText}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Build, brand, and launch your assistant with a drop-in chat surface plus a secure gateway for OpenAI or Ollama.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button component={RouterLink} to="/chat" variant="contained" color="primary">
                Go to chat demo
              </Button>
              <Button variant="outlined" color="secondary" onClick={onOpenModal}>
                Open modal assistant
              </Button>
            </Stack>
          </Stack>
          <Box
            component="img"
            src={burtsonLabsLogoUrl}
            alt="Burtson Labs logo"
            sx={{
              width: "100%",
              maxWidth: 320,
              mx: { xs: "auto", md: 0 },
              display: "block",
              filter: "drop-shadow(0 25px 45px rgba(15, 23, 42, 0.45))",
            }}
          />
        </Box>
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          }}
        >
          <Card sx={{ height: "100%", backdropFilter: "blur(12px)", backgroundColor: "rgba(15, 23, 42, 0.64)" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configure in minutes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Edit <code>public/config.json</code> and <code>.env</code> to tailor models, personas, and branding for your product.
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ height: "100%", backdropFilter: "blur(12px)", backgroundColor: "rgba(15, 23, 42, 0.64)" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ship secure gateways
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Keep API keys server-side while proxying requests to OpenAI or Ollama through the included Express gateway.
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ height: "100%", backdropFilter: "blur(12px)", backgroundColor: "rgba(15, 23, 42, 0.64)" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Manage knowledge freely
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add memories, files, and tools directly in the management console that ships with this quickstart.
              </Typography>
              <Button component={RouterLink} to="/management" variant="text" color="secondary" sx={{ mt: 2, px: 0 }}>
                Explore management console
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Container>
  );

  const ChatPage = ({ onOpenModal }: { onOpenModal: () => void }) => (
    <Container maxWidth="lg" sx={{ py: 4, display: "flex", flexDirection: "column", gap: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Chat demo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This route renders the full <code>{\`<Chat />\`}</code> surface powered by your quickstart gateway.
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button component={RouterLink} to="/management" variant="outlined" color="secondary">
            Management console
          </Button>
          <Button variant="contained" color="primary" onClick={onOpenModal}>
            Open modal assistant
          </Button>
        </Stack>
      </Stack>
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 540,
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 35px 90px rgba(15, 23, 42, 0.55)",
        }}
      >
        <Chat />
      </Box>
    </Container>
  );

  const Header = ({ gatewayChip }: { gatewayChip: ReactNode }) => (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{ borderBottom: "1px solid rgba(148, 163, 184, 0.16)", backdropFilter: "blur(18px)" }}
    >
      <Toolbar sx={{ gap: 2, flexWrap: "wrap" }}>
        <Button
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            py: 1,
            px: 1.5,
            borderRadius: 2,
            textTransform: "none",
            bgcolor: "transparent",
            "&:hover": { bgcolor: "rgba(99, 102, 241, 0.12)" },
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {brandingText}
          </Typography>
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        {gatewayChip}
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
          <Button component={RouterLink} to="/" color="inherit">
            Home
          </Button>
          <Button component={RouterLink} to="/management" color="inherit">
            Management
          </Button>
          <Button component={RouterLink} to="/chat" variant="contained" color="primary">
            Go to chat
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );

  return (
    <Routes>
      <Route path="/management" element={
        <ChatProvider packageSettings={packageSettings}>
          <Management />
        </ChatProvider>
      } />
      <Route path="/chat" element={
            <ThemeProvider theme={banditQuickstartTheme}>
              <CssBaseline />
              <ChatProvider packageSettings={packageSettings}>
                <Box display="flex" flexDirection="column" minHeight="100vh">
                  <Box component="main" sx={{ flexGrow: 1, display: "flex" }}>
                    <ChatPage onOpenModal={handleOpenModal} />
                  </Box>
                  <ChatModal open={isModalOpen} onClose={handleCloseModal} />
                </Box>
              </ChatProvider>
            </ThemeProvider>
          } />
          <Route path="/*" element={
            <ThemeProvider theme={banditQuickstartTheme}>
              <CssBaseline />
              <ChatProvider packageSettings={packageSettings}>
                <Box display="flex" flexDirection="column" minHeight="100vh">
                <Header gatewayChip={gatewayChip} />
                <Box component="main" sx={{ flexGrow: 1, display: "flex" }}>
                  <Routes>
                    <Route path="/" element={<HomePage onOpenModal={handleOpenModal} />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Box>
                <ChatModal open={isModalOpen} onClose={handleCloseModal} />
                </Box>
              </ChatProvider>
            </ThemeProvider>
          } />
        </Routes>
  );
}

export default App;
`;

  const withResponse = template.replace(/__RESPONSE_STATUS__/g, responseStatusExpr);
  const withGatewayError = withResponse.replace(/__GATEWAY_ERROR__/g, gatewayErrorExpr);

  return ensureTrailingNewline(normalizeLineEndings(withGatewayError));
};

export const buildBrandingConfig = (ctx: QuickstartTemplateContext): string =>
  formatJson({
    branding: {
      logoBase64: ctx.isDefaultLogo ? null : ctx.logoBase64,
      brandingText: ctx.brandingText,
      theme: "bandit-dark",
      hasTransparentLogo: ctx.isDefaultLogo ? true : ctx.hasTransparentLogo
    },
    knowledgeDocs: []
  });

export const buildGatewayServer = (ctx: QuickstartTemplateContext): string => {
  const modelsDefinition = JSON.stringify(ctx.gatewayModels, null, 2);

  const gatewaySource = `import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const QUICKSTART_VERSION = "0.1.0";
const DEFAULT_PROVIDER = "${ctx.defaultProvider}";
const BASE_GATEWAY_MODELS = ${modelsDefinition};
const OLLAMA_BASE_URL = (process.env.OLLAMA_URL ?? "http://localhost:11434").replace(/\\/$/, "");

const toGatewayModels = () =>
  BASE_GATEWAY_MODELS.map((model) => ({
    ...model,
    created: Date.now(),
    modified_at: new Date().toISOString(),
    size: 0,
    digest: "",
    details: {
      format: "chat",
      family: model.provider,
      families: [model.provider],
      parameter_size: "",
      quantization_level: "",
    },
  }));

const requireOpenAIKey = () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("Missing OPENAI_API_KEY. Add it to your .env file to route requests to OpenAI.");
  }
  return key;
};

// Utility function to handle streaming responses
const handleStreamingResponse = async (upstreamResponse, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Get the readable stream from the response
    const reader = upstreamResponse.body.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Write the chunk to the response
      res.write(value);
    }
    
    res.end();
  } catch (error) {
    console.error('Streaming error:', error);
    // Fallback to non-streaming
    const text = await upstreamResponse.text();
    res.send(text);
  }
};

// ============================================================================
// GENERAL HEALTH & MODELS
// ============================================================================

app.get("/api/health", async (_req, res) => {
  const providers = [];
  
  // Check OpenAI
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { "Authorization": \`Bearer \${openaiKey}\` }
      });
      providers.push({
        name: "openai",
        status: response.ok ? "healthy" : "unhealthy",
        provider: "openai"
      });
    } else {
      providers.push({
        name: "openai", 
        status: "unconfigured",
        provider: "openai",
        error: "API key not configured"
      });
    }
  } catch (error) {
    providers.push({
      name: "openai",
      status: "unhealthy", 
      provider: "openai",
      error: error.message
    });
  }

  // Check Ollama
  try {
    console.log(\`Checking Ollama health at: \${OLLAMA_BASE_URL}/api/tags\`);
    const response = await fetch(\`\${OLLAMA_BASE_URL}/api/tags\`);
    const status = response.ok ? "healthy" : "unhealthy";
    console.log(\`Ollama health check result: \${status}\`);
    providers.push({
      name: "ollama",
      status: status,
      provider: "ollama",
      url: OLLAMA_BASE_URL
    });
  } catch (error) {
    console.log(\`Ollama health check error: \${error.message}\`);
    providers.push({
      name: "ollama",
      status: "offline",
      provider: "ollama",
      error: error.message,
      url: OLLAMA_BASE_URL
    });
  }

  const overallHealthy = providers.some(p => p.status === "healthy");
  
  res.json({
    status: overallHealthy ? "healthy" : "unhealthy",
    version: QUICKSTART_VERSION,
    uptime: Math.round(process.uptime()),
    providers
  });
});

app.get("/api/models", (_req, res) => {
  res.json({ models: toGatewayModels() });
});

// ============================================================================
// OPENAI ROUTES
// ============================================================================

// OpenAI Health Check
app.get("/api/openai/health", async (_req, res) => {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.status(503).json({
        status: "unhealthy",
        openai_status: false,
        error: "OpenAI API key not configured",
        provider: "openai"
      });
    }

    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { "Authorization": \`Bearer \${openaiKey}\` }
    });

    const isHealthy = response.ok;
    res.json({
      status: isHealthy ? "healthy" : "unhealthy",
      openai_status: isHealthy,
      provider: "openai"
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      openai_status: false,
      error: error.message,
      provider: "openai"
    });
  }
});

// OpenAI Chat Completions
app.post("/api/openai/chat/completions", async (req, res) => {
  try {
    const openaiKey = requireOpenAIKey();
    const isStreaming = req.body?.stream === true;

    // Strip the openai: prefix from model name and remove provider field
    const { provider, ...cleanBody } = req.body;
    const requestBody = {
      ...cleanBody,
      model: req.body?.model?.replace(/^openai:/, "") || "gpt-4o"
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${openaiKey}\`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: \`OpenAI chat failed: \${response.status}\`,
        details: errorText
      });
    }

    if (isStreaming) {
      await handleStreamingResponse(response, res);
    } else {
      const text = await response.text();
      res.setHeader('Content-Type', 'application/json');
      res.send(text);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// OpenAI Chat (alternative route)
app.post("/api/openai/chat", async (req, res) => {
  // Route to the completions endpoint for compatibility
  req.url = "/api/openai/chat/completions";
  return app._router.handle(req, res);
});

// OpenAI Completions
app.post("/api/openai/completions", async (req, res) => {
  try {
    const openaiKey = requireOpenAIKey();
    const isStreaming = req.body?.stream === true;

    // Strip the openai: prefix from model name and remove provider field
    const { provider, ...cleanBody } = req.body;
    const requestBody = {
      ...cleanBody,
      model: req.body?.model?.replace(/^openai:/, "") || "gpt-3.5-turbo-instruct"
    };

    const response = await fetch("https://api.openai.com/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${openaiKey}\`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: \`OpenAI completions failed: \${response.status}\`,
        details: errorText
      });
    }

    if (isStreaming) {
      await handleStreamingResponse(response, res);
    } else {
      const text = await response.text();
      res.setHeader('Content-Type', 'application/json');
      res.send(text);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// OpenAI Generate (converts to chat format for conversation starters)
app.post("/api/openai/generate", async (req, res) => {
  try {
    const openaiKey = requireOpenAIKey();
    const prompt = req.body?.prompt || "";
    const model = req.body?.model?.replace(/^openai:/, "") || "gpt-4o";
    const isStreaming = req.body?.stream === true;

    // Convert generate request to chat format
    const chatBody = {
      model: model,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      stream: isStreaming,
      max_tokens: req.body?.max_tokens || 150,
      temperature: req.body?.temperature || 0.7
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${openaiKey}\`
      },
      body: JSON.stringify(chatBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: \`OpenAI generate failed: \${response.status}\`,
        details: errorText
      });
    }

    if (isStreaming) {
      await handleStreamingResponse(response, res);
    } else {
      const data = await response.json();
      // Convert chat response back to generate format
      const generateResponse = {
        model: model,
        created_at: new Date().toISOString(),
        response: data.choices?.[0]?.message?.content || "",
        done: true,
        context: [],
        total_duration: 0,
        load_duration: 0,
        prompt_eval_count: 0,
        prompt_eval_duration: 0,
        eval_count: data.usage?.completion_tokens || 0,
        eval_duration: 0
      };
      res.json(generateResponse);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// OpenAI Models
app.get("/api/openai/models", async (_req, res) => {
  try {
    const openaiKey = requireOpenAIKey();

    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { "Authorization": \`Bearer \${openaiKey}\` }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: \`OpenAI models failed: \${response.status}\`,
        details: errorText
      });
    }

    const text = await response.text();
    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// OLLAMA ROUTES
// ============================================================================

// Ollama Health Check
app.get("/api/ollama/health", async (_req, res) => {
  try {
    console.log(\`Ollama health check at: \${OLLAMA_BASE_URL}/api/tags\`);
    const response = await fetch(\`\${OLLAMA_BASE_URL}/api/tags\`);
    const isHealthy = response.ok;

    res.json({
      status: isHealthy ? "healthy" : "unhealthy",
      ollama_status: isHealthy,
      provider: "ollama",
      url: OLLAMA_BASE_URL
    });
  } catch (error) {
    console.log(\`Ollama health check error: \${error.message}\`);
    res.status(503).json({
      status: "offline",
      ollama_status: false,
      error: error.message,
      provider: "ollama",
      url: OLLAMA_BASE_URL
    });
  }
});

// Ollama Chat
app.post("/api/ollama/chat", async (req, res) => {
  try {
    const response = await fetch(\`\${OLLAMA_BASE_URL}/api/chat\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: \`Ollama chat failed: \${response.status}\`,
        details: errorText
      });
    }

    const isStreaming = req.body?.stream === true;
    if (isStreaming) {
      await handleStreamingResponse(response, res);
    } else {
      const text = await response.text();
      res.setHeader('Content-Type', 'application/json');
      res.send(text);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ollama Generate
app.post("/api/ollama/generate", async (req, res) => {
  try {
    const response = await fetch(\`\${OLLAMA_BASE_URL}/api/generate\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: \`Ollama generate failed: \${response.status}\`,
        details: errorText
      });
    }

    const isStreaming = req.body?.stream === true;
    if (isStreaming) {
      await handleStreamingResponse(response, res);
    } else {
      const text = await response.text();
      res.setHeader('Content-Type', 'application/json');
      res.send(text);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ollama Models
app.get("/api/ollama/models", async (_req, res) => {
  try {
    const response = await fetch(\`\${OLLAMA_BASE_URL}/api/tags\`);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: \`Ollama models failed: \${response.status}\`,
        details: errorText
      });
    }

    const text = await response.text();
    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ollama Embedding
app.post("/api/ollama/embed", async (req, res) => {
  try {
    const response = await fetch(\`\${OLLAMA_BASE_URL}/api/embeddings\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: \`Ollama embed failed: \${response.status}\`,
        details: errorText
      });
    }

    const text = await response.text();
    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// TTS ROUTES (not implemented - placeholder for compatibility)
// ============================================================================

// TTS Main endpoint
app.post("/api/tts", async (_req, res) => {
  res.status(501).json({
    error: "TTS integration not implemented",
    message: "Text-to-speech functionality is not available in this quickstart gateway"
  });
});

// TTS Stream endpoint
app.post("/api/tts/stream", async (_req, res) => {
  res.status(501).json({
    error: "TTS streaming not implemented", 
    message: "Text-to-speech streaming functionality is not available in this quickstart gateway"
  });
});

// TTS Real-time stream endpoint
app.post("/api/tts/stream-realtime", async (_req, res) => {
  res.status(501).json({
    error: "TTS real-time streaming not implemented",
    message: "Text-to-speech real-time streaming functionality is not available in this quickstart gateway"
  });
});

// TTS Models endpoint - returns empty models
app.get("/api/tts/models", async (_req, res) => {
  res.json({
    models: []
  });
});

// TTS Available models endpoint - returns empty models with defaults
app.get("/api/tts/available-models", async (_req, res) => {
  res.json({
    models: [],
    defaultModel: null,
    fallbackModel: null
  });
});

// ============================================================================
// MCP (Model Context Protocol) TOOL ROUTES
// ============================================================================

// MCP Health Check
app.get("/api/mcp/health", async (_req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    totalTools: 0,
    enabledTools: 0,
    availableTools: [],
    message: "MCP tools are not implemented in this quickstart gateway"
  });
});

// Get available MCP tools
app.get("/api/mcp/tools", async (_req, res) => {
  res.json([]);
});

// News endpoint - placeholder implementation
app.get("/api/mcp/news", async (req, res) => {
  const { topic = "general", count = 10, headlines = false } = req.query;
  
  res.status(501).json({
    error: "News service not implemented",
    message: "MCP news functionality is not available in this quickstart gateway",
    suggestion: "Implement this endpoint to connect to a news API service",
    requestedParams: { topic, count, headlines }
  });
});

// Weather endpoint - placeholder implementation  
app.get("/api/mcp/weather", async (req, res) => {
  const { zip, latitude, longitude } = req.query;
  
  res.status(501).json({
    error: "Weather service not implemented", 
    message: "MCP weather functionality is not available in this quickstart gateway",
    suggestion: "Implement this endpoint to connect to a weather API service",
    requestedParams: { zip, latitude, longitude }
  });
});

// Documentation search endpoint - placeholder implementation
app.get("/api/mcp/docs", async (req, res) => {
  const { query, framework, count = 10 } = req.query;
  
  if (!query) {
    return res.status(400).json({
      error: "Query parameter is required",
      message: "Please provide a search query"
    });
  }
  
  res.status(501).json({
    error: "Documentation search not implemented",
    message: "MCP docs functionality is not available in this quickstart gateway", 
    suggestion: "Implement this endpoint to connect to a documentation search service",
    requestedParams: { query, framework, count }
  });
});

// Get supported documentation frameworks
app.get("/api/mcp/docs/frameworks", async (_req, res) => {
  res.json({
    frameworks: [],
    message: "Documentation frameworks not configured in this quickstart gateway"
  });
});

// Sports scores endpoint - placeholder implementation
app.get("/api/mcp/sports", async (req, res) => {
  const { league, date } = req.query;
  
  res.status(501).json({
    error: "Sports service not implemented",
    message: "MCP sports functionality is not available in this quickstart gateway",
    suggestion: "Implement this endpoint to connect to a sports API service", 
    requestedParams: { league, date }
  });
});

// Get supported sports leagues
app.get("/api/mcp/sports/leagues", async (_req, res) => {
  res.json({
    leagues: [],
    message: "Sports leagues not configured in this quickstart gateway"
  });
});

// Image generation endpoint - placeholder implementation
app.post("/api/mcp/generate-image", async (req, res) => {
  const { prompt, size, quality, style } = req.body;
  
  if (!prompt) {
    return res.status(400).json({
      error: "Prompt is required",
      message: "Please provide a prompt for image generation"
    });
  }
  
  res.status(501).json({
    success: false,
    error: "Image generation not implemented",
    message: "MCP image generation functionality is not available in this quickstart gateway",
    suggestion: "Implement this endpoint to connect to an image generation API service",
    requestedParams: { prompt, size, quality, style }
  });
});

// ============================================================================
// NOT IMPLEMENTED ROUTES (for graceful degradation)
// ============================================================================

app.all("/api/anthropic/*", (_req, res) => {
  res.status(501).json({
    error: "Anthropic integration not implemented",
    message: "This quickstart gateway only supports OpenAI and Ollama providers"
  });
});

app.all("/api/azure/*", (_req, res) => {
  res.status(501).json({
    error: "Azure OpenAI integration not implemented", 
    message: "This quickstart gateway only supports OpenAI and Ollama providers"
  });
});

const port = Number(process.env.PORT ?? ${ctx.gatewayPort});
app.listen(port, () => {
  console.log("⚡ Bandit quickstart gateway ready on http://localhost:" + port);
  console.log("📡 Supported providers: OpenAI, Ollama");
  console.log("🔗 Provider-specific routes:");
  console.log("   • /api/openai/* - OpenAI endpoints");
  console.log("   • /api/ollama/* - Ollama endpoints");
  console.log("   • /api/health - Overall health check");
});
`;

  return ensureTrailingNewline(normalizeLineEndings(gatewaySource));
};

export const buildGitignore = (): string =>
  ensureTrailingNewline(
    normalizeLineEndings(
      `node_modules\n.env\n.vite\n.idea\n.DS_Store\ncoverage\ndist\n`
    )
  );

export const buildNpmrc = (): string => {
  const tokenExpr = "${GITHUB_NPM_TOKEN}";
  const template = `@burtson-labs:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=__NPM_TOKEN__
`;

  return ensureTrailingNewline(
    normalizeLineEndings(template.replace(/__NPM_TOKEN__/g, tokenExpr))
  );
};

export const buildReadme = (ctx: QuickstartTemplateContext): string =>
  ensureTrailingNewline(
    normalizeLineEndings(
      `# ${ctx.projectTitle} — Bandit Quickstart\n\nThis project was generated by the Bandit Engine CLI. It ships with a React + Vite frontend that consumes \`@burtson-labs/bandit-engine\` and a lightweight Express gateway you can adapt for production.\n\n## 🚀 Next steps\n- \`npm install\`\n- \`cp .env.example .env\`\n- Fill in \`OPENAI_API_KEY\` (or point \`OLLAMA_URL\` at your local server)\n- \`npm run dev\`\n\nThe command runs the gateway and the frontend together. Visit http://localhost:${ctx.frontendPort} to see the chat and modal in action.\n\n## 🔧 Customizing your assistant\n- **Branding & personas**: edit \`public/config.json\` to tweak logos, colors, and starter models.\n- **Provider defaults**: update \`.env\` to switch providers or change the default upstream model IDs.\n- **Gateway routes**: open \`server/gateway.js\` to add auth, logging, or connect additional providers.\n\n## 📦 What’s inside\n- React + Vite 5 with Material UI theming\n- Bandit chat surface + modal wired via \`ChatProvider\`\n- Express gateway proxying OpenAI or Ollama to keep API keys server-side\n- Friendly defaults you can evolve into your production stack\n\nNeed more? Run \`npx @burtson-labs/bandit-engine create --help\` to explore additional options.\n`
    )
  );

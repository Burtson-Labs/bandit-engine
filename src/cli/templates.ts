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
  defaultProvider: "openai" | "ollama" | "azure" | "anthropic" | "xai";
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
      `# Frontend configuration\nVITE_DEV_PORT=${ctx.frontendPort}\nVITE_GATEWAY_URL=${ctx.defaultGatewayUrl}\nVITE_DEFAULT_MODEL=${ctx.defaultModelId}\nVITE_FALLBACK_MODEL=${ctx.fallbackModelId ?? ""}\nVITE_GATEWAY_PROVIDER=${ctx.defaultProvider}\nVITE_BRANDING_TEXT=${ctx.brandingText}\n\n# Gateway configuration\n# OPENAI_API_KEY=sk-................................\n# AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com\n# AZURE_OPENAI_API_KEY=................................................................\n# AZURE_OPENAI_API_VERSION=2024-08-01-preview\n# AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4o\n# AZURE_OPENAI_COMPLETIONS_DEPLOYMENT=gpt-35-turbo-instruct\n# AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT=text-embedding-3-large\n# ANTHROPIC_API_KEY=sk-ant-................................\n# ANTHROPIC_BASE_URL=https://api.anthropic.com\n# ANTHROPIC_API_VERSION=2023-06-01\n# ANTHROPIC_MAX_TOKENS=1024\n# XAI_API_KEY=sk-xai-................................\n# XAI_BASE_URL=https://api.x.ai/v1\n# OLLAMA_URL=http://localhost:11434\n# PORT=${ctx.gatewayPort}\n`
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
const provider = (import.meta.env.VITE_GATEWAY_PROVIDER ?? "${ctx.defaultProvider}") as "openai" | "ollama" | "azure" | "anthropic" | "xai";

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
              Build, brand, and launch your assistant with a drop-in chat surface plus a secure gateway for OpenAI, Azure OpenAI, Anthropic, XAI, or Ollama.
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
                Keep API keys server-side while proxying requests to OpenAI, Azure OpenAI, Anthropic, XAI, or Ollama through the included Express gateway.
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

const NEXT_CHAT_ROUTE_TEMPLATE = `import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_PROVIDER = "__DEFAULT_PROVIDER__";
const DEFAULT_MODEL = "__DEFAULT_MODEL__";
const FALLBACK_MODEL = __FALLBACK_MODEL__;

const OLLAMA_URL = (process.env.OLLAMA_URL ?? "http://localhost:11434").replace(/\\/$/, "");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT ? process.env.AZURE_OPENAI_ENDPOINT.replace(/\\/$/, "") : undefined;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION ?? "2024-08-01-preview";
const AZURE_OPENAI_CHAT_DEPLOYMENT = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT;
const AZURE_OPENAI_COMPLETIONS_DEPLOYMENT = process.env.AZURE_OPENAI_COMPLETIONS_DEPLOYMENT ?? AZURE_OPENAI_CHAT_DEPLOYMENT;
const AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT = process.env.AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_BASE_URL = (process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com").replace(/\\/$/, "");
const ANTHROPIC_API_VERSION = process.env.ANTHROPIC_API_VERSION ?? "2023-06-01";
const ANTHROPIC_MAX_TOKENS = Number.isFinite(Number(process.env.ANTHROPIC_MAX_TOKENS))
  ? Number(process.env.ANTHROPIC_MAX_TOKENS)
  : 1024;
const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_BASE_URL = (process.env.XAI_BASE_URL ?? "https://api.x.ai/v1").replace(/\\/$/, "");

interface GatewayChatBody {
  provider?: string;
  model?: string;
  messages?: Array<{ role: string; content: unknown }>;
  prompt?: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stop?: string | string[];
  stop_sequences?: string | string[];
  tools?: unknown;
  tool_choice?: unknown;
  metadata?: unknown;
  thinking?: unknown;
  images?: string[];
  [key: string]: unknown;
}

const normalizeProvider = (input: string): "openai" | "azure" | "anthropic" | "ollama" | "xai" => {
  const value = input.toLowerCase();
  if (value === "azure-openai" || value === "azureopenai" || value === "azure") return "azure";
  if (value === "anthropic" || value === "claude") return "anthropic";
  if (value === "ollama") return "ollama";
  if (value === "xai" || value === "grok") return "xai";
  return "openai";
};

const stripPrefix = (model: unknown, prefix: string, fallback: string): string => {
  if (typeof model === "string") {
    return model.replace(new RegExp(\`^\${prefix}:\`), "");
  }
  return fallback;
};

const requireOpenAIKey = () => {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY. Add it to your .env file to route requests to OpenAI.");
  }
  return OPENAI_API_KEY;
};

const requireXAIKey = () => {
  if (!XAI_API_KEY) {
    throw new Error("Missing XAI_API_KEY. Add it to your .env file to route requests to xAI.");
  }
  return XAI_API_KEY;
};

const requireAnthropicKey = () => {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY. Add it to your .env file to route requests to Anthropic.");
  }
  return ANTHROPIC_API_KEY;
};

const isAzureConfigured = () => Boolean(AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_API_KEY);

const requireAzureBaseConfig = () => {
  if (!AZURE_OPENAI_ENDPOINT) {
    throw new Error("Missing AZURE_OPENAI_ENDPOINT. Add it to your .env file to route requests to Azure OpenAI.");
  }
  if (!AZURE_OPENAI_API_KEY) {
    throw new Error("Missing AZURE_OPENAI_API_KEY. Add it to your .env file to route requests to Azure OpenAI.");
  }
  return {
    endpoint: AZURE_OPENAI_ENDPOINT,
    apiKey: AZURE_OPENAI_API_KEY,
  };
};

const buildAzureDeploymentUrl = (deployment: string | undefined, suffix: string) => {
  if (!deployment) {
    throw new Error(\`Missing Azure OpenAI \${suffix.split("/")[0]} deployment name.\`);
  }
  const { endpoint } = requireAzureBaseConfig();
  const normalized = suffix.replace(/^\\/+/, "");
  return \`\${endpoint}/openai/deployments/\${deployment}/\${normalized}?api-version=\${AZURE_OPENAI_API_VERSION}\`;
};

const resolveAzureDeployment = (model: unknown, fallback: string | undefined, kind: "chat" | "completions" | "embeddings") => {
  const explicit = typeof model === "string" ? model.replace(/^azure:/, "") : undefined;
  if (explicit) return explicit;
  if (kind === "embeddings") return AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT ?? fallback;
  if (kind === "completions") return AZURE_OPENAI_COMPLETIONS_DEPLOYMENT ?? fallback;
  return AZURE_OPENAI_CHAT_DEPLOYMENT ?? fallback;
};

const flattenGatewayContent = (content: unknown): string => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "type" in part) {
          const typed = part as { type?: string; text?: string; image_url?: { url?: string } };
          if (typed.type === "text" && typeof typed.text === "string") return typed.text;
          if (typed.type === "image_url" && typed.image_url?.url) return \`[Image: \${typed.image_url.url}]\`;
        }
        return JSON.stringify(part ?? {});
      })
      .join("\\n");
  }
  if (content && typeof content === "object") return JSON.stringify(content);
  return "";
};

const toAnthropicMessages = (messages: Array<{ role: string; content: unknown }> = []) => {
  const anthropicMessages: Array<{ role: "user" | "assistant"; content: Array<{ type: "text"; text: string }> }> = [];
  let systemPrompt = "";

  for (const message of messages) {
    if (!message) continue;
    const text = flattenGatewayContent(message.content);
    if (message.role === "system") {
      systemPrompt = systemPrompt ? \`\${systemPrompt}\\n\\n\${text}\` : text;
      continue;
    }
    const role = message.role === "assistant" ? "assistant" : "user";
    anthropicMessages.push({
      role,
      content: [{ type: "text", text }],
    });
  }

  return { messages: anthropicMessages, system: systemPrompt || undefined };
};

const convertAnthropicResponseToGateway = (responseBody: any, modelName: string) => {
  if (!responseBody) {
    return {
      id: \`anthropic-\${Date.now()}\`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: modelName.startsWith("anthropic:") ? modelName : \`anthropic:\${modelName}\`,
      choices: [],
    };
  }

  const textContent = Array.isArray(responseBody.content)
    ? responseBody.content
        .filter((item: any) => item && item.type === "text" && typeof item.text === "string")
        .map((item: any) => item.text)
        .join("\\n")
    : typeof responseBody.content === "string"
      ? responseBody.content
      : "";

  const promptTokens = responseBody.usage?.input_tokens ?? 0;
  const completionTokens = responseBody.usage?.output_tokens ?? 0;

  return {
    id: responseBody.id ?? \`anthropic-\${Date.now()}\`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: modelName.startsWith("anthropic:") ? modelName : \`anthropic:\${modelName}\`,
    choices: [
      {
        index: 0,
        message: {
          role: responseBody.role ?? "assistant",
          content: textContent,
        },
        finish_reason: responseBody.stop_reason ?? responseBody.stop_sequence ?? null,
      },
    ],
    usage: responseBody.usage
      ? {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: promptTokens + completionTokens,
        }
      : undefined,
  };
};

const passthroughResponse = (upstream: Response) => {
  const headers = new Headers(upstream.headers);
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
};

const jsonResponse = async (upstream: Response) => {
  const data = await upstream.json().catch(async () => ({ raw: await upstream.text() }));
  return NextResponse.json(data, { status: upstream.status });
};

const errorResponse = (status: number, error: unknown) =>
  NextResponse.json(
    {
      error: error instanceof Error ? error.message : String(error ?? "Unknown error"),
    },
    { status }
  );

export async function POST(request: NextRequest) {
  const body = (await request.json()) as GatewayChatBody;
  const provider = normalizeProvider(body.provider ?? DEFAULT_PROVIDER);
  const stream = body.stream !== false;

  try {
    switch (provider) {
      case "openai": {
        const openaiKey = requireOpenAIKey();
        const { provider: _provider, ...cleanBody } = body;
        const requestBody = {
          ...cleanBody,
          stream,
          model: stripPrefix(body.model ?? DEFAULT_MODEL, "openai", "gpt-4o"),
        };
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: \`Bearer \${openaiKey}\`,
          },
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
          const details = await response.text();
          return NextResponse.json({ error: \`OpenAI chat failed: \${response.status}\`, details }, { status: response.status });
        }
        return stream ? passthroughResponse(response) : jsonResponse(response);
      }

      case "xai": {
        const xaiKey = requireXAIKey();
        const { provider: _provider, ...cleanBody } = body;
        const requestBody = {
          ...cleanBody,
          stream,
          model: stripPrefix(body.model ?? DEFAULT_MODEL, "xai", "grok-2-latest"),
        };
        const response = await fetch(\`\${XAI_BASE_URL}/chat/completions\`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: \`Bearer \${xaiKey}\`,
          },
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
          const details = await response.text();
          return NextResponse.json({ error: \`xAI chat failed: \${response.status}\`, details }, { status: response.status });
        }
        return stream ? passthroughResponse(response) : jsonResponse(response);
      }

      case "anthropic": {
        const anthropicKey = requireAnthropicKey();
        const requestedModel = stripPrefix(body.model ?? DEFAULT_MODEL, "anthropic", "claude-3-5-sonnet-latest");
        const stopSequences = Array.isArray(body.stop)
          ? body.stop
          : Array.isArray(body.stop_sequences)
            ? body.stop_sequences
            : body.stop
              ? [body.stop]
              : undefined;
        const { messages, system } = toAnthropicMessages(Array.isArray(body.messages) ? body.messages : []);
        const fallbackText = typeof body.prompt === "string" && body.prompt.trim().length > 0
          ? body.prompt
          : "Hello from Bandit quickstart gateway";

        const requestBody: Record<string, unknown> = {
          model: requestedModel,
          messages: messages.length > 0
            ? messages
            : [
                {
                  role: "user",
                  content: [{ type: "text", text: fallbackText }],
                },
              ],
          stream,
          max_tokens: typeof body.max_tokens === "number" && body.max_tokens > 0 ? body.max_tokens : ANTHROPIC_MAX_TOKENS,
        };

        if (system) requestBody.system = system;
        if (typeof body.temperature === "number") requestBody.temperature = body.temperature;
        if (typeof body.top_p === "number") requestBody.top_p = body.top_p;
        if (typeof body.top_k === "number") requestBody.top_k = body.top_k;
        if (stopSequences) requestBody.stop_sequences = stopSequences;
        if (body.metadata) requestBody.metadata = body.metadata;
        if (body.tools) requestBody.tools = body.tools;
        if (body.tool_choice) requestBody.tool_choice = body.tool_choice;
        if (body.thinking) requestBody.thinking = body.thinking;

        const response = await fetch(\`\${ANTHROPIC_BASE_URL}/v1/messages\`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": ANTHROPIC_API_VERSION,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const details = await response.text();
          return NextResponse.json({ error: \`Anthropic chat failed: \${response.status}\`, details }, { status: response.status });
        }

        if (stream) {
          return passthroughResponse(response);
        }

        const data = await response.json();
        const normalized = convertAnthropicResponseToGateway(data, requestedModel);
        return NextResponse.json(normalized);
      }

      case "azure": {
        const { apiKey } = requireAzureBaseConfig();
        const deployment = resolveAzureDeployment(body.model, AZURE_OPENAI_CHAT_DEPLOYMENT, "chat");
        const { provider: _provider, model: _model, ...cleanBody } = body;
        const requestBody = {
          ...cleanBody,
          stream,
        };

        const response = await fetch(buildAzureDeploymentUrl(deployment, "chat/completions"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": apiKey,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const details = await response.text();
          return NextResponse.json({ error: \`Azure OpenAI chat failed: \${response.status}\`, details }, { status: response.status });
        }

        return stream ? passthroughResponse(response) : jsonResponse(response);
      }

      case "ollama": {
        const { provider: _provider, ...cleanBody } = body;
        const requestBody = {
          ...cleanBody,
          stream,
          model: stripPrefix(body.model ?? DEFAULT_MODEL, "ollama", "llama3.1"),
        };

        const response = await fetch(\`\${OLLAMA_URL}/api/chat\`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const details = await response.text();
          return NextResponse.json({ error: \`Ollama chat failed: \${response.status}\`, details }, { status: response.status });
        }

        return stream ? passthroughResponse(response) : jsonResponse(response);
      }

      default:
        return errorResponse(400, \`Unsupported provider: \${provider}\`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.startsWith("Missing") ? 400 : 500;
    return errorResponse(status, error);
  }
}

`;
const NEXT_HEALTH_ROUTE_TEMPLATE = `import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const QUICKSTART_VERSION = "0.1.0";
const OLLAMA_URL = (process.env.OLLAMA_URL ?? "http://localhost:11434").replace(/\\/$/, "");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT ? process.env.AZURE_OPENAI_ENDPOINT.replace(/\\/$/, "") : undefined;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION ?? "2024-08-01-preview";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_BASE_URL = (process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com").replace(/\\/$/, "");
const ANTHROPIC_API_VERSION = process.env.ANTHROPIC_API_VERSION ?? "2023-06-01";
const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_BASE_URL = (process.env.XAI_BASE_URL ?? "https://api.x.ai/v1").replace(/\\/$/, "");

const isAzureConfigured = () => Boolean(AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_API_KEY);

const buildAzurePath = (path: string) => {
  const normalized = path.replace(/^\\/+/, "");
  if (!AZURE_OPENAI_ENDPOINT) {
    throw new Error("Missing AZURE_OPENAI_ENDPOINT. Add it to your .env file to route requests to Azure OpenAI.");
  }
  return \`\${AZURE_OPENAI_ENDPOINT}/openai/\${normalized}?api-version=\${AZURE_OPENAI_API_VERSION}\`;
};

export async function GET() {
  const providers: Array<Record<string, unknown>> = [];

  // OpenAI
  try {
    if (OPENAI_API_KEY) {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: \`Bearer \${OPENAI_API_KEY}\` },
      });
      providers.push({
        name: "openai",
        status: response.ok ? "healthy" : "unhealthy",
        provider: "openai",
      });
    } else {
      providers.push({
        name: "openai",
        status: "unconfigured",
        provider: "openai",
        error: "API key not configured",
      });
    }
  } catch (error) {
    providers.push({
      name: "openai",
      status: "unhealthy",
      provider: "openai",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Azure
  if (AZURE_OPENAI_ENDPOINT || AZURE_OPENAI_API_KEY) {
    if (!isAzureConfigured()) {
      providers.push({
        name: "azure",
        status: "unconfigured",
        provider: "azure",
        error: "Endpoint or API key not configured",
        endpoint: AZURE_OPENAI_ENDPOINT,
      });
    } else {
      try {
        const response = await fetch(buildAzurePath("deployments"), {
          headers: { "api-key": AZURE_OPENAI_API_KEY ?? "" },
        });
        providers.push({
          name: "azure",
          status: response.ok ? "healthy" : "unhealthy",
          provider: "azure",
          endpoint: AZURE_OPENAI_ENDPOINT,
        });
      } catch (error) {
        providers.push({
          name: "azure",
          status: "unhealthy",
          provider: "azure",
          endpoint: AZURE_OPENAI_ENDPOINT,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } else {
    providers.push({
      name: "azure",
      status: "unconfigured",
      provider: "azure",
      error: "Endpoint or API key not configured",
    });
  }

  // Anthropic
  if (ANTHROPIC_API_KEY) {
    try {
      const response = await fetch(\`\${ANTHROPIC_BASE_URL}/v1/models\`, {
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": ANTHROPIC_API_VERSION,
        },
      });
      providers.push({
        name: "anthropic",
        status: response.ok ? "healthy" : "unhealthy",
        provider: "anthropic",
        endpoint: ANTHROPIC_BASE_URL,
      });
    } catch (error) {
      providers.push({
        name: "anthropic",
        status: "unhealthy",
        provider: "anthropic",
        endpoint: ANTHROPIC_BASE_URL,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    providers.push({
      name: "anthropic",
      status: "unconfigured",
      provider: "anthropic",
      error: "API key not configured",
    });
  }

  // xAI
  if (XAI_API_KEY) {
    try {
      const response = await fetch(\`\${XAI_BASE_URL}/models\`, {
        headers: { Authorization: \`Bearer \${XAI_API_KEY}\` },
      });
      providers.push({
        name: "xai",
        status: response.ok ? "healthy" : "unhealthy",
        provider: "xai",
        endpoint: XAI_BASE_URL,
      });
    } catch (error) {
      providers.push({
        name: "xai",
        status: "unhealthy",
        provider: "xai",
        endpoint: XAI_BASE_URL,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    providers.push({
      name: "xai",
      status: "unconfigured",
      provider: "xai",
      error: "API key not configured",
      endpoint: XAI_BASE_URL,
    });
  }

  // Ollama
  try {
    const response = await fetch(\`\${OLLAMA_URL}/api/tags\`);
    providers.push({
      name: "ollama",
      status: response.ok ? "healthy" : "unhealthy",
      provider: "ollama",
      url: OLLAMA_URL,
    });
  } catch (error) {
    providers.push({
      name: "ollama",
      status: "offline",
      provider: "ollama",
      url: OLLAMA_URL,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const overallHealthy = providers.some((provider) => provider.status === "healthy");

  return NextResponse.json({
    status: overallHealthy ? "healthy" : "unhealthy",
    version: QUICKSTART_VERSION,
    uptime: Math.round(process.uptime()),
    providers,
  });
}

`;
const NEXT_MODELS_ROUTE_TEMPLATE = `import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE_GATEWAY_MODELS = __GATEWAY_MODELS__;

export function toGatewayModels() {
  return BASE_GATEWAY_MODELS.map((model) => ({
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
}

export async function GET() {
  return NextResponse.json({ models: toGatewayModels() });
}

`;
const NEXT_GATEWAY_README_TEMPLATE = `# Next.js Gateway API

This directory contains a minimal Next.js App Router implementation of the Bandit gateway API. It mirrors the Express gateway in
\`server/gateway.js\` but is ready to drop into a Next.js project.

## Routes

- \`app/api/health/route.ts\` – provider health and availability checks
- \`app/api/chat/completions/route.ts\` – provider-aware chat completions endpoint (OpenAI, Azure OpenAI, Anthropic, xAI, Ollama)
- \`app/api/models/route.ts\` – exposes the scaffolded gateway model metadata used by the frontend

## Usage

1. Copy the contents of \`server/next-app/\` into the \`app/\` directory of a Next.js project.
2. Ensure the environment variables listed in \`.env.example\` are available to the Next.js runtime. At minimum you will want the
   provider API keys you plan to use (OpenAI, Azure OpenAI, Anthropic, xAI, or Ollama).
3. Start Next.js with \`npm run dev\` (or your project’s equivalent). The routes are server-only (\`export const dynamic = "force-dynamic"\`)
   and can coexist with any frontend pages.

The generated routes favour clarity over cleverness so you can extend them with custom auth, logging, and provider routing logic.
`;

export const buildNextChatRoute = (ctx: QuickstartTemplateContext): string => {
  const fallbackModel = ctx.fallbackModelId ? `"${ctx.fallbackModelId}"` : "undefined";
  return ensureTrailingNewline(
    normalizeLineEndings(
      NEXT_CHAT_ROUTE_TEMPLATE
        .replace(/__DEFAULT_PROVIDER__/g, ctx.defaultProvider)
        .replace(/__DEFAULT_MODEL__/g, ctx.defaultModelId)
        .replace(/__FALLBACK_MODEL__/g, fallbackModel)
    )
  );
};

export const buildNextHealthRoute = (): string =>
  ensureTrailingNewline(normalizeLineEndings(NEXT_HEALTH_ROUTE_TEMPLATE));

export const buildNextModelsRoute = (ctx: QuickstartTemplateContext): string => {
  const modelsDefinition = JSON.stringify(ctx.gatewayModels, null, 2);
  return ensureTrailingNewline(
    normalizeLineEndings(
      NEXT_MODELS_ROUTE_TEMPLATE.replace('__GATEWAY_MODELS__', modelsDefinition)
    )
  );
};

export const buildNextGatewayReadme = (): string =>
  ensureTrailingNewline(normalizeLineEndings(NEXT_GATEWAY_README_TEMPLATE));

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
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT ? process.env.AZURE_OPENAI_ENDPOINT.replace(/\\/$/, "") : undefined;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION ?? "2024-08-01-preview";
const AZURE_OPENAI_CHAT_DEPLOYMENT = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT;
const AZURE_OPENAI_COMPLETIONS_DEPLOYMENT = process.env.AZURE_OPENAI_COMPLETIONS_DEPLOYMENT ?? AZURE_OPENAI_CHAT_DEPLOYMENT;
const AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT = process.env.AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_BASE_URL = (process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com").replace(/\\/$/, "");
const ANTHROPIC_API_VERSION = process.env.ANTHROPIC_API_VERSION ?? "2023-06-01";
const ANTHROPIC_MAX_TOKENS = Number.isFinite(Number(process.env.ANTHROPIC_MAX_TOKENS))
  ? Number(process.env.ANTHROPIC_MAX_TOKENS)
  : 1024;
const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_BASE_URL = (process.env.XAI_BASE_URL ?? "https://api.x.ai/v1").replace(/\\/$/, "");

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

const stripAzureModelPrefix = (value) =>
  typeof value === "string" ? value.replace(/^azure:/, "") : undefined;

const isAzureConfigured = () => Boolean(AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_API_KEY);

const requireAzureBaseConfig = () => {
  if (!AZURE_OPENAI_ENDPOINT) {
    throw new Error("Missing AZURE_OPENAI_ENDPOINT. Add it to your .env file to route requests to Azure OpenAI.");
  }
  if (!AZURE_OPENAI_API_KEY) {
    throw new Error("Missing AZURE_OPENAI_API_KEY. Add it to your .env file to route requests to Azure OpenAI.");
  }
  return {
    endpoint: AZURE_OPENAI_ENDPOINT,
    apiKey: AZURE_OPENAI_API_KEY,
    apiVersion: AZURE_OPENAI_API_VERSION,
  };
};

const resolveAzureDeployment = (explicitValue, fallbackValue, kind) => {
  const fromRequest = stripAzureModelPrefix(explicitValue);
  if (fromRequest) {
    return fromRequest;
  }
  if (fallbackValue) {
    return fallbackValue;
  }
  throw new Error(\`Missing Azure OpenAI \${kind} deployment name. Set AZURE_OPENAI_\${kind.toUpperCase()}_DEPLOYMENT in your .env file.\`);
};

const buildAzureDeploymentUrl = (deployment, suffix) => {
  const { endpoint } = requireAzureBaseConfig();
  const normalizedSuffix = suffix.replace(/^\\//, "");
  return \`\${endpoint}/openai/deployments/\${deployment}/\${normalizedSuffix}?api-version=\${AZURE_OPENAI_API_VERSION}\`;
};

const buildAzurePath = (suffix) => {
  const { endpoint } = requireAzureBaseConfig();
  const normalizedSuffix = suffix.replace(/^\\//, "");
  const hasQuery = normalizedSuffix.includes("?");
  const separator = hasQuery ? "&" : "?";
  return \`\${endpoint}/openai/\${normalizedSuffix}\${separator}api-version=\${AZURE_OPENAI_API_VERSION}\`;
};

const stripAnthropicModelPrefix = (value) =>
  typeof value === "string" ? value.replace(/^anthropic:/, "") : undefined;

const isAnthropicConfigured = () => Boolean(ANTHROPIC_API_KEY);

const requireAnthropicKey = () => {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY. Add it to your .env file to route requests to Anthropic.");
  }
  return ANTHROPIC_API_KEY;
};

const buildAnthropicUrl = (path) => {
  const normalized = path.replace(/^\\//, "");
  return \`\${ANTHROPIC_BASE_URL}/v1/\${normalized}\`;
};

const buildAnthropicHeaders = () => ({
  "Content-Type": "application/json",
  "x-api-key": requireAnthropicKey(),
  "anthropic-version": ANTHROPIC_API_VERSION,
});

const flattenGatewayContent = (content) => {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part?.type === "text" && typeof part.text === "string") {
          return part.text;
        }
        if (part?.type === "image_url" && part.image_url?.url) {
          return \`[Image: \${part.image_url.url}]\`;
        }
        return JSON.stringify(part ?? {});
      })
      .join("\\n");
  }
  if (content && typeof content === "object") {
    return JSON.stringify(content);
  }
  return "";
};

const toAnthropicMessages = (messages = []) => {
  const anthropicMessages = [];
  let systemPrompt = "";

  for (const message of messages) {
    if (!message) continue;
    const text = flattenGatewayContent(message.content);

    if (message.role === "system") {
      systemPrompt = systemPrompt ? \`\${systemPrompt}\\n\\n\${text}\` : text;
      continue;
    }

    const role = message.role === "assistant" ? "assistant" : "user";
    anthropicMessages.push({
      role,
      content: [{ type: "text", text }],
    });
  }

  return { messages: anthropicMessages, system: systemPrompt || undefined };
};

const convertAnthropicResponseToGateway = (responseBody, modelName) => {
  if (!responseBody) {
    return {
      id: \`anthropic-\${Date.now()}\`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: modelName.startsWith("anthropic:") ? modelName : \`anthropic:\${modelName}\`,
      choices: [],
    };
  }

  const textContent = Array.isArray(responseBody.content)
    ? responseBody.content
        .filter((item) => item && item.type === "text" && typeof item.text === "string")
        .map((item) => item.text)
        .join("\\n")
    : typeof responseBody.content === "string"
      ? responseBody.content
      : "";

  const promptTokens = responseBody.usage?.input_tokens ?? 0;
  const completionTokens = responseBody.usage?.output_tokens ?? 0;

  return {
    id: responseBody.id ?? \`anthropic-\${Date.now()}\`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: modelName.startsWith("anthropic:") ? modelName : \`anthropic:\${modelName}\`,
    choices: [
      {
        index: 0,
        message: {
          role: responseBody.role ?? "assistant",
          content: textContent,
        },
        finish_reason: responseBody.stop_reason ?? responseBody.stop_sequence ?? null,
      },
    ],
    usage: responseBody.usage
      ? {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: promptTokens + completionTokens,
        }
      : undefined,
  };
};

const convertAnthropicResponseToGenerate = (responseBody, modelName) => {
  const gatewayResponse = convertAnthropicResponseToGateway(responseBody, modelName);
  const content = gatewayResponse.choices?.[0]?.message?.content ?? "";
  return {
    model: gatewayResponse.model,
    created_at: new Date().toISOString(),
    response: content,
    done: true,
    total_duration: 0,
    load_duration: 0,
    prompt_eval_count: gatewayResponse.usage?.prompt_tokens ?? 0,
    prompt_eval_duration: 0,
    eval_count: gatewayResponse.usage?.completion_tokens ?? 0,
    eval_duration: 0,
  };
};

const requireOpenAIKey = () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("Missing OPENAI_API_KEY. Add it to your .env file to route requests to OpenAI.");
  }
  return key;
};

const requireXAIKey = () => {
  const key = XAI_API_KEY;
  if (!key) {
    throw new Error("Missing XAI_API_KEY. Add it to your .env file to route requests to xAI.");
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

  // Check Azure OpenAI
  if (AZURE_OPENAI_ENDPOINT || AZURE_OPENAI_API_KEY) {
    if (!isAzureConfigured()) {
      providers.push({
        name: "azure",
        status: "unconfigured",
        provider: "azure",
        error: "Endpoint or API key not configured",
        endpoint: AZURE_OPENAI_ENDPOINT
      });
    } else {
      try {
        const { endpoint } = requireAzureBaseConfig();
        const deploymentsUrl = buildAzurePath("deployments");
        const response = await fetch(deploymentsUrl, {
          headers: { "api-key": AZURE_OPENAI_API_KEY }
        });
        providers.push({
          name: "azure",
          status: response.ok ? "healthy" : "unhealthy",
          provider: "azure",
          endpoint
        });
      } catch (error) {
        providers.push({
          name: "azure",
          status: "unhealthy",
          provider: "azure",
          error: error instanceof Error ? error.message : String(error),
          endpoint: AZURE_OPENAI_ENDPOINT
        });
      }
    }
  } else {
    providers.push({
      name: "azure",
      status: "unconfigured",
      provider: "azure",
      error: "Endpoint or API key not configured"
    });
  }

  // Check Anthropic
  if (ANTHROPIC_API_KEY) {
    try {
      const response = await fetch(buildAnthropicUrl("models"), {
        headers: buildAnthropicHeaders(),
        method: "GET"
      });
      providers.push({
        name: "anthropic",
        status: response.ok ? "healthy" : "unhealthy",
        provider: "anthropic",
        endpoint: ANTHROPIC_BASE_URL
      });
    } catch (error) {
      providers.push({
        name: "anthropic",
        status: "unhealthy",
        provider: "anthropic",
        error: error instanceof Error ? error.message : String(error),
        endpoint: ANTHROPIC_BASE_URL
      });
    }
  } else {
    providers.push({
      name: "anthropic",
      status: "unconfigured",
      provider: "anthropic",
      error: "API key not configured"
    });
  }

  // Check xAI
  if (XAI_API_KEY) {
    try {
      const response = await fetch(`${XAI_BASE_URL}/models`, {
        headers: { "Authorization": `Bearer ${XAI_API_KEY}` }
      });
      providers.push({
        name: "xai",
        status: response.ok ? "healthy" : "unhealthy",
        provider: "xai",
        endpoint: XAI_BASE_URL
      });
    } catch (error) {
      providers.push({
        name: "xai",
        status: "unhealthy",
        provider: "xai",
        error: error instanceof Error ? error.message : String(error),
        endpoint: XAI_BASE_URL
      });
    }
  } else {
    providers.push({
      name: "xai",
      status: "unconfigured",
      provider: "xai",
      error: "API key not configured",
      endpoint: XAI_BASE_URL
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
// ANTHROPIC ROUTES
// ============================================================================

app.get("/api/anthropic/health", async (_req, res) => {
  try {
    requireAnthropicKey();
    const response = await fetch(buildAnthropicUrl("models"), {
      method: "GET",
      headers: buildAnthropicHeaders()
    });
    const isHealthy = response.ok;
    res.json({
      status: isHealthy ? "healthy" : "unhealthy",
      anthropic_status: isHealthy,
      provider: "anthropic",
      endpoint: ANTHROPIC_BASE_URL
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(503).json({
      status: "unhealthy",
      anthropic_status: false,
      provider: "anthropic",
      error: message,
      endpoint: ANTHROPIC_BASE_URL
    });
  }
});

app.post("/api/anthropic/chat/completions", async (req, res) => {
  try {
    requireAnthropicKey();
    const rawBody = req.body ?? {};
    const isStreaming = rawBody.stream === true;
    const requestedModel =
      stripAnthropicModelPrefix(rawBody.model) ??
      stripAnthropicModelPrefix("${ctx.defaultModelId}") ??
      "claude-3-5-sonnet-latest";

    const stopSequences = Array.isArray(rawBody.stop)
      ? rawBody.stop
      : Array.isArray(rawBody.stop_sequences)
        ? rawBody.stop_sequences
        : rawBody.stop
          ? [rawBody.stop]
          : undefined;

    const { messages: anthropicMessages, system } = toAnthropicMessages(
      Array.isArray(rawBody.messages) ? rawBody.messages : []
    );

    const fallbackText =
      typeof rawBody.prompt === "string" && rawBody.prompt.trim().length > 0
        ? rawBody.prompt
        : "Hello from Bandit quickstart gateway";

    const requestBody = {
      model: requestedModel,
      messages:
        anthropicMessages.length > 0
          ? anthropicMessages
          : [
              {
                role: "user",
                content: [{ type: "text", text: fallbackText }],
              },
            ],
      stream: isStreaming,
      max_tokens:
        typeof rawBody.max_tokens === "number" && rawBody.max_tokens > 0
          ? rawBody.max_tokens
          : ANTHROPIC_MAX_TOKENS,
    };

    if (system) {
      requestBody.system = system;
    }
    if (typeof rawBody.temperature === "number") {
      requestBody.temperature = rawBody.temperature;
    }
    if (typeof rawBody.top_p === "number") {
      requestBody.top_p = rawBody.top_p;
    }
    if (typeof rawBody.top_k === "number") {
      requestBody.top_k = rawBody.top_k;
    }
    if (stopSequences) {
      requestBody.stop_sequences = stopSequences;
    }
    if (rawBody.metadata) {
      requestBody.metadata = rawBody.metadata;
    }
    if (rawBody.tools) {
      requestBody.tools = rawBody.tools;
    }
    if (rawBody.tool_choice) {
      requestBody.tool_choice = rawBody.tool_choice;
    }
    if (rawBody.thinking) {
      requestBody.thinking = rawBody.thinking;
    }
    if (rawBody.extra_headers) {
      requestBody.extra_headers = rawBody.extra_headers;
    }

    const response = await fetch(buildAnthropicUrl("messages"), {
      method: "POST",
      headers: buildAnthropicHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: \`Anthropic chat failed: \${response.status}\`,
        details: errorText,
      });
    }

    if (isStreaming) {
      await handleStreamingResponse(response, res);
    } else {
      const data = await response.json();
      const normalized = convertAnthropicResponseToGateway(data, requestedModel);
      res.json(normalized);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.startsWith("Missing ANTHROPIC_API_KEY") ? 400 : 500;
    res.status(status).json({ error: message });
  }
});

app.post("/api/anthropic/chat", async (req, res) => {
  req.url = "/api/anthropic/chat/completions";
  return app._router.handle(req, res);
});

app.post("/api/anthropic/completions", async (req, res) => {
  try {
    requireAnthropicKey();
    const rawBody = req.body ?? {};
    const isStreaming = rawBody.stream === true;
    const requestedModel =
      stripAnthropicModelPrefix(rawBody.model) ??
      stripAnthropicModelPrefix("${ctx.defaultModelId}") ??
      "claude-3-5-sonnet-latest";

    const stopSequences = Array.isArray(rawBody.stop)
      ? rawBody.stop
      : Array.isArray(rawBody.stop_sequences)
        ? rawBody.stop_sequences
        : rawBody.stop
          ? [rawBody.stop]
          : undefined;

    const prompt =
      typeof rawBody.prompt === "string" && rawBody.prompt.trim().length > 0
        ? rawBody.prompt
        : "Hello from Bandit quickstart gateway";

    const { messages, system } = toAnthropicMessages([
      { role: "user", content: prompt },
    ]);

    const requestBody = {
      model: requestedModel,
      messages,
      stream: isStreaming,
      max_tokens:
        typeof rawBody.max_tokens === "number" && rawBody.max_tokens > 0
          ? rawBody.max_tokens
          : ANTHROPIC_MAX_TOKENS,
    };

    if (system) {
      requestBody.system = system;
    }
    if (typeof rawBody.temperature === "number") {
      requestBody.temperature = rawBody.temperature;
    }
    if (typeof rawBody.top_p === "number") {
      requestBody.top_p = rawBody.top_p;
    }
    if (typeof rawBody.top_k === "number") {
      requestBody.top_k = rawBody.top_k;
    }
    if (stopSequences) {
      requestBody.stop_sequences = stopSequences;
    }
    if (rawBody.metadata) {
      requestBody.metadata = rawBody.metadata;
    }
    if (rawBody.tools) {
      requestBody.tools = rawBody.tools;
    }
    if (rawBody.tool_choice) {
      requestBody.tool_choice = rawBody.tool_choice;
    }

    const response = await fetch(buildAnthropicUrl("messages"), {
      method: "POST",
      headers: buildAnthropicHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: \`Anthropic completions failed: \${response.status}\`,
        details: errorText,
      });
    }

    if (isStreaming) {
      await handleStreamingResponse(response, res);
    } else {
      const data = await response.json();
      const formatted = convertAnthropicResponseToGenerate(data, requestedModel);
      res.json(formatted);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.startsWith("Missing ANTHROPIC_API_KEY") ? 400 : 500;
    res.status(status).json({ error: message });
  }
});

app.post("/api/anthropic/generate", async (req, res) => {
  req.url = "/api/anthropic/completions";
  return app._router.handle(req, res);
});

app.get("/api/anthropic/models", async (_req, res) => {
  try {
    requireAnthropicKey();
    const response = await fetch(buildAnthropicUrl("models"), {
      method: "GET",
      headers: buildAnthropicHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: \`Anthropic models failed: \${response.status}\`,
        details: errorText,
      });
    }

    const text = await response.text();
    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.startsWith("Missing ANTHROPIC_API_KEY") ? 400 : 500;
    res.status(status).json({ error: message });
  }
});

app.post("/api/anthropic/embed", async (_req, res) => {
  res.status(501).json({
    error: "Anthropic embeddings not implemented",
    message: "Add support for the Anthropic embeddings endpoint if your use case requires it."
  });
});

// ============================================================================
// AZURE OPENAI ROUTES
// ============================================================================

app.get("/api/azure/health", async (_req, res) => {
  try {
    const { endpoint } = requireAzureBaseConfig();
    const deploymentsUrl = buildAzurePath("deployments");
    const response = await fetch(deploymentsUrl, {
      headers: { "api-key": AZURE_OPENAI_API_KEY }
    });
    const isHealthy = response.ok;
    res.json({
      status: isHealthy ? "healthy" : "unhealthy",
      azure_status: isHealthy,
      provider: "azure",
      endpoint
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      azure_status: false,
      provider: "azure",
      error: error instanceof Error ? error.message : String(error),
      endpoint: AZURE_OPENAI_ENDPOINT
    });
  }
});

app.post("/api/azure/chat/completions", async (req, res) => {
  try {
    const { apiKey } = requireAzureBaseConfig();
    const deployment = resolveAzureDeployment(req.body?.model, AZURE_OPENAI_CHAT_DEPLOYMENT, "chat");
    const isStreaming = req.body?.stream === true;
    const { provider, model, ...cleanBody } = req.body ?? {};
    const requestBody = { ...cleanBody };

    const response = await fetch(buildAzureDeploymentUrl(deployment, "chat/completions"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: \`Azure OpenAI chat failed: \${response.status}\`,
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
    const message = error instanceof Error ? error.message : String(error);
    const status = message.startsWith("Missing Azure OpenAI") ? 400 : 500;
    res.status(status).json({ error: message });
  }
});

app.post("/api/azure/chat", async (req, res) => {
  req.url = "/api/azure/chat/completions";
  return app._router.handle(req, res);
});

app.post("/api/azure/completions", async (req, res) => {
  try {
    const { apiKey } = requireAzureBaseConfig();
    const deployment = resolveAzureDeployment(req.body?.model, AZURE_OPENAI_COMPLETIONS_DEPLOYMENT, "completions");
    const isStreaming = req.body?.stream === true;
    const { provider, model, ...cleanBody } = req.body ?? {};
    const requestBody = { ...cleanBody };

    const response = await fetch(buildAzureDeploymentUrl(deployment, "completions"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: \`Azure OpenAI completions failed: \${response.status}\`,
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
    const message = error instanceof Error ? error.message : String(error);
    const status = message.startsWith("Missing Azure OpenAI") ? 400 : 500;
    res.status(status).json({ error: message });
  }
});

app.post("/api/azure/generate", async (req, res) => {
  try {
    const { apiKey } = requireAzureBaseConfig();
    const deployment = resolveAzureDeployment(req.body?.model, AZURE_OPENAI_CHAT_DEPLOYMENT, "chat");
    const prompt = req.body?.prompt || "";
    const isStreaming = req.body?.stream === true;

    const chatBody = {
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      stream: isStreaming,
      max_tokens: req.body?.max_tokens ?? 150,
      temperature: req.body?.temperature ?? 0.7
    };

    const response = await fetch(buildAzureDeploymentUrl(deployment, "chat/completions"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify(chatBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: \`Azure OpenAI generate failed: \${response.status}\`,
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
    const message = error instanceof Error ? error.message : String(error);
    const status = message.startsWith("Missing Azure OpenAI") ? 400 : 500;
    res.status(status).json({ error: message });
  }
});

app.get("/api/azure/models", async (_req, res) => {
  try {
    requireAzureBaseConfig();

    const response = await fetch(buildAzurePath("deployments"), {
      headers: { "api-key": AZURE_OPENAI_API_KEY }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: \`Azure OpenAI models failed: \${response.status}\`,
        details: errorText
      });
    }

    const text = await response.text();
    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.startsWith("Missing Azure OpenAI") ? 400 : 500;
    res.status(status).json({ error: message });
  }
});

app.post("/api/azure/embed", async (req, res) => {
  try {
    const { apiKey } = requireAzureBaseConfig();
    const deployment = resolveAzureDeployment(req.body?.model, AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT, "embeddings");
    const { provider, model, ...cleanBody } = req.body ?? {};
    const requestBody = { ...cleanBody };

    const response = await fetch(buildAzureDeploymentUrl(deployment, "embeddings"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: \`Azure OpenAI embed failed: \${response.status}\`,
        details: errorText
      });
    }

    const text = await response.text();
    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.startsWith("Missing Azure OpenAI") ? 400 : 500;
    res.status(status).json({ error: message });
  }
});

// ============================================================================
// XAI ROUTES
// ============================================================================

// xAI Health Check
app.get("/api/xai/health", async (_req, res) => {
  try {
    const xaiKey = requireXAIKey();
    const response = await fetch(`${XAI_BASE_URL}/models`, {
      headers: { "Authorization": `Bearer ${xaiKey}` }
    });
    const isHealthy = response.ok;
    res.json({
      status: isHealthy ? "healthy" : "unhealthy",
      xai_status: isHealthy,
      provider: "xai"
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      xai_status: false,
      error: error instanceof Error ? error.message : String(error),
      provider: "xai"
    });
  }
});

// xAI Chat Completions
app.post("/api/xai/chat/completions", async (req, res) => {
  try {
    const xaiKey = requireXAIKey();
    const isStreaming = req.body?.stream === true;
    const { provider, ...cleanBody } = req.body ?? {};
    const requestBody = {
      ...cleanBody,
      model: req.body?.model?.replace(/^xai:/, "") || "grok-2-latest"
    };

    const response = await fetch(`${XAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${xaiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `xAI chat failed: ${response.status}`,
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
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post("/api/xai/chat", async (req, res) => {
  req.url = "/api/xai/chat/completions";
  return app._router.handle(req, res);
});

// xAI Completions
app.post("/api/xai/completions", async (req, res) => {
  try {
    const xaiKey = requireXAIKey();
    const isStreaming = req.body?.stream === true;
    const { provider, ...cleanBody } = req.body ?? {};
    const requestBody = {
      ...cleanBody,
      model: req.body?.model?.replace(/^xai:/, "") || "grok-2-mini"
    };

    const response = await fetch(`${XAI_BASE_URL}/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${xaiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `xAI completions failed: ${response.status}`,
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
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// xAI Generate
app.post("/api/xai/generate", async (req, res) => {
  try {
    const xaiKey = requireXAIKey();
    const prompt = req.body?.prompt || "";
    const model = req.body?.model?.replace(/^xai:/, "") || "grok-2-latest";
    const isStreaming = req.body?.stream === true;

    const chatBody = {
      model,
      messages: [
        { role: "user", content: prompt }
      ],
      stream: isStreaming,
      max_tokens: req.body?.max_tokens || 150,
      temperature: req.body?.temperature ?? 0.7
    };

    const response = await fetch(`${XAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${xaiKey}`
      },
      body: JSON.stringify(chatBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `xAI generate failed: ${response.status}`,
        details: errorText
      });
    }

    if (isStreaming) {
      await handleStreamingResponse(response, res);
    } else {
      const data = await response.json();
      const generateResponse = {
        model,
        created_at: new Date().toISOString(),
        response: data.choices?.[0]?.message?.content || "",
        done: true,
        context: [],
        total_duration: 0,
        load_duration: 0,
        prompt_eval_count: data.usage?.prompt_tokens || 0,
        prompt_eval_duration: 0,
        eval_count: data.usage?.completion_tokens || 0,
        eval_duration: 0
      };
      res.json(generateResponse);
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// xAI Models
app.get("/api/xai/models", async (_req, res) => {
  try {
    const xaiKey = requireXAIKey();
    const response = await fetch(`${XAI_BASE_URL}/models`, {
      headers: { "Authorization": `Bearer ${xaiKey}` }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `xAI models failed: ${response.status}`,
        details: errorText
      });
    }

    const text = await response.text();
    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
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
    error: "Anthropic route not implemented",
    message: "Extend the quickstart gateway if you need additional Anthropic endpoints beyond the defaults."
  });
});

const port = Number(process.env.PORT ?? ${ctx.gatewayPort});
app.listen(port, () => {
  console.log("⚡ Bandit quickstart gateway ready on http://localhost:" + port);
  console.log("📡 Supported providers: OpenAI, Azure OpenAI, Anthropic, XAI, Ollama");
  console.log("🔗 Provider-specific routes:");
  console.log("   • /api/openai/* - OpenAI endpoints");
  console.log("   • /api/azure/* - Azure OpenAI endpoints");
  console.log("   • /api/anthropic/* - Anthropic endpoints");
  console.log("   • /api/xai/* - XAI endpoints");
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

export const buildNpmrc = (): string =>
  ensureTrailingNewline(
    normalizeLineEndings(`registry=https://registry.npmjs.org/\n`)
  );

export const buildReadme = (ctx: QuickstartTemplateContext): string =>
  ensureTrailingNewline(
    normalizeLineEndings(
      `# ${ctx.projectTitle} — Bandit Quickstart\n\nThis project was generated by the Bandit Engine CLI. It ships with a React + Vite frontend that consumes \`@burtson-labs/bandit-engine\`, a lightweight Express gateway you can adapt for production, and a Next.js App Router API scaffold in \`server/next-app/\`.\n\n## 🚀 Next steps\n- \`npm install\`\n- \`cp .env.example .env\`\n- Fill in your OpenAI, Azure OpenAI, Anthropic, or xAI credentials (or point \`OLLAMA_URL\` at your local server)\n- \`npm run dev\`\n\nThe command runs the gateway and the frontend together. Visit http://localhost:${ctx.frontendPort} to see the chat and modal in action.\n\n## 🔧 Customizing your assistant\n- **Branding & personas**: edit \`public/config.json\` to tweak logos, colors, and starter models.\n- **Provider defaults**: update \`.env\` to switch providers or change the default upstream model IDs.\n- **Gateway routes**: open \`server/gateway.js\` to add auth, logging, or connect additional providers.\n\n## 📦 What’s inside\n- React + Vite 5 with Material UI theming\n- Bandit chat surface + modal wired via \`ChatProvider\`\n- Express gateway proxying OpenAI, Azure OpenAI, Anthropic, XAI, or Ollama to keep API keys server-side\n- Next.js App Router gateway scaffold in `server/next-app/` for projects that prefer Next\n- Friendly defaults you can evolve into your production stack\n\nNeed more? Run \`npx @burtson-labs/bandit-engine create --help\` to explore additional options.\n`
    )
  );

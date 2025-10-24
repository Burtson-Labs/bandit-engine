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

// Bandit Engine Watermark: BL-WM-BC17-F7FDDE
const __banditFingerprint_cli_createQuickstartts = 'BL-FP-34201E-F7E5';
const __auditTrail_cli_createQuickstartts = 'BL-AU-MGOIKVV7-FEUF';
// File: createQuickstart.ts | Path: src/cli/createQuickstart.ts | Hash: bc17f7e5

import path from "node:path";
import fs from "fs-extra";
import prompts, { PromptObject } from "prompts";
import packageJson from "../../package.json";
import {
  ensureTrailingNewline,
  sanitizeModelIdentifier,
  toKebabCase,
  toTitleCase,
} from "./utils";
import {
  buildAppTsx,
  buildBrandingConfig,
  buildEnvDts,
  buildEnvExample,
  buildGatewayServer,
  buildGitignore,
  buildIndexCss,
  buildIndexHtml,
  buildMainTsx,
  buildPackageJson,
  buildReadme,
  buildThemeTs,
  buildTsConfig,
  buildViteConfig,
  buildNpmrc,
  QuickstartTemplateContext,
} from "./templates";

type SupportedProvider = "openai" | "ollama" | "azure" | "anthropic";

interface LogoResolution {
  dataUrl: string;
  fileName: string;
  fileContent: Buffer;
  hasTransparentLogo: boolean;
  isDefault: boolean;
}

interface CreateQuickstartInputs {
  targetDir: string;
  projectTitle: string;
  packageName: string;
  brandingText: string;
  provider: SupportedProvider;
  defaultModelId: string;
  fallbackModelId?: string;
  gatewayPort: number;
  frontendPort: number;
  logo: LogoResolution;
}

export interface CreateQuickstartOptions {
  targetDir: string;
  projectName?: string;
  force?: boolean;
  provider?: string;
  brandingText?: string;
  defaultModelId?: string;
  fallbackModelId?: string;
  gatewayPort?: number;
  frontendPort?: number;
  skipPrompts?: boolean;
}

interface QuickstartResult {
  projectDir: string;
  packageName: string;
  brandingText: string;
  defaultModelId: string;
  fallbackModelId?: string;
  gatewayPort: number;
  frontendPort: number;
  createdFiles: string[];
}

export const createQuickstartProject = async (
  options: CreateQuickstartOptions
): Promise<QuickstartResult> => {
  const resolvedDir = path.resolve(process.cwd(), options.targetDir);
  const rawProjectName = options.projectName ?? path.basename(resolvedDir);
  const packageName = normalizePackageName(rawProjectName);
  const projectTitle = toTitleCase(rawProjectName) || "Bandit Quickstart";

  await ensureWritableDirectory(resolvedDir, Boolean(options.force));

  const skipPrompts = Boolean(options.skipPrompts);

  const provider = options.provider
    ? normalizeProvider(options.provider)
    : skipPrompts
      ? "openai"
      : await promptForProvider();

  const promptAnswers = skipPrompts
    ? {}
    : await promptForMissingData({
        brandingText: options.brandingText,
        provider,
      });

  const brandingText =
    options.brandingText ??
    (typeof promptAnswers.brandingText === "string" && promptAnswers.brandingText.trim().length > 0
      ? promptAnswers.brandingText.trim()
      : `${projectTitle} Assistant`);

  // Package handles CDN logos automatically, no need for logo resolution
  const logoResolution: LogoResolution = {
    dataUrl: "",
    fileName: "",
    fileContent: Buffer.alloc(0),
    hasTransparentLogo: true,
    isDefault: true
  };

  const gatewayPort = sanitizePort(options.gatewayPort ?? promptAnswers.gatewayPort ?? 5151);
  const frontendPort = sanitizePort(options.frontendPort ?? promptAnswers.frontendPort ?? 5183);
  const defaultModelId = sanitizeModelIdentifier(
    options.defaultModelId ?? inferDefaultModelId(provider)
  );
  const fallbackModelId = options.fallbackModelId
    ? sanitizeModelIdentifier(options.fallbackModelId)
    : inferFallbackModelId(provider, defaultModelId);

  const inputs: CreateQuickstartInputs = {
    targetDir: resolvedDir,
    projectTitle,
    packageName,
    brandingText,
    provider,
    defaultModelId,
    fallbackModelId,
    gatewayPort,
    frontendPort,
    logo: logoResolution,
  };

  const createdFiles = await writeProject(inputs);

  return {
    projectDir: resolvedDir,
    packageName,
    brandingText,
    defaultModelId,
    fallbackModelId,
    gatewayPort,
    frontendPort,
    createdFiles,
  };
};

const normalizePackageName = (input: string): string => {
  const fallback = "bandit-quickstart";
  const kebab = toKebabCase(input || fallback);
  if (!kebab) {
    return fallback;
  }
  return /^[a-z]/.test(kebab) ? kebab : `bandit-${kebab}`;
};

const ensureWritableDirectory = async (dir: string, force: boolean) => {
  const exists = await fs.pathExists(dir);
  if (!exists) {
    await fs.ensureDir(dir);
    return;
  }

  const entries = await fs.readdir(dir);
  if (entries.length > 0 && !force) {
    throw new Error(
      `Target directory "${dir}" is not empty. Re-run with --force to overwrite or choose a new folder.`
    );
  }
};

const normalizeProvider = (value?: string): SupportedProvider => {
  const normalized = (value ?? "openai").toLowerCase();
  if (normalized === "ollama") {
    return "ollama";
  }
  if (normalized === "azure" || normalized === "azure-openai" || normalized === "azureopenai") {
    return "azure";
  }
  if (normalized === "anthropic") {
    return "anthropic";
  }
  return "openai";
};

const inferDefaultModelId = (provider: SupportedProvider): string => {
  if (provider === "ollama") {
    return "ollama:llama3.1";
  }
  if (provider === "azure") {
    return "azure:gpt-4o";
  }
  if (provider === "anthropic") {
    return "anthropic:claude-3-5-sonnet-latest";
  }
  return "openai:gpt-4o-mini";
};

const inferFallbackModelId = (provider: SupportedProvider, defaultId: string): string | undefined => {
  if (provider === "ollama") {
    return defaultId === "ollama:llama3" ? "ollama:llama2" : "ollama:llama3";
  }
  if (provider === "azure") {
    return defaultId === "azure:gpt-4o-mini" ? "azure:gpt-4o" : "azure:gpt-4o-mini";
  }
  if (provider === "anthropic") {
    return defaultId === "anthropic:claude-3-5-haiku-latest"
      ? "anthropic:claude-3-5-sonnet-latest"
      : "anthropic:claude-3-5-haiku-latest";
  }
  return defaultId === "openai:gpt-4.1-mini" ? "openai:gpt-4o-mini" : "openai:gpt-4.1-mini";
};

const promptForProvider = async (): Promise<SupportedProvider> => {
  const providerOptions: { label: string; value: SupportedProvider; description?: string }[] = [
    { label: "OpenAI (default)", value: "openai" },
    { label: "Azure OpenAI", value: "azure" },
    { label: "Anthropic", value: "anthropic" },
    { label: "Ollama (self-hosted)", value: "ollama" },
  ];

  const messageLines = [
    "Which provider should we configure for the gateway?",
    ...providerOptions.map((option, index) => `  ${index + 1}. ${option.label}`),
    "Enter a number:",
  ];

  const onCancel = () => {
    throw new Error("Command cancelled.");
  };

  const answers = await prompts(
    {
      type: "number",
      name: "providerIndex",
      message: messageLines.join("\n"),
      initial: 1,
      validate: (input) => {
        if (!Number.isInteger(input)) {
          return "Enter a whole number.";
        }
        return input >= 1 && input <= providerOptions.length
          ? true
          : `Enter a number between 1 and ${providerOptions.length}.`;
      },
    },
    { onCancel }
  );

  const selectedIndex =
    typeof answers.providerIndex === "number" && answers.providerIndex >= 1
      ? answers.providerIndex - 1
      : 0;

  return providerOptions[selectedIndex]?.value ?? "openai";
};

const sanitizePort = (value: number): number => {
  const port = Number(value);
  if (Number.isNaN(port) || port <= 0 || port >= 65535) {
    return 8080;
  }
  return port;
};

const promptForMissingData = async (options: {
  brandingText?: string;
  provider: SupportedProvider;
}): Promise<{
  brandingText?: string;
  gatewayPort?: number;
  frontendPort?: number;
}> => {
  const questions: PromptObject[] = [];

  if (!options.brandingText) {
    questions.push({
      type: "text",
      name: "brandingText",
      message: "What should we display for the app name? (Press Enter to accept)",
      initial: "Bandit Quickstart",
    });
  }

  const defaultGatewayPort = options.provider === "ollama" ? 11435 : 8080;
  const defaultFrontendPort = 5183;

  questions.push({
    type: "text",
    name: "frontendPort",
    message: "Frontend port (Press Enter to accept)",
    initial: String(defaultFrontendPort),
    validate: (value: unknown) => {
      if (typeof value !== "string" || value.trim().length === 0) {
        return true;
      }
      const numericValue = Number(value);
      return Number.isFinite(numericValue) && numericValue > 0 && numericValue < 65535
        ? true
        : "Enter a port between 1 and 65535";
    },
  });

  questions.push({
    type: "text",
    name: "gatewayPort",
    message: "Gateway port (Press Enter to accept)",
    initial: String(defaultGatewayPort),
    validate: (value: unknown) => {
      if (typeof value !== "string" || value.trim().length === 0) {
        return true;
      }
      const numericValue = Number(value);
      return Number.isFinite(numericValue) && numericValue > 0 && numericValue < 65535
        ? true
        : "Enter a port between 1 and 65535";
    },
  });

  const onCancel = () => {
    throw new Error("Command cancelled.");
  };

  const answers = await prompts(questions, { onCancel });

  const parsedGatewayPort =
    typeof answers.gatewayPort === "number"
      ? answers.gatewayPort
      : typeof answers.gatewayPort === "string" && answers.gatewayPort.trim().length > 0
        ? Number(answers.gatewayPort)
        : defaultGatewayPort;

  const parsedFrontendPort =
    typeof answers.frontendPort === "number"
      ? answers.frontendPort
      : typeof answers.frontendPort === "string" && answers.frontendPort.trim().length > 0
        ? Number(answers.frontendPort)
        : defaultFrontendPort;

  return {
    brandingText: typeof answers.brandingText === "string" ? answers.brandingText : undefined,
    gatewayPort: Number.isFinite(parsedGatewayPort) ? parsedGatewayPort : defaultGatewayPort,
    frontendPort: Number.isFinite(parsedFrontendPort) ? parsedFrontendPort : defaultFrontendPort,
  };
};

const writeProject = async (inputs: CreateQuickstartInputs): Promise<string[]> => {
  const { targetDir } = inputs;
  const createdFiles: string[] = [];

  const context: QuickstartTemplateContext = {
    packageName: inputs.packageName,
    projectTitle: inputs.projectTitle,
    engineVersion: packageJson.version,
    brandingText: inputs.brandingText,
  logoBase64: inputs.logo.dataUrl,
  hasTransparentLogo: inputs.logo.hasTransparentLogo,
  isDefaultLogo: inputs.logo.isDefault,
    gatewayPort: inputs.gatewayPort,
    frontendPort: inputs.frontendPort,
    defaultProvider: inputs.provider,
    defaultGatewayUrl: `http://localhost:${inputs.gatewayPort}`,
    defaultModelId: inputs.defaultModelId,
    fallbackModelId: inputs.fallbackModelId,
    gatewayModels: buildGatewayModels(inputs),
  };

  const files: Record<string, string | Buffer> = {
    "package.json": buildPackageJson(context),
    "tsconfig.json": buildTsConfig(),
    "src/env.d.ts": buildEnvDts(),
    "vite.config.ts": buildViteConfig(context),
    "src/main.tsx": buildMainTsx(),
    "index.html": buildIndexHtml(),
    "src/App.tsx": buildAppTsx(context),
    "src/index.css": buildIndexCss(),
    "src/theme.ts": buildThemeTs(),
    "public/config.json": buildBrandingConfig(context),
    "server/gateway.js": buildGatewayServer(context),
    ".env.example": buildEnvExample(context),
    ".gitignore": buildGitignore(),
    ".npmrc": buildNpmrc(),
    "README.md": buildReadme(context),
  };

  // Only add logo file if it's not a default logo (i.e., user provided custom logo)
  if (!inputs.logo.isDefault && inputs.logo.fileName) {
    files[path.posix.join("public", inputs.logo.fileName)] = inputs.logo.fileContent;
  }

  for (const [relativePath, content] of Object.entries(files)) {
    const destination = path.join(targetDir, relativePath);
    await fs.ensureDir(path.dirname(destination));
    if (Buffer.isBuffer(content)) {
      await fs.writeFile(destination, content);
    } else {
      await fs.writeFile(destination, ensureTrailingNewline(content), "utf8");
    }
    createdFiles.push(relativePath);
  }

  return createdFiles;
};

const buildGatewayModels = (inputs: CreateQuickstartInputs) => {
  const seen = new Set<string>();
  const models: { id: string; name: string; provider: string }[] = [];

  const pushModel = (modelId: string | undefined) => {
    if (!modelId) return;
    if (seen.has(modelId)) return;
    seen.add(modelId);
    const provider = modelId.includes(":") ? modelId.split(":")[0] : inputs.provider;
    const nameSegment = modelId.includes(":") ? modelId.split(":")[1] : modelId;
    models.push({
      id: modelId,
      name: toTitleCase(nameSegment.replace(/[-_.]/g, " ")),
      provider,
    });
  };

  pushModel(inputs.defaultModelId);
  pushModel(inputs.fallbackModelId);

  return models;
};

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

// Bandit Engine Watermark: BL-WM-9A05-FB9C98
const __banditFingerprint_chatprovidertsx = 'BL-FP-E60286-2996';
const __auditTrail_chatprovidertsx = 'BL-AU-MGOIKVV6-O6E4';
// File: chat-provider.tsx | Path: src/chat-provider.tsx | Hash: 9a052996

import React, { useEffect, useState } from "react";
import { PackageSettings, usePackageSettingsStore } from "./store/packageSettingsStore";
import { authenticationService } from "./services/auth/authenticationService";
import { useConversationStore } from "./store/conversationStore";
import { useAIQueryStore } from "./store/aiQueryStore";
import { useMemoryStore } from "./store/memoryStore";
import { useModelStore } from "./store/modelStore";
import { usePreferencesStore } from "./store/preferencesStore";
import { useProjectStore } from "./store/projectStore";
import { useConversationSyncStore } from "./store/conversationSyncStore";
import { useKnowledgeStore } from "./store/knowledgeStore";
import { useMCPToolsStore } from "./store/mcpToolsStore";
import { useKnowledgeStore as useKnowledgeHook } from "./chat/hooks/useKnowledgeStore";
import { embeddingService } from "./services/embedding/embeddingService";
import { aiProviderInitService } from "./services/ai-provider-init.service";
import brandingService, { BrandingConfigPayload } from "./services/branding/brandingService";
import indexedDBService from "./services/indexedDB/indexedDBService";
import { debugLogger } from "./services/logging/debugLogger";
import { NotificationProvider } from "./shared/components/NotificationProvider";
import { FeatureFlagProvider } from "./contexts/FeatureFlagContext";
import { FeatureFlagConfig } from "./types/featureFlags";
import "./chat-provider.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StoredBanditConfigRecord } from "./types/config";

export interface ChatConfig {
  packageSettings: PackageSettings;
  /** Feature flag configuration - can override packageSettings.featureFlags */
  featureFlags?: FeatureFlagConfig;
  children?: React.ReactNode;
}

export const ChatProvider: React.FC<ChatConfig> = (props) => {
  const { loadDocuments } = useKnowledgeHook();
  const [queryClient] = useState(() => new QueryClient());

  // Determine final feature flag configuration
  const featureFlagConfig: FeatureFlagConfig = {
    ...props.packageSettings.featureFlags,
    ...props.featureFlags
  };

  useEffect(() => {
    const initializeAsync = async () => {
      // Set package settings first
      usePackageSettingsStore.setState(() => ({
        settings: props.packageSettings,
      }));

      // Initialize the new AI provider system early
      try {
        await aiProviderInitService.initializeFromSettings();
      } catch (error) {
        debugLogger.error("Failed to initialize AI provider:", { error });
      }

      const token = authenticationService.getToken();
      if (token && !authenticationService.isTokenExpired(token)) {
        authenticationService.setToken(token);
      } else {
        authenticationService.clearToken();
      }

      useConversationStore.getState().hydrate();
      useProjectStore.getState().hydrate();
      useAIQueryStore.getState().hydrate();
      useMemoryStore.getState().hydrate();
      
      const isPlaygroundRoute = typeof window !== "undefined" && window.location.pathname.includes("/playground");
      const isPlaygroundMode = isPlaygroundRoute || props.packageSettings.playgroundMode === true;

      if (isPlaygroundMode) {
        debugLogger.info("ChatProvider: Playground mode detected — skipping remote preference and sync initialization");
      } else {
        // Load preferences, knowledge docs, and MCP tools
        await usePreferencesStore.getState().loadPreferences();
        await useKnowledgeStore.getState().loadDocs();
        await useMCPToolsStore.getState().loadTools();
        await useConversationSyncStore.getState().initialize();
      }
      
      // Initialize models after AI provider is set up
      debugLogger.info("ChatProvider about to call initModels - checking for existing branding first");
      
      // Get existing branding before initModels to protect user-saved branding
      const storeConfigs = [{ name: "config", keyPath: "id" }] as const;
      let existingBranding: StoredBanditConfigRecord["branding"] | null = null;
      try {
        const config = await indexedDBService.get<StoredBanditConfigRecord>(
          "banditConfig",
          1,
          "config",
          "main",
          storeConfigs
        );
        if (config?.branding?.userSaved) {
          existingBranding = config.branding;
          debugLogger.info("Found user-saved branding to protect during initModels", {
            hasText: !!existingBranding.brandingText,
            hasLogo: !!existingBranding.logoBase64,
            theme: existingBranding.theme
          });
        }
      } catch (err) {
        debugLogger.warn("Could not check existing branding before initModels", { error: err });
      }
      
      await useModelStore.getState().initModels().catch((err) => {
        debugLogger.error("❌ Failed to initialize models:", { error: err });
      });
      
      // Restore user branding if it was overwritten
      if (existingBranding) {
        try {
          const afterInitModels = await indexedDBService.get<StoredBanditConfigRecord>(
            "banditConfig",
            1,
            "config",
            "main",
            storeConfigs
          );
          if (JSON.stringify(afterInitModels?.branding) !== JSON.stringify(existingBranding)) {
            debugLogger.warn("ChatProvider: initModels overwrote user branding! Restoring...");
            await indexedDBService.put<StoredBanditConfigRecord>("banditConfig", 1, "config", {
              ...afterInitModels,
              id: "main",
              branding: existingBranding,
            }, storeConfigs);
            debugLogger.info("ChatProvider: User branding restored after initModels");
          }
        } catch (err) {
          debugLogger.error("ChatProvider: Failed to restore branding after initModels", { error: err });
        }
      }

      if (props.packageSettings.brandingConfigUrl) {
        fetch(props.packageSettings.brandingConfigUrl)
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP error ${res.status}`);
            }
            return res.json();
          })
          .then((json: unknown) => {
            if (json && typeof json === "object") {
              brandingService.setBrandingFromConfig(json as BrandingConfigPayload);
            }
          })
          .catch((err) => {
            debugLogger.error("❌ Failed to fetch or apply branding config:", { error: err });
          });
      }

      if (!isPlaygroundMode) {
        loadDocuments();
        embeddingService.backfillMissingEmbeddings().catch((err: unknown) => {
          debugLogger.error("❌ Failed to backfill memory embeddings:", { error: err });
        });
      } else {
        debugLogger.info("ChatProvider: Playground mode skipping knowledge backfill");
      }
    };

    initializeAsync();
  }, [props.packageSettings, loadDocuments]);

  return (
    <QueryClientProvider client={queryClient}>
      <FeatureFlagProvider config={featureFlagConfig}>
        <NotificationProvider>
          {props.children}
        </NotificationProvider>
      </FeatureFlagProvider>
    </QueryClientProvider>
  );
};

export default ChatProvider;

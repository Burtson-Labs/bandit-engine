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

// Bandit Engine Watermark: BL-WM-FCFF-64ED2F
const __banditFingerprint_management_managementtsx = 'BL-FP-357F58-3D1B';
const __auditTrail_management_managementtsx = 'BL-AU-MGOIKVVL-LFF9';
// File: management.tsx | Path: src/management/management.tsx | Hash: fcff3d1b

const preloadChatPage = () => import("../chat/chat");

import React, { useState, useEffect, useCallback } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import { alpha } from "@mui/material/styles";
import { useKnowledgeStore } from "../chat/hooks/useKnowledgeStore";
import indexedDBService from "../services/indexedDB/indexedDBService";
import {
  Box,
  Button,
  Typography,
  ThemeProvider,
  CssBaseline,
  Fab,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  SwipeableDrawer,
} from "@mui/material";
import FaceRetouchingNaturalIcon from '@mui/icons-material/FaceRetouchingNatural';
import BrushIcon from '@mui/icons-material/Brush';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TuneIcon from '@mui/icons-material/Tune';
import BuildIcon from '@mui/icons-material/Build';
import CloudIcon from '@mui/icons-material/Cloud';
import StorageIcon from '@mui/icons-material/Storage';
import { useNavigate } from "react-router-dom";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChatModal from "../modals/chat-modal/chat-modal";
import PersonalitiesTab, { LocalModelState } from './components/PersonalitiesTab';
import PreferencesTab from './components/PreferencesTab';
import BrandingTab from './components/BrandingTab';
import KnowledgeTab from './components/KnowledgeTab';
import StorageTab from './components/StorageTab';
import { ProviderTab } from './components/ProviderTab';
import MCPToolsTabV2 from './components/MCPToolsTabV2';

import { BanditPersonality, useModelStore } from "../store/modelStore";
import { banditDarkTheme } from "../theme/banditTheme";
import { predefinedThemes } from "../theme/themeMap";
import { detectTransparency, fetchAndConvertToBase64 } from "../util";
import brandingService from "../services/branding/brandingService";
import { debugLogger } from "../services/logging/debugLogger";
import { usePackageSettingsStore } from "../store/packageSettingsStore";
import { usePreferencesStore } from "../store/preferencesStore";
import { useAIProviderStore } from "../store/aiProviderStore";
import { useNotificationService } from "../hooks/useNotificationService";
import { useFeatures, useFeatureVisibility } from "../hooks/useFeatures";
import { StoredBanditConfigRecord, StoredModelConfig } from "../types/config";

const Management = () => {
  const navigate = useNavigate();

  const notificationService = useNotificationService();

  const isMobile = useMediaQuery("(max-width:900px)");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getOptimalFabLogo = async (): Promise<string> => {
    const banditHead = "https://cdn.burtson.ai/images/bandit-head.png";

    try {
      // First try subdomain favicon
      const subdomain = window.location.hostname.split('.')[0];
      const faviconUrl = `https://cdn.burtson.ai/favicons/${subdomain}/favicon.png`;

      const faviconExists = await new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = faviconUrl;
      });

      if (faviconExists) {
        return faviconUrl;
      }

      // Fallback to branding logo
      const branding = await brandingService.getBranding();
      if (branding?.logoBase64) {
        return branding.logoBase64;
      }

      // Final fallback to Bandit head
      return banditHead;
    } catch (error) {
      debugLogger.error("Failed to get optimal FAB logo", { error });
      return banditHead;
    }
  };
  const {
    name: modelName,
    setModelName,
    tagline,
    setTagline,
    systemPrompt,
    setSystemPrompt,
    availableModels,
    selectedModel,
    setSelectedModel,
    saveModel,
    resetModel,
    hasTransparentLogo,
    setHasTransparentLogo,
  } = useModelStore();

  const [modalOpen, setModalOpen] = useState(false);
  const banditHead = "https://cdn.burtson.ai/images/bandit-head.png";
  const [fabLogo, setFabLogo] = useState<string>(banditHead);

  const [tabIndex, setTabIndex] = useState(0);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [brandingText, setBrandingText] = useState("");
  const [theme, setTheme] = useState("bandit-dark"); // Use consistent default
  const [customAvatarBase64, setCustomAvatarBase64] = useState<string | null>(null);
  const [presetAvatar, setPresetAvatar] = useState<string | null>(null);

  
  const showSnackbarMessage = (message: string, severity: 'success' | 'error' = 'success') => {
    if (severity === 'success') {
      notificationService?.showSuccess(message);
    } else {
      notificationService?.showError(message);
    }
  };

  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  const [brandingLoaded, setBrandingLoaded] = useState(false);
  const [isLoadingBranding, setIsLoadingBranding] = useState(false);

  const { initModels } = useModelStore();
  const { settings: packageSettings } = usePackageSettingsStore();
  const { preferences, updatePreference } = usePreferencesStore();
  const { hasAdminDashboard, hasLimitedAdminDashboard, getCurrentTier, hasAdvancedSearch } = useFeatures();
  const { showAdminPanel, showLimitedAdminPanel } = useFeatureVisibility();
  const { provider: currentProvider, config: currentProviderConfig } = useAIProviderStore();

  const [localSelectedModel, setLocalSelectedModel] = useState<LocalModelState>({
    name: "",
    tagline: "",
    systemPrompt: "",
    selectedModel: "",
  });

  const {
    documents,
    addDocuments,
    removeDocument,
    loadDocuments,
    clearAllDocuments,
  } = useKnowledgeStore();

  useEffect(() => {
    if (selectedModel) {
      const selected = availableModels.find((m) => m.name === selectedModel);
      if (selected) {
        debugLogger.debug("Model hydration complete", {
          selectedModel: selected.name,
          hasAvatar: !!selected?.avatarBase64
        });
        setLocalSelectedModel({
          name: selected.name,
          tagline: selected.tagline,
          systemPrompt: selected.systemPrompt as string,
          selectedModel: selected.name,
        });

        // Handle avatar restoration properly
        if (selected.avatarBase64) {
          setCustomAvatarBase64(selected.avatarBase64);
          setPresetAvatar(null); // Clear preset if we have custom
        } else {
          // Clear custom avatar if model doesn't have one
          setCustomAvatarBase64(null);
          setPresetAvatar(null);
        }
      }
    }
  }, [selectedModel, availableModels]);

  // Load branding/model config from IndexedDB on mount
  const loadBrandingConfig = useCallback(async () => {
    if (isLoadingBranding || brandingLoaded) {
      debugLogger.warn("Branding loading already in progress or completed, skipping");
      return;
    }

    setIsLoadingBranding(true);

    try {
      const storeConfigs = [{ name: "config", keyPath: "id" }] as const;
      const data = await indexedDBService.get<StoredBanditConfigRecord>(
        "banditConfig",
        1,
        "config",
        "main",
        storeConfigs
      );

      const brandingConfig = data?.branding;
      const modelConfig = data?.model;

      debugLogger.info("Management branding load", {
        hasData: !!data,
        hasBranding: !!brandingConfig,
        brandingKeys: brandingConfig ? Object.keys(brandingConfig) : [],
        userSaved: brandingConfig?.userSaved
      });

      const hasUserModifiedBranding = brandingConfig && (
        brandingConfig.userSaved === true ||
        (brandingConfig.brandingText && brandingConfig.brandingText.trim() !== "") ||
        (brandingConfig.logoBase64 && typeof brandingConfig.logoBase64 === "string" && brandingConfig.logoBase64.trim() !== "") ||
        (brandingConfig.theme && brandingConfig.theme !== "bandit-dark")
      );

      const hasCDNOnlyBranding = brandingConfig &&
        brandingConfig.userSaved === false &&
        !hasUserModifiedBranding;

      const shouldSkipCDNBranding = hasUserModifiedBranding;

      if (shouldSkipCDNBranding) {
        debugLogger.info("🚫 USER BRANDING PROTECTION - Skipping CDN branding (preserving user modifications)", {
          hasUserModifiedBranding,
          userSaved: brandingConfig?.userSaved,
          hasCustomText: !!(brandingConfig?.brandingText && brandingConfig.brandingText.trim()),
          hasCustomLogo: !!(brandingConfig?.logoBase64 && brandingConfig.logoBase64.trim()),
          hasCustomTheme: !!(brandingConfig?.theme && brandingConfig.theme !== "bandit-dark")
        });

        setBrandingText(brandingConfig?.brandingText || "");
        setTheme(brandingConfig?.theme || "bandit-dark");
        setLogoBase64(brandingConfig?.logoBase64 || null);
        if (brandingConfig?.hasTransparentLogo !== undefined) {
          setHasTransparentLogo(brandingConfig.hasTransparentLogo);
        }
      } else {
        debugLogger.info("Loading branding and models from CDN config", {
          hasData: !!data,
          hasCDNOnlyBranding,
          brandingKeys: brandingConfig ? Object.keys(brandingConfig) : []
        });

        const packageSettings = usePackageSettingsStore.getState().getSettings();
        let cdnConfig = null;

        if (packageSettings?.brandingConfigUrl) {
          try {
            const configResponse = await fetch(packageSettings.brandingConfigUrl);
            cdnConfig = await configResponse.json();
          } catch (err) {
            debugLogger.warn("Failed to load CDN config:", { error: err });
          }
        }

        const cdnBranding = cdnConfig?.branding;
        if (cdnBranding) {
          debugLogger.info("Applying CDN branding");
          setBrandingText(cdnBranding.brandingText || "");
          setTheme(cdnBranding.theme || "bandit-dark");
          setLogoBase64(cdnBranding.logoBase64 || null);
          if (cdnBranding.hasTransparentLogo !== undefined) {
            setHasTransparentLogo(cdnBranding.hasTransparentLogo);
          }

          if (!hasUserModifiedBranding) {
            debugLogger.info("Saving CDN branding to IndexedDB");
            await indexedDBService.put("banditConfig", 1, "config", {
              id: "main",
              branding: {
                ...cdnBranding,
                userSaved: false,
              },
            }, storeConfigs);
          }
        } else {
          debugLogger.info("Using Bandit default branding");
          setTheme("bandit-dark");
          setHasTransparentLogo(true);
        }

        if (cdnConfig?.models && Array.isArray(cdnConfig.models)) {
          debugLogger.info("Loading models from CDN config", {
            modelCount: cdnConfig.models.length
          });

          await initModels();
        }
      }

      if (modelConfig) {
        setModelName(modelConfig.name || "");
        setTagline(modelConfig.tagline || "");
        setSystemPrompt(modelConfig.systemPrompt || "");
        setSelectedModel(modelConfig.selectedModel || "");
      }

      setBrandingLoaded(true);
    } catch (e) {
      debugLogger.error("Failed to load config from IndexedDB", { error: e });
      setTheme("bandit-dark");
      setHasTransparentLogo(true);
      setBrandingLoaded(true);
    } finally {
      setIsLoadingBranding(false);
    }
  }, [
    brandingLoaded,
    initModels,
    isLoadingBranding,
    setBrandingLoaded,
    setHasTransparentLogo,
    setIsLoadingBranding,
    setModelName,
    setSelectedModel,
    setSystemPrompt,
    setTagline,
    setTheme,
  ]); // Only essential dependencies

  useEffect(() => {
    // Only load once on mount
    void loadBrandingConfig();
  }, [loadBrandingConfig]); // Empty dependency array to run only once on mount

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  // Load branding logo for FAB
  useEffect(() => {
    getOptimalFabLogo().then(setFabLogo);
  }, []);

  // Update FAB logo when logoBase64 changes (when user uploads new logo)
  useEffect(() => {
    if (logoBase64) {
      setFabLogo(logoBase64);
    } else {
      getOptimalFabLogo().then(setFabLogo);
    }
  }, [logoBase64]);

  const handleSaveModel = async () => {
    debugLogger.info("STARTING handleSaveModel", {
      modelName: localSelectedModel.name,
      selectedModel: localSelectedModel.selectedModel
    });

    // Validate required fields
    if (!localSelectedModel.name?.trim()) {
      showSnackbarMessage("Please enter a personality name before saving.", 'error');
      return;
    }

    useModelStore.setState({ isInitializing: true });

    try {
      const storeConfigs = [{ name: "config", keyPath: "id" }] as const;

      // Save branding first (always save branding regardless of model type)
      debugLogger.info("Saving branding to IndexedDB");
      await indexedDBService.put<StoredBanditConfigRecord>("banditConfig", 1, "config", {
        id: "main",
        branding: {
          logoBase64,
          brandingText,
          theme,
          hasTransparentLogo,
          userSaved: true,
        },
      }, storeConfigs);

      // Prepare avatar
      let avatarBase64ToStore: string | null = null;
      if (customAvatarBase64) {
        avatarBase64ToStore = customAvatarBase64;
      } else if (presetAvatar) {
        avatarBase64ToStore = await fetchAndConvertToBase64(presetAvatar);
      }

      // Create model object
      const modelToSave: BanditPersonality = {
        name: localSelectedModel.name.trim(),
        tagline: localSelectedModel.tagline || "",
        systemPrompt: localSelectedModel.systemPrompt || "",
        avatarBase64: avatarBase64ToStore || "",
        commands: [],
      };

      debugLogger.info("Saving custom model", { modelName: modelToSave.name });

      // Save to IndexedDB
      const modelEntry: StoredBanditConfigRecord = {
        id: modelToSave.name,
        name: modelToSave.name,
        tagline: modelToSave.tagline,
        systemPrompt: modelToSave.systemPrompt,
        avatarBase64: modelToSave.avatarBase64 || undefined,
        commands: modelToSave.commands,
        model: {
          name: modelToSave.name,
          tagline: modelToSave.tagline,
          systemPrompt: modelToSave.systemPrompt,
          selectedModel: modelToSave.name,
        },
      };

      await indexedDBService.put<StoredBanditConfigRecord>("banditConfig", 1, "config", modelEntry, storeConfigs);

      // Determine if this is editing an existing model (custom or Bandit) or creating a new one
      const isEditingExistingModel = localSelectedModel.selectedModel &&
        localSelectedModel.selectedModel !== "" &&
        availableModels.some(m => m.name === localSelectedModel.selectedModel);

      const isRenamingModel = isEditingExistingModel && localSelectedModel.selectedModel !== modelToSave.name;

      // Only remove old entry if we're actually renaming a model
      if (isRenamingModel) {
        debugLogger.info("Model renamed, removing old entry", {
          oldName: localSelectedModel.selectedModel,
          newName: modelToSave.name
        });
        await indexedDBService.delete("banditConfig", 1, "config", localSelectedModel.selectedModel, storeConfigs);
      }

      // Update Zustand store
      if (isEditingExistingModel) {
        // Update existing model (whether custom or Bandit)
        debugLogger.info("Updating existing model in store", {
          modelName: localSelectedModel.selectedModel,
          newName: modelToSave.name
        });
        useModelStore.setState({
          availableModels: availableModels.map(model =>
            model.name === localSelectedModel.selectedModel ? modelToSave : model
          ),
        });
      } else {
        // Add new model
        debugLogger.info("Adding new model to store", {
          modelName: modelToSave.name
        });
        useModelStore.setState({
          availableModels: [...availableModels, modelToSave],
        });
      }

      // Update selection and ensure UI state is synchronized
      setSelectedModel(modelToSave.name);
      setLocalSelectedModel({
        name: modelToSave.name,
        tagline: modelToSave.tagline,
        systemPrompt: modelToSave.systemPrompt,
        selectedModel: modelToSave.name,
      });

      debugLogger.info("✅ Model saved successfully");

      // Show success message
      showSnackbarMessage(`Personality "${modelToSave.name}" saved successfully!`, 'success');

      // Dispatch theme change event
      window.dispatchEvent(new CustomEvent('bandit-theme-changed', { detail: { theme } }));

    } catch (e) {
      debugLogger.error("Failed to save", { error: e });
      showSnackbarMessage("Failed to save personality. Please try again.", 'error');
    } finally {
      useModelStore.setState({ isInitializing: false });
    }
  };

  // Save branding data only (separate from model saving)
  const handleSaveBranding = async () => {
    try {
      const storeConfigs = [{ name: "config", keyPath: "id" }] as const;

      debugLogger.info("Saving branding data to IndexedDB");

      // Get current config to preserve other data
      const current = await indexedDBService.get<StoredBanditConfigRecord>(
        "banditConfig",
        1,
        "config",
        "main",
        storeConfigs
      );
      const currentConfig: StoredBanditConfigRecord = current ?? { id: "main" };

      await indexedDBService.put<StoredBanditConfigRecord>("banditConfig", 1, "config", {
        ...currentConfig,
        id: "main",
        branding: {
          logoBase64,
          brandingText,
          theme,
          hasTransparentLogo,
          userSaved: true, // Mark as user-saved to protect from CDN overrides
        },
      }, storeConfigs);

      // Dispatch theme change event for other components to listen
      window.dispatchEvent(new CustomEvent('bandit-theme-changed', {
        detail: { theme }
      }));

      debugLogger.info("Branding saved successfully");

      // Show success feedback
      showSnackbarMessage("Branding saved successfully!", 'success');

    } catch (error) {
      debugLogger.error("Failed to save branding", { error });
      showSnackbarMessage("Failed to save branding. Please try again.", 'error');
    }
  };

  const handleSavePreferences = () => {
    // Preferences are now automatically saved by IndexedDB via preferencesStore
    // This function is kept for UI feedback if needed
    debugLogger.info("Preferences saved automatically by zustand store");
  };

  const handleResetModel = () => {
    resetModel();
    setLocalSelectedModel({
      name: "",
      tagline: "",
      systemPrompt: "",
      selectedModel: "",
    });
    setPresetAvatar(null);
    setCustomAvatarBase64(null);
  };

  // Remove handleTabChange and use setTabIndex directly

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = async function (e) {
        const base64 = e.target?.result as string;
        setLogoBase64(base64);
        debugLogger.debug("Starting transparency detection for uploaded image");
        try {
          const isTransparent = await detectTransparency(base64);
          setHasTransparentLogo(isTransparent);
          debugLogger.debug("Transparency detection result saved", { isTransparent });
        } catch (err) {
          debugLogger.error("Failed to detect transparency", { error: err });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportConfig = async () => {
    const hasLogo = !!logoBase64;
    const exportData = {
      branding: {
        logoBase64: logoBase64 || "",
        brandingText: brandingText || "",
        theme,
        hasTransparentLogo: hasLogo ? await detectTransparency(logoBase64!) : false,
      },
      models: availableModels.map((model) => ({
        name: model.name,
        tagline: model.tagline,
        systemPrompt: model.systemPrompt,
        avatarBase64: model.avatarBase64,
        commands: model.commands,
      })),
      knowledgeDocs: documents,
    };
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "bandit_config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    document.body.removeChild(downloadAnchorNode);
  };

  const handleRestoreDefaults = async () => {
    debugLogger.info("Starting branding restore - attempting CDN defaults first");
    
    // First try to load CDN defaults
    const packageSettings = usePackageSettingsStore.getState().getSettings();
    let cdnBranding = null;
    
    if (packageSettings?.brandingConfigUrl) {
      try {
        debugLogger.info("Attempting to load CDN branding config", { url: packageSettings.brandingConfigUrl });
        const configResponse = await fetch(packageSettings.brandingConfigUrl);
        const cdnConfig = await configResponse.json();
        cdnBranding = cdnConfig?.branding;
        
        if (cdnBranding) {
          debugLogger.info("CDN branding found, applying CDN defaults", { 
            hasBrandingText: !!cdnBranding.brandingText,
            hasLogo: !!cdnBranding.logoBase64,
            theme: cdnBranding.theme
          });
        }
      } catch (err) {
        debugLogger.warn("Failed to load CDN branding config, will use Bandit defaults", { error: err });
      }
    }

    // Apply CDN defaults if available, otherwise use Bandit defaults
    if (cdnBranding) {
      // Apply CDN branding
      setLogoBase64(cdnBranding.logoBase64 || null);
      setBrandingText(cdnBranding.brandingText || "");
      setTheme(cdnBranding.theme || "bandit-dark");
      if (cdnBranding.hasTransparentLogo !== undefined) {
        setHasTransparentLogo(cdnBranding.hasTransparentLogo);
      } else {
        setHasTransparentLogo(true);
      }
      debugLogger.info("Applied CDN branding defaults");
    } else {
      // Fall back to Bandit defaults
      setLogoBase64(null);
      setBrandingText("");
      setTheme("bandit-dark");
      setHasTransparentLogo(true);
      debugLogger.info("Applied Bandit default branding");
    }

    // Reset other local state
    setLogoFile(null);
    setCustomAvatarBase64(null);
    setPresetAvatar(null);
    getOptimalFabLogo().then(setFabLogo);

    // Save the restored defaults to IndexedDB to ensure persistence
    try {
      const storeConfigs = [{ name: "config", keyPath: "id" }] as const;
      const current = await indexedDBService.get<StoredBanditConfigRecord>(
        "banditConfig",
        1,
        "config",
        "main",
        storeConfigs
      );

      const brandingToSave = cdnBranding ? {
        ...cdnBranding,
        userSaved: false, // Mark as CDN-loaded, not user-saved
      } : {
        logoBase64: null,
        brandingText: "",
        theme: "bandit-dark",
        hasTransparentLogo: true,
        userSaved: false, // Mark as default, not user-saved
      };

      debugLogger.info("Saving restored branding to IndexedDB", { 
        source: cdnBranding ? 'CDN' : 'Bandit defaults',
        userSaved: brandingToSave.userSaved
      });
      
      await indexedDBService.put<StoredBanditConfigRecord>("banditConfig", 1, "config", {
        id: "main",
        branding: brandingToSave,
        model: current?.model ?? {},
      }, storeConfigs);

      // Dispatch theme change event for other components to listen
      const finalTheme = cdnBranding?.theme || "bandit-dark";
      window.dispatchEvent(new CustomEvent('bandit-theme-changed', {
        detail: { theme: finalTheme }
      }));

      debugLogger.info("Successfully restored and saved branding", { theme: finalTheme });
    } catch (error) {
      debugLogger.error("Failed to save restored branding", { error });
    }
  };

  // Restore default models: clear deletedModels and re-import from config
  const restoreDefaultModelsAndConfig = async () => {
    try {
      const storeConfigs = [{ name: "config", keyPath: "id" }] as const;

      debugLogger.info("Starting restore defaults - preserving critical data");

      // Get current branding to preserve it if it's user-saved
      const currentMain = await indexedDBService.get<StoredBanditConfigRecord>(
        "banditConfig",
        1,
        "config",
        "main",
        storeConfigs
      );
      const preservedBranding = currentMain?.branding?.userSaved ? currentMain.branding : null;

      // Remove "deletedModels" entry to clear deleted model tracking
      await indexedDBService.delete('banditConfig', 1, 'config', 'deletedModels', storeConfigs);

      // Only clear custom models from IndexedDB, but keep "main", "mcpTools", and other system data
      const allKeys = await indexedDBService.getAllKeys("banditConfig", 1, "config", storeConfigs);
      const systemKeys = ["main", "deletedModels", "mcpTools", "preferences", "knowledgeDocs"]; // Preserve system data

      for (const key of allKeys) {
        if (typeof key === "string" && !systemKeys.includes(key)) {
          // Only delete if it looks like a model entry
          const entry = await indexedDBService.get<StoredBanditConfigRecord>(
            "banditConfig",
            1,
            "config",
            key,
            storeConfigs
          );
          const hasModelData =
            Boolean(entry?.model) ||
            (typeof entry?.name === "string" && entry.name.trim().length > 0) ||
            (typeof entry?.tagline === "string" && entry.tagline.trim().length > 0) ||
            (typeof entry?.systemPrompt === "string" && entry.systemPrompt.trim().length > 0);
          if (hasModelData) {
            debugLogger.info("Deleting custom model:", { key });
            await indexedDBService.delete("banditConfig", 1, "config", key, storeConfigs);
          } else {
            debugLogger.info("Preserving non-model data:", { key });
          }
        }
      }

      // Restore default models (this now handles config URL loading and persistence)
      if (typeof useModelStore.getState().restoreDefaultModels === "function") {
        await useModelStore.getState().restoreDefaultModels();
      }

      // Restore preserved branding if it existed and was user-saved
      if (preservedBranding) {
        debugLogger.info("Restoring preserved user branding after model restore");
        const updatedMain = await indexedDBService.get<StoredBanditConfigRecord>(
          "banditConfig",
          1,
          "config",
          "main",
          storeConfigs
        );
        const restoredMain: StoredBanditConfigRecord = updatedMain ?? { id: "main" };
        await indexedDBService.put<StoredBanditConfigRecord>("banditConfig", 1, "config", {
          ...restoredMain,
          id: "main",
          branding: preservedBranding, // Restore the preserved branding
        }, storeConfigs);
      }

      debugLogger.info("Restore defaults completed successfully");
    } catch (err) {
      debugLogger.error("Failed to restore default models and config", { error: err });
    }
  };

  // Restore deleted Bandit models only
  const restoreBanditModels = async () => {
    try {
      debugLogger.info("Restoring deleted Bandit models");
      await useModelStore.getState().restoreDeletedBanditModels();
      debugLogger.info("✅ Bandit models restored successfully");
    } catch (err) {
      debugLogger.error("Failed to restore Bandit models", { error: err });
    }
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = async function (e) {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.branding) {
            setBrandingText(data.branding.brandingText || "");
            setTheme(data.branding.theme || "Dark");
            setLogoBase64(data.branding.logoBase64 || null);
            setLogoFile(null);
            if (data.branding.hasTransparentLogo !== undefined) {
              setHasTransparentLogo(data.branding.hasTransparentLogo);
            }
          }
          // --- MODELS IMPORT LOGIC ---
          const storeConfigs = [{ name: "config", keyPath: "id" }] as const;
          // Persist each model separately by ID
          if (data.models && Array.isArray(data.models)) {
            for (const model of data.models) {
              if (!model || typeof model !== "object") {
                continue;
              }
              const parsedModel = model as Record<string, unknown>;
              const modelName = typeof parsedModel.name === "string" ? parsedModel.name : "";
              if (!modelName) {
                continue;
              }

              const sanitizedModel: StoredModelConfig = {
                name: modelName,
                tagline: typeof parsedModel.tagline === "string" ? parsedModel.tagline : undefined,
                systemPrompt: typeof parsedModel.systemPrompt === "string" ? parsedModel.systemPrompt : undefined,
                selectedModel: typeof parsedModel.selectedModel === "string" ? parsedModel.selectedModel : undefined,
              };

              const entry: StoredBanditConfigRecord = {
                id: modelName,
                model: sanitizedModel,
                name: modelName,
                tagline: sanitizedModel.tagline,
                systemPrompt: sanitizedModel.systemPrompt,
                avatarBase64: typeof parsedModel.avatarBase64 === "string" ? parsedModel.avatarBase64 : undefined,
              };

              await indexedDBService.put<StoredBanditConfigRecord>("banditConfig", 1, "config", entry, storeConfigs);
            }

            // Update Zustand with all imported models
            useModelStore.setState({
              availableModels: data.models,
              selectedModel: data.models[0]?.name || "",
            });
            setSelectedModel(data.models[0]?.name || "");
            setLocalSelectedModel({
              name: data.models[0]?.name || "",
              tagline: data.models[0]?.tagline || "",
              systemPrompt: data.models[0]?.systemPrompt || "",
              selectedModel: data.models[0]?.name || "",
            });
            setCustomAvatarBase64(data.models[0]?.avatarBase64 || null);
            setPresetAvatar(null);
          }

          // Save branding only to "main" entry - mark as user-saved to protect from CDN
          await indexedDBService.put("banditConfig", 1, "config", {
            id: "main",
            branding: {
              ...data.branding,
              userSaved: true, // Mark imported branding as user-saved to protect from CDN overrides
            },
          }, storeConfigs);

          // Handle knowledgeDocs import
          if (data.knowledgeDocs && Array.isArray(data.knowledgeDocs)) {
            await clearAllDocuments();
            for (const doc of data.knowledgeDocs) {
              const blob = new Blob([doc.content], { type: "text/plain" });
              const file = new File([blob], doc.name, { type: "text/plain" });
              await addDocuments([file]);
            }
            await loadDocuments();
          }

          // Rehydrate from IndexedDB
          if (typeof initModels === "function") {
            await initModels();
          }
        } catch (e) {
          debugLogger.error("Failed to import config", { error: e });
        }
      };
      reader.readAsText(file);
    }
  };

  // Ensure dropdown renders updated options when availableModels changes
  useEffect(() => {
    // If selectedModel is not in availableModels, clear selection
    if (
      localSelectedModel.selectedModel &&
      !availableModels.some((m) => m.name === localSelectedModel.selectedModel)
    ) {
      setLocalSelectedModel((prev) => ({
        ...prev,
        selectedModel: "",
      }));
    }
    // Optionally, you could auto-select the newly added model here if desired
  }, [availableModels, localSelectedModel.selectedModel]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // AI Provider configuration handlers
  const currentTheme = predefinedThemes[theme] || banditDarkTheme;
  if (!brandingLoaded) return null;
  // Side navigation tab config
  const allNavTabs = [
    {
      label: "Personalities",
      icon: <FaceRetouchingNaturalIcon />,
      requiresFeature: 'limitedAdminDashboard', // Available to premium+
    },
    {
      label: "Branding",
      icon: <BrushIcon />,
      requiresFeature: 'limitedAdminDashboard', // Available to premium+
    },
    {
      label: "Knowledge",
      icon: <MenuBookIcon />,
      requiresFeature: 'limitedAdminDashboard', // Available to premium+
    },
    {
      label: "Storage",
      icon: <StorageIcon />,
      requiresFeature: 'limitedAdminDashboard', // Available to premium+ (changed from adminDashboardEnabled)
    },
    {
      label: "Preferences",
      icon: <TuneIcon />,
      requiresFeature: 'limitedAdminDashboard', // Available to premium+
    },
    {
      label: "Provider",
      icon: <CloudIcon />,
      requiresFeature: 'advancedSearch', // Pro/Team users with advanced features
    },
    {
      label: "MCP Tools",
      icon: <BuildIcon />,
      requiresFeature: 'advancedSearch', // Pro/Team users with advanced features
    },
  ];

  // Filter tabs based on user's features
  const navTabs = allNavTabs.filter(tab => {
    if (tab.requiresFeature === 'limitedAdminDashboard') {
      return hasLimitedAdminDashboard() || hasAdminDashboard();
    }
    if (tab.requiresFeature === 'adminDashboardEnabled') {
      return hasAdminDashboard();
    }
    if (tab.requiresFeature === 'advancedSearch') {
      return hasAdvancedSearch(); // Pro/Team users
    }
    return true;
  });

  const navigationContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        bgcolor: "inherit",
      }}
    >
      {isMobile && (
        <Box
          sx={{
            height: 6,
            width: 56,
            borderRadius: 999,
            bgcolor: (theme) => alpha(theme.palette.text.primary, 0.18),
            alignSelf: "center",
            mt: 1.25,
            mb: 0.75,
          }}
        />
      )}

      <Box sx={{ p: isMobile ? 2.5 : 3, pb: isMobile ? 1.5 : 2 }}>
        <Button
          onClick={() => {
            if (isMobile) setSidebarOpen(false);
            navigate("/chat");
          }}
          onMouseEnter={preloadChatPage}
          startIcon={<ChevronLeftIcon sx={{ fontSize: 20 }} />}
          fullWidth
          variant="outlined"
          sx={{
            height: 48,
            borderRadius: 3,
            fontWeight: 600,
            fontSize: "1rem",
            bgcolor: (theme) => theme.palette.mode === "dark"
              ? "rgba(25,118,210,0.08)"
              : "rgba(25,118,210,0.06)",
            border: (theme) => `1.5px solid ${theme.palette.primary.main}30`,
            color: (theme) => theme.palette.primary.main,
            textTransform: "none",
            boxShadow: "0 2px 8px rgba(25,118,210,0.15)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              bgcolor: (theme) => theme.palette.mode === "dark"
                ? "rgba(25,118,210,0.15)"
                : "rgba(25,118,210,0.12)",
              borderColor: (theme) => theme.palette.primary.main,
              transform: "translateY(-1px)",
              boxShadow: "0 4px 16px rgba(25,118,210,0.25)",
            },
            "&:active": {
              transform: "translateY(0px)",
            },
          }}
        >
          Back to Chat
        </Button>
      </Box>

      <Divider sx={{ mx: isMobile ? 2 : 3, mb: 2, opacity: 0.6 }} />

      <Box sx={{ flex: 1, px: isMobile ? 1.5 : 2, pb: 3, overflowY: "auto" }}>
        <List sx={{ px: 0, py: 0 }}>
          {navTabs.map((tab, idx) => (
            <ListItemButton
              key={tab.label}
              selected={tabIndex === idx}
              onClick={() => {
                setTabIndex(idx);
                if (isMobile) setSidebarOpen(false);
              }}
              sx={{
                minHeight: 56,
                borderRadius: 3,
                mx: 1,
                my: 0.5,
                px: 2,
                py: 1.5,
                border: tabIndex === idx 
                  ? (theme) => `2px solid ${theme.palette.primary.main}40`
                  : "2px solid transparent",
                bgcolor: tabIndex === idx
                  ? (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(25,118,210,0.12)"
                      : "rgba(25,118,210,0.08)"
                  : "transparent",
                color: tabIndex === idx ? "primary.main" : "text.primary",
                fontWeight: tabIndex === idx ? 700 : 500,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                overflow: "hidden",
                "&:before": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  bgcolor: tabIndex === idx ? "primary.main" : "transparent",
                  borderRadius: "0 2px 2px 0",
                  transition: "all 0.2s",
                },
                "&:hover": {
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(25,118,210,0.15)"
                      : "rgba(25,118,210,0.10)",
                  color: "primary.main",
                  transform: "translateX(4px)",
                  "&:before": {
                    bgcolor: "primary.main",
                  },
                },
                "&:active": {
                  transform: "translateX(2px) scale(0.98)",
                },
                "& .MuiListItemIcon-root": {
                  minWidth: 44,
                  mr: 1.5,
                },
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: tabIndex === idx ? "primary.main" : "text.secondary",
                  fontSize: 24,
                  transition: "all 0.2s",
                }}
              >
                {tab.icon}
              </ListItemIcon>
              <ListItemText
                primary={tab.label}
                primaryTypographyProps={{
                  fontWeight: tabIndex === idx ? 700 : 600,
                  fontSize: "1rem",
                  letterSpacing: "-0.01em",
                }}
              />
              {tabIndex === idx && (
                <Box
                  sx={{
                    position: "absolute",
                    right: -10,
                    top: -10,
                    width: 90,
                    height: 90,
                    bgcolor: (theme) => theme.palette.primary.main,
                    filter: "blur(45px)",
                    opacity: 0.35,
                    pointerEvents: "none",
                  }}
                />
              )}
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Box>
  );
  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Box
        display="flex"
        height="100vh"
        sx={{
          bgcolor: "background.default",
          flexDirection: isMobile ? "column" : "row",
          width: "100vw",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Enhanced Mobile Header */}
        {isMobile && (
          <Box
            sx={{
              width: "100%",
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 3,
              py: 1.5,
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(24,28,40,0.95)"
                  : "rgba(255,255,255,0.95)",
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
              backdropFilter: "blur(12px)",
              zIndex: 1201,
              position: "sticky",
              top: 0,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            {/* Enhanced Hamburger Menu */}
            <Button
              onClick={() => setSidebarOpen((o) => !o)}
              sx={{
                minWidth: 48,
                minHeight: 48,
                p: 1.5,
                borderRadius: 2,
                border: "none",
                bgcolor: sidebarOpen 
                  ? (theme) => theme.palette.primary.main
                  : (theme) => theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.04)",
                color: sidebarOpen 
                  ? "white"
                  : (theme) => theme.palette.primary.main,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: sidebarOpen ? "rotate(90deg)" : "rotate(0deg)",
                "&:hover": {
                  bgcolor: sidebarOpen
                    ? (theme) => theme.palette.primary.dark
                    : (theme) => theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(0,0,0,0.08)",
                  transform: "scale(1.05)",
                },
                "&:active": {
                  transform: sidebarOpen ? "rotate(90deg) scale(0.95)" : "scale(0.95)",
                },
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d={sidebarOpen 
                    ? "M18 6L6 18M6 6L18 18" 
                    : "M3 12H21M3 6H21M3 18H21"
                  }
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>

            {/* App Title */}
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700, 
                color: "primary.main",
                fontSize: "1.1rem",
                letterSpacing: "-0.02em"
              }}
            >
              Management
            </Typography>

            {/* Current Tab Indicator */}
            <Box sx={{
              px: 2,
              py: 0.5,
              borderRadius: 2,
              bgcolor: (theme) => theme.palette.mode === "dark"
                ? "rgba(25,118,210,0.12)"
                : "rgba(25,118,210,0.08)",
              border: (theme) => `1px solid ${theme.palette.primary.main}20`,
            }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: "primary.main", 
                  fontWeight: 600,
                  fontSize: "0.75rem"
                }}
              >
                {navTabs[tabIndex]?.label}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Enhanced Side Navigation */}
        {isMobile ? (
          <SwipeableDrawer
            anchor="bottom"
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onOpen={() => setSidebarOpen(true)}
            disableSwipeToOpen
            ModalProps={{ keepMounted: true }}
            PaperProps={{
              sx: {
                height: 'min(720px, 82vh)',
                borderRadius: '22px 22px 0 0',
                overflow: 'hidden',
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(16,20,28,0.98)"
                    : "rgba(255,255,255,0.98)",
                boxShadow: '0 12px 32px rgba(0,0,0,0.28)',
                backdropFilter: 'blur(18px)',
              },
            }}
          >
            {navigationContent}
          </SwipeableDrawer>
        ) : (
          <Box
            sx={{
              width: 280,
              minWidth: 280,
              maxWidth: 280,
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(16,20,28,0.98)"
                  : "rgba(255,255,255,0.98)",
              borderRight: (theme) => `1px solid ${theme.palette.divider}`,
              boxShadow: (theme) => theme.palette.mode === "dark"
                ? "2px 0 16px 0 rgba(0,0,0,0.25)"
                : "2px 0 16px 0 rgba(0,0,0,0.08)",
              backdropFilter: "blur(16px)",
              zIndex: 1200,
              position: "fixed",
              left: 0,
              top: 0,
              overflow: "hidden",
            }}
          >
            {navigationContent}
          </Box>
        )}

        {/* Main content area */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 1, sm: 3, md: 4 },
            overflowY: "auto",
            height: isMobile ? "auto" : "100vh",
            maxWidth: "100vw",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.default",
            ml: isMobile ? 0 : "280px", // Fixed left margin only on desktop
            mt: 0,
            transition: "margin-left 0.2s",
            overflow: "auto",
            // Hide scrollbars while keeping scroll functionality
            scrollbarWidth: "none", // Firefox
            "&::-webkit-scrollbar": {
              display: "none", // Chrome, Safari, Edge
            },
            "-ms-overflow-style": "none", // IE and Edge
          }}
        >
          {/* Tab Content */}
          {navTabs[tabIndex]?.label === "Personalities" && (
            <PersonalitiesTab
              availableModels={availableModels}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              localSelectedModel={localSelectedModel}
              setLocalSelectedModel={setLocalSelectedModel}
              customAvatarBase64={customAvatarBase64}
              setCustomAvatarBase64={setCustomAvatarBase64}
              presetAvatar={presetAvatar}
              setPresetAvatar={setPresetAvatar}
              handleSaveModel={handleSaveModel}
              handleResetModel={handleResetModel}
              restoreDefaultModelsAndConfig={restoreDefaultModelsAndConfig}
              restoreBanditModels={restoreBanditModels}
              showSnackbar={showSnackbarMessage}
            />
          )}
          {navTabs[tabIndex]?.label === "Branding" && (
            <BrandingTab
              logoFile={logoFile}
              logoBase64={logoBase64}
              brandingText={brandingText}
              setBrandingText={setBrandingText}
              theme={theme}
              setTheme={setTheme}
              predefinedThemes={predefinedThemes}
              handleLogoUpload={handleLogoUpload}
              handleRestoreDefaults={handleRestoreDefaults}
              handleExportConfig={handleExportConfig}
              handleImportConfig={handleImportConfig}
              handleSaveBranding={handleSaveBranding}
              setLogoFile={setLogoFile}
              setLogoBase64={setLogoBase64}
            />
          )}
          {navTabs[tabIndex]?.label === "Knowledge" && (
            <KnowledgeTab
              documents={documents}
              addDocuments={addDocuments}
              removeDocument={removeDocument}
              loadDocuments={loadDocuments}
              clearAllDocuments={clearAllDocuments}
              currentTheme={currentTheme}
              isLimitedAdmin={hasLimitedAdminDashboard() && !hasAdminDashboard()}
            />
          )}
          {navTabs[tabIndex]?.label === "Storage" && (
            <StorageTab currentTheme={currentTheme} />
          )}
          {navTabs[tabIndex]?.label === "Preferences" && (
            <PreferencesTab
              preferences={preferences}
              updatePreference={updatePreference}
              packageSettings={packageSettings}
              handleSavePreferences={handleSavePreferences}
              showSnackbar={showSnackbarMessage}
            />
          )}
          {navTabs[tabIndex]?.label === "Provider" && <ProviderTab />}
          {navTabs[tabIndex]?.label === "MCP Tools" && <MCPToolsTabV2 />}
        </Box>

        <Fab
          aria-label="AI"
          onClick={handleOpenModal}
          sx={(theme) => ({
            position: "fixed",
            bottom: 16,
            right: 16,
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
              transform: "scale(1.05)",
            },
            "&:active": {
              transform: "scale(0.95)",
            },
            transition: "all 0.2s ease-in-out",
            boxShadow: theme.shadows[6],
            zIndex: 2000,
          })}
        >
          <img
            src={fabLogo}
            alt="AI Assistant Logo"
            style={{
              width: 32,
              height: 32,
              objectFit: "contain",
            }}
          />
        </Fab>
        <ChatModal open={modalOpen} onClose={handleCloseModal} />
      </Box>

    </ThemeProvider>
  );
};

export default Management;

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

// Bandit Engine Watermark: BL-WM-0868-1B08DD
const __banditFingerprint_chat_chatappbartsx = 'BL-FP-17AC7A-1F59';
const __auditTrail_chat_chatappbartsx = 'BL-AU-MGOIKVUW-HL0K';
// File: chat-app-bar.tsx | Path: src/chat/chat-app-bar.tsx | Hash: 08681f59

import { Avatar } from "@mui/material";
import { useModelStore } from "../store/modelStore";
import { BanditPersonality } from "../store/modelStore";

const CDN_BASE = "https://cdn.burtson.ai/";
const banditHead = `${CDN_BASE}/images/bandit-head.png`;

const modelAvatars: Record<string, string> = {
  "Bandit-Core": `${CDN_BASE}/avatars/core-avatar.png`,
  "Bandit-Muse": `${CDN_BASE}/avatars/muse-avatar.png`,
  "Bandit-Logic": `${CDN_BASE}/avatars/logic-avatar.png`,
  "Bandit-D1VA": `${CDN_BASE}/avatars/d1va-avatar.png`,
  "Bandit-Exec": `${CDN_BASE}/avatars/exec-avatar.png`,
};
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import NotesIcon from "@mui/icons-material/Notes";
import NotesIconOutlined from "@mui/icons-material/NotesOutlined";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import SyncIcon from "@mui/icons-material/Sync";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { toTitleCase } from "../util";
import ConversationDrawer from "./conversation-drawer";
import MobileConversationsModal from "./enhanced-mobile-conversations-modal";
import { useConversationStore } from "../store/conversationStore";
import indexedDBService from "../services/indexedDB/indexedDBService";
import { debugLogger } from "../services/logging/debugLogger";
import { usePreferencesStore } from "../store/preferencesStore";
import { usePackageSettingsStore } from "../store/packageSettingsStore";
import { useFeatures, useFeatureVisibility } from "../hooks/useFeatures";
import { useConversationSyncStore } from "../store/conversationSyncStore";
import { shallow } from "zustand/shallow";

interface ChatAppBarProps {
  availableModels: BanditPersonality[];
  handleModelChange: (modelId: string) => void;
  selectedVoice: string;
  availableVoices: string[];
  handleVoiceChange: (voiceId: string) => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

const ChatAppBar: React.FC<ChatAppBarProps> = ({
  availableModels,
  handleModelChange,
  selectedVoice,
  availableVoices,
  handleVoiceChange,
  drawerOpen,
  setDrawerOpen,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const hasLoggedRouterWarningRef = useRef(false);
  let navigate: NavigateFunction | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    navigate = useNavigate();
  } catch (error) {
    if (!hasLoggedRouterWarningRef.current) {
      debugLogger.warn("ChatAppBar: Navigation not available (missing Router context)", { error });
      hasLoggedRouterWarningRef.current = true;
    }
    navigate = null;
  }

  const safeNavigate = (to: string) => {
    if (navigate) {
      navigate(to);
    } else if (typeof window !== "undefined") {
      window.location.href = to;
    }
  };

  const {
    background,
    border,
    icon,
    iconHover,
    menuBackground,
    menuText,
  } = theme.palette.chat.appBar;

  const [modelAnchorEl, setModelAnchorEl] = useState<null | HTMLElement>(null);
  const [voiceAnchorEl, setVoiceAnchorEl] = useState<null | HTMLElement>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [confirmModelChangeOpen, setConfirmModelChangeOpen] = useState(false);
  const [pendingModel, setPendingModel] = useState<string | null>(null);

  const { conversations, currentId, createNewConversation, _hasHydrated } =
    useConversationStore();
  const { preferences } = usePreferencesStore();
  const { settings: packageSettings } = usePackageSettingsStore();

  const isPlaygroundRoute =
    typeof window !== "undefined" && window.location.pathname.includes("/playground");
  const isPlaygroundMode =
    Boolean(packageSettings?.playgroundMode) ||
    (packageSettings?.gatewayApiUrl ?? "").toLowerCase().startsWith("playground://") ||
    (typeof window !== "undefined" && window.location.pathname.startsWith("/playground"));
  const managementPath = isPlaygroundMode ? "/playground/management" : "/management";

  const {
    syncEnabled,
    syncStatus,
    lastSyncAt,
    pendingCount,
    warningConversations,
    oversizedConversations,
    triggerSync,
    setSyncEnabled,
  } = useConversationSyncStore((state) => ({
    syncEnabled: state.syncEnabled,
    syncStatus: state.status,
    lastSyncAt: state.lastSyncAt,
    pendingCount:
      state.pendingConversationUpserts.size +
      state.pendingConversationDeletes.size +
      state.pendingProjectUpserts.size +
      state.pendingProjectDeletes.size,
    warningConversations: state.warningConversations,
    oversizedConversations: state.oversizedConversations,
    triggerSync: state.runSync,
    setSyncEnabled: state.setSyncEnabled,
  }), shallow);

  useEffect(() => {
    if (isPlaygroundMode && syncEnabled) {
      void setSyncEnabled(false).catch((error) => {
        debugLogger.warn("ChatAppBar: Failed to disable sync in playground", {
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }
  }, [isPlaygroundMode, syncEnabled, setSyncEnabled]);

  const syncSpinSx = {
    animation: 'spin 1s linear infinite',
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
  } as const;

  const syncIndicatorIcon = (() => {
    if (isPlaygroundMode || !syncEnabled) {
      return <CloudOffIcon fontSize="small" color="disabled" />;
    }
    switch (syncStatus) {
      case 'syncing':
        return <SyncIcon fontSize="small" sx={syncSpinSx} color="primary" />;
      case 'error':
        return <ErrorOutlineIcon fontSize="small" color="error" />;
      case 'idle':
      default:
        return <CloudDoneIcon fontSize="small" color="success" />;
    }
  })();

  const syncTooltip = (() => {
    if (isPlaygroundMode) {
      return "Cloud sync is unavailable in playground mode.";
    }
    if (!syncEnabled) {
      return "Cloud sync is disabled. Enable it from Management > Preferences.";
    }
    let base: string;
    if (oversizedConversations.length > 0) {
      base = 'Some conversations are too large for Bandit Cloud. Start a new conversation to keep syncing.';
    } else if (syncStatus === 'syncing') {
      base = 'Syncing changes to Bandit Cloud…';
    } else if (warningConversations.length > 0) {
      base = 'Conversations are nearing the Bandit Cloud limit. Consider starting a new one soon.';
    } else if (syncStatus === 'error') {
      base = 'Sync needs attention. Visit Management > Preferences for details.';
    } else {
      base = 'Conversations are in sync with Bandit Cloud.';
    }
    const pending = pendingCount > 0
      ? ` ${pendingCount} change${pendingCount === 1 ? '' : 's'} queued.`
      : '';
    const last = lastSyncAt
      ? ` Last sync ${new Date(lastSyncAt).toLocaleTimeString()}.`
      : '';
    return `${base}${pending}${last}`;
  })();

  const syncButtonDisabled = isPlaygroundMode || !syncEnabled;

  const handleSyncBadgeClick = () => {
    if (isPlaygroundMode || !syncEnabled || syncStatus === 'syncing') {
      return;
    }
    void triggerSync({ force: true });
  };

  // Feature flag checks
  const { hasTTS, hasSTT, isAdmin, getCurrentTier, hasLimitedAdminDashboard } = useFeatures();
  const { showVoiceControls, showLimitedAdminPanel } = useFeatureVisibility();

  // Check if TTS is available and enabled
  const isTTSAvailable = !!packageSettings?.gatewayApiUrl && preferences.ttsEnabled && hasTTS();

  const currentConversation = conversations.find((c) => c.id === currentId);
  const conversationCountDisplay = conversations.length > 99
    ? "99+"
    : conversations.length.toString();
  const isTrulyNewConversation =
    currentConversation?.name === "New Conversation" &&
    currentConversation.history.length === 0;

  const canShowNewConversationButton =
    _hasHydrated && currentConversation && !isTrulyNewConversation;

  // 🧼 Enhanced button styles with better UX
  const pillButtonStyles = {
    width: 36,
    height: 36,
    borderRadius: "50%",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    color: icon,
    bgcolor: background,
    position: "relative",
    "&:hover": { 
      bgcolor: iconHover,
      transform: "scale(1.05)",
      boxShadow: theme.palette.mode === "dark" 
        ? "0 2px 8px rgba(255,255,255,0.1)" 
        : "0 2px 8px rgba(0,0,0,0.1)",
    },
    "&:active": {
      transform: "scale(0.95)",
    },
    "&:focus-visible": {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: "2px",
    },
  } as const;

  const selectedModel = useModelStore((s) => s.selectedModel);
  const currentModel = useModelStore((s) => s.availableModels.find((m) => m.name === selectedModel));
  const currentAvatar = currentModel?.avatarBase64 || modelAvatars[selectedModel] || banditHead;

  const pendingModelAvatar =
    useModelStore.getState().availableModels.find((m) => m.name === pendingModel)?.avatarBase64 ||
    modelAvatars[pendingModel || ""] ||
    banditHead;

  function goToHome() {
    // Check if user has configured a custom home URL
    if (preferences.homeUrl && preferences.homeUrl.trim()) {
      window.location.href = preferences.homeUrl;
      return;
    }

    // Default to React Router navigation within the current app
    if (typeof window !== 'undefined') {
      const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
      const isStandalone =
        window.matchMedia?.('(display-mode: standalone)').matches ||
        navigatorWithStandalone.standalone === true;
      if (isStandalone) {
        try {
          sessionStorage.setItem('banditPwaStayOnHome', 'true');
        } catch (error) {
          debugLogger.warn('[chat-app-bar] Unable to persist home preference', {
            error: error instanceof Error ? error.message : String(error)
          });
        }
        safeNavigate('/?mode=home');
        return;
      }
    }

    safeNavigate('/');
  }

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "transparent",
          zIndex: 1300,
          pointerEvents: "none",
          "& > *": {
            pointerEvents: "auto",
          },
        }}
      >
        {/* LEFT PILL */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            bgcolor: background,
            px: 1.25,
            py: 0.5,
            borderRadius: "9999px",
            border: `1px solid ${border}`,
            backdropFilter: "blur(10px)",
            boxShadow: theme.palette.mode === "dark" 
              ? "0 4px 16px rgba(0,0,0,0.3)" 
              : "0 4px 16px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: theme.palette.mode === "dark" 
                ? "0 6px 20px rgba(0,0,0,0.4)" 
                : "0 6px 20px rgba(0,0,0,0.15)",
            },
          }}
        >
          <Tooltip title={preferences.homeUrl && preferences.homeUrl.trim() ? `Home (${new URL(preferences.homeUrl).hostname})` : "Home"} arrow>
            <IconButton
              onClick={goToHome}
              sx={pillButtonStyles}
              aria-label="Go to home page"
            >
              <HomeIcon />
            </IconButton>
          </Tooltip>
          
          {showLimitedAdminPanel() && (
            <Tooltip title="Management & Settings" arrow>
              <IconButton 
                onClick={() => safeNavigate(managementPath)} 
                sx={{
                  ...pillButtonStyles,
                  ...(typeof window !== "undefined" && window.location.pathname === managementPath && {
                    bgcolor: theme.palette.primary.main + "20",
                    color: theme.palette.primary.main,
                  }),
                }}
                aria-label="Open management settings"
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={syncTooltip} arrow>
            <IconButton
              onClick={handleSyncBadgeClick}
              disabled={syncButtonDisabled}
              sx={{
                ...pillButtonStyles,
                color: syncButtonDisabled ? theme.palette.action.disabled : theme.palette.primary.main,
                bgcolor: syncButtonDisabled
                  ? 'transparent'
                  : syncStatus === 'error'
                    ? theme.palette.error.main + '20'
                    : theme.palette.primary.main + '12',
                '&:hover': syncButtonDisabled
                  ? {}
                  : {
                      bgcolor: syncStatus === 'error'
                        ? theme.palette.error.main + '30'
                        : theme.palette.primary.main + '20',
                    },
              }}
              aria-label="Conversation sync status"
            >
              {syncIndicatorIcon}
              {pendingCount > 0 && !syncButtonDisabled && syncStatus !== 'syncing' && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    minWidth: 16,
                    height: 16,
                    px: 0.3,
                    bgcolor: theme.palette.warning.main,
                    color: theme.palette.getContrastText(theme.palette.warning.main),
                    borderRadius: '999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    border: `2px solid ${background}`,
                  }}
                >
                  {pendingCount > 9 ? '9+' : pendingCount}
                </Box>
              )}
            </IconButton>
          </Tooltip>

          {!isMobile && (
            <Tooltip title={`${drawerOpen ? "Close" : "Open"} Conversations`} arrow>
              <IconButton
                onClick={() => setDrawerOpen(!drawerOpen)}
                sx={{
                  ...pillButtonStyles,
                  ...(drawerOpen && {
                    bgcolor: theme.palette.primary.main + "20",
                    color: theme.palette.primary.main,
                  }),
                }}
                aria-label={`${drawerOpen ? "Close" : "Open"} conversations drawer`}
                aria-pressed={drawerOpen}
              >
                {drawerOpen ? (
                  <NotesIcon />
                ) : (
                  <NotesIconOutlined />
                )}
                {conversations.length > 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      minWidth: 16,
                      height: 16,
                      px: 0.3,
                      bgcolor: theme.palette.primary.main,
                      color: "white",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.6rem",
                      fontWeight: "bold",
                      border: `2px solid ${background}`,
                    }}
                  >
                    {conversationCountDisplay}
                  </Box>
                )}
              </IconButton>
            </Tooltip>
          )}

          {!isMobile && canShowNewConversationButton && (
            <Tooltip title="Start New Conversation" arrow>
              <IconButton 
                onClick={() => createNewConversation()} 
                sx={{
                  ...pillButtonStyles,
                  bgcolor: theme.palette.success.main + "20",
                  color: theme.palette.success.main,
                  "&:hover": {
                    bgcolor: theme.palette.success.main + "30",
                    transform: "scale(1.1)",
                  },
                }}
                aria-label="Create new conversation"
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* RIGHT PILL */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            bgcolor: background,
            px: 1.25,
            py: 0.5,
            borderRadius: "9999px",
            border: `1px solid ${border}`,
            backdropFilter: "blur(10px)",
            boxShadow: theme.palette.mode === "dark" 
              ? "0 4px 16px rgba(0,0,0,0.3)" 
              : "0 4px 16px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: theme.palette.mode === "dark" 
                ? "0 6px 20px rgba(0,0,0,0.4)" 
                : "0 6px 20px rgba(0,0,0,0.15)",
            },
          }}
        >
          {isMobile && (
            <Tooltip title={`Conversations (${conversations.length})`} arrow>
              <IconButton 
                onClick={() => setModalOpen(true)} 
                sx={{
                  ...pillButtonStyles,
                  position: "relative",
                }}
                aria-label={`Open conversations modal with ${conversations.length} conversations`}
              >
                <NotesIcon fontSize="small" />
                {conversations.length > 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      minWidth: 14,
                      height: 14,
                      px: 0.35,
                      bgcolor: theme.palette.primary.main,
                      color: "white",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.55rem",
                      fontWeight: "bold",
                      border: `1.5px solid ${background}`,
                    }}
                  >
                    {conversationCountDisplay}
                  </Box>
                )}
              </IconButton>
            </Tooltip>
          )}

          {isMobile && canShowNewConversationButton && (
            <Tooltip title="Start New Conversation" arrow>
              <IconButton
                onClick={() => {
                  createNewConversation();
                  setModalOpen(false);
                }}
                sx={{
                  ...pillButtonStyles,
                  bgcolor: theme.palette.success.main + "20",
                  color: theme.palette.success.main,
                  "&:hover": {
                    bgcolor: theme.palette.success.main + "30",
                    transform: "scale(1.1)",
                  },
                }}
                aria-label="Create new conversation"
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={`Current AI: ${selectedModel.replace("Bandit-", "")}`} arrow>
            <IconButton
              onClick={(e) => setModelAnchorEl(e.currentTarget)}
              sx={{
                ...pillButtonStyles,
                "&:hover": {
                  ...pillButtonStyles["&:hover"],
                  "& .MuiAvatar-root": {
                    transform: "scale(1.1)",
                    filter: "brightness(2) saturate(1.2)",
                  },
                },
              }}
              aria-label={`Change AI personality. Currently using ${selectedModel}`}
            >
              <Avatar
                src={currentAvatar}
                alt={selectedModel}
                sx={{
                  width: "36px",
                  height: "36px",
                  filter: "brightness(1.7)",
                  transition: "all 0.2s ease-in-out",
                  border: `2px solid ${theme.palette.primary.main}20`,
                }}
                className="MuiAvatar-root"
              />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={modelAnchorEl}
            open={Boolean(modelAnchorEl)}
            onClose={() => setModelAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                bgcolor: menuBackground,
                color: menuText,
                fontSize: "0.875rem",
                zIndex: 20000,
                borderRadius: 2,
                border: `1px solid ${border}`,
                boxShadow: theme.palette.mode === "dark" 
                  ? "0 8px 32px rgba(0,0,0,0.5)" 
                  : "0 8px 32px rgba(0,0,0,0.2)",
                minWidth: 200,
                "& .MuiMenuItem-root": {
                  transition: "all 0.15s ease-in-out",
                  borderRadius: "6px",
                  margin: "2px 4px",
                  "&:hover": {
                    bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                    transform: "translateX(2px)",
                  },
                  "&.Mui-selected": {
                    bgcolor: theme.palette.primary.main + "20",
                    color: theme.palette.primary.main,
                    "&:hover": {
                      bgcolor: theme.palette.primary.main + "30",
                    },
                  },
                },
              },
            }}
          >
            {availableModels.map((model) => (
              <MenuItem
                key={model.name}
                selected={model.name === selectedModel}
                onClick={() => {
                  if (
                    !currentConversation?.history.length ||
                    currentConversation?.history.length === 0
                  ) {
                    handleModelChange(model.name);
                    useModelStore.getState().setSelectedModel(model.name);
                    (async () => {
                      try {
                        const storeConfigs = [{ name: "config", keyPath: "id" }];
                        const current = await indexedDBService.get("banditConfig", 1, "config", "main", storeConfigs);
                        const updated = {
                          ...current,
                          id: "main",
                          model: {
                            ...(current?.model || {}),
                            name: model.name,
                            selectedModel: model.name,
                          },
                        };
                        await indexedDBService.put("banditConfig", 1, "config", updated, storeConfigs);
                      } catch (err) {
                        debugLogger.error("Failed to persist selectedModel to IndexedDB", { error: err });
                      }
                    })();
                    setModelAnchorEl(null);
                    return;
                  }

                  setPendingModel(model.name);
                  setConfirmModelChangeOpen(true);
                  setModelAnchorEl(null);
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  minHeight: 48,
                  px: 2,
                }}
              >
                <Avatar
                  src={
                    model.avatarBase64 || 
                    modelAvatars[model.name] || 
                    banditHead
                  }
                  alt={model.name}
                  sx={{ 
                    width: 28, 
                    height: 28, 
                    filter: "brightness(1.7)",
                    transition: "all 0.2s ease-in-out",
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {model.name.replace("Bandit-", "")}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: "block" }}>
                    {model.name === selectedModel ? "Currently active" : "Switch to this AI"}
                  </Typography>
                </Box>
                {model.name === selectedModel && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: theme.palette.primary.main,
                    }}
                  />
                )}
              </MenuItem>
            ))}
          </Menu>

          {isTTSAvailable && (
            <>
              <Tooltip title={`Voice: ${selectedVoice ? toTitleCase(selectedVoice.split("-")[1]) : "Default"}`} arrow>
                <IconButton
                  onClick={(e) => setVoiceAnchorEl(e.currentTarget)}
                  sx={{
                    ...pillButtonStyles,
                    bgcolor: theme.palette.info.main + "20",
                    color: theme.palette.info.main,
                    "&:hover": {
                      ...pillButtonStyles["&:hover"],
                      bgcolor: theme.palette.info.main + "30",
                    },
                  }}
                  aria-label={`Change voice. Currently using ${selectedVoice ? toTitleCase(selectedVoice.split("-")[1]) : "default"}`}
                >
                  <RecordVoiceOverIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={voiceAnchorEl}
                open={Boolean(voiceAnchorEl)}
                onClose={() => setVoiceAnchorEl(null)}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  sx: {
                    bgcolor: menuBackground,
                    color: menuText,
                    fontSize: "0.875rem",
                    zIndex: 20000,
                    borderRadius: 2,
                    border: `1px solid ${border}`,
                    boxShadow: theme.palette.mode === "dark" 
                      ? "0 8px 32px rgba(0,0,0,0.5)" 
                      : "0 8px 32px rgba(0,0,0,0.2)",
                    minWidth: 180,
                    "& .MuiMenuItem-root": {
                      transition: "all 0.15s ease-in-out",
                      borderRadius: "6px",
                      margin: "2px 4px",
                      minHeight: 40,
                      "&:hover": {
                        bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                        transform: "translateX(2px)",
                      },
                      "&.Mui-selected": {
                        bgcolor: theme.palette.info.main + "20",
                        color: theme.palette.info.main,
                        "&:hover": {
                          bgcolor: theme.palette.info.main + "30",
                        },
                      },
                    },
                  },
                }}
              >
                {availableVoices.length > 0 ? (
                  availableVoices.map((voice) => (
                    <MenuItem
                      key={voice}
                      selected={voice === selectedVoice}
                      onClick={() => {
                        handleVoiceChange(voice);
                        setVoiceAnchorEl(null);
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                        <RecordVoiceOverIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2">
                            {toTitleCase(voice.split("-")[1])}
                          </Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {voice === selectedVoice ? "Currently active" : "Switch to this voice"}
                          </Typography>
                        </Box>
                        {voice === selectedVoice && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: theme.palette.info.main,
                            }}
                          />
                        )}
                      </Box>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      No voices available
                    </Typography>
                  </MenuItem>
                )}
              </Menu>
            </>
          )}
        </Box>
      </Box>

      <ConversationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <MobileConversationsModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <Dialog
        open={confirmModelChangeOpen}
        onClose={() => setConfirmModelChangeOpen(false)}
      >
        <DialogTitle>Change personality and start new conversation?</DialogTitle>
        <DialogContent>
          <Box display="flex" alignItems="center" gap={2} mt={1} justifyContent="center">
            <Avatar
              src={pendingModelAvatar}
              alt={pendingModel || "Personality Avatar"}
              sx={{ width: 40, height: 40, filter: "brightness(1.7)" }}
            />
            <Typography variant="body2">
              Your current conversation will be saved, and a new one will begin with <strong>{pendingModel}</strong>.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmModelChangeOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (pendingModel) {
                createNewConversation();
                handleModelChange(pendingModel);
                useModelStore.getState().setSelectedModel(pendingModel);
                (async () => {
                  try {
                    const storeConfigs = [{ name: "config", keyPath: "id" }];
                    const current = await indexedDBService.get("banditConfig", 1, "config", "main", storeConfigs);
                    const updated = {
                      ...current,
                      id: "main",
                      model: {
                        ...(current?.model || {}),
                        name: pendingModel,
                        selectedModel: pendingModel,
                      },
                    };
                    await indexedDBService.put("banditConfig", 1, "config", updated, storeConfigs);
                  } catch (err) {
                    debugLogger.error("Failed to persist selectedModel to IndexedDB", { error: err });
                  }
                })();

                // Set the model on the new currentConversation
                const { conversations, currentId } = useConversationStore.getState();
                const conv = conversations.find((c) => c.id === currentId);
                if (conv) conv.model = pendingModel;
              }
              setConfirmModelChangeOpen(false);
            }}
            color="error"
          >
            Change Personality
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatAppBar;

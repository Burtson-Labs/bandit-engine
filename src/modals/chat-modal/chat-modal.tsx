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

// Bandit Engine Watermark: BL-WM-4E6D-74941D
const __banditFingerprint_chatmodal_chatmodaltsx = 'BL-FP-1AAA0B-D0A0';
const __auditTrail_chatmodal_chatmodaltsx = 'BL-AU-MGOIKVVN-K5Z2';
// File: chat-modal.tsx | Path: src/modals/chat-modal/chat-modal.tsx | Hash: 4e6dd0a0

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Modal,
  InputAdornment,
  Tooltip,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import DraggableBox from "./draggable-box";
import ModalHeader from "./modal-header";
import QueryInput from "./query-input";
import AIResponseTextField from "./ai-response-text-field";
import indexedDBService from "../../services/indexedDB/indexedDBService";
import AIQueriesDrawer from "./chat-drawer";
import GenericLoader from "../../shared/generic-loader";
import { FeedbackButton } from "../../components/feedback/FeedbackButton";
import useAIChat from "../../hooks/useAiChat";
import useDraggable from "../../hooks/useDraggable";
import { useAIQueryStore } from "../../store/aiQueryStore";
import { useModelStore } from "../../store/modelStore";
import { useVoiceStore } from "../../store/voiceStore";
import { usePreferencesStore } from "../../store/preferencesStore";
import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import { useNotificationService } from "../../hooks/useNotificationService";
import { useAIProviderStore } from "../../store/aiProviderStore";
import brandingService from "../../services/branding/brandingService";
import { debugLogger } from "../../services/logging/debugLogger";
import { banditDarkTheme } from "../../theme/banditTheme";
import themeMap from "../../theme/themeMap";
import { useTTS } from "../../hooks/useTTS";
import { Subscription } from "rxjs";

export const FULL_SCREEN_THRESHOLD = 100;
export const MIN_WINDOWED_HEIGHT = 400;
export const MAX_WINDOWED_HEIGHT = 600;

const CDN_BASE = "https://cdn.burtson.ai/";
const banditHead = `${CDN_BASE}/images/bandit-head.png`;

const modelAvatars: Record<string, string> = {
  "Bandit-Core": `${CDN_BASE}/avatars/core-avatar.png`,
  "Bandit-Muse": `${CDN_BASE}/avatars/muse-avatar.png`,
  "Bandit-Logic": `${CDN_BASE}/avatars/logic-avatar.png`,
  "Bandit-D1VA": `${CDN_BASE}/avatars/d1va-avatar.png`,
  "Bandit-Exec": `${CDN_BASE}/avatars/exec-avatar.png`,
};

const useOptionalNavigate = (): NavigateFunction | null => {
  const hasLoggedRef = useRef(false);

  try {
    return useNavigate();
  } catch (error) {
    if (!hasLoggedRef.current) {
      debugLogger.debug("Navigation not available in ChatModal context", { error });
      hasLoggedRef.current = true;
    }
    return null;
  }
};

export interface ChatModalProps {
  /**
   * Controls whether the modal is rendered. When `true`, the modal
   * mounts and begins loading the latest conversation context.
   */
  open: boolean;
  /**
   * Invoked when the user clicks the close button or presses escape.
   * Consumers should toggle their `open` state off in this handler.
   */
  onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({
  open,
  onClose,
}) => {
    const navigate = useOptionalNavigate();

    const getOptimalLogo = async (): Promise<string> => {
      const banditAiLogo = "https://cdn.burtson.ai/logos/bandit-ai-logo.png";

      try {
        // Try branding logo first
        const branding = await brandingService.getBranding();
        if (branding?.logoBase64) {
          return branding.logoBase64;
        }

        // Fallback to Bandit AI logo
        return banditAiLogo;
      } catch (error) {
        debugLogger.error("Failed to get optimal logo", { error });
        return banditAiLogo;
      }
    };

    const {
      inputValue,
      response,
      previousQuestion,
      componentStatus,
      apiKey,
      history,
      setInputValue,
      setApiKey,
    } = useAIQueryStore();

    const {
      fullScreen,
      setFullScreen,
      drawerOpen,
      setDrawerOpen,
      showSettings,
      setShowSettings,
      handleSend,
    } = useAIChat();

    const { modalRef, position, setPosition, handleDrag, handleHeaderMouseDown } =
      useDraggable();

    const [pastedImages, setPastedImages] = useState<string[]>([]);
    const [responseStarted, setResponseStarted] = useState(false);
    const [modalLogo, setModalLogo] = useState<string>("https://cdn.burtson.ai/logos/bandit-ai-logo.png");
    const [modelAnchorEl, setModelAnchorEl] = useState<null | HTMLElement>(null);
    const [voiceAnchorEl, setVoiceAnchorEl] = useState<null | HTMLElement>(null);
    const [audioSub, setAudioSub] = useState<Subscription>(new Subscription());
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
    const [themeLoading, setThemeLoading] = useState(true);
    const [autoFullscreenTriggered, setAutoFullscreenTriggered] = useState(false);
    const [userHasDragged, setUserHasDragged] = useState(false);
    const [manualFullscreenToggleTime, setManualFullscreenToggleTime] = useState<number>(0);

    // Function to center modal when exiting fullscreen
    const handleExitFullscreen = () => {
      // Center the modal when exiting fullscreen
      setPosition({
        x: Math.max(0, window.innerWidth / 2 - 300),
        y: Math.max(0, window.innerHeight / 2 - 300),
      });
      // Reset drag tracking since we're repositioning
      setUserHasDragged(false);
    };

    // Custom drag handler that tracks user interaction
    const handleCustomDrag = (e: MouseEvent) => {
      handleDrag(e);
      setUserHasDragged(true); // Mark that user has manually positioned the modal
    };

    // Get the active theme based on what's saved in IndexedDB
    const activeTheme = themeMap[selectedTheme ?? "bandit-dark"] || banditDarkTheme;

    const { availableModels, selectedModel, setSelectedModel } = useModelStore();
    const SYSTEM_PROMPT = useModelStore((state) => state.systemPrompt);

    // Voice Store
    const { availableVoices, selectedVoice, setSelectedVoice } = useVoiceStore();
    
    // TTS functionality
    const { speak: ttsSpeak, stop: ttsStop, isAvailable: isTTSAvailable } = useTTS();

    // Other stores
    const { preferences } = usePreferencesStore();
    const { settings: packageSettings } = usePackageSettingsStore();
    const provider = useAIProviderStore((state) => state.provider);
    const notificationService = useNotificationService();

    // Get current model info
    const currentModel = availableModels.find(m => m.name === selectedModel);
    const currentAvatar = currentModel?.avatarBase64 || modelAvatars[selectedModel] || banditHead;

    const removeImage = (index: number) => {
      setPastedImages((prev) => prev.filter((_, i) => i !== index));
    };

    // Voice change handler - same as in chat.tsx
    const handleVoiceChange = async (newVoice: string) => {
      // Stop any current TTS playback FIRST
      ttsStop();
      
      // Force immediate voice change with cache clearing
      setSelectedVoice(newVoice);
      
      // Add a small delay to ensure voice store is updated
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const voiceName = newVoice.split("-")[1];
      const defaultModel = packageSettings?.defaultModel;

      // Get the friendly display name for the personality (use selectedModel which is the Bandit personality)
      const currentModelConfig = availableModels.find(m => m.name === selectedModel);
      const personalityName = currentModelConfig ? currentModelConfig.name.replace("Bandit-", "Bandit ") : (selectedModel || defaultModel || "Bandit");

      if (isTTSAvailable) {
        try {
          // Create the greeting directly - no AI generation needed
          const greetingText = `Hi, I'm ${personalityName} speaking with ${voiceName}'s voice.`;
          
          // Speak the greeting directly
          await ttsSpeak(greetingText, { useStreaming: true });
          
        } catch (ttsError) {
          debugLogger.error('TTS failed for voice greeting:', { error: ttsError instanceof Error ? ttsError.message : String(ttsError) });
        }
      }
    };

    // Helper function to capitalize voice names
    const toTitleCase = (str: string) => {
      return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    };

    useEffect(() => {
      if (!SYSTEM_PROMPT) {
        const defaultModel = availableModels.length > 0 ? availableModels[0] : null;
        if (defaultModel) {
          setSelectedModel(defaultModel.name);
        }
      }
    }, [SYSTEM_PROMPT, availableModels, setSelectedModel]);

    // Cleanup audio subscription on unmount
    useEffect(() => {
      return () => {
        audioSub.unsubscribe();
      };
    }, [audioSub]);

    useEffect(() => {
      if (open) {
        // Always center the modal when it opens and reset drag tracking
        setPosition({
          x: Math.max(0, window.innerWidth / 2 - 300),
          y: Math.max(0, window.innerHeight / 2 - 300),
        });
        // Reset tracking states when modal opens
        setAutoFullscreenTriggered(false);
        setUserHasDragged(false);
        setManualFullscreenToggleTime(0);
        // Load optimal logo when modal opens
        getOptimalLogo().then(setModalLogo);
      }
    }, [open, setPosition]);

    // Load theme from IndexedDB (only when modal is open to avoid conflicts)
    useEffect(() => {
      if (!open) return; // Only load when modal is actually open
      
      const fetchTheme = async () => {
        try {
          const config = await indexedDBService.get<{ branding?: { theme?: string } }>(
            'banditConfig',
            1,
            'config',
            'main',
            [{ name: 'config', keyPath: 'id' }]
          );

          if (config?.branding?.theme) {
            setSelectedTheme(config.branding.theme);
          } else {
            // No theme saved, use default
            setSelectedTheme("bandit-dark");
          }
        } catch (err) {
          debugLogger.error("Failed to load theme from IndexedDB:", { error: err });
          // Fallback to default on error
          setSelectedTheme("bandit-dark");
        } finally {
          setThemeLoading(false);
        }
      };

      fetchTheme();

      // Listen for custom theme change events only when modal is open
      const handleThemeChange = () => {
        if (open) { // Only handle theme changes when modal is open
          fetchTheme();
        }
      };

      window.addEventListener('bandit-theme-changed', handleThemeChange);

      return () => {
        window.removeEventListener('bandit-theme-changed', handleThemeChange);
      };
    }, [open]); // Depend on open state

    useLayoutEffect(() => {
      // Only auto-trigger fullscreen if:
      // 1. Modal has content (response exists)
      // 2. Not already in fullscreen
      // 3. Auto fullscreen hasn't been triggered yet (to prevent re-triggering)
      // 4. User hasn't manually toggled fullscreen recently (within 5 seconds)
      const timeSinceManualToggle = Date.now() - manualFullscreenToggleTime;
      const manualToggleRecentlyUsed = timeSinceManualToggle < 5000; // 5 seconds

      if (modalRef.current && response && !fullScreen && !autoFullscreenTriggered && !manualToggleRecentlyUsed) {
        // Get the modal's actual content height
        const modal = modalRef.current;

        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
          if (!modal) return;

          const modalHeight = modal.scrollHeight;
          const viewportHeight = window.innerHeight;
          const maxAllowedHeight = viewportHeight * 0.75; // 75% of viewport height (reduced from 80%)

          // Check if content is overflowing significantly
          if (modalHeight > maxAllowedHeight + FULL_SCREEN_THRESHOLD) {
            setFullScreen(true);
            setAutoFullscreenTriggered(true); // Mark that auto fullscreen was triggered
          }
        });
      }
    }, [
      response,
      fullScreen,
      autoFullscreenTriggered,
      manualFullscreenToggleTime,
      modalRef,
      setFullScreen,
      setAutoFullscreenTriggered,
    ]);

    useEffect(() => {
      const handlePaste = (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (items) {
          for (const item of items) {
            if (item.type.startsWith("image/")) {
              const file = item.getAsFile();
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  if (event.target?.result) {
                    setPastedImages((prev) => [...prev, event.target!.result as string]);
                  }
                };
                reader.readAsDataURL(file);
              }
            }
          }
        }
      };

      document.addEventListener("paste", handlePaste);
      return () => {
        document.removeEventListener("paste", handlePaste);
      };
    }, []);

    useEffect(() => {
      if (response && !responseStarted) {
        setResponseStarted(true);
      }
    }, [response, responseStarted]);

    const handleDrawerClose = () => setDrawerOpen(false);
    const handleClose = () => {
      // Reset fullscreen state when modal closes (unless on mobile)
      const isMobile = window.innerWidth < 600; // Simple mobile check
      if (!isMobile) {
        setFullScreen(false);
      }
      // Reset auto fullscreen tracking when modal closes
      setAutoFullscreenTriggered(false);
      // Reset theme loading state when modal closes
      setThemeLoading(true);
      onClose();
    };

    const onSend = (e: React.MouseEvent | React.KeyboardEvent, value: string) => {
      setResponseStarted(false);
      handleSend();
    };

    // Don't render until theme is loaded
    if (themeLoading) {
      return null;
    }

    return (
      <ThemeProvider theme={activeTheme}>
        <Modal open={open} onClose={handleClose}>
          <DraggableBox
            ref={modalRef}
            position={position}
            setPosition={setPosition}
            fullScreen={fullScreen}
            onDrag={handleCustomDrag}
          >
            <ModalHeader
              fullScreen={fullScreen}
              setFullScreen={setFullScreen}
              onClose={handleClose}
              onDrawerOpen={() => setDrawerOpen(true)}
              onMouseDown={handleHeaderMouseDown}
              logo={modalLogo}
              historyCount={history.length}
              onManualFullscreenToggle={() => {
                setAutoFullscreenTriggered(false);
                setManualFullscreenToggleTime(Date.now());
              }}
              onExitFullscreen={handleExitFullscreen}
            />

            {/* Scrollable content area */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden", // Let child handle scrolling
                minHeight: 0, // Important for flex scrolling
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  overflow: "auto", // Enable scrolling here
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  // Ensure proper height calculation for both fullscreen and windowed
                  height: fullScreen ? "auto" : "100%",
                  maxHeight: fullScreen ? "none" : "100%",
                  // Custom scrollbar styling
                  "&::-webkit-scrollbar": {
                    width: "8px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: activeTheme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                    borderRadius: "4px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: activeTheme.palette.mode === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
                    borderRadius: "4px",
                    "&:hover": {
                      background: activeTheme.palette.mode === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
                    },
                  },
                }}
              >
                <QueryInput
                  inputValue={inputValue}
                  onChange={setInputValue}
                  onSend={onSend}
                  apiKey={apiKey}
                  showSettings={showSettings}
                  setShowSettings={setShowSettings}
                  setApiKey={setApiKey}
                  startAdornment={
                    <InputAdornment position="start" sx={{ gap: 1 }}>
                      {/* Model selector with avatar */}
                      <Tooltip title={`Current AI: ${selectedModel.replace("Bandit-", "")}`} arrow>
                        <IconButton
                          onClick={(e) => setModelAnchorEl(e.currentTarget)}
                          sx={{
                            p: 0.5,
                            borderRadius: "8px",
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              backgroundColor: activeTheme.palette.action.hover,
                              transform: "scale(1.05)",
                            },
                          }}
                        >
                          <Avatar
                            src={currentAvatar}
                            alt={selectedModel}
                            sx={{
                              width: 32,
                              height: 32,
                              filter: "brightness(1.7)",
                              border: `2px solid ${activeTheme.palette.primary.main}30`,
                              transition: "all 0.2s ease-in-out",
                            }}
                          />
                        </IconButton>
                      </Tooltip>

                      {/* Enhanced Model selection menu */}
                      <Menu
                        anchorEl={modelAnchorEl}
                        open={Boolean(modelAnchorEl)}
                        onClose={() => setModelAnchorEl(null)}
                        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                        PaperProps={{
                          sx: {
                            bgcolor: activeTheme.palette.background.paper,
                            color: activeTheme.palette.text.primary,
                            fontSize: "0.875rem",
                            zIndex: 20000,
                            maxHeight: 300,
                            minWidth: 200,
                            border: `1px solid ${activeTheme.palette.divider}`,
                            borderRadius: "12px",
                            boxShadow: activeTheme.palette.mode === "dark"
                              ? "0 8px 32px rgba(0,0,0,0.5)"
                              : "0 8px 32px rgba(0,0,0,0.2)",
                            "& .MuiMenuItem-root": {
                              borderRadius: "8px",
                              margin: "4px 8px",
                              transition: "all 0.15s ease-in-out",
                              "&:hover": {
                                bgcolor: activeTheme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                                transform: "translateX(2px)",
                              },
                              "&.Mui-selected": {
                                bgcolor: activeTheme.palette.primary.main + "20",
                                color: activeTheme.palette.primary.main,
                                "&:hover": {
                                  bgcolor: activeTheme.palette.primary.main + "30",
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
                              setSelectedModel(model.name);
                              useModelStore.getState().setSelectedModel(model.name);
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
                              <Typography variant="caption" sx={{ color: activeTheme.palette.text.secondary }}>
                                {model.name === selectedModel ? "Currently active" : "Switch to this AI"}
                              </Typography>
                            </Box>
                            {model.name === selectedModel && (
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  bgcolor: activeTheme.palette.primary.main,
                                }}
                              />
                            )}
                          </MenuItem>
                        ))}
                      </Menu>

                      {/* Voice selector - only show if TTS is available */}
                      {isTTSAvailable && (
                        <>
                          <Tooltip title={`Voice: ${selectedVoice ? toTitleCase(selectedVoice.split("-")[1]) : "Default"}`} arrow>
                            <IconButton
                              onClick={(e) => setVoiceAnchorEl(e.currentTarget)}
                              sx={{
                                p: 0.5,
                                borderRadius: "8px",
                                bgcolor: activeTheme.palette.info.main + "20",
                                color: activeTheme.palette.info.main,
                                transition: "all 0.2s ease-in-out",
                                "&:hover": {
                                  backgroundColor: activeTheme.palette.info.main + "30",
                                  transform: "scale(1.05)",
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
                            transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                            PaperProps={{
                              sx: {
                                bgcolor: activeTheme.palette.background.paper,
                                color: activeTheme.palette.text.primary,
                                fontSize: "0.875rem",
                                zIndex: 20000,
                                borderRadius: 2,
                                border: `1px solid ${activeTheme.palette.divider}`,
                                boxShadow: activeTheme.palette.mode === "dark"
                                  ? "0 8px 32px rgba(0,0,0,0.5)"
                                  : "0 8px 32px rgba(0,0,0,0.2)",
                                "& .MuiMenuItem-root": {
                                  borderRadius: "8px",
                                  margin: "4px 8px",
                                  transition: "all 0.15s ease-in-out",
                                  "&:hover": {
                                    bgcolor: activeTheme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                                  },
                                  "&.Mui-selected": {
                                    bgcolor: activeTheme.palette.info.main + "20",
                                    color: activeTheme.palette.info.main,
                                    "&:hover": {
                                      bgcolor: activeTheme.palette.info.main + "30",
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
                                    <RecordVoiceOverIcon fontSize="small" sx={{ color: activeTheme.palette.text.secondary }} />
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="body2">
                                        {toTitleCase(voice.split("-")[1])}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: activeTheme.palette.text.secondary }}>
                                        {voice === selectedVoice ? "Currently active" : "Switch to this voice"}
                                      </Typography>
                                    </Box>
                                    {voice === selectedVoice && (
                                      <Box
                                        sx={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: "50%",
                                          bgcolor: activeTheme.palette.info.main,
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

                      {/* Enhanced Pasted images */}
                      {pastedImages.map((img, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            position: "relative",
                            transition: "all 0.15s ease-out",
                            "&:hover": {
                              // Removed transform to prevent jitter
                            },
                          }}
                        >
                          <Avatar
                            src={img}
                            variant="rounded"
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: "8px",
                              border: `2px solid ${activeTheme.palette.primary.main}30`,
                              cursor: "pointer",
                            }}
                          />
                          <Tooltip title="Remove image" arrow>
                            <IconButton
                              size="small"
                              onClick={() => removeImage(idx)}
                              sx={{
                                position: "absolute",
                                top: -8,
                                right: -8,
                                width: 20,
                                height: 20,
                                bgcolor: activeTheme.palette.error.main,
                                color: "white",
                                border: `2px solid ${activeTheme.palette.background.paper}`,
                                transition: "all 0.15s ease-out",
                                "&:hover": {
                                  bgcolor: activeTheme.palette.error.dark,
                                  // Removed transform to prevent jitter
                                },
                              }}
                            >
                              <CloseIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ))}
                    </InputAdornment>
                  }
                  endAdornment={
                    <InputAdornment position="end" sx={{ gap: 1 }}>
                      {preferences.feedbackEnabled && (
                        <FeedbackButton
                          inline={true}
                          size="small"
                          buttonText=""
                        />
                      )}
                      <Tooltip title={inputValue.trim() === "" ? "Type a message first" : "Send Message"} arrow>
                        <span>
                          <IconButton
                            onClick={handleSend}
                            disabled={inputValue.trim() === ""}
                            sx={{
                              color: inputValue.trim() !== ""
                                ? activeTheme.palette.primary.main
                                : activeTheme.palette.action.disabled,
                              transition: "all 0.15s ease-out",
                              borderRadius: "8px",
                              minWidth: "40px",
                              minHeight: "40px",
                              "&:hover": {
                                bgcolor: inputValue.trim() !== ""
                                  ? activeTheme.palette.primary.main + "15"
                                  : "transparent",
                                // Removed transform to prevent jitter
                              },
                              "&:active": {
                                bgcolor: inputValue.trim() !== ""
                                  ? activeTheme.palette.primary.main + "25"
                                  : "transparent",
                              },
                              "&:disabled": {
                                color: activeTheme.palette.action.disabled,
                              },
                            }}
                          >
                            <SendIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  }
                />

                {!responseStarted && componentStatus === "Loading" && <GenericLoader variant="dots" />}
                {responseStarted && response && !showSettings && (
                  <AIResponseTextField question={previousQuestion} response={response} />
                )}
              </Box>
            </Box>

            <AIQueriesDrawer
              drawerOpen={drawerOpen}
              onClose={handleDrawerClose}
              onClearComplete={handleClose}
              onNavigateToMain={navigate ? () => {
                onClose(); // Close the modal
                navigate('/chat'); // Navigate to main chat
              } : undefined}
            />
          </DraggableBox>
        </Modal>
      </ThemeProvider>
    );
  };

export default ChatModal;

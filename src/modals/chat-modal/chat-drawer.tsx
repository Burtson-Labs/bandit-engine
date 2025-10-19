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

// Bandit Engine Watermark: BL-WM-3832-E313DD
const __banditFingerprint_chatmodal_chatdrawertsx = 'BL-FP-144DC4-8A73';
const __auditTrail_chatmodal_chatdrawertsx = 'BL-AU-MGOIKVVM-PKOO';
// File: chat-drawer.tsx | Path: src/modals/chat-modal/chat-drawer.tsx | Hash: 38328a73

import React, { useState, useEffect, useMemo } from "react";
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  useMediaQuery,
  Theme,
  useTheme,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  TextField,
  InputAdornment,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import MemoryIcon from "@mui/icons-material/Memory";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useAIQueryStore } from "../../store/aiQueryStore";
import { useConversationStore, type Conversation } from "../../store/conversationStore";
import { useVoiceStore } from "../../store/voiceStore";
import { useMemoryStore } from "../../store/memoryStore";
import { usePreferencesStore } from "../../store/preferencesStore";
import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import { useAIProviderStore } from "../../store/aiProviderStore";
import { useModelStore } from "../../store/modelStore";
import AIResponseTextField from "./ai-response-text-field";
import MemoryModal from "../../chat/memory-modal";
import { speakStream } from "../../services/tts/streaming-tts";
import { Subscription } from "rxjs";
import { debugLogger } from "../../services/logging/debugLogger";
import { toTitleCase } from "../../util";

interface AIQueriesDrawerProps {
  drawerOpen: boolean;
  onClose: () => void;
  onClearComplete?: () => void; // Add callback for when clear is complete
  onNavigateToMain?: () => void; // Add callback for navigating to main chat
}

const AIQueriesDrawer: React.FC<AIQueriesDrawerProps> = ({ drawerOpen, onClose, onClearComplete, onNavigateToMain }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("sm")
  );

  // AI Query Store (local session history)
  const history = useAIQueryStore((state) => state.history);
  const clearHistory = useAIQueryStore((state) => state.clearHistory);
  const setResponse = useAIQueryStore((state) => state.setResponse);
  const setPreviousQuestion = useAIQueryStore((state) => state.setPreviousQuestion);
  const setInputValue = useAIQueryStore((state) => state.setInputValue);

  // Main Conversation Store
  const { conversations, currentId, switchConversation, _hasHydrated, hydrate } = useConversationStore();

  // Voice Store
  const { availableVoices, selectedVoice, setSelectedVoice, isServiceAvailable, refreshVoices } = useVoiceStore();

  // Memory Store
  const { entries: memoryEntries } = useMemoryStore();

  // Preferences and Settings
  const { preferences } = usePreferencesStore();
  const { settings: packageSettings } = usePackageSettingsStore();

  // AI Provider and Model stores for voice changing
  const provider = useAIProviderStore((state) => state.provider);
  const { selectedModel, availableModels } = useModelStore();

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set());
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [contextMode, setContextMode] = useState<"local" | "main">("local");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["history", "voice"]));
  const [audioSub, setAudioSub] = useState<Subscription>(new Subscription());
  const [isContextSwitching, setIsContextSwitching] = useState(false);
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);

  // Auto-hydrate conversations when drawer opens
  useEffect(() => {
    if (drawerOpen && !_hasHydrated) {
      hydrate();
    }
  }, [drawerOpen, _hasHydrated, hydrate]);

  // Cleanup on drawer close
  useEffect(() => {
    if (!drawerOpen) {
      setIsDrawerLoading(false);
      // Cleanup after close animation completes
      const cleanupTimer = setTimeout(() => {
        setSearchTerm("");
        setExpandedItems(new Set());
        setExpandedConversations(new Set());
      }, 225); // After close animation
      
      return () => clearTimeout(cleanupTimer);
    }
  }, [drawerOpen]);

  // Cleanup audio subscription on unmount
  useEffect(() => {
    return () => {
      audioSub.unsubscribe();
    };
  }, [audioSub]);

  // Helper functions
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleContextSwitch = async (newMode: "local" | "main") => {
    if (newMode === contextMode) return;

    setIsContextSwitching(true);

    try {
      // Use requestAnimationFrame to allow UI updates before heavy operations
      await new Promise(resolve => requestAnimationFrame(resolve));

      // If switching to main and store isn't hydrated, wait for hydration
      if (newMode === "main" && !_hasHydrated) {
        debugLogger.debug("Context switch triggering hydration", { newMode, hasHydrated: _hasHydrated });

        // Break up the hydration process
        await new Promise(resolve => {
          setTimeout(async () => {
            await hydrate();
            resolve(void 0);
          }, 50);
        });

        // Additional delay to ensure UI updates
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Use another frame to ensure smooth transition
      await new Promise(resolve => requestAnimationFrame(resolve));

      setContextMode(newMode);
      // Reset expanded states when switching context
      setExpandedItems(new Set());
      setExpandedConversations(new Set());

      debugLogger.debug("Context switch completed", { newMode, conversationCount: conversations.length });
    } catch (error) {
      debugLogger.error("Error during context switch", { error: String(error) });
    } finally {
      // Add minimum delay for better UX and ensure loading state shows
      setTimeout(() => setIsContextSwitching(false), 300);
    }
  };

  const isVoiceAvailable = isServiceAvailable && preferences.ttsEnabled && !!packageSettings?.gatewayApiUrl;
  const isMemoryAvailable = preferences.memoryEnabled;
  const currentConversation = conversations.find(c => c.id === currentId);

  // Loading states
  const isInitialLoading = !_hasHydrated && contextMode === "main";
  const isContentLoading = isContextSwitching || isInitialLoading;

  // Debug loading states - defer logging to avoid blocking drawer opening
  useEffect(() => {
    if (drawerOpen) {
      // Defer debug logging to avoid blocking drawer animation
      const debugTimer = setTimeout(() => {
        debugLogger.debug("Chat drawer loading states", {
          drawerOpen,
          _hasHydrated,
          isDrawerLoading,
          isContentLoading,
          contextMode,
          storeState: "modal-chat-drawer-loading"
        });
      }, 400); // After drawer animation and initial setup

      return () => clearTimeout(debugTimer);
    }
  }, [drawerOpen, _hasHydrated, isDrawerLoading, isContentLoading, contextMode]);

  // Debug voice availability
  useEffect(() => {
    debugLogger.debug("Chat drawer voice availability check", {
      isServiceAvailable,
      ttsEnabled: preferences.ttsEnabled,
      gatewayApiUrl: !!packageSettings?.gatewayApiUrl,
      isVoiceAvailable,
      availableVoicesCount: availableVoices.length,
      selectedVoice,
      storeState: "modal-chat-drawer-voice"
    });
  }, [isServiceAvailable, preferences.ttsEnabled, packageSettings?.gatewayApiUrl, isVoiceAvailable, availableVoices.length, selectedVoice]);

  // Get the appropriate history based on context mode
  const activeHistory = useMemo(() => {
    if (contextMode === "local") {
      return history;
    }

    return currentConversation?.history ?? [];
  }, [contextMode, history, currentConversation]);

  // When switching to main context, ensure we have a valid conversation
  const effectiveContextMode = contextMode === "main" && (!currentConversation || currentConversation.history.length === 0)
    ? "local"
    : contextMode;

  // Remove auto-selection - let user choose conversation manually
  // (Auto-selection removed to allow user control over conversation viewing)

  // Debug context switching
  useEffect(() => {
    debugLogger.debug("Chat drawer context state", {
      contextMode,
      effectiveContextMode,
      conversationCount: conversations.length,
      currentConversationId: currentId,
      currentConversationName: currentConversation?.name,
      currentConversationHistoryLength: currentConversation?.history.length || 0,
      localHistoryLength: history.length,
      hasHydrated: _hasHydrated,
      storeState: "modal-chat-drawer"
    });
  }, [contextMode, effectiveContextMode, conversations.length, currentId, currentConversation, history.length, _hasHydrated]);

  // Filter history based on search term and context mode with memoization
  const filteredHistory = useMemo(() => {
    const filtered = activeHistory.filter((entry) =>
      entry.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
    // Limit to last 20 items for performance
    return filtered.slice(-20);
  }, [activeHistory, searchTerm]);

  // Filter conversations based on search term (for main context) with memoization
  const filteredConversations = useMemo<Conversation[]>(() => {
    const filtered = conversations.filter((conversation) =>
      conversation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.history.some(entry =>
        entry.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.answer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    // Limit to first 20 items for performance
    return filtered.slice(0, 20);
  }, [conversations, searchTerm]);

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const toggleConversationExpanded = (conversationId: string) => {
    const newExpanded = new Set(expandedConversations);
    if (newExpanded.has(conversationId)) {
      newExpanded.delete(conversationId);
    } else {
      newExpanded.add(conversationId);
    }
    setExpandedConversations(newExpanded);
  };

  // Voice change handler - same as in chat.tsx
  const handleVoiceChange = (newVoice: string) => {
    debugLogger.debug("Chat drawer voice change initiated", {
      oldVoice: selectedVoice,
      newVoice,
      storeState: "modal-chat-drawer-voice-change"
    });

    // Use voice store setter to persist the change
    setSelectedVoice(newVoice);
    const voiceName = newVoice.split("-")[1];
    const defaultModel = packageSettings?.defaultModel;

    // Get the friendly display name for the personality (use selectedModel which is the Bandit personality)
    const currentModelConfig = availableModels.find(m => m.name === selectedModel);
    const personalityName = currentModelConfig ? currentModelConfig.name.replace("Bandit-", "Bandit ") : (selectedModel || defaultModel || "Bandit");

    // Only play greeting if TTS is available and enabled
    const isTTSAvailable = !!packageSettings?.gatewayApiUrl && preferences.ttsEnabled;

    if (isTTSAvailable) {
      debugLogger.debug("Playing voice greeting", { voiceName, personalityName });
      
      // Create the greeting directly - no AI generation needed
      const greetingText = `Hi, I'm ${personalityName} speaking with ${voiceName}'s voice.`;
      
      // Use speakStream directly
      const spoken = speakStream(greetingText, newVoice);
      audioSub.unsubscribe();
      setAudioSub(
        spoken.subscribe({
          next: () => debugLogger.debug("Voice greeting played successfully"),
          error: (err) => {
            debugLogger.error(`Error changing voices: ${err}`);
          }
        })
      );
    } else {
      debugLogger.debug("Voice greeting skipped", {
        hasProvider: !!provider,
        isTTSAvailable,
        hasDefaultModel: !!defaultModel
      });
    }
  };

  const handleClearHistory = () => {
    setConfirmClearOpen(true);
  };

  const handleConfirmClear = () => {
    // Clear all chat data
    clearHistory();
    setResponse("");
    setPreviousQuestion("");
    setInputValue("");

    // Reset local state
    setExpandedItems(new Set());
    setSearchTerm("");
    setConfirmClearOpen(false);

    // Close the drawer and notify parent (to close modal)
    onClose();
    if (onClearComplete) {
      onClearComplete();
    }
  };

  const handleCancelClear = () => {
    setConfirmClearOpen(false);
  };

  return (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={onClose}
      keepMounted={false} // Don't keep mounted when closed to improve performance
      disablePortal={false}
      sx={{
        zIndex: 1400,
        '& .MuiDrawer-paper': {
          width: isMobile ? "100vw" : "50vw",
          maxWidth: isMobile ? "100vw" : "600px",
          bgcolor: theme.palette.background.paper,
          borderLeft: `1px solid ${theme.palette.divider}`,
          backdropFilter: "blur(20px)",
          boxShadow: theme.palette.mode === "dark"
            ? "0 8px 32px rgba(0,0,0,0.5)"
            : "0 8px 32px rgba(0,0,0,0.2)",
          // Optimize animations
          transition: 'transform 225ms cubic-bezier(0, 0, 0.2, 1) 0ms',
        }
      }}
      transitionDuration={225} // Faster animation
      SlideProps={{
        timeout: 225, // Consistent timing
      }}
    >
      <Box
        sx={{
          height: "100%",
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
        role="presentation"
      >
        {/* Enhanced Header */}
        <Box
          sx={{
            p: 3,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Title and Context Toggle */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <HistoryIcon sx={{ color: theme.palette.primary.main }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
                Chat Control Center
              </Typography>
              <Tooltip title="About Chat History" arrow>
                <IconButton
                  onClick={() => setInfoDialogOpen(true)}
                  size="small"
                  sx={{
                    color: theme.palette.info.main,
                    "&:hover": {
                      bgcolor: theme.palette.info.main + "20",
                    },
                  }}
                >
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Refresh Conversations" arrow>
                <IconButton
                  onClick={() => {
                    debugLogger.info("Manual conversation refresh triggered", {
                      currentConversationCount: conversations.length,
                      hasHydrated: _hasHydrated,
                      currentId
                    });
                    hydrate();
                    // Also refresh voice store if needed
                    if (availableVoices.length === 0) {
                      refreshVoices();
                    }
                  }}
                  size="small"
                  sx={{
                    color: theme.palette.primary.main,
                    "&:hover": {
                      bgcolor: theme.palette.primary.main + "20",
                    },
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Tooltip title="Close" arrow>
              <IconButton
                onClick={onClose}
                size="small"
                sx={{
                  color: theme.palette.text.secondary,
                  "&:hover": {
                    bgcolor: theme.palette.action.hover,
                    color: theme.palette.text.primary,
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Context Switching */}
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: "flex",
                bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                borderRadius: "12px",
                p: 0.5,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Button
                onClick={() => handleContextSwitch("local")}
                variant={contextMode === "local" ? "contained" : "text"}
                disabled={isContextSwitching}
                sx={{
                  flex: 1,
                  textTransform: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  position: "relative",
                  ...(contextMode === "local" && {
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    "&:hover": {
                      bgcolor: theme.palette.primary.dark,
                    },
                  }),
                }}
              >
                {isContextSwitching && contextMode !== "local" ? (
                  <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    opacity: 0.7
                  }}>
                    <Box sx={{
                      width: 12,
                      height: 12,
                      border: '2px solid currentColor',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }} />
                    Loading...
                  </Box>
                ) : (
                  <>
                    Session Context
                    <Chip
                      label={history.length}
                      size="small"
                      sx={{
                        ml: 1,
                        height: "18px",
                        fontSize: "0.6rem",
                        bgcolor: contextMode === "local"
                          ? theme.palette.primary.contrastText + "20"
                          : theme.palette.primary.main + "20",
                        color: contextMode === "local"
                          ? theme.palette.primary.contrastText
                          : theme.palette.primary.main,
                      }}
                    />
                  </>
                )}
              </Button>
              <Tooltip title="Switch to conversation history" arrow>
                <Button
                  onClick={() => handleContextSwitch("main")}
                  variant={contextMode === "main" ? "contained" : "text"}
                  disabled={conversations.length === 0 || isContextSwitching}
                  sx={{
                    flex: 1,
                    textTransform: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    position: "relative",
                    ...(contextMode === "main" && {
                      bgcolor: theme.palette.secondary.main,
                      color: theme.palette.secondary.contrastText,
                      "&:hover": {
                        bgcolor: theme.palette.secondary.dark,
                      },
                    }),
                  }}
                >
                  {isContextSwitching && contextMode !== "main" ? (
                    <Box sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      opacity: 0.7
                    }}>
                      <Box sx={{
                        width: 12,
                        height: 12,
                        border: '2px solid currentColor',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' }
                        }
                      }} />
                      Loading...
                    </Box>
                  ) : (
                    <>
                      Main Conversation
                      <Chip
                        label={conversations.length}
                        size="small"
                        sx={{
                          ml: 1,
                          height: "18px",
                          fontSize: "0.6rem",
                          bgcolor: contextMode === "main"
                            ? theme.palette.secondary.contrastText + "20"
                            : theme.palette.secondary.main + "20",
                          color: contextMode === "main"
                            ? theme.palette.secondary.contrastText
                            : theme.palette.secondary.main,
                        }}
                      />
                    </>
                  )}
                </Button>
              </Tooltip>
            </Box>
          </Box>

          {/* Voice Controls Section */}
          {isVoiceAvailable ? (
            <Box sx={{ mb: 2 }}>
              <Box
                onClick={() => toggleSection("voice")}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  p: 1,
                  borderRadius: "8px",
                  "&:hover": {
                    bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <RecordVoiceOverIcon sx={{ color: theme.palette.success.main, fontSize: "1.2rem" }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
                    Voice Model
                  </Typography>
                  <Chip
                    label={selectedVoice ? toTitleCase(selectedVoice.split("-")[1]) : "Default"}
                    size="small"
                    sx={{
                      height: "18px",
                      fontSize: "0.6rem",
                      bgcolor: theme.palette.success.main + "20",
                      color: theme.palette.success.main,
                    }}
                  />
                  <Tooltip title="Refresh Voices" arrow>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        debugLogger.debug("Manual voice refresh triggered from chat drawer");
                        refreshVoices();
                      }}
                      size="small"
                      sx={{
                        color: theme.palette.text.secondary,
                        "&:hover": {
                          bgcolor: theme.palette.success.main + "20",
                          color: theme.palette.success.main,
                        },
                      }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                {expandedSections.has("voice") ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>

              <Collapse in={expandedSections.has("voice")}>
                <Box sx={{ pl: 2, pt: 1 }}>
                  {availableVoices.length > 0 ? (
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Voice Model"
                      value={selectedVoice}
                      onChange={(e) => {
                        const newVoice = e.target.value;
                        handleVoiceChange(newVoice);
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                        },
                      }}
                    >
                      {availableVoices.map((voice) => (
                        <MenuItem key={voice} value={voice}>
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
                                  bgcolor: theme.palette.success.main,
                                }}
                              />
                            )}
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <Box sx={{ textAlign: "center", py: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        No voices available
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                        Service: {isServiceAvailable ? "✓" : "✗"} | TTS: {preferences.ttsEnabled ? "✓" : "✗"} | Gateway: {!!packageSettings?.gatewayApiUrl ? "✓" : "✗"}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Box>
          ) : (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ p: 1, borderRadius: "8px", bgcolor: theme.palette.warning.main + "10" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <RecordVoiceOverIcon sx={{ color: theme.palette.warning.main, fontSize: "1.2rem" }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.warning.main }}>
                    Voice Not Available
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, pl: 4 }}>
                  Service: {isServiceAvailable ? "✓" : "✗"} | TTS: {preferences.ttsEnabled ? "✓" : "✗"} | Gateway: {!!packageSettings?.gatewayApiUrl ? "✓" : "✗"}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Memory Controls Section */}
          {isMemoryAvailable && (
            <Box sx={{ mb: 2 }}>
              <Box
                onClick={() => toggleSection("memory")}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  p: 1,
                  borderRadius: "8px",
                  "&:hover": {
                    bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MemoryIcon sx={{ color: theme.palette.warning.main, fontSize: "1.2rem" }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
                    Personal Memory
                  </Typography>
                  <Chip
                    label={memoryEntries.length}
                    size="small"
                    sx={{
                      height: "18px",
                      fontSize: "0.6rem",
                      bgcolor: theme.palette.warning.main + "20",
                      color: theme.palette.warning.main,
                    }}
                  />
                </Box>
                {expandedSections.has("memory") ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>

              <Collapse in={expandedSections.has("memory")}>
                <Box sx={{ pl: 2, pt: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setMemoryModalOpen(true)}
                    startIcon={<MemoryIcon />}
                    sx={{
                      textTransform: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                    }}
                  >
                    Manage Memories
                  </Button>
                </Box>
              </Collapse>
            </Box>
          )}

          {/* History Section Header */}
          <Box
            onClick={() => toggleSection("history")}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              p: 1,
              borderRadius: "8px",
              mb: 1,
              "&:hover": {
                bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <HistoryIcon sx={{ color: theme.palette.primary.main, fontSize: "1.2rem" }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
                {contextMode === "local" ? "Session History" : "Conversation History"}
              </Typography>
              <Chip
                label={activeHistory.length}
                size="small"
                sx={{
                  height: "18px",
                  fontSize: "0.6rem",
                  bgcolor: theme.palette.primary.main + "20",
                  color: theme.palette.primary.main,
                }}
              />
              {activeHistory.length > 0 && contextMode === "local" && (
                <Tooltip title="Clear Session History" arrow>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearHistory();
                    }}
                    size="small"
                    sx={{
                      color: theme.palette.error.main,
                      "&:hover": {
                        bgcolor: theme.palette.error.main + "20",
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            {expandedSections.has("history") ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>

          {/* Search Bar - only show when history section is expanded */}
          <Collapse in={expandedSections.has("history")}>
            <Box sx={{ mb: 1 }}>
              {activeHistory.length > 0 && (
                <TextField
                  fullWidth
                  size="small"
                  placeholder={`Search ${contextMode === "local" ? "session" : "conversation"} history...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: "12px",
                      bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: `1px solid ${theme.palette.divider}`,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.main + "60",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                  }}
                />
              )}
            </Box>
          </Collapse>
        </Box>

        {/* Content Area */}
        <Collapse in={expandedSections.has("history")}>
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 2,
              minHeight: "200px", // Reduced minimum height
              maxHeight: "400px", // Reduced max height for better performance
              position: "relative", // For loading overlay positioning
              // Custom scrollbar
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
                borderRadius: "4px",
                "&:hover": {
                  background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
                },
              },
              // Firefox scrollbar
              scrollbarWidth: "thin",
              scrollbarColor: theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.2) rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.2) rgba(0,0,0,0.1)",
            }}
          >
            {/* Loading Overlay */}
            {isContentLoading && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: theme.palette.mode === "dark"
                    ? "rgba(0, 0, 0, 0.7)"
                    : "rgba(255, 255, 255, 0.8)",
                  backdropFilter: "blur(4px)",
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                }}
              >
                <Box sx={{
                  width: 40,
                  height: 40,
                  border: '3px solid currentColor',
                  borderTop: '3px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  color: theme.palette.primary.main,
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 500,
                  }}
                >
                  {isInitialLoading ? "Loading conversations..." : "Switching context..."}
                </Typography>
              </Box>
            )}

            {/* Content - only render when not loading to prevent layout thrashing */}
            {!isContentLoading && (
              contextMode === "main" ? (
                // Show conversation list when in main context
                filteredConversations.length === 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "200px",
                      textAlign: "center",
                      color: theme.palette.text.secondary,
                    }}
                  >
                    <HistoryIcon sx={{ fontSize: "3rem", mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 500, color: "text.primary" }}>
                      {searchTerm ? "No Matching Conversations" : "No Conversations Yet"}
                    </Typography>
                    <Typography variant="body2">
                      {searchTerm
                        ? "Try adjusting your search terms"
                        : "Create your first conversation to get started"
                      }
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {filteredConversations.map((conversation, index: number) => {
                      const isCurrent = conversation.id === currentId;
                      const isExpanded = expandedConversations.has(conversation.id);
                      const conversationHistory = conversation.history || [];

                      return (
                        <ListItem
                          key={conversation.id}
                          sx={{
                            display: "block",
                            p: 0,
                            mb: 1,
                          }}
                        >
                          <Box
                            sx={{
                              bgcolor: isCurrent
                                ? theme.palette.primary.main + "20"
                                : theme.palette.background.default,
                              borderRadius: "8px",
                              border: `1px solid ${isCurrent
                                ? theme.palette.primary.main + "40"
                                : theme.palette.divider}`,
                              overflow: "hidden",
                              transition: "all 0.2s ease-in-out",
                            }}
                          >
                            {/* Conversation Header */}
                            <Box
                              onClick={() => {
                                toggleConversationExpanded(conversation.id);
                                // Also switch to this conversation as the current one
                                switchConversation(conversation.id);
                              }}
                              sx={{
                                p: 2,
                                cursor: "pointer",
                                "&:hover": {
                                  bgcolor: isCurrent
                                    ? theme.palette.primary.main + "30"
                                    : theme.palette.primary.main + "10",
                                },
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontWeight: 600,
                                    color: isCurrent
                                      ? theme.palette.primary.main
                                      : theme.palette.text.primary,
                                    flex: 1,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {conversation.name}
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  {isCurrent && (
                                    <Chip
                                      label="Current"
                                      size="small"
                                      sx={{
                                        height: "18px",
                                        fontSize: "0.6rem",
                                        bgcolor: theme.palette.primary.main,
                                        color: theme.palette.primary.contrastText,
                                      }}
                                    />
                                  )}
                                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </Box>
                              </Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: theme.palette.text.secondary,
                                  }}
                                >
                                  {conversationHistory.length} messages
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: theme.palette.text.secondary,
                                  }}
                                >
                                  • Model: {conversation.model}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Expanded Conversation Messages */}
                            <Collapse in={isExpanded}>
                              {conversationHistory.length > 0 ? (
                                <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                                  {conversationHistory
                                    .filter((entry) =>
                                      !searchTerm ||
                                      entry.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      entry.answer.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .slice()
                                    .reverse()
                                    .map((entry, messageIndex: number) => {
                                      const isMessageExpanded = expandedItems.has(messageIndex);
                                      return (
                                        <Box key={messageIndex} sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                                          <Box
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleExpanded(messageIndex);
                                            }}
                                            sx={{
                                              p: 2,
                                              cursor: "pointer",
                                              "&:hover": {
                                                bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                                              },
                                            }}
                                          >
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                fontWeight: 500,
                                                color: theme.palette.text.primary,
                                                mb: 1,
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                              }}
                                            >
                                              {entry.question}
                                            </Typography>
                                            <Typography
                                              variant="caption"
                                              sx={{
                                                color: theme.palette.text.secondary,
                                                display: "-webkit-box",
                                                WebkitLineClamp: 1,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                              }}
                                            >
                                              {entry.answer}
                                            </Typography>
                                          </Box>

                                          {/* Expanded Message Content */}
                                          <Collapse in={isMessageExpanded}>
                                            <Box sx={{ p: 2, pt: 0, bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                                              <AIResponseTextField
                                                question={entry.question}
                                                response={entry.answer}
                                              />
                                            </Box>
                                          </Collapse>
                                        </Box>
                                      );
                                    })}
                                </Box>
                              ) : (
                                <Box sx={{ p: 2, textAlign: "center", color: theme.palette.text.secondary, borderTop: `1px solid ${theme.palette.divider}` }}>
                                  <Typography variant="body2">
                                    No messages in this conversation yet
                                  </Typography>
                                </Box>
                              )}
                            </Collapse>
                          </Box>
                        </ListItem>
                      );
                    })}
                  </List>
                )
              ) : (
                // Show message history when in local context
                activeHistory.length === 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "200px",
                      textAlign: "center",
                      color: theme.palette.text.secondary,
                    }}
                  >
                    <HistoryIcon sx={{ fontSize: "3rem", mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 500, color: "text.primary" }}>
                      No Session History Yet
                    </Typography>
                    <Typography variant="body2">
                      Start a conversation to see your session history here
                    </Typography>
                  </Box>
                ) : filteredHistory.length === 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "200px",
                      textAlign: "center",
                      color: theme.palette.text.secondary,
                    }}
                  >
                    <SearchIcon sx={{ fontSize: "3rem", mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 500, color: "text.primary" }}>
                      No Results Found
                    </Typography>
                    <Typography variant="body2">
                      Try adjusting your search terms
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {[...filteredHistory].reverse().map((entry, index) => {
                      const isExpanded = expandedItems.has(index);
                      return (
                        <React.Fragment key={index}>
                          <ListItem
                            sx={{
                              display: "block",
                              p: 0,
                              mb: 2,
                            }}
                          >
                            <Box
                              onClick={() => toggleExpanded(index)}
                              sx={{
                                bgcolor: theme.palette.background.default,
                                borderRadius: "12px",
                                border: `1px solid ${theme.palette.divider}`,
                                overflow: "hidden",
                                cursor: "pointer",
                                transition: "all 0.2s ease-in-out",
                                "&:hover": {
                                  borderColor: theme.palette.primary.main + "60",
                                  boxShadow: `0 4px 12px ${theme.palette.mode === "dark" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"}`,
                                  transform: "translateY(-1px)",
                                },
                              }}
                            >
                              {/* Preview Header */}
                              <Box sx={{ p: 2 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    color: theme.palette.text.primary,
                                    mb: 1,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  {entry.question}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: theme.palette.text.secondary,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  {entry.answer}
                                </Typography>
                              </Box>

                              {/* Expanded Content */}
                              <Collapse in={isExpanded}>
                                <Divider />
                                <Box sx={{ p: 2 }}>
                                  <AIResponseTextField
                                    question={entry.question}
                                    response={entry.answer}
                                  />
                                </Box>
                              </Collapse>
                            </Box>
                          </ListItem>
                        </React.Fragment>
                      );
                    })}
                  </List>
                )
              )
            )}
          </Box>
        </Collapse>
      </Box>

      {/* Custom Confirmation Modal */}
      <Dialog
        open={confirmClearOpen}
        onClose={handleCancelClear}
        maxWidth="sm"
        fullWidth
        sx={{
          zIndex: 1500, // Higher than drawer (1400)
        }}
        PaperProps={{
          sx: {
            borderRadius: "16px",
            bgcolor: theme.palette.mode === "dark" ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
            boxShadow: `0 24px 48px ${theme.palette.mode === "dark" ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.15)"}`,
          }
        }}
        BackdropProps={{
          sx: {
            bgcolor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(8px)",
          }
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            fontSize: "1.5rem",
            fontWeight: 600,
            color: theme.palette.error.main,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <DeleteIcon sx={{ fontSize: "1.75rem" }} />
          Clear Chat History
        </DialogTitle>

        <DialogContent sx={{ pb: 2 }}>
          <DialogContentText
            sx={{
              fontSize: "1rem",
              color: theme.palette.text.primary,
              mb: 2,
            }}
          >
            Are you sure you want to clear all chat history?
          </DialogContentText>
          <DialogContentText
            sx={{
              fontSize: "0.9rem",
              color: theme.palette.text.secondary,
              fontStyle: "italic",
            }}
          >
            This action cannot be undone. All your conversation history will be permanently deleted.
          </DialogContentText>
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            pt: 1,
            gap: 1,
          }}
        >
          <Button
            onClick={handleCancelClear}
            variant="outlined"
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
              minWidth: "100px",
              border: `2px solid ${theme.palette.text.secondary}`,
              color: theme.palette.text.primary,
              "&:hover": {
                border: `2px solid ${theme.palette.text.primary}`,
                bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmClear}
            variant="contained"
            color="error"
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
              minWidth: "100px",
              bgcolor: theme.palette.error.main,
              "&:hover": {
                bgcolor: theme.palette.error.dark,
                transform: "translateY(-1px)",
                boxShadow: `0 6px 20px ${theme.palette.error.main}40`,
              },
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            Clear All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Info Dialog */}
      <Dialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          zIndex: 1500, // Higher than drawer (1400)
        }}
        PaperProps={{
          sx: {
            borderRadius: "16px",
            bgcolor: theme.palette.mode === "dark" ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
            boxShadow: `0 24px 48px ${theme.palette.mode === "dark" ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.15)"}`,
          }
        }}
        BackdropProps={{
          sx: {
            bgcolor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(8px)",
          }
        }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            fontSize: "1.5rem",
            fontWeight: 600,
            color: theme.palette.info.main,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: "1.75rem" }} />
          About Chat Control Center
        </DialogTitle>

        <DialogContent sx={{ pb: 2 }}>
          <DialogContentText
            sx={{
              fontSize: "1rem",
              color: theme.palette.text.primary,
              mb: 2,
              lineHeight: 1.6,
            }}
          >
            This control center gives you full access to your chat experience and AI capabilities.
          </DialogContentText>

          <DialogContentText
            sx={{
              fontSize: "0.95rem",
              color: theme.palette.text.secondary,
              mb: 2,
              lineHeight: 1.6,
            }}
          >
            <strong>Context Modes:</strong><br />
            • <strong>Session Context</strong>: Local conversation for this modal session only<br />
            • <strong>Main Conversation</strong>: Your persistent account conversations<br />
            • Switch between them to access different conversation histories<br /><br />

            <strong>Additional Features:</strong><br />
            • <strong>Voice Models</strong>: Change AI voice when TTS is enabled<br />
            • <strong>Personal Memory</strong>: Manage what the AI remembers about you<br />
            • <strong>Search & Organization</strong>: Find specific conversations quickly
          </DialogContentText>

          <DialogContentText
            sx={{
              fontSize: "0.9rem",
              color: theme.palette.info.main,
              fontStyle: "italic",
              bgcolor: theme.palette.mode === "dark" ? "rgba(33, 150, 243, 0.1)" : "rgba(33, 150, 243, 0.05)",
              p: 2,
              borderRadius: "8px",
              border: `1px solid ${theme.palette.info.main}30`,
            }}
          >
            💡 <strong>Pro Tip:</strong> Use Session Context for quick experiments and Main Conversation
            for important discussions you want to keep. All features respect your privacy settings!
          </DialogContentText>
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            pt: 1,
          }}
        >
          <Button
            onClick={() => setInfoDialogOpen(false)}
            variant="contained"
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
              minWidth: "100px",
              bgcolor: theme.palette.info.main,
              "&:hover": {
                bgcolor: theme.palette.info.dark,
                transform: "translateY(-1px)",
                boxShadow: `0 6px 20px ${theme.palette.info.main}40`,
              },
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            Got it!
          </Button>
        </DialogActions>
      </Dialog>

      {/* Memory Modal */}
      <MemoryModal
        open={memoryModalOpen}
        onClose={() => setMemoryModalOpen(false)}
      />
    </Drawer>
  );
};

export default AIQueriesDrawer;

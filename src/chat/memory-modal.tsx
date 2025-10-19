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

// Bandit Engine Watermark: BL-WM-E2F1-C79818
const __banditFingerprint_chat_memorymodaltsx = 'BL-FP-F532AD-BDE7';
const __auditTrail_chat_memorymodaltsx = 'BL-AU-MGOIKVV3-DWCK';
// File: memory-modal.tsx | Path: src/chat/memory-modal.tsx | Hash: e2f1bde7

import React, { useState, useEffect } from "react";
import { useTheme, alpha, keyframes } from "@mui/material/styles";
import {
  Box,
  Typography,
  Modal,
  SwipeableDrawer,
  IconButton,
  TextField,
  Button,
  List,
  ListItem,
  Divider,
  Tabs,
  Tab,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import CloudSyncIcon from "@mui/icons-material/CloudSync";
import { useMemoryStore } from "../store/memoryStore";
import { useVectorStore } from "../hooks/useVectorStore";
import { useConversationSyncStore } from "../store/conversationSyncStore";
import { debugLogger } from "../services/logging/debugLogger";

interface MemoryModalProps {
  open: boolean;
  onClose: () => void;
}

type VectorMemory = {
  id: string;
  content: string;
  source?: "user" | "auto" | string;
  pinned?: boolean;
  uploadedAt?: string | number | Date;
  tags?: string[];
  [key: string]: unknown;
};

type ImportResultDetails = {
  totalMemories: number;
  successCount: number;
  failureCount: number;
  duration?: string;
  warnings?: string[];
};

type ImportResult = {
  success: boolean;
  message?: string;
  details?: ImportResultDetails;
};

type ImportProgress = {
  isImporting: boolean;
  progress: string;
  result?: ImportResult;
};

/**
 * Bandit Memory Modal
 *
 * - Displays user and auto memories.
 * - Supports editing, pinning, deleting, and adding new memories.
 * - Memory-aware layout adapts to mobile virtual keyboards.
 * - Shows pinned memory token budget in real-time.
 */
const MemoryModal: React.FC<MemoryModalProps> = ({ open, onClose }) => {
  const { entries, addMemory, togglePinMemory, removeMemory, clearMemories, hydrate, _hasHydrated } = useMemoryStore();
  const isAdvancedVectorFeaturesEnabled = useConversationSyncStore(
    (state) => state.isAdvancedVectorFeaturesEnabled
  );
  const { 
    isVectorEnabled, 
    addMemory: addVectorMemory, 
    batchCreateMemories,
    batchCreateMemoriesAdvanced,
    batchImportMemories,
    getUserMemories: getVectorMemories,
    deleteMemory: deleteVectorMemory,
    updateMemory: updateVectorMemory
  } = useVectorStore();
  
  // Check if vector should be used for memories
  const shouldUseVectorForMemories = isVectorEnabled && isAdvancedVectorFeaturesEnabled;
  
  // Debug preferences on modal open
  useEffect(() => {
    if (open) {
      debugLogger.memoryDebug("Memory modal opened", {
        isVectorEnabled,
        isAdvancedVectorFeaturesEnabled,
        shouldUseVectorForMemories,
      });
    }
  }, [open, isVectorEnabled, isAdvancedVectorFeaturesEnabled, shouldUseVectorForMemories]);
  
  const [newMemory, setNewMemory] = useState("");
  const [selectedTab, setSelectedTab] = useState<"auto" | "user">("user"); // Always default to user
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [clearOption, setClearOption] = useState<"user" | "auto" | "both">("both");
  const [vectorMemories, setVectorMemories] = useState<VectorMemory[]>([]);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    isImporting: false,
    progress: "",
  });

  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down("sm"));
  
  // Define pulse animation
  const pulse = keyframes`
    0% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.1);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  `;

  // Define shimmer animation
  const shimmer = keyframes`
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  `;

  const {
    shell,
    input,
    fileText,
    appBar,
    badge,
    badgeHover,
  } = theme.palette.chat;

  const handleAdd = async () => {
    if (newMemory.trim()) {
      if (shouldUseVectorForMemories) {
        try {
          await addVectorMemory(newMemory.trim());
          // Refresh vector memories list
          const memories = await getVectorMemories();
          setVectorMemories((memories ?? []) as VectorMemory[]);
        } catch (error) {
          debugLogger.error("Failed to add vector memory", { error });
          // Fallback to local store
          await addMemory(newMemory.trim(), [], "user");
        }
      } else {
        await addMemory(newMemory.trim(), [], "user");
      }
      setNewMemory("");
    }
  };

  // Load vector memories when modal opens and vector is enabled
  useEffect(() => {
    if (open && shouldUseVectorForMemories) {
      const loadVectorMemories = async () => {
        try {
          const memories = await getVectorMemories();
          debugLogger.memoryDebug("Vector memories loaded", {
            count: memories?.length || 0,
            isArray: Array.isArray(memories),
          });
          setVectorMemories((memories ?? []) as VectorMemory[]);
        } catch (error) {
          debugLogger.error("Failed to load vector memories", { error });
          setVectorMemories([]);
        }
      };
      loadVectorMemories();
    }
  }, [open, shouldUseVectorForMemories, getVectorMemories]);

  // Load local memories when modal opens and vector is disabled
  useEffect(() => {
    if (open && !shouldUseVectorForMemories) {
      const loadLocalMemories = async () => {
        try {
          await hydrate();
        } catch (error) {
          debugLogger.error("Failed to load local memories", { error });
        }
      };
      loadLocalMemories();
    }
  }, [open, shouldUseVectorForMemories, hydrate]);

  // Also hydrate on initial mount to ensure memories are always loaded
  useEffect(() => {
    if (!shouldUseVectorForMemories && !_hasHydrated) {
      const initialHydrate = async () => {
        try {
          await hydrate();
        } catch (error) {
          debugLogger.error("Failed to perform initial hydration", { error });
        }
      };
      initialHydrate();
    }
  }, [shouldUseVectorForMemories, _hasHydrated, hydrate]);

  const handleMultiDelete = async () => {
    if (selectedIds.length === 0) return;
    
    // Use the working single delete function in a loop
    let successCount = 0;
    let errorCount = 0;
    
    for (const id of selectedIds) {
      try {
        await handleDeleteMemory(id);
        successCount++;
        
        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        debugLogger.error("Failed to delete memory during bulk delete", { id, error });
        errorCount++;
      }
    }
    
    setSelectedIds([]);
    setMultiSelectMode(false);
    setConfirmOpen(false);
  };

  const handleMultiPin = async (pinned: boolean) => {
    debugLogger.memoryDebug("Multi-pin requested", {
      count: selectedIds.length,
      pinned,
    });

    if (selectedIds.length === 0) {
      debugLogger.warn("No memories selected for pinning");
      return;
    }
    
    if (shouldUseVectorForMemories) {
      // For vector memories, loop through each ID and update pin status
      let successCount = 0;
      let errorCount = 0;
      
      for (const id of selectedIds) {
        try {
          const result = await updateVectorMemory(id, { pinned });
          if (result && result.success) {
            successCount++;
          } else {
            debugLogger.error("Failed to update vector memory pin status", {
              id,
              error: result?.error || "Unknown error",
            });
            errorCount++;
          }
        } catch (error) {
          debugLogger.error("Exception updating vector memory pin status", { id, error });
          errorCount++;
        }
      }
      
      debugLogger.memoryDebug("Vector pin update summary", {
        successCount,
        errorCount,
      });
      
      // Refresh vector memories list
      try {
        const memories = await getVectorMemories();
        setVectorMemories((memories ?? []) as VectorMemory[]);
      } catch (error) {
        debugLogger.error("Failed to refresh vector memories after pin update", { error });
      }
    } else {
      // Local store pin toggle
      try {
        let successCount = 0;
        
        for (const id of selectedIds) {
          const currentEntries = useMemoryStore.getState().entries;
          const memory = currentEntries.find(entry => entry.id === id);
          
          if (memory) {
            if (memory.pinned !== pinned) {
              togglePinMemory(id);
              successCount++;
            } else {
              debugLogger.memoryDebug("Memory already at desired pin status", { id, pinned });
            }
          } else {
            debugLogger.warn("Memory not found in local store during pin update", { id });
          }
        }
        
        debugLogger.memoryDebug("Local pin update summary", { successCount });
      } catch (error) {
        debugLogger.error("Failed to update local pin status", { error });
      }
    }
    
    setSelectedIds([]);
    setMultiSelectMode(false);
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (shouldUseVectorForMemories) {
      try {
        const result = await deleteVectorMemory(memoryId);
        
        if (result && result.success) {
          // Refresh vector memories list
          const memories = await getVectorMemories();
          setVectorMemories((memories ?? []) as VectorMemory[]);
        } else {
          throw new Error(result?.error || 'Delete operation failed');
        }
      } catch (error) {
        debugLogger.error("Failed to delete vector memory", { error });
        // Don't fallback to local store for vector memories, just throw the error
        throw error;
      }
    } else {
      removeMemory(memoryId);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkImport = async () => {
    if (!batchCreateMemoriesAdvanced) {
      debugLogger.error("Advanced batch import not available");
      return;
    }

    setImportProgress({ isImporting: true, progress: 'Preparing import...' });
    
    try {
      // Get all memories from IndexedDB
      await hydrate();
      const indexedDBMemories = entries;

      if (indexedDBMemories.length === 0) {
        setImportProgress({ 
          isImporting: false, 
          progress: 'No memories found to import',
          result: { success: false, message: 'No memories found in local storage' }
        });
        return;
      }

      // Convert IndexedDB format to vector format
      const memoriesToImport = indexedDBMemories.map(entry => ({
        content: entry.content,
        title: `Imported Memory - ${new Date(entry.timestamp).toLocaleDateString()}`,
        tags: entry.tags || []
      }));

      // Use advanced batch import with progress reporting
      const result = await batchCreateMemoriesAdvanced(memoriesToImport, {
        mode: 'append',
        clearExisting: false,
        chunkSize: 25, // Smaller chunks for better progress reporting
        validateContent: true,
        onProgress: (current: number, total: number, message: string) => {
          setImportProgress({ 
            isImporting: true, 
            progress: `${message} (${current}/${total})`
          });
        }
      });
      
      setImportProgress({ 
        isImporting: false, 
        progress: 'Import completed!',
        result: {
          success: result.success,
          message: result.message,
          details: {
            totalMemories: result.totalMemories,
            successCount: result.successCount,
            failureCount: result.failureCount,
            warnings: result.warnings,
            duration: `${(result.duration / 1000).toFixed(1)}s`
          }
        }
      });

      if (result.success) {
        // Refresh vector memories list
        const memories = await getVectorMemories();
        setVectorMemories((memories ?? []) as VectorMemory[]);
        
        // Auto-close dialog after success
        setTimeout(() => {
          setBulkImportOpen(false);
          setImportProgress({ isImporting: false, progress: '' });
        }, 3000);
      }
    } catch (error) {
      debugLogger.error("Bulk import failed", { error });
      setImportProgress({ 
        isImporting: false, 
        progress: `Import failed: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  };

  const getMemoriesForDisplay = () => {
    if (shouldUseVectorForMemories) {
      // Transform vector memories to match local memory structure, preserving the source field from API
      const transformedMemories = vectorMemories.map(vectorMemory => ({
        ...vectorMemory,
        // Preserve the source field from API response, but default to 'auto' for backwards compatibility
        // Most vector memories are automatically created by the system
        source: vectorMemory.source || "auto", // Default to 'auto' since most vector memories are system-generated
        pinned: vectorMemory.pinned || false, // Use API pinned or default to false
        timestamp: vectorMemory.uploadedAt ? new Date(vectorMemory.uploadedAt).getTime() : Date.now(),
        tags: vectorMemory.tags || []
      }));
      
      // Filter by selected tab (user or auto)
      const result = transformedMemories.filter(memory => memory.source === selectedTab);
      debugLogger.memoryDebug("Vector memories filtered for display", {
        selectedTab,
        vectorMemoriesCount: vectorMemories.length,
        resultCount: result.length,
      });
      return result;
    } else {
      // Local store memories
      const result = entries.filter((entry) => entry.source === selectedTab);
      return result;
    }
  };

  const getUserMemoryCount = () => {
    if (shouldUseVectorForMemories) {
      return vectorMemories.filter(memory => (memory.source || "auto") === "user").length;
    } else {
      return entries.filter(e => e.source === "user").length;
    }
  };

  const getAutoMemoryCount = () => {
    if (shouldUseVectorForMemories) {
      return vectorMemories.filter(memory => (memory.source || "auto") === "auto").length;
    } else {
      return entries.filter(e => e.source === "auto").length;
    }
  };

  const handleClearAll = async () => {
    if (shouldUseVectorForMemories) {
      // For vector memories, we need to clear based on the selected option
      try {
        let memoriesToDelete = [];
        
        if (clearOption === "user") {
          memoriesToDelete = vectorMemories.filter(memory => (memory.source || "auto") === "user");
        } else if (clearOption === "auto") {
          memoriesToDelete = vectorMemories.filter(memory => (memory.source || "auto") === "auto");
        } else { // both
          memoriesToDelete = vectorMemories;
        }
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const memory of memoriesToDelete) {
          try {
            const result = await deleteVectorMemory(memory.id);
            
            if (result && result.success) {
              successCount++;
            } else {
              errorCount++;
              debugLogger.error("Vector memory deletion failed", {
                id: memory.id,
                error: result?.error || "No result returned",
              });
            }
          } catch (error) {
            errorCount++;
            debugLogger.error("Exception deleting vector memory", { id: memory.id, error });
          }
          
          // Add a small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Refresh vector memories list
        const memories = await getVectorMemories();
        setVectorMemories((memories ?? []) as VectorMemory[]);
      } catch (error) {
        debugLogger.error("Exception during vector clear-all operation", { error });
      }
    } else {
      // Local store clearing
      try {
        if (clearOption === "both") {
          await clearMemories();
        } else {
          // Clear specific type
          const entriesToKeep = entries.filter(entry => entry.source !== clearOption);
          useMemoryStore.setState({ entries: entriesToKeep });
        }
      } catch (error) {
        debugLogger.error("Failed to clear local memories", { error });
      }
    }
    setClearAllOpen(false);
  };

  const filteredMemories = getMemoriesForDisplay();

  const sheet = (
      <Box
        sx={{
          width: "100%",
          maxWidth: isMobileView ? "100%" : 800,
          maxHeight: isMobileView ? "min(720px, 82vh)" : "90vh",
          height: isMobileView ? "100%" : "auto",
          bgcolor: isMobileView ? theme.palette.background.paper : shell,
          color: theme.palette.text.primary,
          display: "flex",
          flexDirection: "column",
          borderRadius: isMobileView ? "22px 22px 0 0" : 3,
          overflow: "hidden",
          boxShadow: isMobileView ? "none" : `0 20px 60px ${alpha(theme.palette.common.black, 0.3)}`,
          border: isMobileView ? "none" : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          zIndex: 2000, // Ensure it's on top
        }}
      >
        {isMobileView && (
          <Box
            sx={{
              height: 6,
              width: 56,
              borderRadius: 999,
              bgcolor: alpha(theme.palette.text.primary, 0.18),
              alignSelf: "center",
              mt: 1.25,
              mb: 0.75,
            }}
          />
        )}

        {/* Header */}
        <Box
          sx={{
            flexShrink: 0,
            px: isMobileView ? 1.5 : 2,
            py: isMobileView ? 1.25 : 2,
            borderBottom: `1px solid ${appBar.border}`,
            display: "flex",
            flexDirection: "column",
            gap: isMobileView ? 0.9 : 1.25,
          }}
        >
          <Box
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: isMobileView ? 0.75 : 1.25,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Memory
              </Typography>
              {shouldUseVectorForMemories && (
                <Tooltip title="Memories are stored in an AI vector database with semantic search capabilities">
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      cursor: "help",
                    }}
                  >
                    Vector
                  </Typography>
                </Tooltip>
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: isMobileView ? 0.5 : 1,
                flexWrap: "wrap",
              }}
            >
              {multiSelectMode ? (
                <>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mr: 0.5 }}>
                    {selectedIds.length} selected
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setMultiSelectMode(false);
                      setSelectedIds([]);
                    }}
                    sx={{ textTransform: "none", borderRadius: 2, fontSize: "0.75rem" }}
                  >
                    Cancel
                  </Button>
                  {selectedIds.length > 0 && (
                    <>
                      <Button
                        variant="outlined"
                        size="small"
                        color="secondary"
                        onClick={() => handleMultiPin(true)}
                        sx={{ textTransform: "none", borderRadius: 2, fontSize: "0.75rem" }}
                      >
                        Pin ({selectedIds.length})
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleMultiPin(false)}
                        sx={{ textTransform: "none", borderRadius: 2, fontSize: "0.75rem" }}
                      >
                        Unpin ({selectedIds.length})
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        color="error"
                        onClick={() => setConfirmOpen(true)}
                        sx={{ textTransform: "none", borderRadius: 2, fontSize: "0.75rem" }}
                      >
                        Delete ({selectedIds.length})
                      </Button>
                    </>
                  )}
                </>
              ) : (
                filteredMemories.length > 0 && (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setClearAllOpen(true)}
                      sx={{ textTransform: "none", borderRadius: 2, fontSize: "0.75rem" }}
                    >
                      Clear All
                    </Button>
                    {isVectorEnabled && entries.length > 0 && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="primary"
                        onClick={() => setBulkImportOpen(true)}
                        startIcon={<CloudSyncIcon />}
                        sx={{ textTransform: "none", borderRadius: 2, fontSize: "0.75rem" }}
                      >
                        Import to Vector
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => {
                        setMultiSelectMode(true);
                        setSelectedIds([]);
                      }}
                      sx={{ textTransform: "none", borderRadius: 2, fontSize: "0.75rem" }}
                    >
                      Select
                    </Button>
                  </>
                )
              )}

              {!multiSelectMode && isMobileView && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAdd}
                  disabled={!newMemory.trim()}
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    fontWeight: 600,
                    minWidth: 88,
                  }}
                >
                  Save
                </Button>
              )}

              <IconButton
                onClick={onClose}
                sx={{
                  color: appBar.icon,
                  '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.08) },
                  borderRadius: 2,
                }}
                size="small"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 0.5,
              color: theme.palette.text.secondary,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                borderRadius: 1,
                px: 0.75,
                py: 0.25,
                bgcolor: alpha(theme.palette.text.secondary, 0.1),
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              {shouldUseVectorForMemories ? "Cloud memory" : "Local memory"}
            </Typography>
            {filteredMemories.length > 0 && (
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  borderRadius: 1,
                  px: 0.75,
                  py: 0.25,
                  bgcolor: alpha(theme.palette.text.secondary, 0.1),
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                {filteredMemories.length} {selectedTab}
              </Typography>
            )}
          </Box>
        </Box>
        {/* Vector Mode Indicator */}
        {shouldUseVectorForMemories && (
          <Box sx={{
            flexShrink: 0,
            mx: isMobileView ? 1.5 : 2,
            mt: 1,
            p: 1.5,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Animated background shimmer */}
            <Box sx={{
              position: "absolute",
              top: 0,
              left: "-100%",
              width: "100%",
              height: "100%",
              background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
              animation: `${shimmer} 3s infinite`
            }} />
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: theme.palette.primary.main,
              animation: `${pulse} 2s infinite`,
              zIndex: 1
            }} />
            <Typography variant="body2" sx={{ 
              color: theme.palette.primary.main,
              fontSize: "0.8rem",
              fontWeight: 500,
              zIndex: 1
            }}>
              Advanced Vector Memory Active • Memories synced to AI database for enhanced semantic search
            </Typography>
          </Box>
        )}

        {/* Info + Tabs */}
        <Box sx={{ flexShrink: 0 }}>
          <Box sx={{ px: isMobileView ? 1.5 : 2, py: isMobileView ? 1.25 : 1.5 }}>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary, fontSize: "0.85rem", textAlign: isMobileView ? "left" : "center" }}
            >
              {shouldUseVectorForMemories ? (
                "🚀 AI-Powered Vector Memory. Semantic search across your conversations."
              ) : (
                "🧠 Private. Local. Yours. You control your memories."
              )}
            </Typography>
          </Box>
          <Tabs
            value={selectedTab}
            onChange={(_, val) => setSelectedTab(val)}
            textColor="inherit"
            indicatorColor="secondary"
            centered={!isMobileView}
            variant={isMobileView ? "fullWidth" : "standard"}
            sx={{ 
              bgcolor: alpha(input, isMobileView ? 0.65 : 0.5),
              borderTop: isMobileView ? `1px solid ${alpha(theme.palette.divider, 0.15)}` : undefined,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 500,
                minHeight: isMobileView ? 44 : 48,
                paddingInline: isMobileView ? 1 : 1.5,
              }
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  User
                  {getUserMemoryCount() > 0 && (
                    <Typography variant="caption" sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                      color: theme.palette.primary.main,
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 1,
                      fontSize: "0.65rem",
                      fontWeight: 600,
                    }}>
                      {getUserMemoryCount()}
                    </Typography>
                  )}
                </Box>
              } 
              value="user" 
            />
            <Tab 
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Auto
                  {getAutoMemoryCount() > 0 && (
                    <Typography variant="caption" sx={{
                      bgcolor: alpha(theme.palette.secondary.main, 0.2),
                      color: theme.palette.secondary.main,
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 1,
                      fontSize: "0.65rem",
                      fontWeight: 600,
                    }}>
                      {getAutoMemoryCount()}
                    </Typography>
                  )}
                </Box>
              } 
              value="auto" 
            />
          </Tabs>
        </Box>

        {/* Scrollable Memory List */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            px: isMobileView ? 1.5 : 2,
            py: isMobileView ? 1 : 1,
          }}
        >
          {filteredMemories.length === 0 ? (
            <Box sx={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: "center",
              height: "200px",
              textAlign: "center"
            }}>
              <Typography variant="h6" sx={{ 
                color: theme.palette.text.secondary, 
                mb: 1,
                fontSize: "1.1rem"
              }}>
                No {selectedTab} memories yet
              </Typography>
              <Typography variant="body2" sx={{ 
                color: alpha(theme.palette.text.secondary, 0.7),
                maxWidth: 280
              }}>
                {selectedTab === "user" 
                  ? shouldUseVectorForMemories 
                    ? "Start by adding something you'd like me to remember. Your memories will be stored in the AI vector database for intelligent retrieval."
                    : "Start by adding something you'd like me to remember about you or your preferences."
                  : shouldUseVectorForMemories
                    ? "Auto memories are created automatically based on our conversations and stored in the vector database for semantic search."
                    : "Auto memories are created automatically based on our conversations."
                }
              </Typography>
            </Box>
          ) : (
            filteredMemories.map((memory) => {
              const isSelected = selectedIds.includes(memory.id);
              return (
                <React.Fragment key={memory.id}>
                  <List sx={{ listStyle: "none", pl: 0, m: 0 }}>
                    <ListItem
                      onClick={() => multiSelectMode && toggleSelection(memory.id)}
                      sx={{
                        px: 0,
                        py: 1.5,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 1.5,
                        alignItems: "flex-start",
                        bgcolor: isSelected ? alpha(theme.palette.error.main, 0.1) : undefined,
                        borderRadius: isSelected ? 2 : 0,
                        cursor: multiSelectMode ? "pointer" : undefined,
                        border: isSelected ? `2px solid ${alpha(theme.palette.error.main, 0.3)}` : "2px solid transparent",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          bgcolor: multiSelectMode ? alpha(theme.palette.error.main, 0.05) : alpha(theme.palette.text.primary, 0.02),
                        }
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          flexGrow: 1,
                          gap: 1.5,
                        }}
                      >
                        <Avatar
                          src="https://cdn.burtson.ai/images/brain-icon.png"
                          alt="Memory"
                          sx={{
                            width: 36,
                            height: 36,
                            mt: 0.2,
                            bgcolor: theme.palette.mode === "light" ? "#f5f5f5" : theme.palette.background.paper,
                            border: isVectorEnabled 
                              ? `2px solid ${alpha(theme.palette.primary.main, 0.4)}` 
                              : `1px solid ${theme.palette.divider}`,
                            position: "relative"
                          }}
                        >
                          {isVectorEnabled && (
                            <Box sx={{
                              position: "absolute",
                              top: -2,
                              right: -2,
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              bgcolor: theme.palette.primary.main,
                              border: `2px solid ${theme.palette.background.paper}`,
                              fontSize: "6px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white"
                            }}>
                              ⚡
                            </Box>
                          )}
                        </Avatar>
                        {editingId === memory.id ? (
                          <TextField
                            fullWidth
                            multiline
                            autoFocus
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            onBlur={() => {
                              if (
                                editedContent.trim() &&
                                editedContent !== memory.content
                              ) {
                                useMemoryStore.setState((state) => ({
                                  entries: state.entries.map((entry) =>
                                    entry.id === memory.id
                                      ? { ...entry, content: editedContent }
                                      : entry
                                  ),
                                }));
                              }
                              setEditingId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setEditingId(null);
                                setEditedContent('');
                              } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                e.currentTarget.blur();
                              }
                            }}
                            sx={{
                              "& .MuiInputBase-root": { 
                                color: theme.palette.text.primary,
                                bgcolor: input,
                                borderRadius: 3,
                              },
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 3,
                                "& fieldset": {
                                  borderRadius: 3,
                                },
                                "&:hover fieldset": {
                                  borderRadius: 3,
                                },
                                "&.Mui-focused fieldset": {
                                  borderRadius: 3,
                                },
                              },
                            }}
                            helperText="Press Cmd/Ctrl+Enter to save, Escape to cancel"
                          />
                        ) : (
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              sx={{
                                cursor: (!multiSelectMode && !shouldUseVectorForMemories) ? "pointer" : "default",
                                wordBreak: "break-word",
                                color: memory.pinned ? "secondary.main" : theme.palette.text.primary,
                                fontWeight: memory.pinned ? 500 : 400,
                                lineHeight: 1.4,
                                "&:hover": (!multiSelectMode && !shouldUseVectorForMemories) ? {
                                  color: memory.pinned ? "secondary.dark" : "primary.main"
                                } : undefined
                              }}
                              onClick={() => {
                                if (!multiSelectMode && !shouldUseVectorForMemories) {
                                  setEditingId(memory.id);
                                  setEditedContent(memory.content);
                                }
                              }}
                            >
                              {memory.content}
                            </Typography>
                            {memory.pinned && (
                              <Typography variant="caption" sx={{
                                color: alpha(theme.palette.secondary.main, 0.7),
                                fontStyle: "italic",
                                mt: 0.5,
                                display: "block"
                              }}>
                                📌 Pinned
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                      {!multiSelectMode && (
                        <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
                          <Tooltip title={memory.pinned ? "Unpin memory" : "Pin memory"}>
                            <IconButton
                              onClick={async () => {
                                if (shouldUseVectorForMemories) {
                                  try {
                                    // Toggle pin status using vector update API
                                    const result = await updateVectorMemory(memory.id, { pinned: !memory.pinned });
                                    if (result.success) {
                                      // Refresh vector memories list to show updated pin status
                                      const memories = await getVectorMemories();
                                      setVectorMemories((memories ?? []) as VectorMemory[]);
                                    } else {
                                      debugLogger.error("Failed to update vector memory pin status", {
                                        id: memory.id,
                                        error: result.error,
                                      });
                                    }
                                  } catch (error) {
                                    debugLogger.error("Error updating vector memory pin status", {
                                      id: memory.id,
                                      error,
                                    });
                                  }
                                } else {
                                  togglePinMemory(memory.id);
                                }
                              }}
                              sx={{ 
                                color: memory.pinned ? "secondary.main" : alpha(theme.palette.text.secondary, 0.7),
                                "&:hover": { 
                                  bgcolor: alpha(memory.pinned ? theme.palette.secondary.main : theme.palette.text.secondary, 0.1)
                                }
                              }}
                              size="small"
                            >
                              {memory.pinned ? (
                                <PushPinIcon fontSize="small" />
                              ) : (
                                <PushPinOutlinedIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete memory">
                            <IconButton
                              onClick={async () => await handleDeleteMemory(memory.id)}
                              sx={{ 
                                color: alpha(theme.palette.text.secondary, 0.7),
                                "&:hover": { 
                                  bgcolor: alpha(theme.palette.error.main, 0.1),
                                  color: theme.palette.error.main
                                }
                              }}
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </ListItem>
                  </List>
                  {filteredMemories.indexOf(memory) < filteredMemories.length - 1 && (
                    <Divider sx={{ bgcolor: alpha(appBar.border, 0.5), my: 0.5 }} />
                  )}
                </React.Fragment>
              );
            })
          )}
        </Box>

        {/* Multi Delete Confirm Bar */}
        {multiSelectMode && (
          <Box
            sx={{
              p: isMobileView ? 1.5 : 2,
              borderTop: `1px solid ${appBar.border}`,
              bgcolor: alpha(theme.palette.error.main, 0.05),
              borderBottom: selectedIds.length > 0 ? `2px solid ${alpha(theme.palette.error.main, 0.2)}` : undefined,
            }}
          >
            {selectedIds.length === 0 ? (
              <Typography variant="body2" sx={{ 
                textAlign: "center", 
                color: theme.palette.text.secondary,
                fontStyle: "italic"
              }}>
                Tap memories to select them for deletion
              </Typography>
            ) : (
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSelectedIds(filteredMemories.map(m => m.id));
                  }}
                  sx={{ 
                    textTransform: "none",
                    borderRadius: 2,
                    fontSize: "0.8rem",
                    minWidth: "auto",
                  }}
                >
                  Select All
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  onClick={() => setConfirmOpen(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Delete Selected ({selectedIds.length})
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Footer */}
        <Box
          sx={{
            flexShrink: 0,
            p: isMobileView ? 1.5 : 2,
            borderTop: `1px solid ${appBar.border}`,
            bgcolor: isMobileView ? theme.palette.background.paper : shell,
            pb: `calc(env(safe-area-inset-bottom, 0px) + 8px)`,
          }}
        >
          <TextField
            fullWidth
            size="small"
            value={newMemory}
            onChange={(e) => setNewMemory(e.target.value)}
            placeholder={shouldUseVectorForMemories 
              ? `Add a new ${selectedTab} memory to vector database...` 
              : `Add a new ${selectedTab} memory...`
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && newMemory.trim()) {
                e.preventDefault();
                handleAdd();
              }
            }}
            sx={{
              "& .MuiInputBase-root": { 
                color: theme.palette.text.primary,
                bgcolor: alpha(input, 0.3), // Use semi-transparent background
                borderRadius: 3, // More rounded for modern look
              },
              "& .MuiOutlinedInput-root": {
                borderRadius: 3, // Ensure outline variant is also rounded
                bgcolor: "transparent", // Remove background from outline variant
                "& fieldset": {
                  borderRadius: 3, // Ensure fieldset border is rounded
                  borderColor: alpha(theme.palette.divider, 0.3),
                },
                "&:hover fieldset": {
                  borderRadius: 3, // Maintain rounded corners on hover
                  borderColor: alpha(theme.palette.primary.main, 0.5),
                },
                "&.Mui-focused fieldset": {
                  borderRadius: 3, // Maintain rounded corners when focused
                  borderColor: theme.palette.primary.main,
                },
              },
              mb: 1.5,
            }}
            InputProps={{
              endAdornment: newMemory.trim() && (
                <Typography variant="caption" sx={{ 
                  color: alpha(theme.palette.text.secondary, 0.7),
                  fontSize: "0.7rem",
                  whiteSpace: "nowrap"
                }}>
                  Press Enter
                </Typography>
              )
            }}
          />
          {!isMobileView && (
            <Button
              fullWidth
              variant="contained"
              onClick={handleAdd}
              disabled={!newMemory.trim()}
              sx={{ 
                borderRadius: 2, 
                py: 1.25,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Save
            </Button>
          )}
        </Box>

        {/* Confirm Delete Modal */}
        <Dialog 
          open={confirmOpen} 
          onClose={() => setConfirmOpen(false)}
          sx={{
            zIndex: 2100, // Higher than main modal (2000)
          }}
          PaperProps={{
            sx: { borderRadius: 3, minWidth: 320 }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            Delete {selectedIds.length} {selectedIds.length === 1 ? 'Memory' : 'Memories'}?
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              This will permanently remove the selected memory entries. This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button 
              onClick={() => setConfirmOpen(false)}
              sx={{ textTransform: "none", borderRadius: 3 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMultiDelete} 
              color="error"
              variant="contained"
              sx={{ textTransform: "none", borderRadius: 3 }}
            >
              Delete ({selectedIds.length})
            </Button>
          </DialogActions>
        </Dialog>
        {/* Clear All Dialog */}
        <Dialog 
          open={clearAllOpen} 
          onClose={() => setClearAllOpen(false)}
          sx={{
            zIndex: 2100, // Higher than main modal (2000)
          }}
          PaperProps={{
            sx: { borderRadius: 3, minWidth: 320 }
          }}
        >
          <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
            Clear Memories
          </DialogTitle>
          <DialogContent sx={{ pb: 2 }}>
            <Typography variant="body2" sx={{ mb: 3, color: theme.palette.text.secondary }}>
              This will permanently remove selected memory types. Choose which ones to clear:
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                value={clearOption}
                onChange={(e) => setClearOption(e.target.value as "user" | "auto" | "both")}
              >
                <FormControlLabel 
                  value="user" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography>User Memories</Typography>
                      <Typography variant="caption" sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        fontWeight: 600,
                      }}>
                        {getUserMemoryCount()}
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="auto" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography>Auto Memories</Typography>
                      <Typography variant="caption" sx={{
                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                        color: theme.palette.secondary.main,
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        fontWeight: 600,
                      }}>
                        {getAutoMemoryCount()}
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="both" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography>Both Types</Typography>
                      <Typography variant="caption" sx={{
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        color: theme.palette.error.main,
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        fontWeight: 600,
                      }}>
                        {entries.length}
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button 
              onClick={() => setClearAllOpen(false)}
              sx={{ textTransform: "none", borderRadius: 3 }}
            >
              Cancel
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={handleClearAll}
              sx={{ textTransform: "none", borderRadius: 3 }}
            >
              Clear {clearOption === "both" ? "All" : clearOption} Memories
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Import Dialog */}
        <Dialog 
          open={bulkImportOpen} 
          onClose={() => setBulkImportOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle sx={{ 
            fontWeight: 600, 
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <CloudSyncIcon color="primary" />
            Import Memories to Vector Database
          </DialogTitle>
          <DialogContent sx={{ py: 2 }}>
            {!importProgress.isImporting ? (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  This will import all your local memories ({entries.length} memories) to the vector database for enhanced semantic search capabilities.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  • Memories will be added to your vector storage
                  • Local memories will remain unchanged
                  • You can switch between local and vector storage anytime
                </Typography>
                <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                  Ready to import {entries.length} memories?
                </Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CloudSyncIcon 
                  sx={{ 
                    fontSize: 48, 
                    color: 'primary.main',
                    mb: 2,
                    animation: `${pulse} 2s ease-in-out infinite`
                  }} 
                />
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {importProgress.progress}
                </Typography>
                {importProgress.result && (
                  <>
                    <Typography 
                      variant="body2" 
                      color={importProgress.result.success ? 'success.main' : 'error.main'}
                      sx={{ mt: 1, mb: 2 }}
                    >
                      {importProgress.result.message}
                    </Typography>
                    {importProgress.result.details && (
                      <Box sx={{ 
                        textAlign: 'left', 
                        backgroundColor: 'background.paper',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 2,
                        mt: 2
                      }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Import Details:
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          • Total: {importProgress.result.details.totalMemories} memories
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          • Success: {importProgress.result.details.successCount}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          • Failed: {importProgress.result.details.failureCount}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          • Duration: {importProgress.result.details.duration}
                        </Typography>
                        {importProgress.result.details.warnings && importProgress.result.details.warnings.length > 0 && (
                          <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                            ⚠️ {importProgress.result.details.warnings.join(', ')}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button 
              onClick={() => {
                setBulkImportOpen(false);
                setImportProgress({ isImporting: false, progress: '' });
              }}
              disabled={importProgress.isImporting}
              sx={{ textTransform: "none", borderRadius: 3 }}
            >
              {importProgress.isImporting ? 'Importing...' : 'Cancel'}
            </Button>
            {!importProgress.isImporting && !importProgress.result && (
              <Button
                color="primary"
                variant="contained"
                onClick={handleBulkImport}
                startIcon={<CloudSyncIcon />}
                sx={{ textTransform: "none", borderRadius: 3 }}
              >
                Import {entries.length} Memories
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
  );

  if (isMobileView) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onOpen={() => {}}
        disableSwipeToOpen
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            height: 'min(720px, 82vh)',
            borderRadius: '22px 22px 0 0',
            overflow: 'hidden',
            bgcolor: theme.palette.background.paper,
            display: 'flex',
            justifyContent: 'center',
          },
        }}
      >
        {sheet}
      </SwipeableDrawer>
    );
  }

  return (
    <Modal 
      open={open} 
      onClose={onClose}
      sx={{
        zIndex: 2000, // Higher than drawer (1400) and other modals (1500)
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      {sheet}
    </Modal>
  );
};

export default MemoryModal;

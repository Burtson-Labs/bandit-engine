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

// Bandit Engine Watermark: BL-WM-817D-B6A919
const __banditFingerprint_chat_enhancedmobileconversationsmodaltsx = 'BL-FP-E99537-679F';
const __auditTrail_chat_enhancedmobileconversationsmodaltsx = 'BL-AU-MGOIKVV1-DNC2';
// File: enhanced-mobile-conversations-modal.tsx | Path: src/chat/enhanced-mobile-conversations-modal.tsx | Hash: 817d679f

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Box,
  IconButton,
  Modal,
  Typography,
  TextField,
  InputAdornment,
  Slide,
  Collapse,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  AppBar,
  Toolbar,
  Avatar,
  Chip,
} from "@mui/material";
import {
  Close as CloseIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Folder as FolderIcon,
  MoreVert as MoreVertIcon,
  DeleteSweep as DeleteSweepIcon,
  Inbox as InboxIcon,
} from "@mui/icons-material";
import { Add as AddIcon } from "@mui/icons-material";
import { useTheme, alpha } from "@mui/material/styles";
import { useConversationStore, Conversation } from "../store/conversationStore";
import { useProjectStore } from "../store/projectStore";
import { HistoryEntry } from "../store/aiQueryStore";
import { useAuthenticationStore } from "../store/authenticationStore";
import brandingService from "../services/branding/brandingService";
import ProjectManagementModal from "./project-management-modal";
import MoveConversationModal from "./move-conversation-modal";
import SimpleConversationItem from "./simple-conversation-item";
import ProjectHeader from "./project-header";
import { debugLogger } from "../services/logging/debugLogger";

interface MobileConversationsModalProps {
  open: boolean;
  onClose: () => void;
}

type ProjectConversation = Conversation & {
  _snippet?: string;
};

interface ProjectGroup {
  id: string | null;
  name: string;
  color?: string;
  conversations: ProjectConversation[];
  collapsed: boolean;
}

const BANDIT_AVATAR = "https://cdn.burtson.ai/images/bandit-head.png";

const coerceOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const deriveInitials = (value: string): string => {
  if (!value) return "B";
  const sanitized = value.trim();
  if (!sanitized) return "B";

  const words = sanitized.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const first = words[0]?.charAt(0) ?? "";
    const last = words[words.length - 1]?.charAt(0) ?? "";
    const initials = `${first}${last}`.trim();
    return initials ? initials.toUpperCase() : sanitized.slice(0, 2).toUpperCase();
  }

  const alphanumeric = sanitized.replace(/[^A-Za-z0-9]/g, "");
  if (alphanumeric.length >= 2) {
    return alphanumeric.slice(0, 2).toUpperCase();
  }
  if (alphanumeric.length === 1) {
    return alphanumeric.toUpperCase();
  }
  return sanitized.slice(0, 2).toUpperCase();
};

const EnhancedMobileConversationsModal: React.FC<MobileConversationsModalProps> = ({
  open,
  onClose,
}) => {
  const theme = useTheme();
  const { user } = useAuthenticationStore();
  
  const {
    conversations,
    currentId,
    switchConversation,
    deleteConversation,
    renameConversation,
    createNewConversation,
    clearAllConversations,
    moveConversationToProject,
    getConversationsByProject,
  } = useConversationStore();

  const {
    projects,
    _hasHydrated: projectsHydrated,
    hydrate: hydrateProjects,
    createProject,
    deleteProject,
  } = useProjectStore();

  // State for UI
  const [projectManagementOpen, setProjectManagementOpen] = useState(false);
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const didInitCollapseRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [conversationToMove, setConversationToMove] = useState<Conversation | null>(null);
  const [renameProjectId, setRenameProjectId] = useState<string | null>(null);
  const [deletedConversationIds, setDeletedConversationIds] = useState<Set<string>>(new Set());
  const [touchDragState, setTouchDragState] = useState<{
    conversationId: string | null;
    originProjectId: string | null;
    hoverProjectId: string | null;
  }>({ conversationId: null, originProjectId: null, hoverProjectId: null });
  const [avatarImage, setAvatarImage] = useState<string>(BANDIT_AVATAR);

  const getCustomClaim = useCallback((key: string): string | undefined => {
    if (!user) return undefined;
    const record = user as unknown as Record<string, unknown>;
    return coerceOptionalString(record[key]);
  }, [user]);

  const userDisplayName = useMemo(() => {
    if (!user) return undefined;

    const candidateFields = [
      coerceOptionalString(user.name),
      coerceOptionalString(user.preferred_username),
      user.given_name && user.family_name
        ? coerceOptionalString(`${user.given_name} ${user.family_name}`)
        : undefined,
      getCustomClaim("full_name"),
      getCustomClaim("displayName"),
    ];

    const resolvedName = candidateFields.find(Boolean);
    if (resolvedName) return resolvedName;

    const trimmedEmail = coerceOptionalString(user.email);
    if (trimmedEmail) return trimmedEmail;

    return user.sub;
  }, [user, getCustomClaim]);

  const userSecondaryText = useMemo(() => {
    if (!user) return undefined;

    const trimmedEmail = coerceOptionalString(user.email);
    if (trimmedEmail && trimmedEmail !== userDisplayName) {
      return trimmedEmail;
    }

    const subId = coerceOptionalString(user.sub);
    if (subId && subId !== userDisplayName) {
      return subId;
    }

    return undefined;
  }, [user, userDisplayName]);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const branding = await brandingService.getBranding();
        setAvatarImage(branding?.logoBase64 || BANDIT_AVATAR);
      } catch (error) {
        debugLogger.error("Failed to load branding avatar", {
          error: error instanceof Error ? error.message : String(error),
        });
        setAvatarImage(BANDIT_AVATAR);
      }
    };

    if (open) {
      fetchBranding();
    }
  }, [open]);

  const avatarLabel = userDisplayName || user?.email || "Bandit";
  const avatarInitials = useMemo(() => deriveInitials(avatarLabel), [avatarLabel]);

  // Build snippet helper
  const buildSnippet = (text: string, query: string, idx: number) => {
    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + query.length + 60);
    return text.slice(start, end).replace(/\s+/g, " ").trim();
  };

  // Hydrate projects on mount
  useEffect(() => {
    if (open && !projectsHydrated) {
      hydrateProjects();
    }
  }, [open, projectsHydrated, hydrateProjects]);

  // Collapse all projects by default after hydrate (one-time per mount)
  useEffect(() => {
    if (projectsHydrated && !didInitCollapseRef.current) {
      didInitCollapseRef.current = true;
      if (projects && projects.length > 0) {
        setCollapsedProjects(new Set(projects.map(p => p.id)));
      }
    }
  }, [projectsHydrated, projects]);

  // Organize conversations by projects (same as desktop)
  const projectGroups = useMemo((): ProjectGroup[] => {
    const visibleConversations = conversations.filter(
      (conversation) => !deletedConversationIds.has(conversation.id)
    );

    const groups: ProjectGroup[] = projects.map((project) => ({
      id: project.id,
      name: project.name,
      color: project.color,
      conversations: visibleConversations
        .filter((conversation) => conversation.projectId === project.id)
        .map<ProjectConversation>((conversation) => ({
          ...conversation,
        })),
      collapsed: collapsedProjects.has(project.id),
    }));

    const ungroupedConversations = visibleConversations
      .filter((conversation) => !conversation.projectId)
      .map<ProjectConversation>((conversation) => ({
        ...conversation,
      }));

    if (ungroupedConversations.length > 0) {
      groups.push({
        id: null,
        name: "Ungrouped",
        conversations: ungroupedConversations,
        collapsed: false,
      });
    }

    return groups.filter((group) => group.conversations.length > 0 || group.id !== null);
  }, [projects, conversations, collapsedProjects, deletedConversationIds]);

  const visibleConversationCount = useMemo(
    () => projectGroups.reduce((total, group) => total + group.conversations.length, 0),
    [projectGroups]
  );

  // Filter conversations based on search query and attach snippets
  const filteredProjectGroups = useMemo((): ProjectGroup[] => {
    if (!searchQuery.trim()) return projectGroups;

    const query = searchQuery.toLowerCase();

    return projectGroups
      .map(group => {
        const conversationsWithSnippets = group.conversations
          .map<ProjectConversation | null>((conv) => {
            if (conv.name.toLowerCase().includes(query)) {
              return { ...conv, _snippet: undefined };
            }

            for (const entry of conv.history as HistoryEntry[]) {
              const body = `${entry.question || ""} ${entry.answer || ""}`;
              const hay = body.toLowerCase();
              const idx = hay.indexOf(query);
              if (idx !== -1) {
                return { ...conv, _snippet: buildSnippet(body, query, idx) };
              }
            }
            return null;
          })
          .filter((conv): conv is ProjectConversation => conv !== null);

        return {
          ...group,
          conversations: conversationsWithSnippets,
        };
      })
      .filter(group => group.conversations.length > 0);
  }, [projectGroups, searchQuery]);

  const touchDragActive = Boolean(touchDragState.conversationId);

  const getProjectIdFromPoint = useCallback((clientX: number, clientY: number) => {
    if (typeof document === "undefined") return null;
    const element = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    if (!element) return null;
    const projectNode = element.closest('[data-project-id]') as HTMLElement | null;
    return projectNode?.getAttribute('data-project-id') ?? null;
  }, []);

  const handleTouchDragStart = useCallback((conversation: Conversation, touch: React.Touch) => {
    const initialHover = getProjectIdFromPoint(touch.clientX, touch.clientY);
    setTouchDragState({
      conversationId: conversation.id,
      originProjectId: conversation.projectId ?? null,
      hoverProjectId: initialHover ?? (conversation.projectId ?? null),
    });
  }, [getProjectIdFromPoint]);

  const handleTouchDragMove = useCallback((touch: React.Touch) => {
    setTouchDragState(prev => {
      if (!prev.conversationId) return prev;
      const hoverId = getProjectIdFromPoint(touch.clientX, touch.clientY);
      if (hoverId === prev.hoverProjectId) return prev;
      return { ...prev, hoverProjectId: hoverId };
    });
  }, [getProjectIdFromPoint]);

  const handleTouchDragEnd = useCallback((touch?: React.Touch) => {
    setTouchDragState(prev => {
      if (!prev.conversationId) {
        return { conversationId: null, originProjectId: null, hoverProjectId: null };
      }

      let hoverId = prev.hoverProjectId;
      if (touch) {
        const resolved = getProjectIdFromPoint(touch.clientX, touch.clientY);
        if (resolved !== null) hoverId = resolved;
      }

      if (hoverId) {
        const targetProjectId = hoverId === "__ungrouped" ? null : hoverId;
        if (targetProjectId !== prev.originProjectId) {
          const conversationId = prev.conversationId;
          setTimeout(() => {
            try {
              moveConversationToProject(conversationId, targetProjectId);
            } catch (error) {
              debugLogger.error("Failed to move conversation via touch drag", {
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }, 0);
        }
      }

      return { conversationId: null, originProjectId: null, hoverProjectId: null };
    });
  }, [getProjectIdFromPoint, moveConversationToProject]);

  const activeDragConversation = useMemo(() => {
    if (!touchDragState.conversationId) return null;
    return conversations.find(conv => conv.id === touchDragState.conversationId) || null;
  }, [touchDragState.conversationId, conversations]);

  const activeHoverLabel = useMemo(() => {
    if (!touchDragState.hoverProjectId) return "";
    if (touchDragState.hoverProjectId === "__ungrouped") return "Ungrouped";
    const project = projects.find(p => p.id === touchDragState.hoverProjectId);
    return project?.name || "";
  }, [touchDragState.hoverProjectId, projects]);

  const handleToggleProject = (projectId: string | null) => {
    const key = projectId || "ungrouped";
    const newCollapsed = new Set(collapsedProjects);
    if (newCollapsed.has(key)) {
      newCollapsed.delete(key);
    } else {
      newCollapsed.add(key);
    }
    setCollapsedProjects(newCollapsed);
  };

  const handleDropConversation = (projectId: string | null, conversationId: string) => {
    moveConversationToProject(conversationId, projectId === null ? null : projectId);
  };

  const handleSearchClear = () => {
    setSearchQuery("");
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleClearAllConfirm = async () => {
    try {
      setDeletedConversationIds(new Set(conversations.map((conv) => conv.id)));
      await clearAllConversations();
      setClearConfirmOpen(false);
      handleMenuClose();
      onClose(); // Close modal after clearing
    } catch (error) {
      debugLogger.error("Failed to clear conversations", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleMoveConversation = (conversation: ProjectConversation) => {
    setConversationToMove(conversation);
    setMoveModalOpen(true);
  };

  const handleMoveModalClose = () => {
    setMoveModalOpen(false);
    setConversationToMove(null);
  };

  useEffect(() => {
    setDeletedConversationIds((prev) => {
      let changed = false;
      const active = new Set(conversations.map((conv) => conv.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (active.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [conversations]);

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        sx={{
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        <Slide direction="up" in={open}>
          <Box
            sx={{
              width: "100%",
              height: "86vh",
              maxHeight: 720,
              bgcolor: theme.palette.background.paper,
              borderRadius: "20px 20px 0 0",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <AppBar 
              position="static" 
              elevation={0}
              sx={{
                bgcolor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Toolbar>
                <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
                  Conversations
                </Typography>
                {visibleConversationCount > 0 && (
                  <Chip
                    label={visibleConversationCount}
                    size="small"
                    sx={{
                      mr: 1,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(148, 163, 184, 0.16)"
                          : "rgba(15, 23, 42, 0.08)",
                      color: theme.palette.text.secondary,
                      fontWeight: 600,
                    }}
                  />
                )}
                
                <IconButton
                  onClick={() => setProjectManagementOpen(true)}
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <FolderIcon />
                </IconButton>

                <IconButton
                  onClick={handleMenuOpen}
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <MoreVertIcon />
                </IconButton>
                
                <IconButton
                  onClick={onClose}
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <CloseIcon />
                </IconButton>
              </Toolbar>
            </AppBar>

            {/* Search Bar */}
            <Box sx={{ p: 2, pb: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search conversations and content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleSearchClear}
                        size="small"
                        edge="end"
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Content */}
            <Box
              sx={{
                flex: 1,
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                pb: 2,
              }}
            >
              {touchDragActive && activeDragConversation && (
                <Box
                  sx={{
                    position: "absolute",
                    top: theme.spacing(5),
                    left: "50%",
                    transform: "translate(-50%, -100%)",
                    zIndex: theme.zIndex.modal + 10,
                    pointerEvents: "none",
                    bgcolor: theme.palette.mode === "dark"
                      ? alpha(theme.palette.common.black, 0.82)
                      : alpha(theme.palette.common.white, 0.95),
                    color: theme.palette.mode === "dark"
                      ? theme.palette.common.white
                      : theme.palette.text.primary,
                    border: `1px solid ${theme.palette.mode === "dark"
                      ? alpha(theme.palette.common.white, 0.25)
                      : alpha(theme.palette.common.black, 0.2)}`,
                    borderRadius: 999,
                    px: 2,
                    py: 0.75,
                    boxShadow: `0 16px 32px ${alpha(theme.palette.common.black, 0.3)}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    backdropFilter: "blur(12px)",
                    whiteSpace: "nowrap",
                    maxWidth: "min(90vw, 520px)",
                    overflow: "hidden",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Move
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 700,
                        maxWidth: "45vw",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      “{activeDragConversation.name}”
                    </Box>
                  </Typography>
                  <Typography
                    variant="caption"
                    color="inherit"
                    sx={{
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {activeHoverLabel ? (
                      <>
                        to{" "}
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {activeHoverLabel}
                        </Box>
                      </>
                    ) : (
                      "Drag over a project to drop"
                    )}
                  </Typography>
                </Box>
              )}
              {/* Quick Add Project */}
              <Box
                onClick={async () => {
                  const names = new Set(projects.map(p => p.name));
                  const base = "New Project";
                  let name = base;
                  if (names.has(name)) {
                    for (let i = 2; i < 1000; i++) {
                      const candidate = `${base} ${i}`;
                      if (!names.has(candidate)) { name = candidate; break; }
                    }
                  }
                  try {
                    const created = await createProject(name);
                    setRenameProjectId(created.id);
                  } catch (error) {
                    debugLogger.error("Failed to create project", {
                      error: error instanceof Error ? error.message : String(error),
                    });
                  }
                }}
                sx={{
                  px: 2,
                  py: 1.25,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  cursor: "pointer",
                  '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.04) },
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    bgcolor: alpha(theme.palette.success.main, 0.15),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <FolderIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                </Box>
                <Typography
                  variant="subtitle2"
                  sx={{ flex: 1, fontWeight: 600, fontSize: "0.875rem" }}
                >
                  New Project
                </Typography>
                <IconButton size="small" sx={{ color: theme.palette.success.main }}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ opacity: 0.3 }} />

              {filteredProjectGroups.map((group, index) => (
                <Box key={group.id || "ungrouped"}>
                  {/* Add visual separator before ungrouped section */}
                  {group.id === null && filteredProjectGroups.length > 1 && (
                    <Box
                      sx={{
                        py: 2,
                        px: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <Divider sx={{ flex: 1, opacity: 0.6 }} />
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <InboxIcon 
                          sx={{ 
                            color: theme.palette.text.disabled,
                            fontSize: "0.9rem",
                            opacity: 0.7,
                          }} 
                        />
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: theme.palette.text.disabled,
                            fontSize: "0.7rem",
                            fontWeight: 500,
                            letterSpacing: "0.5px",
                            textTransform: "uppercase",
                          }}
                        >
                          Other Conversations
                        </Typography>
                      </Box>
                      <Divider sx={{ flex: 1, opacity: 0.6 }} />
                    </Box>
                  )}

                  {/* Only show project header for actual projects, not ungrouped */}
                  {group.id !== null ? (
                    <>
                      <ProjectHeader
                        projectId={group.id}
                        projectName={group.name}
                        projectColor={group.color}
                        conversationCount={group.conversations.length}
                        isCollapsed={group.collapsed}
                        onToggleCollapse={() => handleToggleProject(group.id)}
                        onDropConversation={(conversationId) => 
                          handleDropConversation(group.id, conversationId)
                        }
                        isRenaming={renameProjectId === group.id}
                        onRenameComplete={() => setRenameProjectId(null)}
                        onRenameCancelDelete={async () => {
                          if (renameProjectId === group.id) {
                            try {
                              if (typeof group.id === 'string') {
                                await deleteProject(group.id);
                              }
                        } catch (error) {
                          debugLogger.error("Failed to delete project", {
                            error: error instanceof Error ? error.message : String(error),
                          });
                        } finally {
                          setRenameProjectId(null);
                        }
                          }
                        }}
                        isTouchTarget={touchDragActive && touchDragState.hoverProjectId === group.id}
                      />
                      
                      <Collapse in={!group.collapsed}>
                        <Box
                          data-project-id={group.id ?? "__ungrouped"}
                          sx={{
                            pb: 1,
                            border: touchDragActive && touchDragState.hoverProjectId === group.id
                              ? `2px dashed ${theme.palette.primary.main}`
                              : "1px solid transparent",
                            borderRadius: touchDragActive && touchDragState.hoverProjectId === group.id ? 2 : 0,
                            transition: "border 0.2s ease, background-color 0.2s ease",
                            backgroundColor: touchDragActive && touchDragState.hoverProjectId === group.id
                              ? alpha(theme.palette.primary.main, 0.08)
                              : "transparent",
                          }}
                        >
                          {group.conversations.map((conversation) => (
                            <SimpleConversationItem
                              key={conversation.id}
                              conversation={conversation}
                              isSelected={conversation.id === currentId}
                              onSelect={() => {
                                switchConversation(conversation.id);
                                onClose();
                              }}
                              onDelete={() => {
                                setDeletedConversationIds((prev) => {
                                  if (prev.has(conversation.id)) return prev;
                                  const next = new Set(prev);
                                  next.add(conversation.id);
                                  return next;
                                });
                                deleteConversation(conversation.id);
                              }}
                              onRename={(newName) => renameConversation(conversation.id, newName)}
                              onMove={() => handleMoveConversation(conversation)}
                              projectColor={group.color}
                              snippet={searchQuery ? conversation._snippet : undefined}
                              searchQuery={searchQuery.trim() || undefined}
                              onTouchDragStart={handleTouchDragStart}
                              onTouchDragMove={handleTouchDragMove}
                              onTouchDragEnd={handleTouchDragEnd}
                              isTouchDragActive={touchDragState.conversationId === conversation.id}
                            />
                          ))}
                        </Box>
                      </Collapse>
                    </>
                  ) : (
                    // Special handling for ungrouped - no header, just conversations in scrollable area
                    <Box 
                      sx={{ 
                        minHeight: 0,
                        overflow: "auto",
                        px: 1,
                        py: 1,
                        bgcolor: alpha(theme.palette.background.default, 0.3),
                        borderRadius: "8px 8px 0 0",
                        mx: 1,
                        mb: 1,
                        border: touchDragActive && touchDragState.hoverProjectId === "__ungrouped"
                          ? `2px dashed ${theme.palette.primary.main}`
                          : "1px solid transparent",
                        transition: "border 0.2s ease, background-color 0.2s ease",
                        backgroundColor: touchDragActive && touchDragState.hoverProjectId === "__ungrouped"
                          ? alpha(theme.palette.primary.main, 0.08)
                          : alpha(theme.palette.background.default, 0.3),
                      }}
                      data-project-id="__ungrouped"
                    >
                      {group.conversations.map((conversation) => (
                        <SimpleConversationItem
                          key={conversation.id}
                          conversation={conversation}
                          isSelected={conversation.id === currentId}
                          onSelect={() => {
                            switchConversation(conversation.id);
                            onClose();
                          }}
                          onDelete={() => {
                            setDeletedConversationIds((prev) => {
                              if (prev.has(conversation.id)) return prev;
                              const next = new Set(prev);
                              next.add(conversation.id);
                              return next;
                            });
                            deleteConversation(conversation.id);
                          }}
                          onRename={(newName) => renameConversation(conversation.id, newName)}
                          onMove={() => handleMoveConversation(conversation)}
                          projectColor={group.color}
                          snippet={searchQuery ? conversation._snippet : undefined}
                          searchQuery={searchQuery.trim() || undefined}
                          onTouchDragStart={handleTouchDragStart}
                          onTouchDragMove={handleTouchDragMove}
                          onTouchDragEnd={handleTouchDragEnd}
                          isTouchDragActive={touchDragState.conversationId === conversation.id}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              ))}
              
              {filteredProjectGroups.length === 0 && (
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 4,
                    textAlign: "center",
                    color: theme.palette.text.secondary,
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {searchQuery ? "No conversations found" : "No conversations yet"}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3, maxWidth: 280 }}>
                    {searchQuery 
                      ? `No conversations match "${searchQuery}"`
                      : "Start your first conversation to begin organizing your chats into projects"
                    }
                  </Typography>
                </Box>
              )}
            </Box>

            <Box
              sx={{
                mt: "auto",
                px: 2,
                py: 1.75,
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.25,
                bgcolor: alpha(theme.palette.background.default, 0.88),
                flexWrap: "wrap",
              }}
            >
              <Avatar
                src={avatarImage}
                alt={avatarLabel}
                sx={{
                  width: 40,
                  height: 40,
                  fontSize: "1rem",
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: theme.palette.primary.main,
                }}
              >
                {avatarInitials}
              </Avatar>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  noWrap
                  sx={{ fontWeight: 600, color: theme.palette.text.primary }}
                >
                  {user ? userDisplayName : "Not signed in"}
                </Typography>
                {!user && (
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.secondary }}
                    noWrap
                  >
                    Connect your account to sync chats
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Slide>
      </Modal>

      {/* Project Management Modal */}
      <ProjectManagementModal
        open={projectManagementOpen}
        onClose={() => setProjectManagementOpen(false)}
      />

      {/* Move Conversation Modal */}
      {conversationToMove && (
        <MoveConversationModal
          open={moveModalOpen}
          onClose={handleMoveModalClose}
          conversations={[conversationToMove]}
          currentProjectId={conversationToMove.projectId}
        />
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <MenuItem 
          onClick={() => {
            setClearConfirmOpen(true);
            handleMenuClose();
          }}
          disabled={visibleConversationCount === 0}
          sx={{ color: theme.palette.error.main }}
        >
          <ListItemIcon>
            <DeleteSweepIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
          </ListItemIcon>
          <ListItemText>Clear All Conversations</ListItemText>
        </MenuItem>
      </Menu>

      {/* Clear All Confirmation Dialog */}
      <Dialog
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Clear All Conversations?</DialogTitle>
        <DialogContent>
          <Typography>
            {visibleConversationCount === 0
              ? "No conversations available to clear."
              : `This will permanently delete ${visibleConversationCount} conversation${visibleConversationCount === 1 ? '' : 's'} and cannot be undone.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearConfirmOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleClearAllConfirm}
            color="error"
            variant="contained"
          >
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EnhancedMobileConversationsModal;

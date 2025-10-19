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

// Bandit Engine Watermark: BL-WM-2968-6B1DA0
const __banditFingerprint_chat_conversationdrawertsx = 'BL-FP-4ABDAD-3ADB';
const __auditTrail_chat_conversationdrawertsx = 'BL-AU-MGOIKVUZ-GN4Q';
// File: conversation-drawer.tsx | Path: src/chat/conversation-drawer.tsx | Hash: 29683adb

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  useMediaQuery,
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
  Avatar,
  alpha,
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
import { useTheme } from "@mui/material/styles";
import { useConversationStore, type Conversation } from "../store/conversationStore";
import { useProjectStore } from "../store/projectStore";
import { HistoryEntry } from "../store/aiQueryStore";
import { useAuthenticationStore } from "../store/authenticationStore";
import brandingService from "../services/branding/brandingService";
import ProjectManagementModal from "./project-management-modal";
import MoveConversationModal from "./move-conversation-modal";
import SimpleConversationItem from "./simple-conversation-item";
import ProjectHeader from "./project-header";
import { debugLogger } from "../services/logging/debugLogger";

interface Props {
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

const ConversationDrawer: React.FC<Props> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user } = useAuthenticationStore();
  const baseRadius = typeof theme.shape.borderRadius === "number"
    ? theme.shape.borderRadius
    : parseFloat(theme.shape.borderRadius) || 0;
  const drawerCornerRadius = baseRadius * 3;
  
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

  const [avatarImage, setAvatarImage] = useState<string>(BANDIT_AVATAR);

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

    fetchBranding();
  }, []);

  const avatarLabel = userDisplayName || user?.email || "Bandit";
  const avatarInitials = useMemo(() => deriveInitials(avatarLabel), [avatarLabel]);

  // Hydrate projects on mount
  useEffect(() => {
    if (!projectsHydrated) {
      hydrateProjects();
    }
  }, [projectsHydrated, hydrateProjects]);

  // Collapse all projects by default after projects hydrate (one-time)
  useEffect(() => {
    if (projectsHydrated && !didInitCollapseRef.current) {
      didInitCollapseRef.current = true;
      if (projects && projects.length > 0) {
        setCollapsedProjects(new Set(projects.map(p => p.id)));
      }
    }
  }, [projectsHydrated, projects]);

  // Build searchable results with a short snippet from questions/answers
  const buildSnippet = (text: string, query: string, idx: number) => {
    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + query.length + 60);
    return text.slice(start, end).replace(/\s+/g, " ").trim();
  };

  // Organize conversations by projects
  const projectGroups = useMemo((): ProjectGroup[] => {
    const groups: ProjectGroup[] = projects.map((project) => ({
      id: project.id,
      name: project.name,
      color: project.color,
      conversations: conversations
        .filter((conversation) => conversation.projectId === project.id)
        .map<ProjectConversation>((conversation) => ({
          ...conversation,
        })),
      collapsed: collapsedProjects.has(project.id),
    }));

    const ungroupedConversations = conversations
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
  }, [projects, conversations, collapsedProjects]);

  // Filter conversations based on search query and attach snippet previews
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

  const handleCreateConversation = () => {
    createNewConversation();
    if (isMobile) {
      onClose();
    }
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
      await clearAllConversations();
      setClearConfirmOpen(false);
      handleMenuClose();
    } catch (error) {
      debugLogger.error("Failed to clear conversations:", {
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

  return (
    <>
      <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        variant={isMobile ? "temporary" : "persistent"}
        sx={{
          width: isMobile ? "auto" : 340,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: isMobile ? `min(94vw, 360px)` : 340,
            maxWidth: 360,
            bgcolor: theme.palette.background.paper,
            borderRight: `1px solid ${isMobile ? alpha(theme.palette.divider, 0.4) : theme.palette.divider}`,
            display: "flex",
            flexDirection: "column",
            height: isMobile ? `calc(100dvh - ${theme.spacing(4)})` : "100dvh",
            top: isMobile ? theme.spacing(2) : 0,
            bottom: isMobile ? theme.spacing(2) : 0,
            left: 0,
            borderRadius: isMobile ? `0 ${drawerCornerRadius}px ${drawerCornerRadius}px 0` : 0,
            boxShadow: isMobile ? `0 18px 36px ${alpha(theme.palette.common.black, 0.28)}` : "none",
            overflow: "hidden",
          },
        }}
        ModalProps={{
          keepMounted: true, // Better performance on mobile
          ...(isMobile && {
            onBackdropClick: onClose, // Ensure backdrop click closes on mobile
          }),
        }}
        SlideProps={{
          ...(isMobile && {
            onExited: () => {}, // Ensure slide animation completes
          }),
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
          <IconButton
            onClick={() => setProjectManagementOpen(true)}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
              "&:hover": {
                color: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <FolderIcon />
          </IconButton>

          <IconButton
            onClick={handleMenuOpen}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
              "&:hover": {
                color: theme.palette.text.primary,
                bgcolor: alpha(theme.palette.text.primary, 0.1),
              },
            }}
          >
            <MoreVertIcon />
          </IconButton>
          
          {isMobile && (
            <IconButton
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              size="small"
              sx={{ 
                color: theme.palette.text.secondary,
                "&:hover": {
                  color: theme.palette.error.main,
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>

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
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: alpha(theme.palette.background.default, 0.5),
                "&:hover": {
                  bgcolor: alpha(theme.palette.background.default, 0.8),
                },
                "&.Mui-focused": {
                  bgcolor: theme.palette.background.default,
                },
              },
            }}
          />
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
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
                  />
                  
                  <Collapse in={!group.collapsed}>
                    <Box sx={{ pb: 1 }}>
                      {group.conversations.map((conversation) => (
                        <SimpleConversationItem
                          key={conversation.id}
                          conversation={conversation}
                          isSelected={conversation.id === currentId}
                          onSelect={() => {
                            switchConversation(conversation.id);
                            if (isMobile) {
                              // Force close on mobile after conversation switch
                              setTimeout(() => onClose(), 100);
                            }
                          }}
                          onDelete={() => deleteConversation(conversation.id)}
                          onRename={(newName) => renameConversation(conversation.id, newName)}
                          onMove={() => handleMoveConversation(conversation)}
                          projectColor={group.color}
                          snippet={searchQuery ? conversation._snippet : undefined}
                          searchQuery={searchQuery.trim() || undefined}
                        />
                      ))}
                      
                      {group.conversations.length === 0 && !group.collapsed && group.id !== null && (
                        <Box
                          sx={{
                            p: 3,
                            textAlign: "center",
                            color: theme.palette.text.secondary,
                          }}
                        >
                          <Typography variant="body2">
                            No conversations in this project yet
                          </Typography>
                          <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                            Drag conversations here or use the + button above
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                  
                  <Divider sx={{ opacity: 0.3 }} />
                </>
              ) : (
                // Special handling for ungrouped - no header, just conversations in scrollable area
                <Box 
                  sx={{ 
                    minHeight: 0, // Allow shrinking
                    overflow: "auto",
                    px: 1,
                    py: 1,
                    bgcolor: alpha(theme.palette.background.default, 0.3),
                    borderRadius: "8px 8px 0 0",
                    mx: 1,
                    mb: 1,
                  }}
                >
                  {group.conversations.map((conversation) => (
                    <SimpleConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isSelected={conversation.id === currentId}
                      onSelect={() => {
                        switchConversation(conversation.id);
                        if (isMobile) {
                          // Force close on mobile after conversation switch
                          setTimeout(() => onClose(), 100);
                        }
                      }}
                      onDelete={() => deleteConversation(conversation.id)}
                      onRename={(newName) => renameConversation(conversation.id, newName)}
                      onMove={() => handleMoveConversation(conversation)}
                      projectColor={group.color}
                      snippet={searchQuery ? conversation._snippet : undefined}
                      searchQuery={searchQuery.trim() || undefined}
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

        {/* User badge */}
        <Box
          sx={{
            mt: "auto",
            px: 2,
            py: 1.75,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            justifyContent: "center",
            bgcolor: alpha(theme.palette.background.default, isMobile ? 0.9 : 0.6),
          }}
        >
          <Avatar
            src={avatarImage}
            alt={avatarLabel}
            sx={{
              width: 36,
              height: 36,
              fontSize: "0.95rem",
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
            }}
          >
            {avatarInitials}
          </Avatar>
          <Box
            sx={{
              minWidth: 0,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: isMobile ? "center" : "flex-start",
              textAlign: isMobile ? "center" : "left",
              gap: 0.25,
            }}
          >
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
              >
                Connect your account to sync chats
              </Typography>
            )}
          </Box>
        </Box>
      </Drawer>

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
            This will permanently delete all conversations and cannot be undone. 
            Are you sure you want to continue?
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

export default ConversationDrawer;

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

// Bandit Engine Watermark: BL-WM-4562-87A9A9
const __banditFingerprint_chat_projectmanagementmodaltsx = 'BL-FP-3B1138-F94C';
const __auditTrail_chat_projectmanagementmodaltsx = 'BL-AU-MGOIKVV5-QMKL';
// File: project-management-modal.tsx | Path: src/chat/project-management-modal.tsx | Hash: 4562f94c

import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Button,
  TextField,
  List,
  ListItem,
  IconButton,
  Box,
  Typography,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  SwipeableDrawer,
  useMediaQuery,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Folder as FolderIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useTheme, alpha } from "@mui/material/styles";
import { useProjectStore, Project } from "../store/projectStore";
import { useConversationStore } from "../store/conversationStore";

interface ProjectManagementModalProps {
  open: boolean;
  onClose: () => void;
}

interface ProjectFormData {
  name: string;
  description: string;
  color: string;
}

const DEFAULT_COLORS = [
  "#2196F3", "#4CAF50", "#FF9800", "#9C27B0", "#F44336",
  "#00BCD4", "#FFEB3B", "#795548", "#607D8B", "#E91E63",
];

const ProjectManagementModal: React.FC<ProjectManagementModalProps> = ({
  open,
  onClose,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const {
    projects,
    _hasHydrated,
    createProject,
    deleteProject,
    renameProject,
    updateProjectColor,
    hydrate,
  } = useProjectStore();

  const { getConversationsByProject } = useConversationStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    color: DEFAULT_COLORS[0],
  });
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Container ref to anchor the menu within the sheet/drawer
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && !_hasHydrated) {
      hydrate();
    }
  }, [open, _hasHydrated, hydrate]);

  useEffect(() => {
    if (!open) {
      setMenuAnchor(null);
      setSelectedProject(null);
    }
  }, [open]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: DEFAULT_COLORS[0],
    });
    setEditingProject(null);
    setShowCreateForm(false);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    setMenuAnchor(null);
    setSelectedProject(null);
    onClose();
  };

  const handleCreateProject = async () => {
    if (!formData.name.trim()) {
      setError("Project name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createProject(formData.name, formData.description, formData.color);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProject = async () => {
    if (!editingProject || !formData.name.trim()) {
      setError("Project name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await renameProject(editingProject.id, formData.name, formData.description);
      if (formData.color !== editingProject.color) {
        await updateProjectColor(editingProject.id, formData.color);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    const conversationCount = getConversationsByProject(project.id).length;

    if (conversationCount > 0) {
      setError(`Cannot delete project "${project.name}" - it contains ${conversationCount} conversation(s). Move conversations to another project first.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setMenuAnchor(null);
      setSelectedProject(null);
      await deleteProject(project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      color: project.color || DEFAULT_COLORS[0],
    });
    setShowCreateForm(true);
    setMenuAnchor(null);
  };

  const openMenu = (event: React.MouseEvent<HTMLButtonElement>, project: Project) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedProject(project);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setSelectedProject(null);
  };

  const chatPalette = theme.palette.chat ?? {};
  const overlayZIndex = (theme.zIndex?.modal ?? 1300) + 20;
  const surfaceColor = isMobile
    ? theme.palette.background.paper
    : chatPalette.shell ?? theme.palette.background.paper;
  const borderColor = chatPalette.appBar?.border ?? alpha(theme.palette.divider, 0.12);
  const subtleSurface = theme.palette.mode === "dark"
    ? alpha(theme.palette.common.white, 0.04)
    : alpha(theme.palette.common.black, 0.03);
  const hoverSurface = alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.22 : 0.08);

  const headerTitle = showCreateForm
    ? editingProject
      ? "Edit Project"
      : "Create Project"
    : "Manage Projects";

  const headerSubtitle = showCreateForm
    ? "Name, describe, and color-code your project."
    : "Organize conversations into cohesive projects.";

  const content = (
    <Box
      ref={modalContainerRef}
      sx={{
        width: "100%",
        maxWidth: isMobile ? undefined : 560,
        maxHeight: isMobile ? "min(720px, 82vh)" : "90vh",
        height: isMobile ? "100%" : "auto",
        bgcolor: surfaceColor,
        borderRadius: isMobile ? "22px 22px 0 0" : 3,
        overflow: "hidden",
        boxShadow: isMobile ? "none" : `0 20px 60px ${alpha(theme.palette.common.black, 0.32)}`,
        border: isMobile ? "none" : `1px solid ${alpha(theme.palette.divider, 0.18)}`,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {isMobile && (
        <Box
          sx={{
            width: 56,
            height: 6,
            borderRadius: 999,
            bgcolor: alpha(theme.palette.text.primary, 0.18),
            alignSelf: "center",
            mt: 1.25,
            mb: 0.75,
          }}
        />
      )}

      <Box
        sx={{
          px: isMobile ? 1.5 : 2.75,
          pt: isMobile ? 1.25 : 2.5,
          pb: isMobile ? 1 : 2,
          borderBottom: `1px solid ${borderColor}`,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              minWidth: 0,
              flex: 1,
            }}
          >
            {showCreateForm && (
              <IconButton onClick={resetForm} size="small" sx={{ mr: 0.5 }}>
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            )}
            <Typography
              variant="h6"
              sx={{
                fontSize: isMobile ? "1rem" : "1.125rem",
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {headerTitle}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {headerSubtitle}
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: isMobile ? 1.5 : 2.75,
          py: isMobile ? 1.5 : 2,
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
        }}
      >
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {showCreateForm ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Project name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              disabled={loading}
              autoFocus
            />

            <TextField
              label="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              minRows={2}
              disabled={loading}
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Color
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {DEFAULT_COLORS.map((color) => (
                  <Box
                    key={color}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: color,
                      cursor: "pointer",
                      border: formData.color === color
                        ? `3px solid ${theme.palette.primary.main}`
                        : "2px solid transparent",
                      transition: "transform 0.2s ease",
                      "&:hover": {
                        transform: "scale(1.08)",
                      },
                    }}
                    onClick={() => setFormData({ ...formData, color })}
                    aria-label={`Select ${color} for project color`}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setShowCreateForm(true)}
              variant="contained"
              sx={{
                alignSelf: "flex-start",
                textTransform: "none",
                borderRadius: 2,
                px: 2.5,
              }}
            >
              Create project
            </Button>

            {projects.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  px: 2,
                  color: theme.palette.text.secondary,
                  borderRadius: 2,
                  border: `1px dashed ${alpha(theme.palette.divider, 0.4)}`,
                  backgroundColor: subtleSurface,
                }}
              >
                <FolderIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  No projects yet
                </Typography>
                <Typography variant="body2">
                  Create your first project to organize conversations.
                </Typography>
              </Box>
            ) : (
              <List sx={{ display: "flex", flexDirection: "column", gap: 1.25, py: 0 }}>
                {projects.map((project) => {
                  const conversationCount = getConversationsByProject(project.id).length;

                  return (
                    <ListItem key={project.id} disablePadding>
                      <Box
                        sx={{
                          display: "flex",
                          width: "100%",
                          borderRadius: 2,
                          alignItems: "center",
                          gap: 1.5,
                          px: 1.5,
                          py: 1.25,
                          backgroundColor: subtleSurface,
                          transition: "background-color 0.2s ease, transform 0.2s ease",
                          "&:hover": {
                            backgroundColor: hoverSurface,
                            transform: "translateY(-1px)",
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: project.color,
                            width: 36,
                            height: 36,
                            fontSize: "1rem",
                          }}
                        >
                          <FolderIcon fontSize="small" />
                        </Avatar>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}
                            >
                              {project.name}
                            </Typography>
                            <Chip
                              label={`${conversationCount}`}
                              size="small"
                              sx={{
                                height: 22,
                                borderRadius: 999,
                                fontWeight: 600,
                                bgcolor: alpha(theme.palette.text.primary, 0.08),
                                color: theme.palette.text.primary,
                              }}
                            />
                          </Box>
                          {project.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                            >
                              {project.description}
                            </Typography>
                          )}
                        </Box>

                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            openMenu(e, project);
                          }}
                          size="small"
                          sx={{
                            alignSelf: "flex-start",
                            mt: 0.25,
                            zIndex: 1,
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        )}
      </Box>

      <Box
        sx={{
          px: isMobile ? 1.5 : 2.75,
          py: isMobile ? 1.25 : 2,
          borderTop: `1px solid ${borderColor}`,
          display: "flex",
          justifyContent: "flex-end",
          gap: 1,
        }}
      >
        {showCreateForm ? (
          <>
            <Button
              onClick={resetForm}
              disabled={loading}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingProject ? handleEditProject : handleCreateProject}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : undefined}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              {editingProject ? "Update project" : "Create project"}
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} sx={{ textTransform: "none", borderRadius: 2 }}>
            Close
          </Button>
        )}
      </Box>

      {/* Menu rendered here so we can control z-index/positioning across modal + drawer modes */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        MenuListProps={{
          dense: true,
          disablePadding: false,
        }}
        disablePortal
        container={modalContainerRef.current ?? undefined}
        PaperProps={{
          sx: {
            zIndex: overlayZIndex + (isMobile ? 10 : 40),
            mt: 0.5,
            minWidth: 160,
          }
        }}
      >
        <MenuItem
          onClick={() => {
            if (!selectedProject) return;
            startEdit(selectedProject);
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <EditIcon fontSize="small" />
            <Typography variant="body2" color="inherit">
              Edit
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!selectedProject) return;
            handleDeleteProject(selectedProject);
          }}
          sx={{ color: theme.palette.error.main }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <DeleteIcon fontSize="small" />
            <Typography variant="body2" color="inherit">
              Delete
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <SwipeableDrawer
          anchor="bottom"
          open={open}
          onClose={handleClose}
          onOpen={() => { }}
          disableSwipeToOpen
          ModalProps={{ keepMounted: true }}
          sx={{ zIndex: overlayZIndex }}
          PaperProps={{
            sx: {
              height: "min(720px, 82vh)",
              borderRadius: "22px 22px 0 0",
              overflow: "hidden",
            },
          }}
        >
          {content}
        </SwipeableDrawer>
      ) : (
        <Modal
          open={open}
          onClose={handleClose}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
            zIndex: overlayZIndex,
          }}
        >
          {content}
        </Modal>
      )}
    </>
  );
};

export default ProjectManagementModal;

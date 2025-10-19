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

// Bandit Engine Watermark: BL-WM-94AC-F1E637
const __banditFingerprint_chat_projectselectortsx = 'BL-FP-C1AC29-5E71';
const __auditTrail_chat_projectselectortsx = 'BL-AU-MGOIKVV5-182S';
// File: project-selector.tsx | Path: src/chat/project-selector.tsx | Hash: 94ac5e71

import React, { useState } from "react";
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Avatar,
} from "@mui/material";
import {
  Add as AddIcon,
  Folder as FolderIcon,
  Inbox as InboxIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useProjectStore } from "../store/projectStore";
import { useConversationStore } from "../store/conversationStore";
import QuickAddProjectButton from "./quick-add-project-button";

interface ProjectSelectorProps {
  selectedProjectId?: string | null;
  onProjectSelect?: (projectId: string | null) => void;
  size?: "small" | "medium" | "large";
  variant?: "button" | "chip";
}

/**
 * Project selector component for choosing which project new conversations go into
 */
const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  selectedProjectId = null,
  onProjectSelect,
  size = "medium",
  variant = "button",
}) => {
  const theme = useTheme();
  const { projects, _hasHydrated } = useProjectStore();
  const { createNewConversation } = useConversationStore();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const isOpen = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProjectSelect = (projectId: string | null) => {
    onProjectSelect?.(projectId);
    handleClose();
  };

  const handleCreateConversationInProject = (projectId: string | null) => {
    createNewConversation(projectId || undefined);
    handleClose();
  };

  if (!_hasHydrated) {
    return null;
  }

  const buttonContent = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
      <Avatar
        sx={{
          bgcolor: selectedProject?.color || theme.palette.grey[400],
          width: size === "small" ? 20 : 24,
          height: size === "small" ? 20 : 24,
        }}
      >
        {selectedProject ? (
          <FolderIcon fontSize={size === "small" ? "small" : "medium"} />
        ) : (
          <InboxIcon fontSize={size === "small" ? "small" : "medium"} />
        )}
      </Avatar>
      
      <Typography
        variant={size === "small" ? "caption" : "body2"}
        sx={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: 120,
        }}
      >
        {selectedProject?.name || "No Project"}
      </Typography>
      
      <ArrowDownIcon 
        fontSize="small" 
        sx={{ 
          ml: "auto",
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
        }} 
      />
    </Box>
  );

  return (
    <>
      <Button
        onClick={handleClick}
        variant={variant === "chip" ? "outlined" : "text"}
        size={size}
        sx={{
          textTransform: "none",
          justifyContent: "flex-start",
          minWidth: variant === "chip" ? "auto" : 160,
          maxWidth: 200,
          borderRadius: variant === "chip" ? 2 : 1,
          bgcolor: variant === "chip" 
            ? theme.palette.background.paper 
            : "transparent",
          border: variant === "chip" 
            ? `1px solid ${theme.palette.divider}`
            : "none",
          "&:hover": {
            bgcolor: variant === "chip"
              ? theme.palette.action.hover
              : theme.palette.action.hover,
          },
        }}
      >
        {buttonContent}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: { minWidth: 200, maxWidth: 300 }
        }}
      >
        {/* No Project Option */}
        <MenuItem onClick={() => handleProjectSelect(null)}>
          <ListItemIcon>
            <Avatar sx={{ bgcolor: theme.palette.grey[400], width: 24, height: 24 }}>
              <InboxIcon fontSize="small" />
            </Avatar>
          </ListItemIcon>
          <ListItemText
            primary="No Project"
            secondary="Keep ungrouped"
          />
        </MenuItem>

        {projects.length > 0 && <Divider />}

        {/* Project Options */}
        {projects.map((project) => (
          <MenuItem
            key={project.id}
            onClick={() => handleProjectSelect(project.id)}
            selected={project.id === selectedProjectId}
          >
            <ListItemIcon>
              <Avatar sx={{ bgcolor: project.color, width: 24, height: 24 }}>
                <FolderIcon fontSize="small" />
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={project.name}
              secondary={project.description}
            />
          </MenuItem>
        ))}

        {projects.length > 0 && <Divider />}

        {/* Quick Actions */}
        <Box sx={{ p: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ px: 1, py: 0.5, display: "block" }}>
            Quick Actions
          </Typography>
          
          <MenuItem onClick={() => handleCreateConversationInProject(selectedProjectId)}>
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="New Conversation Here" />
          </MenuItem>

          <QuickAddProjectButton
            variant="icon"
            size="small"
            onProjectCreated={(projectId) => {
              handleProjectSelect(projectId);
            }}
          />
        </Box>
      </Menu>
    </>
  );
};

export default ProjectSelector;
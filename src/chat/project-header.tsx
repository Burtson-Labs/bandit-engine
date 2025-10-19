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

// Bandit Engine Watermark: BL-WM-9FF1-8A9606
const __banditFingerprint_chat_projectheadertsx = 'BL-FP-8E1E75-E3D0';
const __auditTrail_chat_projectheadertsx = 'BL-AU-MGOIKVV4-JNZM';
// File: project-header.tsx | Path: src/chat/project-header.tsx | Hash: 9ff1e3d0

import React, { useRef, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Tooltip,
  TextField,
  alpha,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Inbox as InboxIcon,
  Close as CloseIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useConversationStore } from "../store/conversationStore";
import { useProjectStore } from "../store/projectStore";
import { debugLogger } from "../services/logging/debugLogger";

interface ProjectHeaderProps {
  projectId: string | null;
  projectName: string;
  projectColor?: string;
  conversationCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onDropConversation?: (conversationId: string) => void;
  // Inline rename controls
  isRenaming?: boolean;
  onRenameComplete?: () => void;
  onRenameCancelDelete?: () => void;
  isTouchTarget?: boolean;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  projectId,
  projectName,
  projectColor,
  conversationCount,
  isCollapsed,
  onToggleCollapse,
  onDropConversation,
  isRenaming,
  onRenameComplete,
  onRenameCancelDelete,
  isTouchTarget,
}) => {
  const theme = useTheme();
  const { createNewConversation } = useConversationStore();
  const { renameProject } = useProjectStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [renameDraft, setRenameDraft] = useState(projectName);
  // Track pre-blur intent to avoid committing when cancel/delete is clicked
  const renameActionRef = useRef<"none" | "save" | "delete">("none");

  const isUngrouped = projectId === null;
  const Icon = isCollapsed ? FolderIcon : FolderOpenIcon;

  const handleAddConversation = (e: React.MouseEvent) => {
    e.stopPropagation();
    createNewConversation(projectId || undefined);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const conversationId = e.dataTransfer.getData("text/plain");
    if (conversationId && onDropConversation) {
      onDropConversation(conversationId);
    }
  };

  const commitRename = async () => {
    if (!isRenaming || projectId === null) return;
    const next = renameDraft.trim();
    try {
      if (next && next !== projectName) {
        await renameProject(projectId, next);
      }
    } catch (error) {
      // swallow; keep original name on failure
      debugLogger.error("Failed to rename project", {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      onRenameComplete?.();
      renameActionRef.current = "none";
    }
  };

  const cancelRename = () => {
    setRenameDraft(projectName);
    onRenameComplete?.();
  };

  return (
    <Box
      data-project-id={projectId ?? "__ungrouped"}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={isUngrouped || isRenaming ? undefined : onToggleCollapse} // Disable toggle while renaming
      sx={{
        display: "flex",
        alignItems: "center",
        px: 2,
        py: 1.5,
        cursor: isUngrouped ? "default" : "pointer", // No pointer cursor for ungrouped
        bgcolor: (isDragOver || isTouchTarget)
          ? alpha(projectColor || theme.palette.primary.main, 0.1)
          : undefined,
        border: (isDragOver || isTouchTarget)
          ? `2px dashed ${projectColor || theme.palette.primary.main}`
          : "2px solid transparent",
        borderRadius: (isDragOver || isTouchTarget) ? 1 : 0,
        transition: "all 0.2s ease",
        "&:hover": !isUngrouped ? { // Only show hover for projects, not ungrouped
          bgcolor: alpha(theme.palette.text.primary, 0.04),
        } : {},
      }}
    >
      {/* Project Icon */}
      <Avatar
        sx={{
          bgcolor: isUngrouped 
            ? alpha(theme.palette.text.disabled, 0.1)
            : projectColor || theme.palette.grey[400],
          width: 28,
          height: 28,
          mr: 1.5,
        }}
      >
        {isUngrouped ? (
          <InboxIcon 
            fontSize="small" 
            sx={{ 
              color: theme.palette.text.disabled,
              opacity: 0.7,
            }} 
          />
        ) : (
          <Icon fontSize="small" />
        )}
      </Avatar>
      
      {/* Project Name */}
      {isRenaming && !isUngrouped ? (
        <TextField
          value={renameDraft}
          onChange={(e) => setRenameDraft(e.target.value)}
          onBlur={() => {
            // If cancel/delete was initiated, skip committing on blur
            if (renameActionRef.current === "delete") {
              renameActionRef.current = "none";
              return;
            }
            // If explicit save already triggered, do nothing
            if (renameActionRef.current === "save") {
              renameActionRef.current = "none";
              return;
            }
            commitRename();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") { 
              renameActionRef.current = "save"; 
              commitRename();
            }
            if (e.key === "Escape") {
              renameActionRef.current = "delete";
              if (onRenameCancelDelete) {
                onRenameCancelDelete();
              } else {
                cancelRename();
              }
            }
          }}
          variant="standard"
          autoFocus
          fullWidth
          inputProps={{
            style: {
              fontSize: "0.875rem",
              fontWeight: 600,
            },
          }}
          sx={{
            flex: 1,
            mr: 2,
            '& .MuiInputBase-input': {
              color: theme.palette.text.primary,
            },
          }}
        />
      ) : (
        <Typography
          variant="subtitle2"
          sx={{
            flex: 1,
            fontWeight: 600,
            color: isUngrouped 
              ? theme.palette.text.disabled
              : theme.palette.text.primary,
            fontSize: "0.875rem",
            opacity: isUngrouped ? 0.8 : 1,
          }}
        >
          {projectName}
          {isDragOver && (
            <Typography 
              component="span" 
              variant="caption" 
              sx={{ 
                ml: 1, 
                color: projectColor || theme.palette.primary.main,
                fontWeight: 500,
              }}
            >
              Drop here
            </Typography>
          )}
        </Typography>
      )}
      
      {/* Conversation Count */}
      <Chip
        label={conversationCount}
        size="small"
        sx={{
          bgcolor: isUngrouped
            ? alpha(theme.palette.text.disabled, 0.1)
            : alpha(projectColor || theme.palette.primary.main, 0.15),
          color: isUngrouped
            ? theme.palette.text.disabled
            : projectColor || theme.palette.primary.main,
          minWidth: 28,
          height: 22,
          mr: 1,
          opacity: isUngrouped ? 0.7 : 1,
          "& .MuiChip-label": {
            fontSize: "0.7rem",
            px: 0.5,
            fontWeight: 600,
          },
        }}
      />

      {/* Rename actions when inline editing */}
      {isRenaming && !isUngrouped && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 1 }}>
          <Tooltip title="Cancel and remove">
            <IconButton
              size="small"
              onMouseDown={(e) => {
                e.stopPropagation();
                // Mark delete intent before blur fires
                renameActionRef.current = "delete";
                onRenameCancelDelete ? onRenameCancelDelete() : cancelRename();
              }}
              sx={{ color: alpha(theme.palette.error.main, 0.9) }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Save">
            <IconButton
              size="small"
              onMouseDown={(e) => {
                e.stopPropagation();
                renameActionRef.current = "save";
                commitRename();
              }}
              sx={{ color: theme.palette.success.main }}
            >
              <CheckIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Add Conversation Button (on hover) - Hidden for ungrouped to discourage usage */}
      {isHovered && !isDragOver && !isUngrouped && !isRenaming && (
        <Tooltip title={`Add conversation to ${projectName.toLowerCase()}`} arrow>
          <IconButton
            onClick={handleAddConversation}
            size="small"
            sx={{
              color: projectColor || theme.palette.primary.main,
              bgcolor: alpha(projectColor || theme.palette.primary.main, 0.1),
              width: 24,
              height: 24,
              mr: 0.5,
              "&:hover": {
                bgcolor: alpha(projectColor || theme.palette.primary.main, 0.2),
                transform: "scale(1.1)",
              },
              transition: "all 0.2s ease",
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      
      {/* Expand/Collapse Button - Hidden for ungrouped */}
      {!isUngrouped && !isRenaming && (
        <IconButton 
          size="small"
          sx={{
            color: theme.palette.text.secondary,
            transition: "transform 0.2s ease",
          }}
        >
          {isCollapsed ? (
            <ExpandMoreIcon fontSize="small" />
          ) : (
            <ExpandLessIcon fontSize="small" />
          )}
        </IconButton>
      )}
    </Box>
  );
};

export default ProjectHeader;

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

// Bandit Engine Watermark: BL-WM-034C-6B5D35
const __banditFingerprint_chat_simpleconversationitemtsx = 'BL-FP-F0F022-71F5';
const __auditTrail_chat_simpleconversationitemtsx = 'BL-AU-MGOIKVV6-OIQT';
// File: simple-conversation-item.tsx | Path: src/chat/simple-conversation-item.tsx | Hash: 034c71f5

import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  MoveToInbox as MoveIcon,
} from "@mui/icons-material";
import { useTheme, alpha } from "@mui/material/styles";
import { Conversation } from "../store/conversationStore";

interface SimpleConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename?: (newName: string) => void;
  onMove?: () => void;
  projectColor?: string;
  // Optional short preview shown when searching
  snippet?: string;
  // Search query for highlighting
  searchQuery?: string;
  onTouchDragStart?: (conversation: Conversation, touch: React.Touch) => void;
  onTouchDragMove?: (touch: React.Touch) => void;
  onTouchDragEnd?: (touch?: React.Touch) => void;
  isTouchDragActive?: boolean;
}

const SimpleConversationItem: React.FC<SimpleConversationItemProps> = ({
  conversation,
  isSelected,
  onSelect,
  onDelete,
  onRename,
  onMove,
  projectColor,
  snippet,
  searchQuery,
  onTouchDragStart,
  onTouchDragMove,
  onTouchDragEnd,
  isTouchDragActive,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(conversation.name);
  const [isDragging, setIsDragging] = useState(false);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const longPressTimeoutRef = useRef<number | null>(null);
  const touchStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const activeTouchIdRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  // Helper function to highlight search terms
  const highlightText = (text: string, query?: string) => {
    if (!query || !query.trim()) {
      return text;
    }

    const regex = new RegExp(`(${query.trim()})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => 
      regex.test(part) ? (
        <Box
          component="span"
          key={index}
          sx={{
            bgcolor: alpha(theme.palette.warning.main, 0.3),
            color: theme.palette.text.primary,
            fontWeight: 600,
            borderRadius: 0.5,
            px: 0.25,
          }}
        >
          {part}
        </Box>
      ) : part
    );
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setEditName(conversation.name);

    if (isMobile) {
      setShowRenameDialog(true);
    } else {
      setIsEditing(true);
    }

    handleMenuClose();
  };

  const handleMove = () => {
    if (onMove) {
      onMove();
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete();
    handleMenuClose();
  };

  const commitRename = () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      return;
    }

    if (trimmed !== conversation.name) {
      onRename?.(trimmed);
    }

    setEditName(trimmed);
  };

  const handleSaveEdit = () => {
    commitRename();
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(conversation.name);
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData("text/plain", conversation.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const cancelLongPress = () => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile || isEditing) return;
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    touchStartPointRef.current = { x: touch.clientX, y: touch.clientY };
    activeTouchIdRef.current = touch.identifier;
    suppressClickRef.current = false;
    cancelLongPress();
    const initialTouch = touch;
    longPressTimeoutRef.current = window.setTimeout(() => {
      if (activeTouchIdRef.current !== null) {
        setIsTouchDragging(true);
        onTouchDragStart?.(conversation, initialTouch);
      }
    }, 350);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    const targetTouch = activeTouchIdRef.current !== null
      ? Array.from(e.touches).find(t => t.identifier === activeTouchIdRef.current)
      : e.touches[0];

    if (!targetTouch) return;

    if (isTouchDragging) {
      if (e.cancelable) {
        e.preventDefault();
      }
      onTouchDragMove?.(targetTouch);
      return;
    }

    const startPoint = touchStartPointRef.current;
    if (startPoint) {
      const deltaX = Math.abs(targetTouch.clientX - startPoint.x);
      const deltaY = Math.abs(targetTouch.clientY - startPoint.y);
      if (deltaX > 8 || deltaY > 8) {
        cancelLongPress();
      }
    }
  };

  const finalizeTouchDrag = (touch?: React.Touch) => {
    if (isTouchDragging) {
      onTouchDragEnd?.(touch);
      suppressClickRef.current = true;
    }
    setIsTouchDragging(false);
    activeTouchIdRef.current = null;
    touchStartPointRef.current = null;
    cancelLongPress();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    const touch = activeTouchIdRef.current !== null
      ? Array.from(e.changedTouches).find(t => t.identifier === activeTouchIdRef.current)
      : e.changedTouches[0];
    finalizeTouchDrag(touch);
  };

  const handleTouchCancel = () => {
    if (!isMobile) return;
    finalizeTouchDrag();
  };

  useEffect(() => {
    if (!isTouchDragActive && isTouchDragging) {
      setIsTouchDragging(false);
    }
  }, [isTouchDragActive, isTouchDragging]);

  return (
    <>
      <Box
      data-project-id={conversation.projectId ?? "__ungrouped"}
      draggable={!isMobile && !isEditing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onClick={
        isEditing || isTouchDragging
          ? undefined
          : (event) => {
              if (suppressClickRef.current) {
                suppressClickRef.current = false;
                event.preventDefault();
                event.stopPropagation();
                return;
              }
              onSelect();
            }
      }
      sx={{
        display: "flex",
        alignItems: "center",
        px: 2,
        py: 1.5,
        mx: 1,
        borderRadius: 1,
        cursor: isEditing || isTouchDragging ? "default" : "pointer",
        bgcolor: isSelected 
          ? alpha(projectColor || theme.palette.primary.main, 0.15)
          : "transparent",
        border: isSelected 
          ? `1px solid ${alpha(projectColor || theme.palette.primary.main, 0.3)}`
          : "1px solid transparent",
        opacity: isDragging || isTouchDragActive ? 0.55 : 1,
        transition: "all 0.2s ease",
        transform: isTouchDragActive ? "scale(0.98)" : "none",
        boxShadow: isTouchDragActive
          ? `0 12px 24px ${alpha(theme.palette.common.black, 0.25)}`
          : undefined,
        touchAction: isTouchDragActive ? "none" : undefined,
        userSelect: isTouchDragging || isTouchDragActive ? "none" : undefined,
        WebkitUserSelect: isTouchDragging || isTouchDragActive ? "none" : undefined,
        "&:hover": !isEditing && !isTouchDragging ? {
          bgcolor: alpha(theme.palette.text.primary, 0.04),
        } : {},
        // Better touch handling on mobile
        ...(isMobile && {
          minHeight: 48, // Larger touch target
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          "&:active": {
            bgcolor: alpha(theme.palette.text.primary, 0.08),
          },
        }),
      }}
    >
      {/* Drag Handle */}
      {!isMobile && !isEditing && (
        <DragIcon 
          sx={{ 
            color: theme.palette.text.disabled,
            mr: 1,
            cursor: "grab",
            fontSize: "1rem",
            "&:active": {
              cursor: "grabbing",
            },
          }} 
        />
      )}

      {/* Conversation Name */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <TextField
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSaveEdit();
              } else if (e.key === "Escape") {
                handleCancelEdit();
              }
            }}
            size="small"
            variant="standard"
            autoFocus
            fullWidth
            sx={{
              "& .MuiInput-root": {
                fontSize: "0.875rem",
              },
            }}
          />
        ) : (
          <Typography
            variant="body2"
            sx={{
              fontWeight: isSelected ? 600 : 400,
              color: isSelected 
                ? projectColor || theme.palette.primary.main
                : theme.palette.text.primary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: "0.875rem",
            }}
          >
            {highlightText(conversation.name, searchQuery)}
          </Typography>
        )}

        {/* Optional snippet preview when searching */}
        {!isEditing && snippet && (
          <Typography
            variant="caption"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              color: alpha(theme.palette.text.secondary, 0.9),
              mt: 0.25,
              lineHeight: 1.3,
              fontSize: "0.72rem",
            }}
            title={snippet}
          >
            {highlightText(snippet, searchQuery)}
          </Typography>
        )}
      </Box>

      {/* Menu Button */}
      {!isEditing && (
        <IconButton
          onClick={handleMenuOpen}
          size="small"
          sx={{
            opacity: isMobile ? 1 : (isSelected ? 1 : 0), // Always visible on mobile
            color: theme.palette.text.secondary,
            ml: 1,
            minWidth: 32,
            minHeight: 32,
            transition: "opacity 0.2s ease",
            ".MuiBox-root:hover &": {
              opacity: 1,
            },
            // Larger touch target on mobile
            ...(isMobile && {
              padding: 1,
              "&:before": {
                content: '""',
                position: "absolute",
                top: -8,
                left: -8,
                right: -8,
                bottom: -8,
              },
            }),
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()} // Prevent menu clicks from bubbling
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            // Larger menu items on mobile for easier touch
            ...(isMobile && {
              "& .MuiMenuItem-root": {
                minHeight: 48,
                fontSize: "1rem",
              },
            }),
          },
        }}
      >
        {onRename && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Rename</ListItemText>
          </MenuItem>
        )}
        {onMove && (
          <MenuItem onClick={handleMove}>
            <ListItemIcon>
              <MoveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Move to Project</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
      </Box>

      {/* Mobile rename dialog */}
      {isMobile && (
        <Dialog
          open={showRenameDialog}
          onClose={() => {
            setShowRenameDialog(false);
            setEditName(conversation.name);
          }}
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              pb: 1,
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>Rename Conversation</DialogTitle>
          <DialogContent>
            <TextField
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
              fullWidth
              placeholder="Enter a new name"
              InputProps={{
                sx: { fontSize: "1rem" },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => {
                setShowRenameDialog(false);
                setEditName(conversation.name);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                commitRename();
                setShowRenameDialog(false);
              }}
              variant="contained"
              disabled={!editName.trim() || editName.trim() === conversation.name}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default SimpleConversationItem;

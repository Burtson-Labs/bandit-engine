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

// Bandit Engine Watermark: BL-WM-5D28-BF4E58
const __banditFingerprint_chat_conversationitemtsx = 'BL-FP-7770FD-59FF';
const __auditTrail_chat_conversationitemtsx = 'BL-AU-MGOIKVUZ-06AQ';
// File: conversation-item.tsx | Path: src/chat/conversation-item.tsx | Hash: 5d2859ff

import React, { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Fade,
  useMediaQuery,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  DragIndicator as DragIcon,
  MoveToInbox as MoveIcon,
  ContentCopy as CopyIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from "@mui/icons-material";
import { useTheme, alpha } from "@mui/material/styles";
import { Conversation } from "../store/conversationStore";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  isCurrent: boolean;
  multiSelectMode: boolean;
  editingId: string | null;
  nameDraft: string;
  onEdit: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onMove: (id: string) => void;
  onSetNameDraft: (name: string) => void;
  onSetEditingId: (id: string | null) => void;
  onToggleSelection: (id: string) => void;
  index: number;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent, conversation: Conversation) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetConversation: Conversation) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  isCurrent,
  multiSelectMode,
  editingId,
  nameDraft,
  onEdit,
  onDelete,
  onClick,
  onRename,
  onMove,
  onSetNameDraft,
  onSetEditingId,
  onToggleSelection,
  index,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false); // Future feature

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleRename = () => {
    onSetEditingId(conversation.id);
    onSetNameDraft(conversation.name);
    handleMenuClose();
  };

  const handleMove = () => {
    onMove(conversation.id);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete(conversation.id);
    handleMenuClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (nameDraft.trim()) {
        onRename(conversation.id, nameDraft.trim());
      }
      onSetEditingId(null);
    } else if (e.key === "Escape") {
      onSetEditingId(null);
    }
  };

  const handleBlur = () => {
    if (nameDraft.trim()) {
      onRename(conversation.id, nameDraft.trim());
    }
    onSetEditingId(null);
  };

  const isEditing = editingId === conversation.id;
  const showActions = (isHovered || isEditing) && !multiSelectMode;

  return (
    <Fade in={true} timeout={200 + index * 50}>
      <Box
        draggable={!isEditing && !isMobile}
        onDragStart={onDragStart ? (e) => onDragStart(e, conversation) : undefined}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={onDrop ? (e) => onDrop(e, conversation) : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onClick(conversation.id)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          cursor: isDragging ? "grabbing" : "pointer",
          bgcolor: isSelected 
            ? alpha(theme.palette.error.main, 0.1) 
            : isCurrent 
            ? alpha(theme.palette.primary.main, 0.08)
            : isDragging
            ? alpha(theme.palette.primary.main, 0.05)
            : undefined,
          borderLeft: isCurrent 
            ? `3px solid ${theme.palette.primary.main}` 
            : "3px solid transparent",
          borderTop: isDragging ? `2px solid ${theme.palette.primary.main}` : undefined,
          transition: "all 0.2s ease",
          position: "relative",
          opacity: isDragging ? 0.7 : 1,
          transform: isDragging ? "scale(1.02)" : "scale(1)",
          "&:hover": {
            backgroundColor: isSelected
              ? alpha(theme.palette.error.main, 0.15)
              : isCurrent
              ? alpha(theme.palette.primary.main, 0.12)
              : alpha(theme.palette.text.primary, 0.04),
            transform: isDragging ? "scale(1.02)" : "translateX(2px)",
          },
          // Drag feedback
          "&[draggable='true']:hover": {
            cursor: "grab",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, minWidth: 0 }}>
          {/* Drag Handle */}
          {!isMobile && !multiSelectMode && showActions && (
            <DragIcon 
              fontSize="small" 
              sx={{ 
                color: alpha(theme.palette.text.secondary, 0.5),
                cursor: "grab",
                "&:hover": {
                  color: theme.palette.text.secondary,
                }
              }} 
            />
          )}

          {/* Selection Checkbox or Status Dot */}
          {multiSelectMode ? (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelection(conversation.id);
              }}
              sx={{ 
                color: isSelected ? theme.palette.error.main : theme.palette.text.secondary,
                p: 0.5,
              }}
            >
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  border: `2px solid ${isSelected ? theme.palette.error.main : theme.palette.text.secondary}`,
                  borderRadius: 1,
                  bgcolor: isSelected ? theme.palette.error.main : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isSelected && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      bgcolor: "white",
                      borderRadius: 0.5,
                    }}
                  />
                )}
              </Box>
            </IconButton>
          ) : (
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: isCurrent 
                ? theme.palette.primary.main 
                : alpha(theme.palette.text.secondary, 0.3),
              flexShrink: 0,
              transition: "all 0.2s ease",
            }} />
          )}
          
          {/* Conversation Name/Edit Field */}
          {isEditing ? (
            <TextField
              value={nameDraft}
              onChange={(e) => onSetNameDraft(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              size="small"
              variant="standard"
              fullWidth
              autoFocus
              sx={{ 
                "& .MuiInputBase-input": { 
                  color: theme.palette.text.primary, 
                  fontSize: "0.875rem",
                  py: 0.5,
                },
                "& .MuiInput-underline:before": {
                  borderBottomColor: alpha(theme.palette.text.secondary, 0.3),
                },
                "& .MuiInput-underline:after": {
                  borderBottomColor: theme.palette.primary.main,
                },
              }}
            />
          ) : (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  color: isCurrent ? theme.palette.primary.main : theme.palette.text.primary,
                  fontWeight: isCurrent ? 600 : 400,
                  fontSize: "0.875rem",
                  lineHeight: 1.2,
                }}
              >
                {conversation.name}
              </Typography>
              
              {/* Subtitle/metadata */}
              <Typography variant="caption" sx={{
                color: alpha(theme.palette.text.secondary, 0.8),
                fontSize: "0.7rem",
                display: "block",
              }}>
                {isCurrent && "Current chat"} 
                {conversation.history.length > 0 && !isCurrent && `${conversation.history.length} messages`}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0, ml: 1 }}>
          {isMobile ? (
            // Mobile: Always show menu button
            <IconButton
              onClick={handleMenuClick}
              size="small"
              sx={{ 
                color: alpha(theme.palette.text.secondary, 0.7),
                "&:hover": { 
                  color: theme.palette.text.primary,
                  bgcolor: alpha(theme.palette.text.primary, 0.08),
                }
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          ) : (
            // Desktop: Show actions on hover
            showActions && !isEditing && (
              <>
                <Tooltip title="Rename">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRename();
                    }}
                    size="small"
                    sx={{ 
                      color: alpha(theme.palette.text.secondary, 0.7),
                      "&:hover": { 
                        color: theme.palette.text.primary,
                        bgcolor: alpha(theme.palette.text.primary, 0.08),
                      }
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="More actions">
                  <IconButton
                    onClick={handleMenuClick}
                    size="small"
                    sx={{ 
                      color: alpha(theme.palette.text.secondary, 0.7),
                      "&:hover": { 
                        color: theme.palette.text.primary,
                        bgcolor: alpha(theme.palette.text.primary, 0.08),
                      }
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )
          )}
        </Box>

        {/* Context Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          {!isEditing && (
            <MenuItem onClick={handleRename}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Rename</ListItemText>
            </MenuItem>
          )}
          
          <MenuItem onClick={handleMove}>
            <ListItemIcon>
              <MoveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Move to project</ListItemText>
          </MenuItem>

          {/* Future features */}
          <MenuItem onClick={() => setIsPinned(!isPinned)}>
            <ListItemIcon>
              {isPinned ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{isPinned ? "Unpin" : "Pin"}</ListItemText>
          </MenuItem>

          <MenuItem onClick={() => navigator.clipboard.writeText(conversation.name)}>
            <ListItemIcon>
              <CopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Copy name</ListItemText>
          </MenuItem>
          
          <MenuItem 
            onClick={handleDelete}
            sx={{ color: theme.palette.error.main }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </Fade>
  );
};

export default ConversationItem;
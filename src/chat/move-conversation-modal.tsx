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

// Bandit Engine Watermark: BL-WM-EA1F-008865
const __banditFingerprint_chat_moveconversationmodaltsx = 'BL-FP-DB7872-D83A';
const __auditTrail_chat_moveconversationmodaltsx = 'BL-AU-MGOIKVV4-0HEP';
// File: move-conversation-modal.tsx | Path: src/chat/move-conversation-modal.tsx | Hash: ea1fd83a

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Avatar,
  Radio,
  Box,
  Divider,
} from "@mui/material";
import {
  Folder as FolderIcon,
  Inbox as InboxIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useProjectStore } from "../store/projectStore";
import { useConversationStore, Conversation } from "../store/conversationStore";
import { debugLogger } from "../services/logging/debugLogger";

interface MoveConversationModalProps {
  open: boolean;
  onClose: () => void;
  conversations: Conversation[];
  currentProjectId?: string | null;
}

const MoveConversationModal: React.FC<MoveConversationModalProps> = ({
  open,
  onClose,
  conversations,
  currentProjectId = null,
}) => {
  const theme = useTheme();
  const { projects, _hasHydrated, hydrate } = useProjectStore();
  const { moveConversationToProject } = useConversationStore();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    currentProjectId
  );

  useEffect(() => {
    if (open && !_hasHydrated) {
      hydrate();
    }
  }, [open, _hasHydrated, hydrate]);

  useEffect(() => {
    setSelectedProjectId(currentProjectId);
  }, [currentProjectId, open]);

  const handleMove = async () => {
    try {
      await Promise.all(
        conversations.map((conv) =>
          moveConversationToProject(conv.id, selectedProjectId)
        )
      );
      onClose();
    } catch (error) {
      debugLogger.error("Failed to move conversations", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const conversationCount = conversations.length;
  const isMultiple = conversationCount > 1;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle>
        Move {isMultiple ? `${conversationCount} Conversations` : "Conversation"}
      </DialogTitle>

      <DialogContent sx={{ px: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isMultiple
            ? `Select a project to move ${conversationCount} conversations to:`
            : `Select a project to move "${conversations[0]?.name}" to:`}
        </Typography>

        <List>
          {/* No Project (Ungrouped) Option */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => setSelectedProjectId(null)}
              selected={selectedProjectId === null}
            >
              <ListItemIcon>
                <Radio
                  checked={selectedProjectId === null}
                  onChange={() => setSelectedProjectId(null)}
                  size="small"
                />
              </ListItemIcon>
              <ListItemIcon>
                <Avatar
                  sx={{
                    bgcolor: theme.palette.grey[400],
                    width: 32,
                    height: 32,
                  }}
                >
                  <InboxIcon />
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary="No Project"
                secondary="Keep conversations ungrouped"
              />
            </ListItemButton>
          </ListItem>

          <Divider sx={{ my: 1 }} />

          {/* Project Options */}
          {projects.map((project) => (
            <ListItem key={project.id} disablePadding>
              <ListItemButton
                onClick={() => setSelectedProjectId(project.id)}
                selected={selectedProjectId === project.id}
              >
                <ListItemIcon>
                  <Radio
                    checked={selectedProjectId === project.id}
                    onChange={() => setSelectedProjectId(project.id)}
                    size="small"
                  />
                </ListItemIcon>
                <ListItemIcon>
                  <Avatar
                    sx={{
                      bgcolor: project.color,
                      width: 32,
                      height: 32,
                    }}
                  >
                    <FolderIcon />
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={project.name}
                  secondary={project.description}
                />
              </ListItemButton>
            </ListItem>
          ))}

          {projects.length === 0 && (
            <Box sx={{ 
              textAlign: "center", 
              py: 2,
              color: theme.palette.text.secondary 
            }}>
              <Typography variant="body2">
                No projects available. Create a project first to organize conversations.
              </Typography>
            </Box>
          )}
        </List>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleMove}
          variant="contained"
          disabled={selectedProjectId === currentProjectId}
        >
          Move {isMultiple ? "Conversations" : "Conversation"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MoveConversationModal;

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

// Bandit Engine Watermark: BL-WM-7E50-31A9C6
const __banditFingerprint_chat_quickaddprojectbuttontsx = 'BL-FP-26E5DF-29B5';
const __auditTrail_chat_quickaddprojectbuttontsx = 'BL-AU-MGOIKVV6-Q9I2';
// File: quick-add-project-button.tsx | Path: src/chat/quick-add-project-button.tsx | Hash: 7e5029b5

import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useProjectStore } from "../store/projectStore";

interface QuickAddProjectButtonProps {
  variant?: "button" | "fab" | "icon";
  size?: "small" | "medium" | "large";
  onProjectCreated?: (projectId: string) => void;
}

const DEFAULT_COLORS = [
  "#2196F3", "#4CAF50", "#FF9800", "#9C27B0", "#F44336",
  "#00BCD4", "#FFEB3B", "#795548", "#607D8B", "#E91E63",
];

const QuickAddProjectButton: React.FC<QuickAddProjectButtonProps> = ({
  variant = "button",
  size = "medium",
  onProjectCreated,
}) => {
  const theme = useTheme();
  const { createProject, projects } = useProjectStore();
  
  const [open, setOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setOpen(true);
    setProjectName("");
    setDescription("");
    setSelectedColor(DEFAULT_COLORS[projects.length % DEFAULT_COLORS.length]);
    setError(null);
  };

  const handleClose = () => {
    if (!loading) {
      setOpen(false);
    }
  };

  const handleCreate = async () => {
    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newProject = await createProject(
        projectName,
        description.trim() || undefined,
        selectedColor
      );
      
      onProjectCreated?.(newProject.id);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !loading) {
      handleCreate();
    }
  };

  const buttonContent = (
    <>
      <AddIcon fontSize={size} />
      {variant === "button" && "New Project"}
    </>
  );

  const triggerButton = variant === "button" ? (
    <Button
      startIcon={<AddIcon />}
      onClick={handleOpen}
      variant="outlined"
      size={size}
      sx={{ textTransform: "none" }}
    >
      New Project
    </Button>
  ) : (
    <Button
      onClick={handleOpen}
      size={size}
      sx={{ 
        minWidth: "auto",
        p: variant === "icon" ? 1 : 1.5,
        aspectRatio: variant === "icon" ? "1" : "auto",
      }}
    >
      {buttonContent}
    </Button>
  );

  return (
    <>
      {triggerButton}
      
      <Dialog
        open={open}
        onClose={handleClose}
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
          Create New Project
        </DialogTitle>

        <DialogContent sx={{ pb: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyPress={handleKeyPress}
              fullWidth
              required
              disabled={loading}
              autoFocus
            />
            
            <TextField
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyPress={handleKeyPress}
              fullWidth
              multiline
              rows={2}
              disabled={loading}
            />
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Color
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {DEFAULT_COLORS.map((color) => (
                  <Box
                    key={color}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: color,
                      cursor: "pointer",
                      border: selectedColor === color 
                        ? `3px solid ${theme.palette.primary.main}` 
                        : "2px solid transparent",
                      "&:hover": {
                        transform: "scale(1.1)",
                      },
                      transition: "all 0.2s",
                    }}
                    onClick={() => !loading && setSelectedColor(color)}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            variant="contained"
            disabled={loading || !projectName.trim()}
            startIcon={loading && <CircularProgress size={16} />}
          >
            Create Project
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuickAddProjectButton;
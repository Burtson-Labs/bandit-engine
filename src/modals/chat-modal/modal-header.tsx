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

// Bandit Engine Watermark: BL-WM-9B91-D4125E
const __banditFingerprint_chatmodal_modalheadertsx = 'BL-FP-B8B72D-323D';
const __auditTrail_chatmodal_modalheadertsx = 'BL-AU-MGOIKVVN-9A3G';
// File: modal-header.tsx | Path: src/modals/chat-modal/modal-header.tsx | Hash: 9b91323d

import React, { useState } from "react";
import {
  Avatar,
  Box,
  IconButton,
  Tooltip,
  useMediaQuery,
  Theme,
  useTheme,
  Typography,
  Chip,
  Fade,
} from "@mui/material";
import MinimizeIcon from "@mui/icons-material/Minimize";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

const banditaiLogo = "https://cdn.burtson.ai/logos/bandit-ai-logo.png";
const banditHead = "https://cdn.burtson.ai/images/bandit-head.png";

// Utility function to determine if a color is light or dark
const getContrastTextColor = (backgroundColor: string): string => {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance using the relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return dark text for light backgrounds, light text for dark backgrounds
  return luminance > 0.6 ? '#2f2f2f' : '#ffffff';
};

interface ModalHeaderProps {
  fullScreen: boolean;
  setFullScreen: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
  onDrawerOpen: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  logo?: string;
  historyCount?: number;
  onManualFullscreenToggle?: () => void;
  onExitFullscreen?: () => void; // Add callback for exiting fullscreen
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  fullScreen,
  setFullScreen,
  onClose,
  onDrawerOpen,
  onMouseDown,
  logo,
  historyCount = 0,
  onManualFullscreenToggle,
  onExitFullscreen,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const displayLogo = logo && logo !== banditaiLogo ? logo : banditHead;
  const [isHovering, setIsHovering] = useState(false);

  // Enhanced button styles for modern UX - Fixed jitter
  const buttonStyles = {
    transition: "all 0.15s ease-out",
    borderRadius: "8px",
    minWidth: "36px",
    minHeight: "36px",
    "&:hover": {
      bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      // Removed transform to prevent jitter
    },
    "&:active": {
      bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
    },
  };

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag from interfering
    onClose();
  };

  const handleToggleFullScreen = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag from interfering
    
    const wasFullScreen = fullScreen;
    
    // When user manually toggles fullscreen, we should respect their choice
    // and not re-trigger auto fullscreen for this session
    setFullScreen((prev) => !prev);
    
    // If exiting fullscreen, trigger repositioning
    if (wasFullScreen && onExitFullscreen) {
      // Use setTimeout to ensure the fullscreen state has updated
      setTimeout(() => {
        onExitFullscreen();
      }, 100);
    }
    
    // Reset auto fullscreen tracking when user manually toggles
    // This prevents auto-fullscreen from interfering with user's choice
    if (onManualFullscreenToggle) {
      onManualFullscreenToggle();
    }
  };

  return (
    <Box
      onMouseDown={onMouseDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "grab",
        userSelect: "none",
        mb: 2,
        p: 1.5,
        borderRadius: "16px",
        bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
        border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
        backdropFilter: "blur(12px)",
        transition: "all 0.2s ease-out",
        "&:hover": {
          bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          borderColor: theme.palette.primary.main + "50",
          boxShadow: `0 8px 32px ${theme.palette.mode === "dark" ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.15)"}`,
          // Removed transform to prevent layout shifts
        },
        "&:active": {
          cursor: "grabbing",
        },
      }}
    >
      {/* Left Section - Avatar and Status */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
        <Avatar
          src={displayLogo}
          alt="AI Assistant"
          sx={{ 
            width: fullScreen ? 72 : 60,
            height: fullScreen ? 72 : 60,
            bgcolor: theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.04)",
            border: "2px solid #a78bfa",
            boxShadow: "0 0 8px rgba(167, 139, 250, 0.3)",
            filter: "brightness(1.05)",
            color: "#fff",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              backgroundColor: theme.palette.mode === "dark" 
                ? "rgba(255,255,255,0.08)" 
                : "rgba(0,0,0,0.05)",
              transform: "scale(1.02)",
            }
          }}
        />
        
        <Fade in={isHovering && !fullScreen}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <DragIndicatorIcon 
              sx={{ 
                color: theme.palette.text.secondary, 
                fontSize: "1.2rem",
                opacity: 0.6,
              }} 
            />
            <Typography 
              variant="caption" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontWeight: 500,
              }}
            >
              Drag to move
            </Typography>
          </Box>
        </Fade>
      </Box>

      {/* Right Section - Controls */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>        
        <Tooltip title="Chat History" arrow>
          <IconButton
            aria-label="Open chat history"
            onClick={(e) => {
              e.stopPropagation();
              onDrawerOpen();
            }}
            sx={{
              ...buttonStyles,
              position: "relative",
              color: theme.palette.text.primary,
            }}
          >
            <HistoryIcon />
            {historyCount > 0 && (
              <Chip
                label={historyCount > 99 ? "99+" : historyCount}
                size="small"
                sx={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  height: 18,
                  fontSize: "0.65rem",
                  bgcolor: theme.palette.primary.main,
                  color: "white",
                  "& .MuiChip-label": {
                    px: 0.5,
                  },
                }}
              />
            )}
          </IconButton>
        </Tooltip>
        
        {!isMobile && (
          <Tooltip title={fullScreen ? "Exit Fullscreen" : "Enter Fullscreen"} arrow>
            <IconButton
              aria-label={fullScreen ? "exit fullscreen" : "enter fullscreen"}
              onClick={handleToggleFullScreen}
              sx={{
                ...buttonStyles,
                color: theme.palette.text.primary,
                bgcolor: fullScreen ? theme.palette.primary.main + "20" : "transparent",
              }}
            >
              {fullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        )}
        
        <Tooltip title="Minimize" arrow>
          <IconButton
            aria-label="minimize window"
            onClick={handleMinimize}
            sx={{
              ...buttonStyles,
              color: theme.palette.warning.main,
            }}
          >
            <MinimizeIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Close" arrow>
          <IconButton 
            aria-label="close window" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            sx={{
              ...buttonStyles,
              color: theme.palette.error.main,
              "&:hover": {
                bgcolor: theme.palette.error.main + "15",
                color: theme.palette.error.main,
                // Removed transform to prevent jitter
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default ModalHeader;

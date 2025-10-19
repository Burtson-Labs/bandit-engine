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

// Bandit Engine Watermark: BL-WM-22A7-982C6E
const __banditFingerprint_chat_chatscrolltobottombuttontsx = 'BL-FP-4E93B8-6C94';
const __auditTrail_chat_chatscrolltobottombuttontsx = 'BL-AU-MGOIKVUX-MLTK';
// File: chat-scroll-to-bottom-button.tsx | Path: src/chat/chat-scroll-to-bottom-button.tsx | Hash: 22a76c94

import React from "react";
import { IconButton } from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

interface Props {
  inputHeight: number;
  onClick: () => void;
  drawerOpen?: boolean;
  isMobile?: boolean;
}

const ChatScrollToBottomButton: React.FC<Props> = ({ 
  inputHeight, 
  onClick, 
  drawerOpen = false, 
  isMobile = false 
}) => {
  
  return (
    <IconButton
      onClick={onClick}
      sx={{
        position: "fixed",
        left: drawerOpen && !isMobile ? "calc(50% + 170px)" : "50%",
        transform: "translateX(-50%)",
        bottom: inputHeight + 10,
        bgcolor: (theme) => theme.palette.background.paper,
        color: (theme) => theme.palette.text.primary,
        border: "1px solid",
        borderColor: (theme) => theme.palette.divider,
        zIndex: 999,
        boxShadow: 3,
        transition: "bottom 0.3s ease, left 0.3s ease-in-out",
        "&:hover": {
          bgcolor: (theme) => theme.palette.action.hover,
        },
      }}
    >
      <ArrowDownwardIcon sx={{ color: "inherit" }} />
    </IconButton>
  );
};

export default ChatScrollToBottomButton;

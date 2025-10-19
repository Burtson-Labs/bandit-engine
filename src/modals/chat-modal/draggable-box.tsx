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

// Bandit Engine Watermark: BL-WM-454A-7DF312
const __banditFingerprint_chatmodal_draggableboxtsx = 'BL-FP-50DD87-AE7B';
const __auditTrail_chatmodal_draggableboxtsx = 'BL-AU-MGOIKVVN-95O3';
// File: draggable-box.tsx | Path: src/modals/chat-modal/draggable-box.tsx | Hash: 454aae7b

import React, { useEffect, useState } from "react";
import { Box, useTheme, Fade } from "@mui/material";

interface DraggableBoxProps {
  children: React.ReactNode;
  fullScreen: boolean;
  position: { x: number; y: number };
  setPosition: (pos: { x: number; y: number }) => void;
  onDrag: (e: MouseEvent) => void;
  onScrollThresholdExceeded?: () => void;
}

const SCROLLABLE_THRESHOLD = 200;

const DraggableBox = React.forwardRef<HTMLDivElement, DraggableBoxProps>(
  (
    { children, fullScreen, position, setPosition, onDrag, onScrollThresholdExceeded },
    ref
  ) => {
    const theme = useTheme();
    const [transitionProps, setTransitionProps] = useState("all");
    const [isDragging, setIsDragging] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    
    useEffect(() => {
      if (ref && typeof ref !== "function" && ref.current && !fullScreen) {
        const modal = ref.current;
        const contentHeight = modal.scrollHeight;
        const modalHeight = modal.clientHeight;
        const hasOverflow = contentHeight > modalHeight + SCROLLABLE_THRESHOLD;
        
        if (hasOverflow) {
          onScrollThresholdExceeded?.();
        }
      }
    }, [children, fullScreen, onScrollThresholdExceeded, ref]);

    return (
      <Fade in timeout={300}>
        <Box
          ref={ref}
          tabIndex={-1}
          onMouseDown={(e) => {
            setTransitionProps("none");
            setIsDragging(true);
          }}
          onMouseUp={(e) => {
            setTransitionProps("all");
            setIsDragging(false);
          }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          sx={{
            transitionProperty: transitionProps,
            transitionDuration: fullScreen ? "0.4s" : "0.3s",
            transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            position: "absolute",
            top: fullScreen ? 0 : position.y,
            left: fullScreen ? 0 : position.x,
            width: fullScreen ? "calc(100vw)" : "90vw",
            maxWidth: fullScreen ? "100vw" : 600,
            height: fullScreen ? "100vh" : "auto",
            minHeight: fullScreen ? "100vh" : "fit-content",
            maxHeight: fullScreen ? "100vh" : "85vh", // Add max height for scrolling
            overflow: "hidden", // Prevent modal itself from scrolling
            bgcolor: theme.palette.background.paper,
            borderRadius: fullScreen ? 0 : "20px",
            boxShadow: fullScreen 
              ? "none" 
              : isDragging
              ? `0 25px 50px ${theme.palette.mode === "dark" ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)"}`
              : isHovering
              ? `0 16px 32px ${theme.palette.mode === "dark" ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.25)"}`
              : `0 12px 24px ${theme.palette.mode === "dark" ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.2)"}`,
            p: fullScreen ? 2 : 3,
            display: "flex",
            flexDirection: "column",
            outline: "none",
            backdropFilter: fullScreen ? "none" : "blur(20px)",
            border: fullScreen 
              ? "none" 
              : `1px solid ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
            // Removed transform to prevent jitter and layout shifts
            "&:focus": {
              outline: `2px solid ${theme.palette.primary.main}40`,
              outlineOffset: "2px",
            },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {children}
          </Box>
        </Box>
      </Fade>
    );
  }
);

export default DraggableBox;

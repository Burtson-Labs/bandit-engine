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

// Bandit Engine Watermark: BL-WM-2EDD-8CF0D8
const __banditFingerprint_feedback_FeedbackButtontsx = 'BL-FP-CF95AD-701C';
const __auditTrail_feedback_FeedbackButtontsx = 'BL-AU-MGOIKVV9-IZZG';
// File: FeedbackButton.tsx | Path: src/components/feedback/FeedbackButton.tsx | Hash: 2edd701c

import React, { useState } from 'react';
import {
  Fab,
  Tooltip,
  useTheme,
  Zoom,
  Button,
  IconButton,
} from '@mui/material';
import {
  Feedback as FeedbackIcon,
} from '@mui/icons-material';
import { FeedbackModal } from './index';

export interface FeedbackButtonProps {
  /** Whether the parent component is in fullscreen mode */
  fullScreen?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Z-index override */
  zIndex?: number;
  /** Custom feedback email (overrides package settings) */
  feedbackEmail?: string;
  /** Show as inline button instead of floating */
  inline?: boolean;
  /** Custom button text for inline mode */
  buttonText?: string;
  /** Custom size */
  size?: 'small' | 'medium' | 'large';
  /** Custom positioning */
  position?: {
    bottom?: number | string;
    right?: number | string;
    top?: number | string;
    left?: number | string;
  };
  /** Use absolute positioning instead of fixed (for modal contexts) */
  absolute?: boolean;
}

export const FeedbackButton: React.FC<FeedbackButtonProps> = ({
  fullScreen = false,
  className,
  zIndex = 1400,
  feedbackEmail,
  inline = false,
  buttonText = "Send Feedback",
  size = 'small',
  position,
  absolute = false,
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // If inline mode, render as a regular button
  if (inline) {
    return (
      <>
        {buttonText ? (
          <Button
            variant="outlined"
            startIcon={<FeedbackIcon />}
            onClick={handleOpen}
            className={className}
            size={size}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: theme.shadows[4],
              },
            }}
          >
            {buttonText}
          </Button>
        ) : (
          <Tooltip title="Send Feedback" arrow>
            <IconButton
              onClick={handleOpen}
              className={className}
              size={size}
              sx={{
                color: theme.palette.primary.main,
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: theme.palette.primary.main + '15',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <FeedbackIcon />
            </IconButton>
          </Tooltip>
        )}

        <FeedbackModal 
          open={open} 
          onClose={handleClose}
          feedbackEmail={feedbackEmail}
        />
      </>
    );
  }

  // Floating FAB mode
  return (
    <>
      <Zoom in={true} timeout={300}>
        <Tooltip 
          title="Send Feedback" 
          placement="left"
          arrow
        >
          <Fab
            size={size}
            onClick={handleOpen}
            className={className}
            sx={{
              position: absolute ? 'absolute' : 'relative',
              ...(absolute && {
                bottom: position?.bottom ?? (fullScreen ? 16 : 20),
                right: position?.right ?? 16,
                top: position?.top,
                left: position?.left,
              }),
              zIndex,
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 32px rgba(0,0,0,0.4)' 
                : '0 8px 32px rgba(0,0,0,0.15)',
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
                transform: 'scale(1.05) translateY(-2px)',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 12px 40px rgba(0,0,0,0.5)' 
                  : '0 12px 40px rgba(0,0,0,0.2)',
              },
              '&:active': {
                transform: 'scale(0.98) translateY(0px)',
              },
              // Subtle pulsing animation
              animation: 'feedbackPulse 3s ease-in-out infinite',
              '@keyframes feedbackPulse': {
                '0%, 100%': {
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 8px 32px rgba(0,0,0,0.4)' 
                    : '0 8px 32px rgba(0,0,0,0.15)',
                },
                '50%': {
                  boxShadow: theme.palette.mode === 'dark' 
                    ? `0 8px 32px ${theme.palette.primary.main}40` 
                    : `0 8px 32px ${theme.palette.primary.main}30`,
                },
              },
            }}
          >
            <FeedbackIcon />
          </Fab>
        </Tooltip>
      </Zoom>

      <FeedbackModal 
        open={open} 
        onClose={handleClose}
        feedbackEmail={feedbackEmail}
      />
    </>
  );
};

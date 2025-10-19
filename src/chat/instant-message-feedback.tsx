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

// Bandit Engine Watermark: BL-WM-707B-6626B1
const __banditFingerprint_chat_instantmessagefeedbacktsx = 'BL-FP-B6ADB9-9955';
const __auditTrail_chat_instantmessagefeedbacktsx = 'BL-AU-MGOIKVV3-J5V3';
// File: instant-message-feedback.tsx | Path: src/chat/instant-message-feedback.tsx | Hash: 707b9955

import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, useTheme } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import SignalWifiStatusbar4BarIcon from "@mui/icons-material/SignalWifiStatusbar4Bar";
import SignalWifi2BarIcon from "@mui/icons-material/SignalWifi2Bar";

interface InstantMessageFeedbackProps {
  message: string;
  images?: string[];
  onConfirmed?: () => void;
  isNetworkSlow?: boolean;
}

export const InstantMessageFeedback: React.FC<InstantMessageFeedbackProps> = ({
  message,
  images,
  onConfirmed,
  isNetworkSlow = false,
}) => {
  const theme = useTheme();
  const [phase, setPhase] = useState<"sending" | "sent" | "confirmed">("sending");
  const [networkTimeout, setNetworkTimeout] = useState(false);

  useEffect(() => {
    // Show as "sent" after 100ms for instant feedback
    const sentTimer = setTimeout(() => setPhase("sent"), 100);
    
    // Show network warning if no confirmation after 3 seconds
    const networkTimer = setTimeout(() => setNetworkTimeout(true), 3000);
    
    // Auto-confirm after reasonable delay if no manual confirmation
    const confirmTimer = setTimeout(() => {
      setPhase("confirmed");
      onConfirmed?.();
    }, 5000);

    return () => {
      clearTimeout(sentTimer);
      clearTimeout(networkTimer);
      clearTimeout(confirmTimer);
    };
  }, [onConfirmed]);

  const getStatusIcon = () => {
    if (phase === "confirmed") {
      return <CheckCircleIcon sx={{ color: "success.main", fontSize: 16 }} />;
    }
    
    if (networkTimeout && isNetworkSlow) {
      return <WifiOffIcon sx={{ color: "warning.main", fontSize: 16 }} />;
    }
    
    if (isNetworkSlow) {
      return <SignalWifi2BarIcon sx={{ color: "warning.main", fontSize: 16 }} />;
    }
    
    if (phase === "sent") {
      return <SignalWifiStatusbar4BarIcon sx={{ color: "success.main", fontSize: 16 }} />;
    }
    
    return (
      <CircularProgress 
        size={16} 
        thickness={5}
        sx={{ color: "primary.main" }}
      />
    );
  };

  const getStatusText = () => {
    if (phase === "confirmed") return "Delivered";
    if (networkTimeout && isNetworkSlow) return "Slow connection";
    if (isNetworkSlow) return "Sending (slow network)";
    if (phase === "sent") return "Sent";
    return "Sending";
  };

  return (
    <Box
      sx={{
        bgcolor: theme.palette.mode === "dark" ? "rgba(33, 150, 243, 0.1)" : "rgba(25, 118, 210, 0.05)",
        border: `1px solid ${theme.palette.mode === "dark" ? "rgba(33, 150, 243, 0.3)" : "rgba(25, 118, 210, 0.2)"}`,
        borderRadius: 2,
        p: 2,
        mb: 2,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: phase === "confirmed" 
            ? "linear-gradient(90deg, transparent, #4caf50, transparent)"
            : "linear-gradient(90deg, transparent, #2196f3, transparent)",
          animation: phase === "sending" ? "shimmer 2s ease-in-out infinite" : "none",
        },
        "@keyframes shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      }}
    >
      {/* Images preview */}
      {images && images.length > 0 && (
        <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
          {images.slice(0, 3).map((img, idx) => (
            <Box
              key={idx}
              component="img"
              src={img}
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                objectFit: "cover",
                border: `1px solid ${theme.palette.divider}`,
                opacity: phase === "confirmed" ? 1 : 0.8,
              }}
            />
          ))}
          {images.length > 3 && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                bgcolor: "rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                color: "text.secondary",
              }}
            >
              +{images.length - 3}
            </Box>
          )}
        </Box>
      )}

      {/* Message text */}
      <Typography
        variant="body1"
        sx={{
          color: "text.primary",
          mb: 1,
          opacity: phase === "confirmed" ? 1 : 0.9,
          lineHeight: 1.4,
        }}
      >
        {message}
      </Typography>

      {/* Status indicator */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          justifyContent: "flex-end",
        }}
      >
        {getStatusIcon()}
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontSize: "0.75rem",
            fontWeight: 500,
          }}
        >
          {getStatusText()}
        </Typography>
      </Box>
    </Box>
  );
};

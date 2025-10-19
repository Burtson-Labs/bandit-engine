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

// Bandit Engine Watermark: BL-WM-6ED3-47FEC9
const __banditFingerprint_components_ConnectionStatustsx = 'BL-FP-C8A6D8-1324';
const __auditTrail_components_ConnectionStatustsx = 'BL-AU-MGOIKVV8-XF32';
// File: ConnectionStatus.tsx | Path: src/components/ConnectionStatus.tsx | Hash: 6ed31324

import React from "react";
import { Box, Chip, useTheme } from "@mui/material";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import SignalWifi2BarIcon from "@mui/icons-material/SignalWifi2Bar";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

interface ConnectionStatusProps {
  showWhenGood?: boolean;
  position?: "top" | "bottom";
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  showWhenGood = false,
  position = "top",
}) => {
  const theme = useTheme();
  const { isOnline, connectionQuality, isSlowConnection } = useNetworkStatus();

  // Don't show if connection is good and showWhenGood is false
  if (connectionQuality === "fast" && !showWhenGood) {
    return null;
  }

  const getStatusConfig = () => {
    switch (connectionQuality) {
      case "offline":
        return {
          icon: <WifiOffIcon sx={{ fontSize: 16 }} />,
          label: "Offline",
          color: "error" as const,
          severity: "high" as const,
        };
      case "slow":
        return {
          icon: <SignalWifi2BarIcon sx={{ fontSize: 16 }} />,
          label: "Slow connection",
          color: "warning" as const,
          severity: "medium" as const,
        };
      case "fast":
        return {
          icon: <WifiIcon sx={{ fontSize: 16 }} />,
          label: "Connected",
          color: "success" as const,
          severity: "low" as const,
        };
      default:
        return {
          icon: <WifiIcon sx={{ fontSize: 16 }} />,
          label: "Unknown",
          color: "default" as const,
          severity: "low" as const,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Box
      sx={{
        position: "fixed",
        [position]: 10,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1400,
        animation: config.severity === "high" ? "pulse 2s ease-in-out infinite" : "none",
        "@keyframes pulse": {
          "0%": { opacity: 1 },
          "50%": { opacity: 0.7 },
          "100%": { opacity: 1 },
        },
      }}
    >
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
        sx={{
          bgcolor: theme.palette.mode === "dark" 
            ? config.color === "default" 
              ? "rgba(156, 163, 175, 0.2)"
              : `rgba(${config.color === "error" ? "244, 67, 54" : config.color === "warning" ? "255, 152, 0" : "76, 175, 80"}, 0.2)`
            : config.color === "default"
              ? "rgba(156, 163, 175, 0.1)"
              : `rgba(${config.color === "error" ? "244, 67, 54" : config.color === "warning" ? "255, 152, 0" : "76, 175, 80"}, 0.1)`,
          color: `${config.color}.main`,
          border: config.color === "default" 
            ? "1px solid rgba(156, 163, 175, 0.4)"
            : `1px solid rgba(${config.color === "error" ? "244, 67, 54" : config.color === "warning" ? "255, 152, 0" : "76, 175, 80"}, 0.4)`,
          backdropFilter: "blur(10px)",
          fontWeight: 500,
          "& .MuiChip-icon": {
            color: `${config.color}.main`,
          },
        }}
      />
    </Box>
  );
};

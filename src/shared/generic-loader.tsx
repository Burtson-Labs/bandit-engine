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

// Bandit Engine Watermark: BL-WM-4E65-64BC92
const __banditFingerprint_shared_genericloadertsx = 'BL-FP-FF822C-47BD';
const __auditTrail_shared_genericloadertsx = 'BL-AU-MGOIKVW2-FIHQ';
// File: generic-loader.tsx | Path: src/shared/generic-loader.tsx | Hash: 4e6547bd

import React from "react";
import { Box, CircularProgress, useTheme } from "@mui/material";

interface GenericLoaderProps {
  size?: number;
  color?: string;
  variant?: "dots" | "spinner" | "pulse";
}

const GenericLoader: React.FC<GenericLoaderProps> = ({ 
  size = 40, 
  color,
  variant = "spinner" 
}) => {
  const theme = useTheme();
  const loaderColor = color || theme.palette.primary.main;

  if (variant === "dots") {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 1,
          py: 2,
          "@keyframes bounce": {
            "0%, 80%, 100%": {
              transform: "scale(0)",
            },
            "40%": {
              transform: "scale(1.0)",
            },
          },
        }}
      >
        {[0, 0.15, 0.3].map((delay, index) => (
          <Box
            key={index}
            sx={{
              width: 8,
              height: 8,
              backgroundColor: loaderColor,
              borderRadius: "50%",
              animation: "bounce 1.4s infinite ease-in-out both",
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </Box>
    );
  }

  if (variant === "pulse") {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 2,
          "@keyframes pulse": {
            "0%": {
              transform: "scale(0.9)",
              opacity: 1,
            },
            "50%": {
              transform: "scale(1.1)",
              opacity: 0.7,
            },
            "100%": {
              transform: "scale(0.9)",
              opacity: 1,
            },
          },
        }}
      >
        <Box
          sx={{
            width: size,
            height: size,
            borderRadius: "50%",
            backgroundColor: loaderColor,
            animation: "pulse 1.5s infinite ease-in-out",
          }}
        />
      </Box>
    );
  }

  // Default spinner variant
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        py: 2,
      }}
    >
      <CircularProgress 
        size={size} 
        sx={{ color: loaderColor }}
      />
    </Box>
  );
};

export default GenericLoader;

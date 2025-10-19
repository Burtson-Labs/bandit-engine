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

// Bandit Engine Watermark: BL-WM-4C5D-9D0B1D
const __banditFingerprint_shared_ellipsisloadertsx = 'BL-FP-09D58B-DC34';
const __auditTrail_shared_ellipsisloadertsx = 'BL-AU-MGOIKVW2-H437';
// File: ellipsis-loader.tsx | Path: src/shared/ellipsis-loader.tsx | Hash: 4c5ddc34

import { Box } from "@mui/material";
const logoUrl = "https://cdn.burtson.ai/images/bandit-head.png";

const EllipsisLoader = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      mt: 2,
      "@keyframes pulse": {
        "0%, 100%": {
          transform: "scale(1)",
        },
        "50%": {
          transform: "scale(1.4)",
        },
      },
    }}
  >
    <img
      src={logoUrl}
      alt="logo"
      style={{
        width: 64,
        height: 64,
        margin: "0 0.5rem",
        animation: "pulse 1.4s infinite ease-in-out both",
      }}
    />
    <img
      src={logoUrl}
      alt="logo"
      style={{
        width: 64,
        height: 64,
        margin: "0 0.5rem",
        animation: "pulse 1.4s infinite ease-in-out both",
        animationDelay: ".2s",
      }}
    />
    <img
      src={logoUrl}
      alt="logo"
      style={{
        width: 64,
        height: 64,
        margin: "0 0.5rem",
        animation: "pulse 1.4s infinite ease-in-out both",
        animationDelay: ".4s",
      }}
    />
  </Box>
);

export default EllipsisLoader;

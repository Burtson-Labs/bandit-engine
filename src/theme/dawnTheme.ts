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

// Bandit Engine Watermark: BL-WM-90BA-28DE38
const __banditFingerprint_theme_dawnThemets = 'BL-FP-4593C0-E9E0';
const __auditTrail_theme_dawnThemets = 'BL-AU-MGOIKVW7-E0FE';
// File: dawnTheme.ts | Path: src/theme/dawnTheme.ts | Hash: 90bae9e0

import { createTheme, ThemeOptions } from "@mui/material/styles";

const commonOptions: Partial<ThemeOptions> = {
  typography: {
    fontFamily: `'Segoe UI', Roboto, sans-serif`,
    fontSize: 14,
    // Fix subtitle and heading variants for better dark theme contrast
    subtitle1: {
      color: 'inherit', // Use the theme's text.primary color
      fontWeight: 600,
    },
    subtitle2: {
      color: 'inherit', // Use the theme's text.primary color  
      fontWeight: 600,
    },
    h6: {
      color: 'inherit', // Use the theme's text.primary color
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
};

export const dawnLightTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: "light",
    primary: {
      main: "#e07a5f",
    },
    secondary: {
      main: "#3d405b",
    },
    background: {
      default: "#f9f6f1",
      paper: "#ffffff",
    },
    text: {
      primary: "#2f2f2f",
      secondary: "#555555",
    },
    chat: {
      shell: "#f4f1ed",
      input: "#ffffff",
      badge: "#ddd",
      badgeHover: "#bbb",
      file: "#eee",
      fileIcon: "#ccc",
      fileText: "#000",
      caption: "#555",
      suggestion: {
        background: "#f0f0f0",
        text: "#222",
        border: "#ddd",
        hoverBackground: "#e0e0e0",
        hoverBorder: "#ccc",
      },
      appBar: {
        background: "#ffffff",
        border: "#ddd",
        icon: "#000",
        iconHover: "#f0f0f0",
        menuBackground: "#f9f9f9",
        menuText: "#000",
      },
      response: {
        userBackground: "#f1ede8",
        userText: "#1565c0",
        userBorder: "#bbb",
        userBubble: "#ffffff",
        userAvatarBackground: "#cccccc",
        modelLabel: "#888",
        border: "#ccc",
        aiBackground: "#f3e9e1",
        aiText: "#1a1a1a",
        aiBorder: "#ccc",
        aiBubble: "#ffffff",
        memoryText: "#2e7d32",
        divider: "#ccc",
        containerBackground: "#f3e9e1",
      },
    },
  },
});

export const dawnDarkTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: "dark",
    primary: {
      main: "#f4a261",
    },
    secondary: {
      main: "#8d99ae",
    },
    background: {
      default: "#2e2a26",
      paper: "#38322e",
    },
    text: {
      primary: "#f1f1f1",
      secondary: "#aaaaaa",
    },
    chat: {
      shell: "#2e2a26",
      input: "#3a3530",
      badge: "#444",
      badgeHover: "#666",
      file: "#333",
      fileIcon: "#555",
      fileText: "#fff",
      caption: "#888",
      suggestion: {
        background: "#3a3530",
        text: "#ccc",
        border: "#444",
        hoverBackground: "#444",
        hoverBorder: "#666",
      },
      appBar: {
        background: "#2e2a26",
        border: "#444",
        icon: "#fff",
        iconHover: "#222",
        menuBackground: "#3a3530",
        menuText: "#fff",
      },
      response: {
        userBackground: "#524841",
        userText: "#f4a261",
        userBorder: "#666",
        userBubble: "#3a3530",
        userAvatarBackground: "transparent",
        modelLabel: "#bbb",
        border: "#444",
        aiBackground: "#3b332d",
        aiText: "#ffffff",
        aiBorder: "#666",
        aiBubble: "#443c35",
        memoryText: "#e9c46a",
        divider: "#555",
        containerBackground: "#3b332d",
      },
    },
  },
});
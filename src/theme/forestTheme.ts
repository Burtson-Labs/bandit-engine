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

// Bandit Engine Watermark: BL-WM-8607-A06051
const __banditFingerprint_theme_forestThemets = 'BL-FP-CD7FFA-4820';
const __auditTrail_theme_forestThemets = 'BL-AU-MGOIKVW7-EKGV';
// File: forestTheme.ts | Path: src/theme/forestTheme.ts | Hash: 86074820

import { createTheme, ThemeOptions } from "@mui/material/styles";

export const forestDarkTheme: ThemeOptions = createTheme({
  typography: {
    fontFamily: '"Source Sans Pro", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    // Fix subtitle and heading variants for better contrast
    subtitle1: {
      color: 'inherit',
      fontWeight: 600,
    },
    subtitle2: {
      color: 'inherit',
      fontWeight: 600,
    },
    h6: {
      color: 'inherit',
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
          backgroundImage: 'none',
        },
      },
    },
  },
  palette: {
    mode: "dark",
    primary: {
      main: "#4caf50", // Forest green
      light: "#6fbf73",
      dark: "#357a38",
    },
    secondary: {
      main: "#8bc34a", // Light green
      light: "#a2cf6e",
      dark: "#618833",
    },
    background: {
      default: "#1b2e20", // Deep forest
      paper: "#2c4332",
    },
    text: {
      primary: "#e8f5e8",
      secondary: "#c8e6c9",
    },
    divider: "#4caf50",
    chat: {
      shell: "#2c4332",
      input: "#2c4332", 
      badge: "#4caf50",
      badgeHover: "#6fbf73",
      file: "#388e3c",
      fileIcon: "#8bc34a",
      fileText: "#e8f5e8",
      caption: "#c8e6c9",
      suggestion: {
        background: "#2c4332",
        text: "#e8f5e8",
        border: "#4caf50",
        hoverBackground: "#388e3c",
        hoverBorder: "#8bc34a",
      },
      appBar: {
        background: "linear-gradient(135deg, #1b2e20 0%, #2c4332 100%)",
        border: "#4caf50",
        icon: "#8bc34a",
        iconHover: "#4caf50",
        menuBackground: "#2c4332",
        menuText: "#e8f5e8",
      },
      response: {
        userBackground: "#388e3c",
        userText: "#e8f5e8",
        userBorder: "#4caf50",
        userBubble: "#2c4332",
        userAvatarBackground: "#4caf50",
        modelLabel: "#c8e6c9",
        border: "#388e3c",
        aiBackground: "#1b2e20",
        aiText: "#e8f5e8",
        aiBorder: "#388e3c",
        aiBubble: "#2c4332",
        memoryText: "#c8e6c9",
        divider: "#388e3c",
        containerBackground: "#1b2e20",
      },
    },
  },
});

export const forestLightTheme: ThemeOptions = createTheme({
  typography: {
    fontFamily: '"Source Sans Pro", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    // Fix subtitle and heading variants for better contrast
    subtitle1: {
      color: 'inherit',
      fontWeight: 600,
    },
    subtitle2: {
      color: 'inherit',
      fontWeight: 600,
    },
    h6: {
      color: 'inherit',
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
          backgroundImage: 'none',
        },
      },
    },
  },
  palette: {
    mode: "light",
    primary: {
      main: "#2e7d32", // Deep green
      light: "#4caf50",
      dark: "#1b5e20",
    },
    secondary: {
      main: "#66bb6a", // Medium green
      light: "#81c784",
      dark: "#4caf50",
    },
    background: {
      default: "#f1f8e9", // Very light green
      paper: "#ffffff",
    },
    text: {
      primary: "#1b5e20",
      secondary: "#2e7d32",
    },
    divider: "#c8e6c9",
    chat: {
      shell: "#ffffff",
      input: "#ffffff",
      badge: "#2e7d32",
      badgeHover: "#1b5e20",
      file: "#c8e6c9",
      fileIcon: "#2e7d32",
      fileText: "#1b5e20",
      caption: "#2e7d32",
      suggestion: {
        background: "#ffffff",
        text: "#1b5e20",
        border: "#c8e6c9",
        hoverBackground: "#f1f8e9",
        hoverBorder: "#2e7d32",
      },
      appBar: {
        background: "linear-gradient(135deg, #f1f8e9 0%, #ffffff 100%)",
        border: "#c8e6c9",
        icon: "#2e7d32",
        iconHover: "#1b5e20",
        menuBackground: "#ffffff",
        menuText: "#1b5e20",
      },
      response: {
        userBackground: "#c8e6c9",
        userText: "#1b5e20",
        userBorder: "#2e7d32",
        userBubble: "#ffffff",
        userAvatarBackground: "#2e7d32",
        modelLabel: "#2e7d32",
        border: "#c8e6c9",
        aiBackground: "#f1f8e9",
        aiText: "#1b5e20",
        aiBorder: "#c8e6c9",
        aiBubble: "#ffffff",
        memoryText: "#2e7d32",
        divider: "#c8e6c9",
        containerBackground: "#f1f8e9",
      },
    },
  },
});

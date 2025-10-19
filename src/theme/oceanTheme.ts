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

// Bandit Engine Watermark: BL-WM-47A2-A8A3C4
const __banditFingerprint_theme_oceanThemets = 'BL-FP-A38F0D-008A';
const __auditTrail_theme_oceanThemets = 'BL-AU-MGOIKVW8-NS7W';
// File: oceanTheme.ts | Path: src/theme/oceanTheme.ts | Hash: 47a2008a

import { createTheme, ThemeOptions } from "@mui/material/styles";

export const oceanDarkTheme: ThemeOptions = createTheme({
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    subtitle1: { color: 'inherit', fontWeight: 600 },
    subtitle2: { color: 'inherit', fontWeight: 600 },
    h6: { color: 'inherit', fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
  palette: {
    mode: "dark",
    primary: {
      main: "#00bcd4", // Cyan
      light: "#33c9dc",
      dark: "#0097a7",
    },
    secondary: {
      main: "#004d5a", // Deep ocean blue
      light: "#336b7a",
      dark: "#00363f",
    },
    background: {
      default: "#0a1929", // Deep ocean
      paper: "#1a2332",
    },
    text: {
      primary: "#e1f5fe",
      secondary: "#b3e5fc",
    },
    divider: "#004d5a",
    chat: {
      shell: "#1a2332",
      input: "#1a2332", 
      badge: "#00bcd4",
      badgeHover: "#33c9dc",
      file: "#004d5a",
      fileIcon: "#00bcd4",
      fileText: "#e1f5fe",
      caption: "#b3e5fc",
      suggestion: {
        background: "#1a2332",
        text: "#e1f5fe",
        border: "#004d5a",
        hoverBackground: "#004d5a",
        hoverBorder: "#00bcd4",
      },
      appBar: {
        background: "linear-gradient(135deg, #0a1929 0%, #1a2332 100%)",
        border: "#004d5a",
        icon: "#00bcd4",
        iconHover: "#33c9dc",
        menuBackground: "#1a2332",
        menuText: "#e1f5fe",
      },
      response: {
        userBackground: "#004d5a",
        userText: "#e1f5fe",
        userBorder: "#00bcd4",
        userBubble: "#1a2332",
        userAvatarBackground: "#00bcd4",
        modelLabel: "#b3e5fc",
        border: "#004d5a",
        aiBackground: "#0a1929",
        aiText: "#e1f5fe",
        aiBorder: "#004d5a",
        aiBubble: "#1a2332",
        memoryText: "#b3e5fc",
        divider: "#004d5a",
        containerBackground: "#0a1929",
      },
    },
  },
});

export const oceanLightTheme: ThemeOptions = createTheme({
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    subtitle1: { color: 'inherit', fontWeight: 600 },
    subtitle2: { color: 'inherit', fontWeight: 600 },
    h6: { color: 'inherit', fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
  palette: {
    mode: "light",
    primary: {
      main: "#006064", // Deep teal
      light: "#33878a",
      dark: "#00424a",
    },
    secondary: {
      main: "#b2dfdb", // Light teal
      light: "#c4e9e5",
      dark: "#7c9c98",
    },
    background: {
      default: "#e0f2f1", // Very light teal
      paper: "#ffffff",
    },
    text: {
      primary: "#263238",
      secondary: "#37474f",
    },
    divider: "#b2dfdb",
    chat: {
      shell: "#ffffff",
      input: "#ffffff",
      badge: "#006064",
      badgeHover: "#00424a",
      file: "#b2dfdb",
      fileIcon: "#006064",
      fileText: "#263238",
      caption: "#37474f",
      suggestion: {
        background: "#ffffff",
        text: "#263238",
        border: "#b2dfdb",
        hoverBackground: "#b2dfdb",
        hoverBorder: "#006064",
      },
      appBar: {
        background: "linear-gradient(135deg, #e0f2f1 0%, #ffffff 100%)",
        border: "#b2dfdb",
        icon: "#006064",
        iconHover: "#00424a",
        menuBackground: "#ffffff",
        menuText: "#263238",
      },
      response: {
        userBackground: "#b2dfdb",
        userText: "#263238",
        userBorder: "#006064",
        userBubble: "#ffffff",
        userAvatarBackground: "#006064",
        modelLabel: "#37474f",
        border: "#b2dfdb",
        aiBackground: "#e0f2f1",
        aiText: "#263238",
        aiBorder: "#b2dfdb",
        aiBubble: "#ffffff",
        memoryText: "#37474f",
        divider: "#b2dfdb",
        containerBackground: "#e0f2f1",
      },
    },
  },
});

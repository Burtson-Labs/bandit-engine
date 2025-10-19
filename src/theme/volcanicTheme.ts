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

// Bandit Engine Watermark: BL-WM-A3A4-E272F3
const __banditFingerprint_theme_volcanicThemets = 'BL-FP-70BB83-F816';
const __auditTrail_theme_volcanicThemets = 'BL-AU-MGOIKVW9-OKGG';
// File: volcanicTheme.ts | Path: src/theme/volcanicTheme.ts | Hash: a3a4f816

import { createTheme, ThemeOptions } from "@mui/material/styles";

export const volcanicDarkTheme: ThemeOptions = createTheme({
  typography: {
    fontFamily: '"Rajdhani", "Roboto Condensed", "Arial", sans-serif',
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
      main: "#d32f2f", // Lava red
      light: "#f44336",
      dark: "#b71c1c",
    },
    secondary: {
      main: "#ff5722", // Magma orange
      light: "#ff7043",
      dark: "#e64a19",
    },
    background: {
      default: "#0f0f0f", // Volcanic ash dark
      paper: "#1c1c1c",
    },
    text: {
      primary: "#ffebee",
      secondary: "#ffcdd2",
    },
    divider: "#424242",
    chat: {
      shell: "#1c1c1c",
      input: "#1c1c1c", 
      badge: "#d32f2f",
      badgeHover: "#f44336",
      file: "#424242",
      fileIcon: "#ff5722",
      fileText: "#ffebee",
      caption: "#ffcdd2",
      suggestion: {
        background: "#1c1c1c",
        text: "#ffebee",
        border: "#d32f2f",
        hoverBackground: "#424242",
        hoverBorder: "#ff5722",
      },
      appBar: {
        background: "linear-gradient(135deg, #0f0f0f 0%, #1c1c1c 100%)",
        border: "#d32f2f",
        icon: "#ff5722",
        iconHover: "#d32f2f",
        menuBackground: "#1c1c1c",
        menuText: "#ffebee",
      },
      response: {
        userBackground: "#424242",
        userText: "#ffebee",
        userBorder: "#d32f2f",
        userBubble: "#1c1c1c",
        userAvatarBackground: "#d32f2f",
        modelLabel: "#ffcdd2",
        border: "#424242",
        aiBackground: "#0f0f0f",
        aiText: "#ffebee",
        aiBorder: "#424242",
        aiBubble: "#1c1c1c",
        memoryText: "#ffcdd2",
        divider: "#424242",
        containerBackground: "#0f0f0f",
      },
    },
  },
});

export const volcanicLightTheme: ThemeOptions = createTheme({
  typography: {
    fontFamily: '"Rajdhani", "Roboto Condensed", "Arial", sans-serif',
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
      main: "#c62828", // Deep red
      light: "#d32f2f",
      dark: "#b71c1c",
    },
    secondary: {
      main: "#e64a19", // Orange red
      light: "#ff5722",
      dark: "#d84315",
    },
    background: {
      default: "#fafafa", // Light gray
      paper: "#ffffff",
    },
    text: {
      primary: "#212121",
      secondary: "#424242",
    },
    divider: "#e0e0e0",
    chat: {
      shell: "#ffffff",
      input: "#ffffff",
      badge: "#c62828",
      badgeHover: "#b71c1c",
      file: "#e0e0e0",
      fileIcon: "#c62828",
      fileText: "#212121",
      caption: "#424242",
      suggestion: {
        background: "#ffffff",
        text: "#212121",
        border: "#e0e0e0",
        hoverBackground: "#fafafa",
        hoverBorder: "#c62828",
      },
      appBar: {
        background: "linear-gradient(135deg, #fafafa 0%, #ffffff 100%)",
        border: "#e0e0e0",
        icon: "#c62828",
        iconHover: "#b71c1c",
        menuBackground: "#ffffff",
        menuText: "#212121",
      },
      response: {
        userBackground: "#ffebee",
        userText: "#212121",
        userBorder: "#c62828",
        userBubble: "#ffffff",
        userAvatarBackground: "#c62828",
        modelLabel: "#424242",
        border: "#e0e0e0",
        aiBackground: "#fafafa",
        aiText: "#212121",
        aiBorder: "#e0e0e0",
        aiBubble: "#ffffff",
        memoryText: "#424242",
        divider: "#e0e0e0",
        containerBackground: "#fafafa",
      },
    },
  },
});

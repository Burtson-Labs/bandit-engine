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

// Bandit Engine Watermark: BL-WM-2FB5-9FBAFE
const __banditFingerprint_theme_sunsetThemets = 'BL-FP-24A802-D6E1';
const __auditTrail_theme_sunsetThemets = 'BL-AU-MGOIKVW8-OQ60';
// File: sunsetTheme.ts | Path: src/theme/sunsetTheme.ts | Hash: 2fb5d6e1

import { createTheme, ThemeOptions } from "@mui/material/styles";

export const sunsetDarkTheme: ThemeOptions = createTheme({
  typography: {
    fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif',
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
      main: "#ff6f00", // Deep orange
      light: "#ff8f33",
      dark: "#e65100",
    },
    secondary: {
      main: "#ff5722", // Red orange
      light: "#ff7043",
      dark: "#d84315",
    },
    background: {
      default: "#2a1c12", // Lighter default background
      paper: "#3d2b1e", // Lighter paper background
    },
    text: {
      primary: "#fff3e0",
      secondary: "#ffcc02",
    },
    divider: "#bf360c",
    chat: {
      shell: "#2d1b14",
      input: "#2d1b14", // Changed from light text color to proper dark background
      badge: "#ff6f00",
      badgeHover: "#ff8f33",
      file: "#bf360c",
      fileIcon: "#ffcc02",
      fileText: "#fff3e0",
      caption: "#ffcc02",
      suggestion: {
        background: "#3d2b1e", // Lighter background for better readability
        text: "#fff3e0",
        border: "#ff6f00",
        hoverBackground: "#4d3b2e", // Even lighter on hover
        hoverBorder: "#ffcc02",
      },
      appBar: {
        background: "linear-gradient(135deg, #2a1c12 0%, #3d2b1e 100%)", // Lighter gradient
        border: "#ff6f00",
        icon: "#ffcc02",
        iconHover: "#ff6f00",
        menuBackground: "#3d2b1e", // Lighter menu background
        menuText: "#fff3e0",
      },
      response: {
        userBackground: "#bf360c",
        userText: "#fff3e0",
        userBorder: "#ff6f00",
        userBubble: "#3d2b1e", // Lighter bubble background
        userAvatarBackground: "#ff6f00",
        modelLabel: "#ffcc02",
        border: "#bf360c",
        aiBackground: "#2a1c12", // Slightly lighter AI background
        aiText: "#fff3e0",
        aiBorder: "#bf360c",
        aiBubble: "#3d2b1e", // Lighter bubble background
        memoryText: "#ffcc02",
        divider: "#bf360c",
        containerBackground: "#2a1c12", // Slightly lighter container background
      },
    },
  },
});

export const sunsetLightTheme: ThemeOptions = createTheme({
  typography: {
    fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif',
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
      main: "#e65100", // Orange
      light: "#ff6f00",
      dark: "#bf360c",
    },
    secondary: {
      main: "#ff9800", // Amber
      light: "#ffa726",
      dark: "#f57c00",
    },
    background: {
      default: "#fff8f3", // Very light orange
      paper: "#ffffff",
    },
    text: {
      primary: "#bf360c",
      secondary: "#e65100",
    },
    divider: "#ffcc80",
    chat: {
      shell: "#ffffff",
      input: "#bf360c",
      badge: "#e65100",
      badgeHover: "#bf360c",
      file: "#ffcc80",
      fileIcon: "#e65100",
      fileText: "#bf360c",
      caption: "#e65100",
      suggestion: {
        background: "#ffffff",
        text: "#bf360c",
        border: "#ffcc80",
        hoverBackground: "#fff8f3",
        hoverBorder: "#e65100",
      },
      appBar: {
        background: "linear-gradient(135deg, #fff8f3 0%, #ffffff 100%)",
        border: "#ffcc80",
        icon: "#e65100",
        iconHover: "#bf360c",
        menuBackground: "#ffffff",
        menuText: "#bf360c",
      },
      response: {
        userBackground: "#ffcc80",
        userText: "#bf360c",
        userBorder: "#e65100",
        userBubble: "#ffffff",
        userAvatarBackground: "#e65100",
        modelLabel: "#e65100",
        border: "#ffcc80",
        aiBackground: "#fff8f3",
        aiText: "#bf360c",
        aiBorder: "#ffcc80",
        aiBubble: "#ffffff",
        memoryText: "#e65100",
        divider: "#ffcc80",
        containerBackground: "#fff8f3",
      },
    },
  },
});

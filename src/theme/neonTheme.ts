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

// Bandit Engine Watermark: BL-WM-DF3D-6B964A
const __banditFingerprint_theme_neonThemets = 'BL-FP-8779EF-B7A1';
const __auditTrail_theme_neonThemets = 'BL-AU-MGOIKVW8-H00L';
// File: neonTheme.ts | Path: src/theme/neonTheme.ts | Hash: df3db7a1

import { createTheme, ThemeOptions } from "@mui/material/styles";

export const neonDarkTheme: ThemeOptions = createTheme({
  typography: {
    fontFamily: '"Orbitron", "Monaco", "Courier New", monospace',
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
      main: "#ff0080", // Hot pink neon
      light: "#ff4da1",
      dark: "#cc0066",
    },
    secondary: {
      main: "#00ffff", // Cyan neon
      light: "#33ffff",
      dark: "#00cccc",
    },
    background: {
      default: "#0d0d0d", // Deep black
      paper: "#1a1a1a",
    },
    text: {
      primary: "#ffffff",
      secondary: "#ff0080",
    },
    divider: "#333333",
    chat: {
      shell: "#1a1a1a",
      input: "#1a1a1a",
      badge: "#ff0080",
      badgeHover: "#ff4da1",
      file: "#333333",
      fileIcon: "#00ffff",
      fileText: "#ffffff",
      caption: "#ff0080",
      suggestion: {
        background: "#1a1a1a",
        text: "#ffffff",
        border: "#ff0080",
        hoverBackground: "#333333",
        hoverBorder: "#00ffff",
      },
      appBar: {
        background: "linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%)",
        border: "#ff0080",
        icon: "#00ffff",
        iconHover: "#ff0080",
        menuBackground: "#1a1a1a",
        menuText: "#ffffff",
      },
      response: {
        userBackground: "#333333",
        userText: "#ffffff",
        userBorder: "#ff0080",
        userBubble: "#1a1a1a",
        userAvatarBackground: "#ff0080",
        modelLabel: "#ff0080",
        border: "#333333",
        aiBackground: "#0d0d0d",
        aiText: "#ffffff",
        aiBorder: "#333333",
        aiBubble: "#1a1a1a",
        memoryText: "#00ffff",
        divider: "#333333",
        containerBackground: "#0d0d0d",
      },
    },
  },
});

export const neonLightTheme: ThemeOptions = createTheme({
  typography: {
    fontFamily: '"Orbitron", "Monaco", "Courier New", monospace',
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
      main: "#e91e63", // Vibrant pink
      light: "#f06292",
      dark: "#ad1457",
    },
    secondary: {
      main: "#00acc1", // Vibrant cyan
      light: "#26c6da",
      dark: "#00838f",
    },
    background: {
      default: "#f8f8f8",
      paper: "#ffffff",
    },
    text: {
      primary: "#212121",
      secondary: "#e91e63",
    },
    divider: "#e0e0e0",
    chat: {
      shell: "#ffffff",
      input: "#ffffff",
      badge: "#e91e63",
      badgeHover: "#ad1457",
      file: "#e0e0e0",
      fileIcon: "#00acc1",
      fileText: "#212121",
      caption: "#e91e63",
      suggestion: {
        background: "#ffffff",
        text: "#212121",
        border: "#e91e63",
        hoverBackground: "#f8f8f8",
        hoverBorder: "#00acc1",
      },
      appBar: {
        background: "linear-gradient(135deg, #f8f8f8 0%, #ffffff 100%)",
        border: "#e91e63",
        icon: "#00acc1",
        iconHover: "#e91e63",
        menuBackground: "#ffffff",
        menuText: "#212121",
      },
      response: {
        userBackground: "#f8f8f8",
        userText: "#212121",
        userBorder: "#e91e63",
        userBubble: "#ffffff",
        userAvatarBackground: "#e91e63",
        modelLabel: "#e91e63",
        border: "#e0e0e0",
        aiBackground: "#f8f8f8",
        aiText: "#212121",
        aiBorder: "#e0e0e0",
        aiBubble: "#ffffff",
        memoryText: "#00acc1",
        divider: "#e0e0e0",
        containerBackground: "#f8f8f8",
      },
    },
  },
});

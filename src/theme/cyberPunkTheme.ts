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

// Bandit Engine Watermark: BL-WM-558E-84B97F
const __banditFingerprint_theme_cyberPunkThemets = 'BL-FP-D0CD8A-872D';
const __auditTrail_theme_cyberPunkThemets = 'BL-AU-MGOIKVW7-6OGC';
// File: cyberPunkTheme.ts | Path: src/theme/cyberPunkTheme.ts | Hash: 558e872d

import { createTheme } from "@mui/material/styles";
import { ThemeOptions } from "@mui/material/styles";

const commonOptions: Partial<ThemeOptions> = {
  typography: {
    fontFamily: `'Orbitron', 'Segoe UI', Roboto, sans-serif`,
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

export const cyberPunkDarkTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: "dark",
    primary: {
      main: "#ff00ff",
    },
    secondary: {
      main: "#00ffff",
    },
    background: {
      default: "#0a0a0a",
      paper: "#1a1a1a",
    },
    text: {
      primary: "#e0e0e0",
      secondary: "#9c9c9c",
    },
    chat: {
      shell: "#0a0a0a",
      input: "#1a1a1a",
      badge: "#290033",
      badgeHover: "#3f004d",
      file: "#2d2d2d",
      fileIcon: "#d500f9",
      fileText: "#ffffff",
      caption: "#ff80ab",
      suggestion: {
        background: "#1a1a1a",
        text: "#e0e0e0",
        border: "#ff00ff",
        hoverBackground: "#2c2c2c",
        hoverBorder: "#ff80ff",
      },
      appBar: {
        background: "#0a0a0a",
        border: "#2c2c2c",
        icon: "#ff00ff",
        iconHover: "#ff80ff",
        menuBackground: "#1c1c1c",
        menuText: "#ffffff",
      },
      response: {
        userBackground: "#290033",
        userText: "#ffccff",
        userBorder: "#ff80ff",
        userBubble: "#330044",
        userAvatarBackground: "#ff00ff",
        modelLabel: "#ff80ff",
        border: "#ff00ff",
        aiBackground: "#1a1a1a",
        aiText: "#ffffff",
        aiBorder: "#ff00ff",
        aiBubble: "#1f002a",
        memoryText: "#00e676",
        divider: "#ff00ff",
        containerBackground: "#100010",
      },
    },
  },
});

export const cyberPunkLightTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: "light",
    primary: {
      main: "#d500f9",
    },
    secondary: {
      main: "#00bcd4",
    },
    background: {
      default: "#fdf6ff",
      paper: "#ffffff",
    },
    text: {
      primary: "#1a1a1a",
      secondary: "#555",
    },
    chat: {
      shell: "#fdf6ff",
      input: "#fdf6ff",
      badge: "#e0b3ff",
      badgeHover: "#cc99ff",
      file: "#f8e8ff",
      fileIcon: "#aa00ff",
      fileText: "#000",
      caption: "#9c27b0",
      suggestion: {
        background: "#f3e5f5",
        text: "#4a148c",
        border: "#ce93d8",
        hoverBackground: "#e1bee7",
        hoverBorder: "#ba68c8",
      },
      appBar: {
        background: "#fdf6ff",
        border: "#ce93d8",
        icon: "#aa00ff",
        iconHover: "#d500f9",
        menuBackground: "#f3e5f5",
        menuText: "#4a148c",
      },
      response: {
        userBackground: "#f3e5f5",
        userText: "#4a148c",
        userBorder: "#ba68c8",
        userBubble: "#ffffff",
        userAvatarBackground: "#aa00ff",
        modelLabel: "#6a1b9a",
        border: "#ce93d8",
        aiBackground: "#f8e8ff",
        aiText: "#1a1a1a",
        aiBorder: "#ba68c8",
        aiBubble: "#f3e5f5",
        memoryText: "#2e7d32",
        divider: "#ba68c8",
        containerBackground: "#fce4ec",
      },
    },
  },
});
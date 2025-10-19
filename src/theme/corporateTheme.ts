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

// Bandit Engine Watermark: BL-WM-9A1D-23CF7B
const __banditFingerprint_theme_corporateThemets = 'BL-FP-223D0C-A225';
const __auditTrail_theme_corporateThemets = 'BL-AU-MGOIKVW7-CIOP';
// File: corporateTheme.ts | Path: src/theme/corporateTheme.ts | Hash: 9a1da225

import { createTheme, ThemeOptions } from '@mui/material/styles';

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
    borderRadius: 6,
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
};

export const corporateDarkTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#0d47a1',
    },
    secondary: {
      main: '#546e7a',
    },
    background: {
      default: '#101820',
      paper: '#1c1f26',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#9e9e9e',
    },
    chat: {
      shell: '#101820',
      input: '#1c1f26',
      badge: '#263238',
      badgeHover: '#37474f',
      file: '#1a1a1a',
      fileIcon: '#607d8b',
      fileText: '#fff',
      caption: '#90a4ae',
      suggestion: {
        background: '#1e2935',
        text: '#cfd8dc',
        border: '#37474f',
        hoverBackground: '#263238',
        hoverBorder: '#455a64',
      },
      appBar: {
        background: "#0d1117",
        border: "#1f2937",
        icon: "#e0e0e0",
        iconHover: "#263238",
        menuBackground: "#1f2937",
        menuText: "#ffffff",
      },
      response: {
        userBackground: '#1e2935',
        userText: '#90caf9',
        userBorder: '#37474f',
        userBubble: '#263238',
        userAvatarBackground: 'transparent',
        modelLabel: '#b0bec5',
        border: '#455a64',
        aiBackground: '#1f2733',
        aiText: '#ffffff',
        aiBorder: '#37474f',
        aiBubble: '#2c3e50',
        memoryText: '#4db6ac',
        divider: '#546e7a',
        containerBackground: '#1c1f26',
      },
    },
  },
});

export const corporateLightTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: 'light',
    primary: {
      main: '#1565c0',
    },
    secondary: {
      main: '#607d8b',
    },
    background: {
      default: '#f7f9fc',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#616161',
    },
    chat: {
      shell: '#f2f5f9',
      input: '#ffffff',
      badge: '#cfd8dc',
      badgeHover: '#b0bec5',
      file: '#e0e0e0',
      fileIcon: '#546e7a',
      fileText: '#000',
      caption: '#607d8b',
      suggestion: {
        background: '#e3f2fd',
        text: '#1565c0',
        border: '#bbdefb',
        hoverBackground: '#d0e9ff',
        hoverBorder: '#90caf9',
      },
      appBar: {
        background: "#ffffff",
        border: "#e0e0e0",
        icon: "#000",
        iconHover: "#eeeeee",
        menuBackground: "#f0f0f0",
        menuText: "#000",
      },
      response: {
        userBackground: '#e3f2fd',
        userText: '#0d47a1',
        userBorder: '#90caf9',
        userBubble: '#ffffff',
        userAvatarBackground: '#bbdefb',
        modelLabel: '#78909c',
        border: '#90a4ae',
        aiBackground: '#f0f4f8',
        aiText: '#212121',
        aiBorder: '#cfd8dc',
        aiBubble: '#ffffff',
        memoryText: '#00796b',
        divider: '#bdbdbd',
        containerBackground: '#e3f2fd',
      },
    },
  },
});
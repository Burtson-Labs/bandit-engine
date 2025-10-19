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

// Bandit Engine Watermark: BL-WM-32A4-940977
const __banditFingerprint_theme_sageThemets = 'BL-FP-A3B652-4130';
const __auditTrail_theme_sageThemets = 'BL-AU-MGOIKVW8-1SOQ';
// File: sageTheme.ts | Path: src/theme/sageTheme.ts | Hash: 32a44130

import { createTheme } from '@mui/material/styles';

export const sageLightTheme = createTheme({
  typography: {
    fontFamily: `'Segoe UI', Roboto, sans-serif`,
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
    mode: 'light',
    primary: {
      main: '#4CAF50',
    },
    secondary: {
      main: '#8BC34A',
    },
    background: {
      default: '#f8f8f4',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#555',
    },
    chat: {
      shell: '#f4f6f4',
      input: '#f0f2ef',
      badge: '#cfd8dc',
      badgeHover: '#b0bec5',
      file: '#e0f2f1',
      fileIcon: '#a5d6a7',
      fileText: '#1a1a1a',
      caption: '#5c6b5c',
      suggestion: {
        background: '#e8f5e9',
        text: '#2e7d32',
        border: '#c8e6c9',
        hoverBackground: '#dcedc8',
        hoverBorder: '#aed581',
      },
      appBar: {
        background: '#ffffff',
        border: '#c8e6c9',
        icon: '#2e7d32',
        iconHover: '#81c784',
        menuBackground: '#f1f8e9',
        menuText: '#2e7d32',
      },
      response: {
        userBackground: '#f1f8e9',
        userText: '#33691e',
        userBorder: '#aed581',
        userBubble: '#ffffff',
        userAvatarBackground: '#d0f0c0',
        modelLabel: '#689f38',
        border: '#c5e1a5',
        aiBackground: '#f0f4c3',
        aiText: '#2e7d32',
        aiBorder: '#cddc39',
        aiBubble: '#ffffff',
        memoryText: '#43a047',
        divider: '#cfd8dc',
        containerBackground: '#f8f8f4',
      },
    },
  },
});

export const sageDarkTheme = createTheme({
  typography: {
    fontFamily: `'Segoe UI', Roboto, sans-serif`,
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
    mode: 'dark',
    primary: {
      main: '#66bb6a',
    },
    secondary: {
      main: '#9ccc65',
    },
    background: {
      default: '#1c1f1c',
      paper: '#26332d',
    },
    text: {
      primary: '#e8f5e9',
      secondary: '#a5d6a7',
    },
    chat: {
      shell: '#1e221e',
      input: '#2a2f2a',
      badge: '#455a64',
      badgeHover: '#546e7a',
      file: '#37474f',
      fileIcon: '#81c784',
      fileText: '#ffffff',
      caption: '#a5d6a7',
      suggestion: {
        background: '#455e47',
        text: '#e8f5e9',
        border: '#388e3c',
        hoverBackground: '#1b5e20',
        hoverBorder: '#66bb6a',
      },
      appBar: {
        background: '#1c1f1c',
        border: '#2e7d32',
        icon: '#81c784',
        iconHover: '#a5d6a7',
        menuBackground: '#26332d',
        menuText: '#c8e6c9',
      },
      response: {
        userBackground: '#2a2f2a',
        userText: '#a5d6a7',
        userBorder: '#388e3c',
        userBubble: '#324934',
        userAvatarBackground: '#1b5e20',
        modelLabel: '#66bb6a',
        border: '#2e7d32',
        aiBackground: '#1e2f1e',
        aiText: '#ffffff',
        aiBorder: '#66bb6a',
        aiBubble: '#2e7d32',
        memoryText: '#66bb6a',
        divider: '#455a64',
        containerBackground: '#1c1f1c',
      },
    },
  },
});
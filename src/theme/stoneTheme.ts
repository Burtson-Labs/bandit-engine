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

// Bandit Engine Watermark: BL-WM-B064-6DA4AB
const __banditFingerprint_theme_stoneThemets = 'BL-FP-C51A0E-1014';
const __auditTrail_theme_stoneThemets = 'BL-AU-MGOIKVW8-CXXR';
// File: stoneTheme.ts | Path: src/theme/stoneTheme.ts | Hash: b0641014

import { createTheme } from '@mui/material/styles';

export const stoneLightTheme = createTheme({
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
      main: '#4a4a4a',
    },
    secondary: {
      main: '#767676',
    },
    background: {
      default: '#e5e5e0',
      paper: '#f0f0eb',
    },
    text: {
      primary: '#222222',
      secondary: '#555555',
    },
    chat: {
      shell: '#e5e5e0',
      input: '#f5f5f0',
      badge: '#d2d2d2',
      badgeHover: '#bababa',
      file: '#ecece8',
      fileIcon: '#aaaaaa',
      fileText: '#000000',
      caption: '#555',
      suggestion: {
        background: '#f0f0eb',
        text: '#222',
        border: '#d4d4d4',
        hoverBackground: '#e2e2e2',
        hoverBorder: '#c0c0c0',
      },
      appBar: {
        background: '#f9f9f4',
        border: '#d8d8d8',
        icon: '#1a1a1a',
        iconHover: '#e6e6e6',
        menuBackground: '#f0f0eb',
        menuText: '#1a1a1a',
      },
      response: {
        userBackground: '#efefea',
        userText: '#2e5c8a',
        userBorder: '#c5c5c5',
        userBubble: '#ffffff',
        userAvatarBackground: '#cfcfcf',
        modelLabel: '#777',
        border: '#ccc',
        aiBackground: '#e3e3dd',
        aiText: '#222',
        aiBorder: '#bbb',
        aiBubble: '#ffffff',
        memoryText: '#3c6e47',
        divider: '#ccc',
        containerBackground: '#e3e3dd',
      },
    },
  },
});

export const stoneDarkTheme = createTheme({
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
      main: '#bfbfbf',
    },
    secondary: {
      main: '#999999',
    },
    background: {
      default: '#1b1b1b',
      paper: '#262626',
    },
    text: {
      primary: '#f5f5f5',
      secondary: '#c2c2c2',
    },
    chat: {
      shell: '#1b1b1b',
      input: '#232323',
      badge: '#444',
      badgeHover: '#666',
      file: '#2d2d2d',
      fileIcon: '#888',
      fileText: '#fff',
      caption: '#888',
      suggestion: {
        background: '#232323',
        text: '#ccc',
        border: '#444',
        hoverBackground: '#2e2e2e',
        hoverBorder: '#666',
      },
      appBar: {
        background: '#121212',
        border: '#2c2c2c',
        icon: '#f5f5f5',
        iconHover: '#1e1e1e',
        menuBackground: '#1f1f1f',
        menuText: '#eee',
      },
      response: {
        userBackground: '#2b2b2b',
        userText: '#80b3ff',
        userBorder: '#444',
        userBubble: '#232323',
        userAvatarBackground: 'transparent',
        modelLabel: '#888',
        border: '#444',
        aiBackground: '#2d2d2d',
        aiText: '#fff',
        aiBorder: '#444',
        aiBubble: '#2d2d2d',
        memoryText: '#9ccc65',
        divider: '#555',
        containerBackground: '#1f1f1f',
      },
    },
  },
});
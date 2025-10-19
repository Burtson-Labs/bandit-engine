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

// Bandit Engine Watermark: BL-WM-0FDA-7A06F8
const __banditFingerprint_theme_neutralThemets = 'BL-FP-B03C04-FA20';
const __auditTrail_theme_neutralThemets = 'BL-AU-MGOIKVW8-1YX7';
// File: neutralTheme.ts | Path: src/theme/neutralTheme.ts | Hash: 0fdafa20

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
};

export const neutralDarkTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#4d90fe',
    },
    secondary: {
      main: '#b39ddb',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#f5f5f5',
      secondary: '#bbbbbb',
    },
    chat: {
      shell: '#121212',
      input: '#1c1c1c',
      badge: '#2c2c2c',
      badgeHover: '#3c3c3c',
      file: '#2a2a2a',
      fileIcon: '#90caf9',
      fileText: '#ffffff',
      caption: '#aaaaaa',
      suggestion: {
        background: '#1e1e1e',
        text: '#e3f2fd',
        border: '#333',
        hoverBackground: '#2a2a2a',
        hoverBorder: '#444',
      },
      appBar: {
        background: '#1a1a1a',
        border: '#333',
        icon: '#90caf9',
        iconHover: '#bbdefb',
        menuBackground: '#242424',
        menuText: '#e0e0e0',
      },
      response: {
        userBackground: '#2a2a2a',
        userText: '#82b1ff',
        userBorder: '#444',
        userBubble: '#2f2f2f',
        userAvatarBackground: '#3b3b3b',
        modelLabel: '#bbbbbb',
        border: '#444',
        aiBackground: '#232323',
        aiText: '#e0e0e0',
        aiBorder: '#444',
        aiBubble: '#292929',
        memoryText: '#aed581',
        divider: '#444',
        containerBackground: '#1c1c1c',
      },
    },
  },
});

export const neutralLightTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: 'light',
    primary: {
      main: '#1565c0',
    },
    secondary: {
      main: '#9575cd',
    },
    background: {
      default: '#f4f4f4',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#555',
    },
    chat: {
      shell: '#ffffff',
      input: '#f5f5f5',
      badge: '#ddd',
      badgeHover: '#ccc',
      file: '#eee',
      fileIcon: '#1565c0',
      fileText: '#000',
      caption: '#666',
      suggestion: {
        background: '#f9f9f9',
        text: '#333',
        border: '#ddd',
        hoverBackground: '#e0e0e0',
        hoverBorder: '#ccc',
      },
      appBar: {
        background: '#ffffff',
        border: '#ddd',
        icon: '#1565c0',
        iconHover: '#e3f2fd',
        menuBackground: '#fafafa',
        menuText: '#111',
      },
      response: {
        userBackground: '#e8f0fe',
        userText: '#0d47a1',
        userBorder: '#bbb',
        userBubble: '#ffffff',
        userAvatarBackground: '#bbdefb',
        modelLabel: '#666',
        border: '#ccc',
        aiBackground: '#f0f0f0',
        aiText: '#1a1a1a',
        aiBorder: '#ccc',
        aiBubble: '#ffffff',
        memoryText: '#558b2f',
        divider: '#ccc',
        containerBackground: '#f5f5f5',
      },
    },
  },
});
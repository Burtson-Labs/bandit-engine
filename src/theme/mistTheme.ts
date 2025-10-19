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

// Bandit Engine Watermark: BL-WM-21CD-792A03
const __banditFingerprint_theme_mistThemets = 'BL-FP-733EC7-1BFB';
const __auditTrail_theme_mistThemets = 'BL-AU-MGOIKVW8-CGIJ';
// File: mistTheme.ts | Path: src/theme/mistTheme.ts | Hash: 21cd1bfb

import { createTheme } from '@mui/material/styles';

export const mistLightTheme = createTheme({
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
  palette: {
    mode: 'light',
    primary: { main: '#5c6bc0' }, // Indigo 400
    secondary: { main: '#8e99f3' }, // Indigo 200
    background: {
      default: '#f9fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#555',
    },
    chat: {
      shell: '#f2f3f5',
      input: '#f9f9fb',
      badge: '#ddd',
      badgeHover: '#bbb',
      file: '#f5f5f5',
      fileIcon: '#aaa',
      fileText: '#000',
      caption: '#666',
      suggestion: {
        background: '#e8eaf6',
        text: '#1a237e',
        border: '#c5cae9',
        hoverBackground: '#dfe3f3',
        hoverBorder: '#b0bec5',
      },
      appBar: {
        background: '#e3eaf4',
        border: '#c5d3e5',
        icon: '#3f51b5',
        iconHover: '#5c6bc0',
        menuBackground: '#f0f2f7',
        menuText: '#1a1a1a',
      },
      response: {
        userBackground: '#e3f2fd',
        userText: '#0d47a1',
        userBorder: '#bbdefb',
        userBubble: '#ffffff',
        userAvatarBackground: '#cfd8dc',
        modelLabel: '#666',
        border: '#ccc',
        aiBackground: '#e8eaf6',
        aiText: '#1a1a1a',
        aiBorder: '#c5cae9',
        aiBubble: '#ffffff',
        memoryText: '#2e7d32',
        divider: '#ccc',
        containerBackground: '#eaeff7',
      },
    },
  },
});

export const mistDarkTheme = createTheme({
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
  palette: {
    mode: 'dark',
    primary: { main: '#8c9eff' },
    secondary: { main: '#536dfe' },
    background: {
      default: '#1a1c23',
      paper: '#232631',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#aaa',
    },
    chat: {
      shell: '#1a1c23',
      input: '#2c2e38',
      badge: '#444',
      badgeHover: '#666',
      file: '#2e2e2e',
      fileIcon: '#777',
      fileText: '#fff',
      caption: '#888',
      suggestion: {
        background: '#303248',
        text: '#c5cae9',
        border: '#444',
        hoverBackground: '#3a3d5a',
        hoverBorder: '#666',
      },
      appBar: {
        background: '#20222a',
        border: '#333',
        icon: '#ccc',
        iconHover: '#fff',
        menuBackground: '#2c2e38',
        menuText: '#eee',
      },
      response: {
        userBackground: '#283593',
        userText: '#bbdefb',
        userBorder: '#3949ab',
        userBubble: '#303f9f',
        userAvatarBackground: '#3949ab',
        modelLabel: '#aaa',
        border: '#444',
        aiBackground: '#2f2f3f',
        aiText: '#e0e0e0',
        aiBorder: '#555',
        aiBubble: '#3a3a4f',
        memoryText: '#80cbc4',
        divider: '#444',
        containerBackground: '#232631',
      },
    },
  },
});
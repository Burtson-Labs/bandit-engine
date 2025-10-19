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

// Bandit Engine Watermark: BL-WM-E610-85E732
const __banditFingerprint_theme_banditThemets = 'BL-FP-8C4B75-D757';
const __auditTrail_theme_banditThemets = 'BL-AU-MGOIKVW6-JQUK';
// File: banditTheme.ts | Path: src/theme/banditTheme.ts | Hash: e610d757

declare module '@mui/material/styles' {
  interface Palette {
    chat: {
      shell: string;
      input: string;
      badge: string;
      badgeHover: string;
      file: string;
      fileIcon: string;
      fileText: string;
      caption: string;
      suggestion: {
        background: string;
        text: string;
        border: string;
        hoverBackground: string;
        hoverBorder: string;
      };
      appBar: {
        background: string;
        border: string;
        icon: string;
        iconHover: string;
        menuBackground: string;
        menuText: string;
      };
      response: {
        userBackground: string;
        userText: string;
        userBorder: string;
        userBubble: string;
        userAvatarBackground: string;
        modelLabel: string;
        border: string;
        aiBackground: string;
        aiText: string;
        aiBorder: string;
        aiBubble: string;
        memoryText: string;
        divider: string;
        containerBackground: string;
        codeBackground?: string;
        codeText?: string;
      };
    };
  }
  interface PaletteOptions {
    chat?: {
      shell: string;
      input: string;
      badge: string;
      badgeHover: string;
      file: string;
      fileIcon: string;
      fileText: string;
      caption: string;
      suggestion?: {
        background: string;
        text: string;
        border: string;
        hoverBackground: string;
        hoverBorder: string;
      };
      appBar?: {
        background: string;
        border: string;
        icon: string;
        iconHover: string;
        menuBackground: string;
        menuText: string;
      };
      response?: {
        userBackground: string;
        userText: string;
        userBorder: string;
        userBubble: string;
        userAvatarBackground: string;
        modelLabel: string;
        border: string;
        aiBackground: string;
        aiText: string;
        aiBorder: string;
        aiBubble: string;
        memoryText: string;
        divider: string;
        containerBackground: string;
        codeBackground?: string;
        codeText?: string;
      };
    };
  }
}

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

export const banditDarkTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#e53935',
    },
    secondary: {
      main: '#8e24aa',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#aaaaaa',
    },
    chat: {
      shell: '#121212',
      input: '#2a2a2a',
      badge: '#444',
      badgeHover: '#666',
      file: '#333',
      fileIcon: '#555',
      fileText: '#fff',
      caption: '#888',
      suggestion: {
        background: '#2a2a2a',
        text: '#ccc',
        border: '#444',
        hoverBackground: '#333',
        hoverBorder: '#666',
      },
      appBar: {
        background: "#000",
        border: "#333",
        icon: "#fff",
        iconHover: "#222",
        menuBackground: "#222",
        menuText: "#fff",
      },
      response: {
        userBackground: '#1f1f1f',
        userText: '#6C9AC5',
        userBorder: '#444',
        userBubble: '#2a2a2a',
        userAvatarBackground: 'transparent',
        modelLabel: '#888',
        border: '#444',
        aiBackground: '#2f2f2f',
        aiText: '#fff',
        aiBorder: '#444',
        aiBubble: '#2f2f2f',
        memoryText: '#00e676',
        divider: '#555',
        containerBackground: '#1c1c1c',
      },
    },
  },
});

export const banditLightTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: 'light',
    primary: {
      main: '#d32f2f',
    },
    secondary: {
      main: '#7b1fa2',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#555555',
    },
    chat: {
      shell: '#f5f5f5',
      input: '#f5f5f5', // already matching shell, no change needed
      badge: '#ddd',
      badgeHover: '#bbb',
      file: '#eee',
      fileIcon: '#ccc',
      fileText: '#000',
      caption: '#555',
      suggestion: {
        background: '#f0f0f0',
        text: '#222',
        border: '#ddd',
        hoverBackground: '#e0e0e0',
        hoverBorder: '#ccc',
      },
      appBar: {
        background: "#ffffff",
        border: "#ddd",
        icon: "#000",
        iconHover: "#f0f0f0",
        menuBackground: "#f9f9f9",
        menuText: "#000",
      },
      response: {
        userBackground: '#f0f0f0', // improved for avatar appearance
        userText: '#1565c0',
        userBorder: '#bbb', // softened border
        userBubble: '#ffffff', // improved contrast and UX
        userAvatarBackground: '#cccccc',
        modelLabel: '#888',
        border: '#ccc',
        aiBackground: '#eaeaea', // softened container-style background for AI bubble
        aiText: '#1a1a1a',
        aiBorder: '#ccc',
        aiBubble: '#ffffff',
        memoryText: '#2e7d32',
        divider: '#ccc',
        containerBackground: '#eaeaea',
      },
    },
  },
});

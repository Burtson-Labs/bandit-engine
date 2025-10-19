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

// Bandit Engine Watermark: BL-WM-6375-0AA470
const __banditFingerprint_theme_themeMapts = 'BL-FP-6535FA-7567';
const __auditTrail_theme_themeMapts = 'BL-AU-MGOIKVW8-4O6Q';
// File: themeMap.ts | Path: src/theme/themeMap.ts | Hash: 63757567

import { banditDarkTheme, banditLightTheme } from "./banditTheme";
import { corporateDarkTheme, corporateLightTheme } from "./corporateTheme";
import { neutralDarkTheme, neutralLightTheme } from "./neutralTheme";
import { cyberPunkDarkTheme, cyberPunkLightTheme } from "./cyberPunkTheme";
import { dawnDarkTheme, dawnLightTheme } from "./dawnTheme";
import { mistDarkTheme, mistLightTheme } from "./mistTheme";
import { sageDarkTheme, sageLightTheme } from "./sageTheme";
import { stoneDarkTheme, stoneLightTheme } from "./stoneTheme";
import { oceanDarkTheme, oceanLightTheme } from "./oceanTheme";
import { neonDarkTheme, neonLightTheme } from "./neonTheme";
import { forestDarkTheme, forestLightTheme } from "./forestTheme";
import { sunsetDarkTheme, sunsetLightTheme } from "./sunsetTheme";
import { volcanicDarkTheme, volcanicLightTheme } from "./volcanicTheme";
import { Theme } from "@mui/material";

type ThemeRegistry = Record<string, Theme>;

const themeMap: ThemeRegistry = {
    "bandit-dark": banditDarkTheme,
    "bandit-light": banditLightTheme,
    "corporate-dark": corporateDarkTheme,
    "corporate-light": corporateLightTheme,
    "neutral-dark": neutralDarkTheme,
    "neutral-light": neutralLightTheme,
    "cyber-dark": cyberPunkDarkTheme,
    "cyber-light": cyberPunkLightTheme,
    "dawn-dark": dawnDarkTheme,
    "dawn-light": dawnLightTheme,
    "mist-dark": mistDarkTheme,
    "mist-light": mistLightTheme,
    "sage-dark": sageDarkTheme,
    "sage-light": sageLightTheme,
    "stone-dark": stoneDarkTheme,
    "stone-light": stoneLightTheme,
    "ocean-dark": oceanDarkTheme,
    "ocean-light": oceanLightTheme,
    "neon-dark": neonDarkTheme,
    "neon-light": neonLightTheme,
    "forest-dark": forestDarkTheme,
    "forest-light": forestLightTheme,
    "sunset-dark": sunsetDarkTheme,
    "sunset-light": sunsetLightTheme,
    "volcanic-dark": volcanicDarkTheme,
    "volcanic-light": volcanicLightTheme,
  };

   export const predefinedThemes: Record<string, Theme & { name: string }> = {
    "bandit-dark": {
      name: "bandit-dark",
      ...banditDarkTheme,
    },
    "bandit-light": {
      name: "bandit-light",
      ...banditLightTheme,
    },
    "corporate-dark": {
      name: "corporate-dark",
      ...corporateDarkTheme,
    },
    "corporate-light": {
      name: "corporate-light",
      ...corporateLightTheme,
    },
    "neutral-dark": {
      name: "neutral-dark",
      ...neutralDarkTheme,
    },
    "neutral-light": {
      name: "neutral-light",
      ...neutralLightTheme,
    },
    "cyber-dark": {
      name: "cyber-dark",
      ...cyberPunkDarkTheme,
    },
    "cyber-light": {
      name: "cyber-light",
      ...cyberPunkLightTheme,
    },
    "dawn-dark": {
      name: "dawn-dark",
      ...dawnDarkTheme,
    },
    "dawn-light": {
      name: "dawn-light",
      ...dawnLightTheme,
    },
    "mist-dark": {
      name: "mist-dark",
      ...mistDarkTheme,
    },
    "mist-light": {
      name: "mist-light",
      ...mistLightTheme,
    },
    "sage-dark": {
      name: "sage-dark",
      ...sageDarkTheme,
    },
    "sage-light": {
      name: "sage-light",
      ...sageLightTheme,
    },
    "stone-dark": {
      name: "stone-dark",
      ...stoneDarkTheme,
    },
    "stone-light": {
      name: "stone-light",
      ...stoneLightTheme,
    },
    "ocean-dark": {
      name: "ocean-dark",
      ...oceanDarkTheme,
    },
    "ocean-light": {
      name: "ocean-light",
      ...oceanLightTheme,
    },
    "neon-dark": {
      name: "neon-dark",
      ...neonDarkTheme,
    },
    "neon-light": {
      name: "neon-light",
      ...neonLightTheme,
    },
    "forest-dark": {
      name: "forest-dark",
      ...forestDarkTheme,
    },
    "forest-light": {
      name: "forest-light",
      ...forestLightTheme,
    },
    "sunset-dark": {
      name: "sunset-dark",
      ...sunsetDarkTheme,
    },
    "sunset-light": {
      name: "sunset-light",
      ...sunsetLightTheme,
    },
    "volcanic-dark": {
      name: "volcanic-dark",
      ...volcanicDarkTheme,
    },
    "volcanic-light": {
      name: "volcanic-light",
      ...volcanicLightTheme,
    },
  };

  export default themeMap;

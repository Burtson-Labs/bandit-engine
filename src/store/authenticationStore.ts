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

// Bandit Engine Watermark: BL-WM-4B68-54D1A0
const __banditFingerprint_store_authenticationStorets = 'BL-FP-3C880F-DCB9';
const __auditTrail_store_authenticationStorets = 'BL-AU-MGOIKVW3-9GUS';
// File: authenticationStore.ts | Path: src/store/authenticationStore.ts | Hash: 4b68dcb9

import { create } from "zustand";
import { JwtClaims } from "../services/auth/authenticationService";

const TOKEN_KEY = "authToken";

// 🔥 Inline hydration of token + user (avoids circular import)
let validToken: string | null = null;
let user: JwtClaims | null = null;

const rawToken = localStorage.getItem(TOKEN_KEY);
if (rawToken) {
  try {
    const base64Url = rawToken.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload) as JwtClaims;

    if (decoded.exp * 1000 > Date.now()) {
      validToken = rawToken;
      user = decoded;
    }
  } catch {
    validToken = null;
    user = null;
  }
}

interface AuthenticationState {
  token: string | null;
  user: JwtClaims | null;
  authError: string | null;
  setToken: (token: string | null) => void;
  clearToken: () => void;
}

export const useAuthenticationStore = create<AuthenticationState>((set) => ({
  token: validToken,
  user,
  authError: null,
  setToken: (token) => {
    if (token) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const user = JSON.parse(jsonPayload) as JwtClaims;

        localStorage.setItem(TOKEN_KEY, token);
        set({ token, authError: null, user });
      } catch {
        set({ token: null, authError: "Invalid token", user: null });
      }
    } else {
      set({ token: null, authError: null, user: null });
    }
  },
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null, authError: null, user: null });
  },
}));

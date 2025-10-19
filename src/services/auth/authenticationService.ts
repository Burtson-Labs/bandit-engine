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

// Bandit Engine Watermark: BL-WM-4D16-84732D
const __banditFingerprint_auth_authenticationServicets = 'BL-FP-90E332-44A4';
const __auditTrail_auth_authenticationServicets = 'BL-AU-MGOIKVVR-AIBP';
// File: authenticationService.ts | Path: src/services/auth/authenticationService.ts | Hash: 4d1644a4

import { useAuthenticationStore } from "../../store/authenticationStore";
import { debugLogger } from "../logging/debugLogger";


export interface JwtClaims {
    /**
     * The unique identifier for the user.
     */
    sub: string;
    /**
     * The email address of the user.
     * This is typically used for authentication and user identification.
     */
    email: string;
    /**
     * Optional display name for the user if provided by the identity provider.
     */
    name?: string;
    /**
     * Optional preferred username provided by the identity provider.
     */
    preferred_username?: string;
    /**
     * Optional direct URL to a profile image for the user.
     */
    picture?: string;
    /**
     * Optional given name of the user when available.
     */
    given_name?: string;
    /**
     * Optional family name of the user when available.
     */
    family_name?: string;
    /**
     * The roles assigned to the user.
     * 'user' | 'admin' | 'super-admin'
     */
    roles: string[];
    /**
     * The time at which the token was issued.
     * This is represented as a Unix timestamp (seconds since the epoch).
     */
    iat: number;

    /**
     * The time at which the token will expire.
     * This is represented as a Unix timestamp (seconds since the epoch).
     */
    exp: number;
    /**
     * The issuer of the token.
     * This is typically the URL of the authentication server.
     * 
     */
    iss: string;
    /**
     * Optional team session identifier for team features.
     * Present when user belongs to a team.
     */
    teamSid?: string;
    /**
     * Optional team identifier for team features.
     * Present when user belongs to a team.
     */
    teamId?: string;
}

export const TOKEN_KEY = "authToken";

class AuthenticationService {
    getToken(): string | null {
        const token = localStorage.getItem(TOKEN_KEY);
        return token;
    }

    setToken(token: string) {
        localStorage.setItem(TOKEN_KEY, token);
        useAuthenticationStore.getState().setToken(token);
    }

    clearToken() {
        localStorage.removeItem(TOKEN_KEY);
        useAuthenticationStore.getState().clearToken();
    }

    isAuthenticated(): boolean {
        const token = useAuthenticationStore.getState().token;
        return !!token && !this.isTokenExpired(token);
    }

    isTokenExpired(token: string): boolean {
        try {
            if (!token) return true;
            const decoded = this.parseJwtClaims(token);
            if (!decoded) return true;
            return decoded.exp * 1000 < Date.now();
        } catch {
            return true;
        }
    }

    parseJwtClaims(token: string): JwtClaims | null {
        try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split("")
                    .map((c) => {
                        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
                    })
                    .join("")
            );
            return JSON.parse(jsonPayload) as JwtClaims;
        } catch (error) {
            debugLogger.error("Failed to parse JWT claims:", { error });
            return null;
        }
    }
}

export const authenticationService = new AuthenticationService();

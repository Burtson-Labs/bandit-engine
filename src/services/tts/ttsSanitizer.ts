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

// Bandit Engine Watermark: BL-WM-DB79-A74813
const __banditFingerprint_tts_ttsSanitizerts = 'BL-FP-EBEA84-E4AB';
const __auditTrail_tts_ttsSanitizerts = 'BL-AU-MGOIKVW0-B1P2';
// File: ttsSanitizer.ts | Path: src/services/tts/ttsSanitizer.ts | Hash: db79e4ab

export const stripHtmlTags = (text: string): string =>
    text.replace(/<[^>]*>/g, '');

export const stripMarkdown = (text: string): string =>
    text.replace(/[*_~`]+/g, '');

export const stripEmojis = (text: string): string =>
    text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');

export const simplifyLinks = (text: string): string =>
    text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

export const stripListBullets = (text: string): string =>
    text.replace(/^\s*[*\-]\s+/gm, '');

export const normalizeWhitespace = (text: string): string =>
    text.replace(/\s{2,}/g, ' ').trim();

export const sanitizeForTTS = (text: string): string => {
    return normalizeWhitespace(
        stripListBullets(
            stripEmojis(
                stripMarkdown(
                    simplifyLinks(
                        stripHtmlTags(text)
                    )
                )
            )
        )
    );
};

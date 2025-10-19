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

// Bandit Engine Watermark: BL-WM-7A26-5275EA
const __banditFingerprint_cli_utilsts = 'BL-FP-62E546-D66C';
const __auditTrail_cli_utilsts = 'BL-AU-MGOIKVV7-1K3Q';
// File: utils.ts | Path: src/cli/utils.ts | Hash: 7a26d66c

import path from "node:path";

export const toKebabCase = (value: string): string => {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_./]+/g, "-")
    .replace(/[^a-zA-Z0-9-]+/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
};

export const toTitleCase = (value: string): string => {
  const cleaned = value
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "";
  }

  return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatJson = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`;

export const detectMimeType = (fileNameOrExtension: string): string => {
  const extension = path.extname(fileNameOrExtension).toLowerCase() || fileNameOrExtension.toLowerCase();
  switch (extension) {
    case ".svg":
    case "svg":
      return "image/svg+xml";
    case ".png":
    case "png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case ".webp":
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
};

export const toDataUrl = (buffer: Buffer, mimeType: string): string =>
  `data:${mimeType};base64,${buffer.toString("base64")}`;

export const sanitizeModelIdentifier = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed.includes(":")) {
    return trimmed.toLowerCase();
  }
  const [provider, model] = trimmed.split(/:(.+)/).filter(Boolean);
  const cleanModel = model
    .replace(/[^a-zA-Z0-9_.-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
  return `${provider.toLowerCase()}:${cleanModel}`;
};

export const normalizeLineEndings = (content: string): string =>
  content.replace(/\r\n/g, "\n");

export const ensureTrailingNewline = (content: string): string =>
  content.endsWith("\n") ? content : `${content}\n`;

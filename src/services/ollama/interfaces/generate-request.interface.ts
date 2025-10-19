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

// Bandit Engine Watermark: BL-WM-8505-9DC507
const __banditFingerprint_interfaces_generaterequestinterfacets = 'BL-FP-C5662B-3A12';
const __auditTrail_interfaces_generaterequestinterfacets = 'BL-AU-MGOIKVVW-TP2X';
// File: generate-request.interface.ts | Path: src/services/ollama/interfaces/generate-request.interface.ts | Hash: 85053a12

export interface GenerateRequest {
    model: string;
    prompt: string;
    options?: Record<string, unknown>;
    stream?: boolean;
    images?: string[];
}

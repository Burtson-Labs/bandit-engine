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

// Bandit Engine Watermark: BL-WM-83E1-DB879B
const __banditFingerprint_interfaces_generateresponseinterfacets = 'BL-FP-3C7687-908A';
const __auditTrail_interfaces_generateresponseinterfacets = 'BL-AU-MGOIKVVW-O76D';
// File: generate-response.interface.ts | Path: src/services/ollama/interfaces/generate-response.interface.ts | Hash: 83e1908a

export interface GenerateResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}


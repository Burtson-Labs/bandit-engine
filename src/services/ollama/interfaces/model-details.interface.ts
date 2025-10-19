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

// Bandit Engine Watermark: BL-WM-912E-199CC5
const __banditFingerprint_interfaces_modeldetailsinterfacets = 'BL-FP-0DC722-9E1B';
const __auditTrail_interfaces_modeldetailsinterfacets = 'BL-AU-MGOIKVVW-G0CC';
// File: model-details.interface.ts | Path: src/services/ollama/interfaces/model-details.interface.ts | Hash: 912e9e1b

export interface ModelDetails {
    families: string[];
    family: string;
    format: string;
    parameter_size: string;
    parent_model: string;
    quantization_level: string;
}
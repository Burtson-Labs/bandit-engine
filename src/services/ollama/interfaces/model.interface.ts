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

// Bandit Engine Watermark: BL-WM-8C04-84ECC4
const __banditFingerprint_interfaces_modelinterfacets = 'BL-FP-8647BB-B2F6';
const __auditTrail_interfaces_modelinterfacets = 'BL-AU-MGOIKVVW-K5ID';
// File: model.interface.ts | Path: src/services/ollama/interfaces/model.interface.ts | Hash: 8c04b2f6

import { ModelDetails } from "./model-details.interface";

export interface Model {
    name: string;
    model: string;
    modified_at: string;
    size: number;
    digest: string;
    details: ModelDetails;
}
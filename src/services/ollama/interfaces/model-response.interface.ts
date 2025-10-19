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

// Bandit Engine Watermark: BL-WM-D719-4EDAAF
const __banditFingerprint_interfaces_modelresponseinterfacets = 'BL-FP-C2D87D-0DE5';
const __auditTrail_interfaces_modelresponseinterfacets = 'BL-AU-MGOIKVVW-4SW5';
// File: model-response.interface.ts | Path: src/services/ollama/interfaces/model-response.interface.ts | Hash: d7190de5

import { Model } from "./model.interface";

export interface ModelResponse {
    models: Model[];
}
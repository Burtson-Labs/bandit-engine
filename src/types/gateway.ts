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

// Bandit Engine Watermark: BL-WM-9121-473906
const __banditFingerprint_types_gatewayts = 'BL-FP-75AB89-3701';
const __auditTrail_types_gatewayts = 'BL-AU-MGOIKVW9-LMOE';
// File: gateway.ts | Path: src/types/gateway.ts | Hash: 91213701

import {
  GatewayChatRequest,
  GatewayChatResponse,
  GatewayGenerateRequest,
  GatewayGenerateResponse,
  GatewayHealthResponse
} from "../services/gateway/interfaces";

export interface GatewayContract {
  chat(request: GatewayChatRequest): Promise<GatewayChatResponse>;
  generate(request: GatewayGenerateRequest): Promise<GatewayGenerateResponse>;
  health(): Promise<GatewayHealthResponse>;
}
